# AI API Entegrasyonu

Bu doküman, Octopus projesinde kullanılan AI API entegrasyonlarını, yapılandırma seçeneklerini, rate limitleri ve maliyet analizlerini detaylı olarak açıklar.

---

## 1. Genel Bakış

Octopus, benzer haberleri tespit etmek ve gruplamak için AI tabanlı bir deduplikasyon sistemi kullanır. Bu sistem şu anda **Google Gemini API** ile entegre çalışmaktadır.

### 1.1 Kullanım Alanları

| Özellik | Açıklama |
|---------|----------|
| **Haber Deduplikasyonu** | Farklı kaynaklardan gelen aynı haberleri tespit eder |
| **Benzerlik Analizi** | İki haber arasındaki semantik benzerliği ölçer |
| **Otomatik Gruplama** | Benzer haberleri otomatik olarak gruplar |
| **Türkçe Dil Desteği** | Türkçe haberler için optimize edilmiş promptlar |

### 1.2 Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                     Crawler Service                          │
│  (Yeni haber geldiğinde DeduplicationService'i çağırır)     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DeduplicationService                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Pre-filter     │→ │  AI Similarity  │→ │  Grouping   │ │
│  │  (Jaccard)      │  │  (Gemini API)   │  │  (Database) │ │
│  │  Threshold:0.15 │  │  Threshold:0.8  │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Mevcut Yapılandırma

### 2.1 Ortam Değişkenleri

```env
# --- Google Gemini AI ---
GEMINI_API_KEY="your-api-key-here"
GEMINI_MODEL="gemini-2.5-flash"
```

### 2.2 Servis Yapılandırması

```typescript
// backend/src/modules/deduplication/deduplication.service.ts

private readonly config: DeduplicationConfig = {
  similarityThreshold: 0.8,      // AI benzerlik eşiği (0.8 = %80)
  titleSimilarityPrefilter: 0.15, // Jaccard pre-filter eşiği
  maxDaysBack: 7,                 // Karşılaştırma için geriye bakılan gün
  batchSize: 10,                  // Toplu işlem boyutu
};
```

### 2.3 Kullanılan SDK

```json
// package.json
{
  "dependencies": {
    "@google/genai": "^1.x.x"
  }
}
```

---

## 3. Google Gemini API

### 3.1 Model Bilgileri

| Model | Açıklama | Kullanım |
|-------|----------|----------|
| `gemini-2.5-flash` | Hızlı ve ekonomik model | **Aktif** |
| `gemini-2.5-pro` | Daha güçlü, daha pahalı | Alternatif |
| `gemini-2.0-flash` | Eski versiyon | Kullanılmıyor |

### 3.2 Rate Limitleri

#### Free Tier (Ücretsiz)

| Metrik | Limit | Açıklama |
|--------|-------|----------|
| **RPM** (Requests Per Minute) | 10 | Dakikada maksimum istek |
| **TPM** (Tokens Per Minute) | 250,000 | Dakikada maksimum token |
| **RPD** (Requests Per Day) | 250 | Günlük maksimum istek |

#### Pay-as-you-go (Ücretli - Billing Aktif)

| Metrik | Limit | Açıklama |
|--------|-------|----------|
| **RPM** | 2,000 | 200x artış |
| **TPM** | 4,000,000 | 16x artış |
| **RPD** | Unlimited | Sınırsız |

### 3.3 Fiyatlandırma (Aralık 2025)

| Model | Input (1M token) | Output (1M token) |
|-------|------------------|-------------------|
| gemini-2.5-flash | $0.075 | $0.30 |
| gemini-2.5-pro | $1.25 | $5.00 |

### 3.4 Maliyet Hesaplaması

**Varsayımlar:**
- Günlük 100 yeni haber
- Her haber için ortalama 3 AI karşılaştırması (pre-filter sonrası)
- Her karşılaştırma: ~500 input token + ~100 output token

| Metrik | Hesaplama | Sonuç |
|--------|-----------|-------|
| Günlük API çağrısı | 100 × 3 | 300 çağrı |
| Input token/gün | 300 × 500 | 150,000 token |
| Output token/gün | 300 × 100 | 30,000 token |
| **Günlük maliyet** | (0.15M × $0.075) + (0.03M × $0.30) | **~$0.02** |
| **Aylık maliyet** | $0.02 × 30 | **~$0.60** |

> **Not:** Free tier günlük 250 istek limiti bizim kullanımımız için yeterlidir. Billing aktif edildiğinde bile maliyet son derece düşüktür.

---

## 4. Alternatif AI API'ler

### 4.1 Karşılaştırma Tablosu

| Sağlayıcı | Model | Input (1M) | Output (1M) | Tahmini Aylık Maliyet |
|-----------|-------|------------|-------------|----------------------|
| **Google Gemini** | 2.5-flash | $0.075 | $0.30 | **$0.60** |
| DeepSeek | V3 | $0.56 | $1.68 | $6.60 |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 | $3.15 |
| OpenAI | GPT-4o | $2.50 | $10.00 | $65 |
| Anthropic | Claude Sonnet | $3.00 | $15.00 | $105 |

### 4.2 DeepSeek (Önceki Entegrasyon)

DeepSeek daha önce kullanılıyordu ancak:
- Hesap bakiyesi tükendi (402 Insufficient Balance)
- Gemini'ye göre daha pahalı ($6.60 vs $0.60/ay)

**Yedek olarak .env'de tutulmaktadır:**
```env
# --- DeepSeek AI (backup) ---
# DEEPSEEK_API_KEY="sk-xxx"
# DEEPSEEK_BASE_URL="https://api.deepseek.com"
# DEEPSEEK_MODEL="deepseek-chat"
```

---

## 5. Teknik Detaylar

### 5.1 Pre-filter (Jaccard Similarity)

AI API çağrısı yapmadan önce, başlık benzerliği ile hızlı bir ön eleme yapılır:

```typescript
quickTitleSimilarity(title1: string, title2: string): number {
  // Türkçe suffix stripping
  const turkishSuffixes = ['ler', 'lar', 'leri', 'ları', 'de', 'da', ...];

  // Jaccard index hesaplama
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}
```

**Threshold:** 0.15 (Türkçe morfolojisi için düşük tutuldu)

### 5.2 AI Prompt

```typescript
const prompt = `İki haber metnini karşılaştır ve aynı olayı/konuyu anlatıp anlatmadıklarını belirle.

Haber 1:
Başlık: ${article1.title}
İçerik: ${article1.content.substring(0, 500)}

Haber 2:
Başlık: ${article2.title}
İçerik: ${article2.content.substring(0, 500)}

SADECE JSON formatında yanıt ver:
{"isSameNews": true/false, "similarity": 0.0-1.0, "reason": "Kısa açıklama"}

Kurallar:
- Aynı olay farklı kelimelerle anlatılmış olabilir
- similarity: 1.0 = kesinlikle aynı, 0.8+ = muhtemelen aynı, <0.5 = farklı`;
```

### 5.3 Rate Limiting ve Retry

```typescript
// İstekler arası delay (rate limit aşımını önlemek için)
if (i > 0) {
  await this.sleep(2000); // 2 saniye
}

// Retry mekanizması
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // API çağrısı
  } catch (error) {
    if (isRateLimit && attempt < maxRetries) {
      const delay = attempt * 5000; // 5s, 10s, 15s
      await this.sleep(delay);
      continue;
    }
  }
}
```

### 5.4 Caching

Benzerlik sonuçları Redis'te cache'lenir:

```typescript
// Cache key formatı
const cacheKey = `dedup:${hash(title1)}:${hash(title2)}`;

// 24 saat TTL
await this.cacheService.cacheMetadata(cacheKey, result);
```

---

## 6. API Endpoints

### 6.1 Tüm Haberleri Deduplike Et

```http
POST /articles/deduplicate-all
```

**Yanıt:**
```json
{
  "processed": 1830,
  "grouped": 45,
  "groups": 20
}
```

### 6.2 Haber Gruplarını Listele

```http
GET /articles/groups?page=1&limit=20
```

**Yanıt:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "title": "Grup başlığı",
      "articleCount": 3,
      "articles": [...]
    }
  ],
  "total": 20
}
```

### 6.3 Tek Grup Detayı

```http
GET /articles/groups/:id
```

---

## 7. Monitoring ve Debug

### 7.1 Log Örnekleri

```bash
# Başarılı gruplama
[DeduplicationService] Created group xxx with 2 articles
[CrawlerProcessor] Merged article "..." with group (similarity: 0.90)

