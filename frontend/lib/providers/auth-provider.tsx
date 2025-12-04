'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, User, ProfileResponse } from '@/lib/api/auth';
import { getToken } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  profile: ProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname?.startsWith('/auth'));

      if (!user && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        router.push('/auth/login');
      } else if (user && pathname?.startsWith('/auth')) {
        // Authenticated but on auth page, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const checkAuth = async () => {
    const token = getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const profileData = await authApi.getProfile();
      setUser({
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
      });
      setProfile(profileData);
    } catch (error) {
      // Token invalid, clear it
      authApi.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
    await refreshProfile();
    router.push('/dashboard');
  };

  const register = async (email: string, password: string) => {
    const response = await authApi.register({ email, password });
    setUser(response.user);
    await refreshProfile();
    router.push('/dashboard');
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setProfile(null);
    router.push('/auth/login');
  };

  const refreshProfile = async () => {
    try {
      const profileData = await authApi.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
