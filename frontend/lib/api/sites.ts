import { api } from './client';

export type SiteType = 'NATIONAL' | 'LOCAL' | 'AGENCY' | 'OTHER';

export const siteTypeLabels: Record<SiteType, string> = {
  NATIONAL: 'Ulusal',
  LOCAL: 'Yerel',
  AGENCY: 'Haberalma',
  OTHER: 'Diğer',
};

export interface Site {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  siteType: SiteType;
  isSystem: boolean;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sources: number;
  };
}

export interface SiteWithDetails extends Site {
  sources?: Array<{
    id: string;
    name: string;
    url: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    category?: {
      id: string;
      name: string;
      icon?: string;
      color?: string;
    };
    _count?: {
      articles: number;
    };
  }>;
}

export interface CreateSiteInput {
  name: string;
  domain: string;
  logoUrl?: string;
  siteType?: SiteType;
}

export interface UpdateSiteInput {
  name?: string;
  logoUrl?: string;
  siteType?: SiteType;
}

export const sitesApi = {
  /**
   * Tüm siteleri getir
   */
  getAll: async (): Promise<Site[]> => {
    return api.get<Site[]>('/sites');
  },

  /**
   * Site detayı
   */
  getOne: async (id: string): Promise<SiteWithDetails> => {
    return api.get<SiteWithDetails>(`/sites/${id}`);
  },

  /**
   * Yeni site oluştur
   */
  create: async (data: CreateSiteInput): Promise<Site> => {
    // Backend expects url, convert domain to url
    // Sanitize domain: remove protocol, www., trailing slashes
    let domain = data.domain.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');

    const payload = {
      name: data.name,
      url: `https://${domain}`,
      logoUrl: data.logoUrl,
      siteType: data.siteType,
    };
    return api.post<Site>('/sites', payload);
  },

  /**
   * Site oluştur veya mevcut olanı döndür
   */
  findOrCreate: async (data: CreateSiteInput): Promise<Site> => {
    // Backend expects url, convert domain to url
    // Sanitize domain: remove protocol, www., trailing slashes
    let domain = data.domain.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');

    const payload = {
      name: data.name,
      url: `https://${domain}`,
      logoUrl: data.logoUrl,
      siteType: data.siteType,
    };
    return api.post<Site>('/sites/find-or-create', payload);
  },

  /**
   * URL'e göre site ara
   */
  searchByUrl: async (url: string): Promise<Site | null> => {
    try {
      return api.get<Site>(`/sites/search?url=${encodeURIComponent(url)}`);
    } catch {
      return null;
    }
  },

  /**
   * Site güncelle
   */
  update: async (id: string, data: UpdateSiteInput): Promise<Site> => {
    return api.put<Site>(`/sites/${id}`, data);
  },

  /**
   * Site sil
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(`/sites/${id}`);
  },
};
