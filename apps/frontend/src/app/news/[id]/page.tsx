'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { getNewsList, subscribeNewsChange, type NewsItem } from '@/lib/news';

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<NewsItem | null>(null);
  const [otherNews, setOtherNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const list = getNewsList();
    const found = list.find((n) => n.id === id);
    setItem(found || null);
    setOtherNews(list.filter((n) => n.id !== id).slice(0, 3));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeNewsChange(loadData);
    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <main className="page-shell detail-page">
        <div className="loading-state">
          <span className="spinner" /> กำลังโหลดข่าวสาร...
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="page-shell detail-page">
        <Link href="/news" className="back-link">
          ← กลับไปหน้าข่าวสารทั้งหมด
        </Link>
        <section className="empty-state">
          <Icon name="file" />
          <h1>ไม่พบข่าวสารที่ต้องการ</h1>
          <p>ข่าวสารนี้อาจถูกลบออก หรือลิงก์ไม่ถูกต้อง</p>
          <Link href="/news" className="button button-orange">
            ดูข่าวสารทั้งหมด
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page" style={{ maxWidth: 860, margin: '0 auto', paddingTop: 40, paddingBottom: 80 }}>
      {/* Back link */}
      <Link href="/news" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>
        ← กลับไปหน้าข่าวสารทั้งหมด
      </Link>

      {/* Meta Top */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span
          style={{
            background: 'var(--orange)',
            color: 'white',
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 3,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {item.category}
        </span>
        <span style={{ font: '11px var(--font-mono)', color: '#888' }}>
          📅 {item.date} {item.author ? `· เผยแพร่โดย ${item.author}` : ''}
        </span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-1.5px',
          lineHeight: 1.25,
          margin: '0 0 20px',
        }}
      >
        {item.title}
      </h1>

      {/* Featured Banner Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: 460,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 32,
          border: '1px solid var(--line)',
          background: 'var(--ink)',
        }}
      >
        <img
          src={item.image_url}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Summary Highlight Box */}
      <div
        style={{
          background: '#fff0eb',
          borderLeft: '4px solid var(--orange)',
          padding: '18px 24px',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.8,
          color: '#333',
          marginBottom: 32,
          borderRadius: '0 8px 8px 0',
        }}
      >
        {item.summary}
      </div>

      {/* Full Content */}
      <article
        style={{
          fontSize: 15,
          lineHeight: 2,
          color: '#333',
          whiteSpace: 'pre-line',
          marginBottom: 60,
        }}
      >
        {item.content || item.summary}
      </article>

      {/* Other News Section */}
      {otherNews.length > 0 && (
        <section style={{ borderTop: '1px solid var(--line)', paddingTop: 40, marginTop: 40 }}>
          <div className="section-heading" style={{ marginBottom: 20 }}>
            <div>
              <span className="page-kicker">
                <span className="orange-dot" /> READ MORE
              </span>
              <h2 style={{ fontSize: 22, margin: '6px 0 0' }}>ข่าวสารที่น่าสนใจ</h2>
            </div>
            <Link href="/news" className="text-link">
              ดูทั้งหมด <span>↗</span>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {otherNews.map((other) => (
              <Link
                key={other.id}
                href={`/news/${other.id}`}
                style={{
                  background: 'white',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div style={{ height: 130, position: 'relative' }}>
                  <img src={other.image_url} alt={other.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 14 }}>
                  <span style={{ fontSize: 9, font: '9px var(--font-mono)', color: 'var(--orange)', fontWeight: 700 }}>
                    {other.category}
                  </span>
                  <h4 style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 4px', lineHeight: 1.4 }}>
                    {other.title}
                  </h4>
                  <span style={{ fontSize: 10, color: '#999' }}>{other.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
