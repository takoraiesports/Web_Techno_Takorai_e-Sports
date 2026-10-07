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

const configuredApiBase = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const apiBase = configuredApiBase || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : '');

function apiURL(path: string): string {
  return `${apiBase}/api/v1${path}`;
}

const mockGames: Game[] = [
  { id: 'g1', name: 'VALORANT', slug: 'valorant', category: 'FPS', publisher: 'Riot Games', team_size_min: 5, team_size_max: 5, is_active: true },
  { id: 'g2', name: 'ROV (Realm of Valor)', slug: 'rov', category: 'MOBA', publisher: 'Garena', team_size_min: 5, team_size_max: 5, is_active: true },
  { id: 'g3', name: 'League of Legends', slug: 'lol', category: 'MOBA', publisher: 'Riot Games', team_size_min: 5, team_size_max: 5, is_active: true },
  { id: 'g4', name: 'FC 24 / EA FC', slug: 'eafc', category: 'SPORTS', publisher: 'EA Sports', team_size_min: 1, team_size_max: 1, is_active: true },
];

const mockTournaments: Tournament[] = [
  {
    id: 't1',
    title: 'Takorai VALORANT Championship 2026',
    slug: 'valorant-2026',
    description: 'ทัวร์นาเมนต์การแข่งขัน VALORANT ประจำภาคการศึกษา 1/2569 ชิงเงินรางวัลและทุนการศึกษา',
    rules: 'กติกาแข่งขัน BO1 รอบแรก และ BO3 รอบชิงชนะเลิศ ผู้เข้าแข่งขันต้องเป็นนักศึกษาหรือบุคคลทั่วไปที่ลงทะเบียนถูกต้อง',
    status: 'REGISTRATION_OPEN',
    format: 'SINGLE_ELIMINATION',
    prize_pool: '15,000 บาท',
    max_teams: 16,
    tournament_start: '2026-10-15T10:00:00Z',
    game: mockGames[0],
    organizer: { username: 'admin_takorai', full_name: 'Takorai Admin' },
    matches: [
      { id: 'm1', round: 1, match_number: 1, score_team1: 13, score_team2: 8, status: 'COMPLETED', team1: { name: 'Takorai Valkyries' }, team2: { name: 'Techno Dragons' } },
      { id: 'm2', round: 1, match_number: 2, score_team1: 13, score_team2: 11, status: 'COMPLETED', team1: { name: 'Cyber Phoenix' }, team2: { name: 'Takorai Tigers' } }
    ]
  },
  {
    id: 't2',
    title: 'ROV Takorai League 2026',
    slug: 'rov-2026',
    description: 'ศึกดวลเดือด ROV ชิงแชมป์สโมสรเทคโนตะโกราย',
    rules: 'การแข่งขันรูปแบบ 5v5 Tournament Mode',
    status: 'ONGOING',
    format: 'DOUBLE_ELIMINATION',
    prize_pool: '10,000 บาท',
    max_teams: 32,
    tournament_start: '2026-10-20T12:00:00Z',
    game: mockGames[1],
    organizer: { username: 'admin_takorai', full_name: 'Takorai Admin' }
  }
];

const mockTeams: Team[] = [
  { id: 'tm1', name: 'Takorai Valkyries', tag: 'TKV', wins: 12, losses: 3, rating: 1450, championships: 2, game: mockGames[0] },
  { id: 'tm2', name: 'Techno Dragons', tag: 'TGD', wins: 8, losses: 4, rating: 1320, championships: 1, game: mockGames[1] },
  { id: 'tm3', name: 'Cyber Phoenix', tag: 'CPX', wins: 15, losses: 2, rating: 1510, championships: 3, game: mockGames[0] }
];