# Pre-filter
[DeduplicationService] Pre-filter: 329 -> 3 potential matches

# Rate limit
[DeduplicationService] Rate limited, waiting 5s before retry 2/3

# Hata
[DeduplicationService] AI similarity check failed (attempt 3): RESOURCE_EXHAUSTED
```

### 7.2 Google AI Studio Dashboard

- **URL:** https://aistudio.google.com
- **Metrikler:**
  - Total API Requests per day
  - Total API Errors per day
  - Input Tokens per day
  - Rate limits breakdown

---

## 8. Sorun Giderme

### 8.1 Yaygın Hatalar

| Hata | Sebep | Çözüm |
|------|-------|-------|
| `429 RESOURCE_EXHAUSTED` | Rate limit aşıldı | Delay artır veya billing aktif et |
| `404 Model not found` | Yanlış model ismi | Model adını kontrol et |
| `401 Unauthorized` | Geçersiz API key | API key'i yenile |
| `500 Internal Error` | API geçici hatası | Retry mekanizması devrede |

### 8.2 Rate Limit Çözümleri

1. **Billing Aktif Et (Önerilen)**
   - Google Cloud Console'dan kredi kartı ekle
   - Limitler otomatik artar
   - Düşük kullanımda hala ücretsiz

2. **Delay Artır**
   ```typescript
   // 2 saniye → 6 saniye
   await this.sleep(6000);
   ```

3. **Pre-filter Threshold Artır**
   ```typescript
   titleSimilarityPrefilter: 0.25 // Daha az AI çağrısı
   ```

---

## 9. Gelecek Geliştirmeler

### 9.1 Planlanan

- [ ] Batch API kullanımı (birden fazla karşılaştırmayı tek istekte)
- [ ] Embedding tabanlı similarity (daha hızlı, daha ucuz)
- [ ] Local model desteği (Ollama ile)
- [ ] A/B test altyapısı (farklı modelleri karşılaştırma)

### 9.2 Değerlendirilen Alternatifler

- **OpenAI Embeddings:** Daha hızlı, daha ucuz, ama daha az doğru
- **Local LLM (Ollama):** Ücretsiz, ama GPU gerektirir
- **Hybrid Yaklaşım:** Embeddings + AI validation

---

## 10. Değişiklik Geçmişi

| Tarih | Değişiklik | Detay |
|-------|------------|-------|
| 2025-12-02 | Gemini'ye geçiş | DeepSeek → Google Gemini 2.5-flash |
| 2025-12-02 | Yeni SDK | @google/generative-ai → @google/genai |
| 2025-12-02 | Türkçe stemming | Jaccard için suffix stripping eklendi |
| 2025-12-01 | DeepSeek entegrasyonu | İlk AI deduplikasyon sistemi |
| 2025-11-30 | Pre-filter | Jaccard similarity eklendi |

---

## 11. Referanslar

- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Gemini Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Google AI Studio](https://aistudio.google.com)
- [DeepSeek API Docs](https://api-docs.deepseek.com)
