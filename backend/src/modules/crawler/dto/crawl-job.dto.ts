export interface SelectorConfig {
  // List page
  listItem: string;    // Selector for repeating list items (link auto-detected)
  // Detail page
  title: string;       // Selector for article title
  date: string;        // Selector for article date
  content: string;     // Selector for article content
  summary: string;     // Selector for article summary
  image: string;       // Selector for article image
}

export interface CrawlJobData {
  sourceId: string;
  url: string;
  sourceType: 'SELECTOR' | 'RSS';
  triggeredBy: 'manual' | 'scheduled';

  // For SELECTOR type sources
  selectors?: SelectorConfig;

  // For RSS type sources
  feedUrl?: string;
  lastEtag?: string;
  lastFeedModified?: string;
  enrichContent?: boolean;
  contentSelector?: string;
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
  content?: string;
  summary?: string;
  imageUrl?: string;
  isPartial?: boolean;
}
