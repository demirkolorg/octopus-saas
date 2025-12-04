export interface AIExtractionResult {
  title: string;
  date?: string;
  content?: string;
  summary?: string;
  imageUrl?: string;
  confidence: number;
  extractionMethod: 'ai' | 'selector' | 'hybrid';
}

export interface AIExtractionRequest {
  html: string;
  url: string;
  hints?: {
    expectedTitle?: string;
    expectedDate?: string;
    siteType?: 'news' | 'blog' | 'ecommerce' | 'other';
  };
}

export interface SelectorSuggestion {
  listItem: string;
  title: string;
  date: string;
  content: string;
  summary: string;
  image: string;
  confidence: number;
}
