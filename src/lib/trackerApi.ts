import type { PersistedState } from './trackerTypes';
import { normalizePersistedState } from './trackerNormalization';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5175';
const API_TIMEOUT_MS = 5000;

const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal, credentials: 'include' });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const readState = async (): Promise<PersistedState | null> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/state`);
  if (response.status === 204) return null;
  if (!response.ok) throw new Error('Failed to load saved data.');

  const data = (await response.json()) as unknown;
  return normalizePersistedState(data);
};

export const writeState = async (state: PersistedState): Promise<void> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });

  if (!response.ok) {
    throw new Error('Failed to save data.');
  }
};

export const clearState = async (): Promise<void> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/state`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to reset data.');
  }
};
