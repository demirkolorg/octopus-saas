import { api } from './client';

export interface BulletPoint {
  category: string;
  text: string;
}

export interface CategoryStat {
  name: string;
  count: number;
  icon?: string;
  color?: string;
}

export interface SourceStat {
  name: string;
  count: number;
  domain?: string;
}

export interface DailySummary {
  id: string;
  date: string;
  summary: string;
  bulletPoints: BulletPoint[] | null;
  articleCount: number;
  topCategories: CategoryStat[] | null;
  topSources: SourceStat[] | null;
  isPartial: boolean;
  generatedAt: string;
  createdAt: string;
}

export interface DailySummaryResponse {
  data: DailySummary | null;
}

export interface DailySummaryListResponse {
  data: DailySummary[];
}

/**
 * Get summary for a specific date
 */
export async function getDailySummary(date?: string): Promise<DailySummary | null> {
  const params = date ? `?date=${date}` : '';
  const response = await api.get<DailySummaryResponse>(`/daily-summary${params}`);
  return response.data;
}

/**
 * Get partial (mid-day) summary for today
 */
export async function getPartialSummary(): Promise<DailySummary | null> {
  const response = await api.get<DailySummaryResponse>('/daily-summary/partial');
  return response.data;
}

/**
 * Get list of all summaries
 */
export async function getDailySummaries(
  startDate?: string,
  endDate?: string,
): Promise<DailySummary[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  const url = `/daily-summary/list${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<DailySummaryListResponse>(url);
  return response.data;
}

/**
 * Generate full day summary
 */
export async function generateDailySummary(date?: string): Promise<DailySummary> {
  const params = date ? `?date=${date}` : '';
  const response = await api.post<DailySummaryResponse>(`/daily-summary/generate${params}`);
  return response.data!;
}

/**
 * Generate partial summary (mid-day)
 */
export async function generatePartialSummary(): Promise<DailySummary> {
  const response = await api.post<DailySummaryResponse>('/daily-summary/generate/partial');
  return response.data!;
}
