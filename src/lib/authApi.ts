export type AuthUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
};

export type AdminUser = AuthUser & {
  created_at: number;
  last_login: number | null;
  has_data: 0 | 1;
  last_saved: number | null;
  data_bytes: number;
};

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5175';

async function authFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await authFetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json() as Promise<AuthUser>;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as { error?: string } & AuthUser;
  if (!res.ok) throw new Error(data.error ?? 'Login failed.');
  return data;
}

export async function register(
  email: string, password: string, name: string
): Promise<AuthUser> {
  const res = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json() as { error?: string } & AuthUser;
  if (!res.ok) throw new Error(data.error ?? 'Registration failed.');
  return data;
}

export async function logout(): Promise<void> {
  await authFetch('/api/auth/logout', { method: 'POST' });
}

// Admin
export async function adminGetUsers(): Promise<AdminUser[]> {
  const res = await authFetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to load users.');
  return res.json() as Promise<AdminUser[]>;
}

export async function adminDeleteUser(id: string): Promise<void> {
  const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error ?? 'Failed to delete user.'); }
}

export type UserStats = {
  unit: 'metric' | 'imperial';
  startWeight: number | null;
  targetWeight: number | null;
  currentWeight: number | null;
  weightLost: number | null;
  progressPct: number;
  totalWorkouts: number;
  weeksActive: number;
  currentWeek: number;
  avgCalories: number | null;
  inchesLost: number;
  startDate: string | null;
  weekWeights: { week: number; weight: number }[];
  photoCount: number;
};

export async function adminGetUserStats(id: string): Promise<UserStats | null> {
  const res = await authFetch(`/api/admin/users/${id}/stats`);
  if (!res.ok) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as UserStats;
}

export async function adminSetRole(id: string, role: 'admin' | 'user'): Promise<void> {
  const res = await authFetch(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error ?? 'Failed to update role.'); }
}
