import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import TurndownService from 'turndown';
import { load } from 'cheerio';
import {
  AIExtractionResult,
  AIExtractionRequest,
  SelectorSuggestion,
} from './dto/extraction-result.dto';

@Injectable()
export class AIExtractorService {
  private readonly logger = new Logger(AIExtractorService.name);
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private turndown: TurndownService;
  private isEnabled = false;
  private isGeminiEnabled = false;

  constructor() {
    // Initialize Turndown for HTML to Markdown conversion
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Remove script, style, and other non-content elements
    this.turndown.remove(['script', 'style', 'nav', 'footer', 'header', 'aside']);

    // Initialize OpenAI client for DeepSeek
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      });
      this.isEnabled = true;
      this.logger.log('DeepSeek AI extractor initialized');
    } else {
      this.logger.warn('DEEPSEEK_API_KEY not set, AI extraction disabled');
    }

    // Initialize Gemini for content formatting
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
      this.isGeminiEnabled = true;
      this.logger.log('Gemini AI content formatter initialized');
    }
  }

  /**
   * Check if AI extraction is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.openai !== null;
  }

  /**
   * Extract article data using AI
   */
  async extractArticle(request: AIExtractionRequest): Promise<AIExtractionResult | null> {
    if (!this.isAvailable()) {
      this.logger.warn('AI extraction not available');
      return null;
    }

    try {
      // Convert HTML to Markdown (reduces tokens significantly)
      const markdown = this.htmlToMarkdown(request.html);

      // Truncate if too long (DeepSeek has 64k context, but we want to save tokens)
      const truncatedMarkdown = markdown.substring(0, 15000);

      const prompt = this.buildExtractionPrompt(truncatedMarkdown, request.url, request.hints);

      const response = await this.openai!.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Sen bir web scraping uzmanısın. HTML/Markdown içerikten yapılandırılmış veri çıkarırsın.
Her zaman JSON formatında yanıt ver. Türkçe içerik için Türkçe çıktı üret.
Eğer bir alan bulunamazsa, o alanı null olarak döndür.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        this.logger.warn('Empty response from AI');
        return null;
      }

      const parsed = JSON.parse(content);

      return {
        title: parsed.title || '',
        date: parsed.date || undefined,
        content: parsed.content || undefined,
        summary: parsed.summary || undefined,
        imageUrl: parsed.imageUrl || undefined,
        confidence: parsed.confidence || 0.5,
        extractionMethod: 'ai',
      };
    } catch (error) {
      this.logger.error('AI extraction failed:', error);
      return null;
    }
  }

  /**
   * Suggest CSS selectors for a page using AI
   */
  async suggestSelectors(html: string, url: string): Promise<SelectorSuggestion | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Get a sample of the HTML structure
      const $ = load(html);

      // Extract structural hints
      const hints = this.extractStructuralHints($);

      const prompt = `Aşağıdaki web sayfası yapısını analiz et ve CSS selector önerileri sun.

URL: ${url}

Sayfa Yapısı:
${hints}

Aşağıdaki alanlar için CSS selector öner:
1. listItem: Liste sayfasındaki tekrarlayan haber/makale öğeleri
2. title: Haber başlığı
3. date: Yayın tarihi
4. content: Ana içerik
5. summary: Özet (varsa)
6. image: Ana görsel

JSON formatında döndür:
{
  "listItem": "selector",
  "title": "selector",
  "date": "selector",
  "content": "selector",
  "summary": "selector",
  "image": "selector",
  "confidence": 0.0-1.0
}

Emin olmadığın alanlar için boş string kullan.`;

      const response = await this.openai!.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Sen bir web scraping uzmanısın. CSS selector önerileri yaparsın.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      return JSON.parse(content) as SelectorSuggestion;
    } catch (error) {
      this.logger.error('Selector suggestion failed:', error);
      return null;
    }
  }

  /**
   * Validate if selectors work correctly
   */
  async validateSelectors(
    html: string,
    selectors: Record<string, string>,
  ): Promise<{ valid: boolean; issues: string[] }> {
    const $ = load(html);
    const issues: string[] = [];

    for (const [name, selector] of Object.entries(selectors)) {
      if (!selector) continue;

      try {
        const elements = $(selector);
        if (elements.length === 0) {
          issues.push(`${name}: Selector "${selector}" bulunamadı`);
        }
      } catch {
        issues.push(`${name}: Geçersiz selector "${selector}"`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Convert HTML to Markdown for token efficiency
   */
  private htmlToMarkdown(html: string): string {
    try {
      // Pre-process HTML to remove noise
      const $ = load(html);

      // Remove common non-content elements
      $('script, style, nav, footer, header, aside, iframe, noscript').remove();
      $('[class*="comment"], [class*="sidebar"], [class*="ad-"], [id*="ad-"]').remove();
      $('[class*="social"], [class*="share"], [class*="related"]').remove();

      // Get the main content area if identifiable
      const mainContent =
        $('article').html() ||
        $('main').html() ||
        $('[role="main"]').html() ||
        $('.content').html() ||
        $('body').html() ||
        html;

      return this.turndown.turndown(mainContent || html);
    } catch {
      // If conversion fails, return cleaned text
      const $ = load(html);
      return $('body').text().substring(0, 15000);
    }
  }

  /**
   * Build extraction prompt
   */
  private buildExtractionPrompt(
    markdown: string,
    url: string,
    hints?: AIExtractionRequest['hints'],
  ): string {
    let prompt = `Aşağıdaki içerikten haber/makale bilgilerini çıkar.

URL: ${url}
`;

    if (hints?.siteType) {
      prompt += `Site Tipi: ${hints.siteType}\n`;
    }

    prompt += `
İçerik:
${markdown}

Aşağıdaki bilgileri JSON formatında döndür:
{
  "title": "Haber başlığı",
  "date": "Yayın tarihi (ISO 8601 formatında, örn: 2024-01-15)",
  "content": "Haber içeriği (max 3000 karakter)",
  "summary": "Kısa özet (max 300 karakter)",
  "imageUrl": "Ana görsel URL'si (varsa)",
  "confidence": 0.0-1.0 arası güven skoru
}

Kurallar:
- Bulunamayan alanlar için null kullan
- Tarih formatını standartlaştır
- İçeriği temizle (reklam, menü vs. çıkar)
- Güven skoru: 1.0 = çok emin, 0.5 = orta, 0.0 = emin değil`;

    return prompt;
  }

  /**
   * Extract structural hints from HTML
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractStructuralHints($: any): string {
    const hints: string[] = [];

    // Common article containers
    const articleContainers = [
      'article',
      '[class*="article"]',
      '[class*="post"]',
      '[class*="news"]',
      '[class*="story"]',
      '[class*="entry"]',
    ];

    for (const selector of articleContainers) {
      const count = $(selector).length;
      if (count > 0) {
        hints.push(`${selector}: ${count} öğe bulundu`);
      }
    }

    // Check for list structures
    const listItems = $('ul li, ol li').length;
    hints.push(`Liste öğeleri: ${listItems}`);

    // Check for headings
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    hints.push(`Başlıklar: h1=${h1Count}, h2=${h2Count}`);

    // Check for time/date elements
    const timeElements = $('time').length;
    const dateClasses = $('[class*="date"], [class*="time"]').length;
    hints.push(`Tarih öğeleri: time=${timeElements}, date class=${dateClasses}`);

    // Check for images
    const images = $('img').length;
    hints.push(`Görseller: ${images}`);

    // Sample of class names
    const classes = new Set<string>();
    $('[class]')
      .slice(0, 50)
      .each((_, el) => {
        const classList = $(el).attr('class')?.split(' ') || [];
        classList.forEach((c) => classes.add(c));
      });
    hints.push(`Örnek class'lar: ${Array.from(classes).slice(0, 20).join(', ')}`);

    return hints.join('\n');
  }

  /**
   * Check if Gemini content formatting is available
   */
  isFormattingAvailable(): boolean {
    return this.isGeminiEnabled && this.gemini !== null;
  }

  /**
   * Format article content into proper paragraphs using Gemini AI
   */
  async formatContent(content: string): Promise<string> {
    // If content is short or already has paragraphs, skip AI
    if (!content || content.length < 200) {
      return content;
    }

    // Check if content already has proper paragraph breaks
    const paragraphCount = (content.match(/\n\n/g) || []).length;
    if (paragraphCount >= 2) {
      return content; // Already formatted
    }

    // If Gemini not available, use simple formatting
    if (!this.isFormattingAvailable()) {
      return this.simpleFormatContent(content);
    }

    try {
      const model = this.gemini!.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      });

      const prompt = `Aşağıdaki haber metnini düzgün paragraflara ayır.

Kurallar:
- Her paragraf mantıksal bir bütün oluşturmalı
- Paragraflar arasında çift satır boşluğu bırak (\\n\\n)
- Metni değiştirme, sadece paragraf boşlukları ekle
- Minimum 2-3 cümle paragraf uzunluğu hedefle
- Sadece formatlanmış metni döndür, açıklama ekleme

Metin:
${content.substring(0, 4000)}`;

      const result = await model.generateContent(prompt);
      const formattedContent = result.response.text();

      if (formattedContent && formattedContent.length > content.length * 0.8) {
        return formattedContent.trim();
      }

      return content;
    } catch (error) {
      this.logger.error('Content formatting failed:', error);
      return this.simpleFormatContent(content);
    }
  }

  /**
   * Simple rule-based content formatting (fallback)
   */
  private simpleFormatContent(content: string): string {
    if (!content) return content;

    // If already has paragraph breaks, return as-is
    if (content.includes('\n\n')) {
      return content;
    }

    // Try to split by single newlines first
    if (content.includes('\n')) {
      return content.replace(/\n/g, '\n\n');
    }

    // Split by sentence endings and group into paragraphs
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    const paragraphs: string[] = [];
    const sentencesPerParagraph = 3;

    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
      const group = sentences.slice(i, i + sentencesPerParagraph);
      paragraphs.push(group.join(' ').trim());
    }

    return paragraphs.join('\n\n');
  }
}
