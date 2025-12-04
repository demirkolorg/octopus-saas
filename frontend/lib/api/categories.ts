import { api } from './client';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  userId?: string;
  createdAt: string;
  _count?: {
    sources: number;
  };
}

export interface CategoryWithSources extends Category {
  sources?: Array<{
    id: string;
    name: string;
    url: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    site?: {
      id: string;
      name: string;
      domain: string;
      logoUrl?: string;
    };
    _count?: {
      articles: number;
    };
  }>;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}

export const categoriesApi = {
  /**
   * Tüm kategorileri getir (sistem + kullanıcı kategorileri)
   */
  getAll: async (): Promise<Category[]> => {
    return api.get<Category[]>('/categories');
  },

  /**
   * Kategori detayı
   */
  getOne: async (id: string): Promise<CategoryWithSources> => {
    return api.get<CategoryWithSources>(`/categories/${id}`);
  },

  /**
   * Yeni kullanıcı kategorisi oluştur
   */
  create: async (data: CreateCategoryInput): Promise<Category> => {
    return api.post<Category>('/categories', data);
  },

  /**
   * Kategori güncelle (sadece kullanıcı kategorileri)
   */
  update: async (id: string, data: UpdateCategoryInput): Promise<Category> => {
    return api.put<Category>(`/categories/${id}`, data);
  },

  /**
   * Kategori sil (sadece kullanıcı kategorileri)
   */
  delete: async (id: string): Promise<void> => {
    return api.delete(`/categories/${id}`);
  },
};
