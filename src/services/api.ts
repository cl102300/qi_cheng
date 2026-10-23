export interface User {
  id: string;
  username: string;
}

export const accountSettingsService = {
  async getFirstMeetingDate(): Promise<string | null> {
    const result = await apiRequest<{ firstMeetingDate: string | null }>('/api/account-settings');
    return result.firstMeetingDate;
  },

  async setFirstMeetingDate(firstMeetingDate: string | null): Promise<void> {
    await apiRequest('/api/account-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstMeetingDate }),
    });
  },
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { credentials: 'same-origin', ...options });
  } catch {
    throw new Error('无法连接相册服务器，请检查网络或服务器状态');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || '请求失败，请稍后重试');
  return body as T;
}

export const authService = {
  async currentUser(): Promise<User | null> {
    const result = await apiRequest<{ user: User | null }>('/api/auth/me');
    return result.user;
  },

  async login(username: string, password: string): Promise<User> {
    const result = await apiRequest<{ user: User }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return result.user;
  },

  async register(username: string, password: string): Promise<User> {
    const result = await apiRequest<{ user: User }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return result.user;
  },

  async logout(): Promise<void> {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  },
};
