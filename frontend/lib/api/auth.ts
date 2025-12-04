import { api, setToken, removeToken, getToken } from './client';

// Types
export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ProfileResponse extends User {
  createdAt: string;
  _count: {
    sources: number;
    sites: number;
    categories: number;
  };
}

// Auth API functions
export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data, true);
    setToken(response.accessToken);
    return response;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data, true);
    setToken(response.accessToken);
    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    return api.get<ProfileResponse>('/auth/profile');
  },

  /**
   * Logout - removes token from storage
   */
  logout(): void {
    removeToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getToken();
  },
};
