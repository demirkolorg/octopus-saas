export interface CrawlJobData {
  sourceId: string;
  url: string;
  selectors: {
    listItem: string;
    title: string;
    link: string;
    date?: string;
    summary?: string;
  };
  triggeredBy: 'manual' | 'scheduled';
}

export interface CrawlJobResult {
  sourceId: string;
  itemsFound: number;
  itemsInserted: number;
  errors: string[];
  duration: number;
}

export interface ArticleData {
  title: string;
  url: string;
  date?: string;
  summary?: string;
  imageUrl?: string;
}
