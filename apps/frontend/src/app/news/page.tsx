'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { getNewsList, subscribeNewsChange, type NewsItem } from '@/lib/news';
import { NewsSlider } from '@/components/news-slider';

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('ทั้งหมด');
  const [activeModalItem, setActiveModalItem] = useState<NewsItem | null>(null);

  const loadData = () => {
    setNews(getNewsList());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeNewsChange(loadData);
    return () => unsub();
  }, []);

  const categories = ['ทั้งหมด', 'ข่าวการแข่งขัน', 'ข่าวประกาศ', 'สินค้า & MERCH', 'ผลงานชมรม', 'กิจกรรม'];

  const filteredNews =
    selectedCat === 'ทั้งหมด' ? news : news.filter((item) => item.category.toUpperCase().includes(selectedCat.toUpperCase()));

  return (
    <main className="page-shell collection-page">
      <div className="collection-heading" style={{ marginBottom: 24 }}>
        <div>
          <span className="page-kicker">
            <span className="orange-dot" /> CLUB NEWS & ANNOUNCEMENTS
          </span>
          <h1>
            ข่าวสาร & <em>ประกาศ</em>
          </h1>
          <p>อัปเดตข่าวการแข่งขัน กิจกรรมชมรม และสินค้าใหม่จาก Techno Takorai</p>
        </div>
      </div>

      {/* Featured News Slider on top of News page */}
      <div style={{ marginBottom: 40 }}>
        <NewsSlider />
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 28 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`button ${selectedCat === cat ? 'button-orange' : 'button-dark'}`}
            style={{ padding: '6px 14px', minHeight: 36, fontSize: 11, fontWeight: 700 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News Cards Grid */}
      {filteredNews.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredNews.map((item) => (
            <article
              key={item.id}
              onClick={() => setActiveModalItem(item)}
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 6,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
              }}
              className="news-card-hover"
            >
              <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
                <img
                  src={item.image_url}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'var(--orange)',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 3,
                  }}
                >
                  {item.category}
                </span>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ font: '10px var(--font-mono)', color: '#888', marginBottom: 8 }}>
                  📅 {item.date} {item.author ? `· โดย ${item.author}` : ''}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.4 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, margin: '0 0 16px', flex: 1 }}>
                  {item.summary}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    อ่านเพิ่มเติม <Icon name="arrow" />
                  </span>
                  <Link
                    href={`/news/${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 10, font: '10px var(--font-mono)', color: '#888', textDecoration: 'underline' }}
                  >
                    เปิดในหน้าใหม่ ↗
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <Icon name="file" />
          <h2>ยังไม่มีข่าวสารในหมวดหมู่นี้</h2>
          <p>เลือกหมวดหมู่อื่นหรือรอผู้ดูแลระบบเผยแพร่ข่าวใหม่</p>
        </section>
      )}

      {/* News Detail Reader Modal */}
      {activeModalItem && (
        <div className="news-modal-backdrop" onClick={() => setActiveModalItem(null)}>
          <div
            className="news-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 680, width: '100%', padding: 0, overflow: 'hidden' }}
          >
            {/* Header Image */}
            <div style={{ height: 260, position: 'relative' }}>
              <img
                src={activeModalItem.image_url}
                alt={activeModalItem.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => setActiveModalItem(null)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                ✕
              </button>
              <span
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 20,
                  background: 'var(--orange)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 3,
                }}
              >
                {activeModalItem.category}
              </span>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px 28px 32px' }}>
              <span style={{ font: '11px var(--font-mono)', color: '#888' }}>
                📅 {activeModalItem.date} {activeModalItem.author ? `· โดย ${activeModalItem.author}` : ''}
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 16px', lineHeight: 1.35 }}>
                {activeModalItem.title}
              </h2>

              <div
                style={{
                  background: '#fff0eb',
                  borderLeft: '3px solid var(--orange)',
                  padding: '12px 16px',
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: '#444',
                  marginBottom: 20,
                  fontWeight: 600,
                }}
              >
                {activeModalItem.summary}
              </div>

              <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-line', marginBottom: 28 }}>
                {activeModalItem.content || activeModalItem.summary}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <Link
                  href={`/news/${activeModalItem.id}`}
                  className="button button-orange"
                  style={{ minHeight: 38, padding: '0 16px', fontSize: 11 }}
                >
                  ไปที่หน้าข่าวเต็ม ↗
                </Link>
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => setActiveModalItem(null)}
                  style={{ minHeight: 38, padding: '0 16px', fontSize: 11 }}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
