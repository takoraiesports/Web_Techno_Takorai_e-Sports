export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  category?: string;
  publisher?: string;
  team_size_min?: number;
  team_size_max?: number;
  is_active: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  slug: string;
  description?: string;
  rules?: string;
  status: string;
  format?: string;
  prize_pool?: string;
  max_teams?: number;
  registration_start?: string;
  registration_end?: string;
  tournament_start?: string;
  tournament_end?: string;
  game?: Game;
  organizer?: { username?: string; full_name?: string };
  matches?: Match[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url?: string;
  game?: Game;
  members?: { id: string; role?: string; user?: { username?: string; full_name?: string } }[];
  member_count?: number;
  captain?: { username?: string; full_name?: string };
  wins?: number;
  losses?: number;
  rating?: number;
  championships?: number;
}

export interface Match {
  id: string;
  round: number;
  score_team1: number;
  score_team2: number;
  status: string;
  match_number?: number;
  winner_id?: string;
  scheduled_at?: string;
  stream_url?: string;
  vod_url?: string;
  team1?: { name: string };
  team2?: { name: string };
}

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}/api/v1${path}`, { cache: 'no-store' });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error ?? 'ไม่สามารถโหลดข้อมูลได้');
  }
  return body.data;
}

export async function apiPost<T>(path: string, input: unknown): Promise<T> {
  const token = typeof window === 'undefined' ? null : window.sessionStorage.getItem('arena_token');
  const response = await fetch(`${apiBase}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error ?? 'คำขอไม่สำเร็จ');
  }
  return body.data;
}

export async function apiPut<T>(path: string, input: unknown): Promise<T> {
  return apiRequest<T>(path, 'PUT', input);
}

export async function apiDelete(path: string): Promise<void> {
  const token = typeof window === 'undefined' ? null : window.sessionStorage.getItem('arena_token');
  const response = await fetch(`${apiBase}/api/v1${path}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const body = (await response.json()) as ApiResponse<unknown>;
  if (!response.ok || !body.success) throw new Error(body.error ?? 'คำขอไม่สำเร็จ');
}

async function apiRequest<T>(path: string, method: 'PUT', input: unknown): Promise<T> {
  const token = typeof window === 'undefined' ? null : window.sessionStorage.getItem('arena_token');
  const response = await fetch(`${apiBase}/api/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(input),
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success || body.data === undefined) throw new Error(body.error ?? 'คำขอไม่สำเร็จ');
  return body.data;
}

export const formatDate = (value?: string) => {
  if (!value) return 'กำหนดการเร็ว ๆ นี้';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'กำหนดการเร็ว ๆ นี้';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};