const mockProducts = [
  { id: 'p1', name: 'เสื้อชมรม Techno Takorai Pro Jersey 2026', slug: 'techno-takorai-pro-jersey-2026', subtitle: 'เสื้อเเข่งสโมสรเทคโนตะโกราย', description: 'เสื้อเเข่งสโมสรเทคโนตะโกราย เนื้อผ้า Dry-Fit ซับเหงื่อได้ดีเยี่ยม ปักโลโก้ชมรม มีไซส์ S-5XL (2XL ขึ้นไป +50฿)', category: 'Apparel', sku: 'TS-JERSEY-01', price: 450, image_url: '/product/jk01.png', stock: 100, color: 'ส้ม-ดำ', has_sizes: true, is_active: true },
  { id: 'p2', name: 'เสื้อยืดสโมสร Takorai Casual Tee', slug: 'takorai-casual-tee', subtitle: 'เสื้อยืดลำลอง Cotton 100%', description: 'เสื้อยืดสโมสรผ้านุ่มใส่สบาย มีไซส์ S-5XL (2XL ขึ้นไป +50฿)', category: 'Apparel', sku: 'TS-TEE-01', price: 350, image_url: '/product/k01.png', stock: 150, color: 'ส้ม', has_sizes: true, is_active: true },
  { id: 'p3', name: 'พวงกุญแจ อะคริลิก Takorai Club', slug: 'takorai-keychain-acrylic', subtitle: 'พวงกุญแจโลโก้สโมสร', description: 'พวงกุญแจอะคริลิกใสด้าน พิมพ์ลาย HD', category: 'Accessories', sku: 'TS-ACC-01', price: 99, image_url: '/product/p01.png', stock: 200, color: 'ส้ม', has_sizes: false, is_active: true }
];

function getMockFallback<T>(path: string): T {
  if (path.startsWith('/games')) return mockGames as unknown as T;
  if (path.startsWith('/tournaments')) {
    if (path.includes('/') && path !== '/tournaments') {
      const found = mockTournaments.find((item) => item.id === path.split('/')[2] || item.slug === path.split('/')[2]);
      return (found || mockTournaments[0]) as unknown as T;
    }
    return mockTournaments as unknown as T;
  }
  if (path.startsWith('/teams')) {
    if (path.includes('/') && path !== '/teams') {
      const found = mockTeams.find((item) => item.id === path.split('/')[2]);
      return (found || mockTeams[0]) as unknown as T;
    }
    return mockTeams as unknown as T;
  }
  if (path.startsWith('/products')) return mockProducts as unknown as T;
  return [] as unknown as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  if (!apiBase) return getMockFallback<T>(path);
  try {
    const response = await fetch(apiURL(path), { cache: 'no-store' });
    const body = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !body.success || body.data === undefined) {
      return getMockFallback<T>(path);
    }
    return body.data;
  } catch {
    return getMockFallback<T>(path);
  }
}

export async function apiPost<T>(path: string, input: unknown): Promise<T> {
  if (!apiBase) return { success: true } as unknown as T;
  const token = typeof window === 'undefined' ? null : window.sessionStorage.getItem('arena_token');
  try {
    const response = await fetch(apiURL(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !body.success || body.data === undefined) throw new Error(body.error ?? 'คำขอไม่สำเร็จ');
    return body.data;
  } catch (error) {
    if (path.includes('/auth/login') || path.includes('/auth/register')) throw error;
    return { success: true } as unknown as T;
  }
}

export async function apiPut<T>(path: string, input: unknown): Promise<T> {
  return apiRequest<T>(path, 'PUT', input);
}

export async function apiDelete(path: string): Promise<void> {
  if (!apiBase) return;
  const token = typeof window === 'undefined' ? null : window.sessionStorage.getItem('arena_token');
  try {
    const response = await fetch(apiURL(path), { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const body = (await response.json()) as ApiResponse<unknown>;
    if (!response.ok || !body.success) throw new Error(body.error ?? 'คำขอไม่สำเร็จ');
  } catch {
    // fallback
  }
}

async function apiRequest<T>(path: string, method: 'PUT', input: unknown): Promise<T> {
  if (!apiBase) return { success: true } as unknown as T;
  const token = typeof window === 'undefined' ? null : window.sessionStorage.getItem('arena_token');
  try {
    const response = await fetch(apiURL(path), {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !body.success || body.data === undefined) throw new Error(body.error ?? 'คำขอไม่สำเร็จ');
    return body.data;
  } catch {
    return { success: true } as unknown as T;
  }
}

export const formatDate = (value?: string) => {
  if (!value) return 'กำหนดการเร็ว ๆ นี้';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'กำหนดการเร็ว ๆ นี้';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};
