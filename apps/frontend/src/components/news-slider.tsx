'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';
import {
  addNewsItem,
  deleteNewsItem,
  getNewsList,
  subscribeNewsChange,
  updateNewsItem,
  type NewsItem,
} from '@/lib/news';
import { uploadToCloudinary } from '@/lib/cloudinary';

export function NewsSlider() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State for Admin News Management
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ข่าวการแข่งขัน');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('/picshop/HL1.jpg');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const loadData = () => {
    const list = getNewsList();
    setNews(list);
    try {
      const rawUser = sessionStorage.getItem('arena_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      const admin =
        Boolean(sessionStorage.getItem('arena_token')) &&
        Boolean(user?.roles?.some((r: { name: string }) => r.name === 'ADMIN'));
      setIsAdmin(admin);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeNewsChange(loadData);
    return () => unsubscribe();
  }, []);

  // Auto-slide every 5 seconds (5000ms)
  useEffect(() => {
    if (!news.length) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [news.length]);

  const nextSlide = () => {
    if (!news.length) return;
    setCurrentIndex((prev) => (prev + 1) % news.length);
  };

  const prevSlide = () => {
    if (!news.length) return;
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('ข่าวการแข่งขัน');
    setSummary('');
    setContent('');
    setImageUrl('/picshop/HL1.jpg');
    setMsg('');
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (item: NewsItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setSummary(item.summary);
    setContent(item.content);
    setImageUrl(item.image_url);
    setMsg('');
    setShowAdminModal(true);
  };

  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setMsg('กรุณากรอกหัวข้อและรายละเอียดข่าวอย่างย่อ');
      return;
    }

    if (editingId) {
      updateNewsItem(editingId, {
        title,
        category,
        summary,
        content: content || summary,
        image_url: imageUrl,
      });
      setMsg('แก้ไขข่าวสารเรียบร้อยแล้ว');
    } else {
      addNewsItem({
        title,
        category,
        summary,
        content: content || summary,
        image_url: imageUrl,
      });
      setMsg('เพิ่มข่าวสารเรียบร้อยแล้ว');
    }
    setTimeout(() => {
      setShowAdminModal(false);
    }, 800);
  };

  const handleDeleteNews = (id: string) => {
    if (!confirm('คุณต้องการลบข่าวสารนี้ใช่หรือไม่?')) return;
    deleteNewsItem(id);
    if (currentIndex >= news.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setMsg('');
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
      setMsg('อัปโหลดรูปภาพข่าวสำเร็จ');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  if (!news.length) {
    return (
      <div className="news-slider-container hero-art">
        <div className="news-slide-fallback">
          <span>ยังไม่มีข่าวสารในระบบ</span>
          {isAdmin && (
            <button onClick={handleOpenAddModal} className="news-admin-badge">
              + เพิ่มข่าวสาร (Admin)
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeNews = news[currentIndex] || news[0];

  return (
    <div className="news-slider-container hero-art" aria-label="ข่าวสารและประกาศชมรม">
      {/* Slides Track */}
      <div
        className="news-track"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {news.map((item, idx) => (
          <div key={item.id} className={`news-slide ${idx === currentIndex ? 'active' : ''}`}>
            <img src={item.image_url} alt={item.title} className="news-slide-bg" />
            <div className="news-slide-overlay" />
            
            <div className="news-slide-content">
              <div className="news-meta-top">
                <span className="news-cat-pill">{item.category}</span>
                <span className="news-date">{item.date}</span>
              </div>
              <h2 className="news-slide-title">{item.title}</h2>
              <p className="news-slide-summary">{item.summary}</p>
              
              <div className="news-slide-actions">
                <Link href="/news" className="news-read-btn">
                  อ่านข่าวสารทั้งหมด <Icon name="arrow" />
                </Link>
                {isAdmin && (
                  <div className="news-admin-actions">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="news-admin-mini-btn"
                      title="แก้ไขข่าวนี้"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      className="news-admin-mini-btn danger"
                      title="ลบข่าวนี้"
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Quick Add Button */}
      {isAdmin && (
        <button
          type="button"
          className="news-admin-top-btn"
          onClick={handleOpenAddModal}
        >
          📰 + เพิ่มข่าวสาร (Admin)
        </button>
      )}

      {/* Navigation Controls */}
      <div className="news-controls">
        <button onClick={prevSlide} className="news-nav-btn" aria-label="ข่าวสารก่อนหน้า">
          ‹
        </button>
        <span className="news-counter">
          {String(currentIndex + 1).padStart(2, '0')} / {String(news.length).padStart(2, '0')}
        </span>
        <button onClick={nextSlide} className="news-nav-btn" aria-label="ข่าวสารถัดไป">
          ›
        </button>
      </div>

      {/* Progress Indicator Dots */}
      <div className="news-dots">
        {news.map((item, idx) => (
          <button
            key={item.id}
            className={`news-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`ไปที่ข่าวที่ ${idx + 1}`}
          />
        ))}
      </div>

      {/* Admin News Modal */}
      {showAdminModal && (
        <div className="news-modal-backdrop" onClick={() => setShowAdminModal(false)}>
          <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-header">
              <h3>{editingId ? '✏️ แก้ไขข่าวสาร' : '📰 เพิ่มข่าวสารใหม่ (Admin)'}</h3>
              <button className="news-modal-close" onClick={() => setShowAdminModal(false)}>
                ✕
              </button>
            </div>

            {msg && <div className="news-modal-msg">{msg}</div>}

            <form onSubmit={handleSaveNews} className="news-modal-form">
              <label>
                หัวข้อข่าว *
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น Techno Takorai Valorant Championship 2026"
                  required
                />
              </label>

              <div className="news-form-row">
                <label>
                  หมวดหมู่ *
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="ข่าวการแข่งขัน">ข่าวการแข่งขัน</option>
                    <option value="ข่าวประกาศ">ข่าวประกาศ</option>
                    <option value="สินค้า & MERCH">สินค้า & MERCH</option>
                    <option value="ผลงานชมรม">ผลงานชมรม</option>
                    <option value="กิจกรรม">กิจกรรมชมรม</option>
                  </select>
                </label>

                <label>
                  รูปภาพข่าว (URL หรือ อัปโหลด)
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/picshop/HL1.jpg หรือ Cloudinary URL"
                  />
                </label>
              </div>

              <div className="news-upload-box">
                <span>อัปโหลดรูปภาพใหม่ไปที่ Cloudinary:</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) void handleImageUpload(e.target.files[0]);
                  }}
                  disabled={uploading}
                />
                {uploading && <small>กำลังอัปโหลดรูปภาพ...</small>}
              </div>

              <label>
                รายละเอียดอย่างย่อ (แสดงบนสไลด์) *
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="รายละเอียดสั้นๆ ความยาวประมาณ 2-3 บรรทัด..."
                  rows={3}
                  required
                />
              </label>

              <label>
                เนื้อหาข่าวฉบับเต็ม
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="เนื้อหาข่าวแบบละเอียด..."
                  rows={5}
                />
              </label>

              <div className="news-modal-footer">
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => setShowAdminModal(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="button button-orange">
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มข่าวสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
