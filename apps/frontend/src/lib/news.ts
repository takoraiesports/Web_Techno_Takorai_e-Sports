export type NewsItem = {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  image_url: string;
  date: string;
  author?: string;
};

export const DEFAULT_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Techno Takorai Valorant Championship 2026 เปิดรับสมัครแล้ว!',
    category: 'ข่าวการแข่งขัน',
    summary: 'ชิงเงินรางวัลรวมกว่า 15,000 บาท พร้อมถ้วยรางวัลเกียรติยศและเสื้อแข่งชมรมฟรีสำหรับทีมที่เข้ารอบ 4 ทีมสุดท้าย',
    content: 'ชมรม Techno Takorai E-Sports ประกาศเปิดรับสมัครการแข่งขันเกม Valorant รายการใหญ่อัปเดตภาคเรียนใหม่ 1/2569 โดยเปิดรับสมัครทีมละ 5 คน...',
    image_url: '/picshop/HL1.jpg',
    date: '15 ต.ค. 2026',
    author: 'แอดมินชมรม',
  },
  {
    id: 'news-2',
    title: 'เปิดตัวเสื้อแข่ง Official Jersey 2026 Season 1',
    category: 'สินค้า & MERCH',
    summary: 'เสื้อแข่งทรงสปอร์ตเนื้อผ้า Quick-Dry เกรดพรีเมียม พิมพ์ลายกราฟิกสีส้มดำอันเป็นเอกลักษณ์ พร้อมเปิดสั่งซื้อแล้ว',
    content: 'เปิดตัวอย่างเป็นทางการ เสื้อแข่งประจำชมรม Techno Takorai E-Sports Club ดีไซน์ใหม่ล่าสุด...',
    image_url: '/picshop/HL1.jpg',
    date: '12 ต.ค. 2026',
    author: 'แอดมินชมรม',
  },
  {
    id: 'news-3',
    title: 'ขอแสดงความยินดีกับทีม Takorai Alpha คว้าชัยแชมป์ Campus Invitational',
    category: 'ผลงานชมรม',
    summary: 'ทีมตัวแทนจากชมรมของเราสร้างชื่อเสียงคว้าอันดับ 1 ในการแข่งขันระดับอุดมศึกษา',
    content: 'ขอแสดงความยินดีอย่างยิ่งกับสมาชิกทีม Takorai Alpha ที่โชว์ฟอร์มได้อย่างยอดเยี่ยม...',
    image_url: '/picshop/HL1.jpg',
    date: '08 ต.ค. 2026',
    author: 'แอดมินชมรม',
  },
];

const STORAGE_KEY = 'takorai_news_list';
const EVENT_NAME = 'takorai-news-changed';

export function getNewsList(): NewsItem[] {
  if (typeof window === 'undefined') return DEFAULT_NEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NEWS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_NEWS;
  } catch {
    return DEFAULT_NEWS;
  }
}

export function saveNewsList(list: NewsItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function addNewsItem(item: Omit<NewsItem, 'id' | 'date'> & { id?: string; date?: string }): NewsItem {
  const current = getNewsList();
  const newItem: NewsItem = {
    id: item.id || `news-${Date.now()}`,
    title: item.title,
    category: item.category || 'ข่าวประกาศ',
    summary: item.summary,
    content: item.content || item.summary,
    image_url: item.image_url || '/picshop/HL1.jpg',
    date: item.date || new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    author: item.author || 'แอดมินชมรม',
  };
  const updated = [newItem, ...current];
  saveNewsList(updated);
  return newItem;
}

export function updateNewsItem(id: string, updatedFields: Partial<NewsItem>): void {
  const current = getNewsList();
  const updated = current.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
  saveNewsList(updated);
}

export function deleteNewsItem(id: string): void {
  const current = getNewsList();
  const updated = current.filter((item) => item.id !== id);
  saveNewsList(updated);
}

export function subscribeNewsChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
