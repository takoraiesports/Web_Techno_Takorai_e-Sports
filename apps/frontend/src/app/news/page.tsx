'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { getNewsList, subscribeNewsChange, type NewsItem } from '@/lib/news';
import { NewsSlider } from '@/components/news-slider';

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('ทั้งหมด');

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

      {/* News Grid */}
      {filteredNews.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredNews.map((item) => (
            <article
              key={item.id}
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: 6,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
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
                {item.content && item.content !== item.summary && (
                  <details style={{ marginTop: 'auto', fontSize: 11, color: '#555' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--orange)' }}>
                      อ่านเนื้อหาฉบับเต็ม ▼
                    </summary>
                    <p style={{ marginTop: 10, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{item.content}</p>
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <Icon name="file" />
          <h2>ยังไม่มีข่าวสารในหมวดหมู่นี้</h2>
          <p>เลือกหมวดตู้อื่นหรือรอผู้ดูแลระบบเผยแพร่ข่าวใหม่</p>
        </section>
      )}
    </main>
  );
}
