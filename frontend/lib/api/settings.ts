import { api } from './client';

export interface UserSettings {
  id: string;
  userId: string;
  emailDigestEnabled: boolean;
  emailDigestTime: string;
  emailDigestTimezone: string;
  notifyOnNewArticles: boolean;
  notifyOnErrors: boolean;
  lastDigestSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  emailDigestEnabled?: boolean;
  emailDigestTime?: string;
  emailDigestTimezone?: string;
  notifyOnNewArticles?: boolean;
  notifyOnErrors?: boolean;
}

export const settingsApi = {
  get: async (): Promise<UserSettings> => {
    return api.get<UserSettings>('/settings');
  },

  update: async (data: UpdateSettingsInput): Promise<UserSettings> => {
    return api.put<UserSettings>('/settings', data);
  },

  reset: async (): Promise<UserSettings> => {
    return api.post<UserSettings>('/settings/reset');
  },
};
