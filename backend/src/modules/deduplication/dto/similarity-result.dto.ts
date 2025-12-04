export interface SimilarityResult {
  articleId: string;
  isSameNews: boolean;
  similarity: number;
  reason: string;
}

export interface ArticleData {
  title: string;
  content?: string;
  summary?: string;
  url: string;
}

export interface DeduplicationConfig {
  similarityThreshold: number; // Default: 0.8
  titleSimilarityPrefilter: number; // Default: 0.3
  maxDaysBack: number; // Default: 7
  batchSize: number; // Default: 10
}
