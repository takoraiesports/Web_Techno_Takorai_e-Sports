'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { Icon } from '@/components/icons';
import { TournamentCard } from '@/components/tournament-card';
import { apiGet, type Game, type Team, type Tournament } from '@/lib/api';
import { type Product } from '@/lib/products';
import { uploadToCloudinary } from '@/lib/cloudinary';

const DEFAULT_HERO_IMAGE = '/picshop/HL1.jpg';

export default function StorefrontPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Hero Image state
  const [heroImage, setHeroImage] = useState<string>(DEFAULT_HERO_IMAGE);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminHeroModal, setShowAdminHeroModal] = useState<boolean>(false);
  const [newHeroUrl, setNewHeroUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    // Check saved hero image
    const saved = localStorage.getItem('takorai_hero_image');
    if (saved) setHeroImage(saved);

    // Check admin session
    try {
      const rawUser = sessionStorage.getItem('arena_user');
      if (rawUser) {
        const user = JSON.parse(rawUser) as { roles?: { name: string }[] };
        if (user.roles?.some((r) => r.name === 'ADMIN')) {
          setIsAdmin(true);
        }
      }
    } catch {
      setIsAdmin(false);
    }

    Promise.allSettled([
      apiGet<Game[]>('/games'),
      apiGet<Team[]>('/teams'),
      apiGet<Tournament[]>('/tournaments'),
      apiGet<Product[]>('/products'),
    ]).then(([g, tm, t, p]) => {
      if (g.status === 'fulfilled') setGames(g.value);
      if (tm.status === 'fulfilled') setTeams(tm.value);
      if (t.status === 'fulfilled') setTournaments(t.value);
      if (p.status === 'fulfilled') setProducts(p.value);
      setLoaded(true);
    });
  }, []);

  const visibleTournaments = useMemo(
    () =>
      tournaments.filter((item) =>
        `${item.title} ${item.game?.name ?? ''}`.toLocaleLowerCase('th').includes(query.trim().toLocaleLowerCase('th'))
      ),
    [tournaments, query]
  );

  const handleHeroFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setNewHeroUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const saveHeroImage = () => {
    if (!newHeroUrl.trim()) return;
    setHeroImage(newHeroUrl.trim());
    localStorage.setItem('takorai_hero_image', newHeroUrl.trim());
    setShowAdminHeroModal(false);
    setNewHeroUrl('');
  };

  const resetHeroImage = () => {
    setHeroImage(DEFAULT_HERO_IMAGE);
    localStorage.removeItem('takorai_hero_image');
    setShowAdminHeroModal(false);
  };

  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <div className="page-kicker">
            <span className="orange-dot" /> TECHNO TAKORAI E-SPORTS CLUB
          </div>
          <h1>
            พื้นที่ของ<br />
            <span>คนรักเกม</span>
          </h1>
          <p className="hero-lead">
            ติดตามทีม การแข่งขัน และสินค้าของชมรม<br className="desktop-break" />
            จากข้อมูลจริงที่ผู้ดูแลเพิ่มในระบบ
          </p>
          <div className="hero-actions">
            <Link href="/tournaments" className="button button-orange">
              ดูการแข่งขัน <Icon name="arrow" />
            </Link>
            <Link href="/shop" className="text-link">
              ไปที่ร้านค้าชมรม <span>↗</span>
            </Link>
          </div>
          <div className="hero-social-proof">
            <span>
              <strong>รวมข่าวสารและกิจกรรมของชมรม</strong>
              <small>ข้อมูลจะปรากฏเมื่อมีการเพิ่มในระบบ</small>
            </span>
          </div>
        </div>

        {/* Hero Graphic Box */}
        <div className="hero-art" aria-label="กราฟิกชมรม">
          {/* Default/Custom Hero Background Image */}
          <img src={heroImage} alt="Techno Takorai Hero Banner" className="hero-real-bg" />

          {/* Admin Edit Button */}
          {isAdmin && (
            <button
              type="button"
              className="hero-admin-btn"
              onClick={() => {
                setNewHeroUrl(heroImage);
                setShowAdminHeroModal(true);
              }}
            >
              📷 ปรับแต่งรูป Hero (Admin)
            </button>
          )}

          <div className="hero-art-grid" />
          <div className="hero-art-circle circle-one" />
          <div className="hero-art-circle circle-two" />
          <div className="art-index">TECHNO / TAKORAI</div>
          <div className="art-vertical">E-SPORTS CLUB</div>
          <div className="art-monogram">
            T<span>.</span>
          </div>
          <div className="art-note">
            <span>PLAY</span>
            <strong>TOGETHER</strong>
          </div>
          <div className="art-bottom">
            <span>
              TECHNO TAKORAI<br />E-SPORTS CLUB
            </span>
            <span className="art-line" />
            <span>TH</span>
          </div>
        </div>
      </section>

      {/* Admin Hero Image Edit Modal */}
      {showAdminHeroModal && (
        <div className="cart-overlay" style={{ zIndex: 100 }}>
          <div className="cart-scrim" onClick={() => setShowAdminHeroModal(false)} />
          <div className="checkout-unavailable" style={{ maxWidth: 500 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>📷 ปรับแต่งรูปภาพ Hero Banner</h2>
            <p style={{ fontSize: 11, color: '#777' }}>
              รูปปัจจุบัน: {heroImage === DEFAULT_HERO_IMAGE ? 'HL1.jpg (Default)' : 'รูปคัสตอมจาก Cloudinary/URL'}
            </p>

            <div style={{ margin: '15px 0' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                อัปโหลดรูปภาพใหม่ (เข้าสู่ Cloudinary):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroFileUpload}
                disabled={uploading}
                style={{ fontSize: 11 }}
              />
              {uploading && <small style={{ display: 'block', color: 'var(--orange)', marginTop: 4 }}>กำลังอัปโหลดรูปภาพ...</small>}
            </div>

            <div style={{ margin: '15px 0' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                หรือใส่ Image URL:
              </label>
              <input
                type="url"
                value={newHeroUrl}
                onChange={(e) => setNewHeroUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--line)', fontSize: 11 }}
              />
            </div>

            {newHeroUrl && (
              <div style={{ marginBottom: 15 }}>
                <small style={{ display: 'block', color: '#777', marginBottom: 4 }}>ตัวอย่างรูปที่เลือก:</small>
                <img src={newHeroUrl} alt="Preview" style={{ width: '100%', height: 140, objectFit: 'cover', border: '1px solid var(--line)' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="button button-white" onClick={resetHeroImage}>
                คืนค่าเป็น HL1.jpg (Default)
              </button>
              <button type="button" className="button button-white" onClick={() => setShowAdminHeroModal(false)}>
                ยกเลิก
              </button>
              <button type="button" className="button button-orange" onClick={saveHeroImage} disabled={!newHeroUrl.trim() || uploading}>
                บันทึกรูปภาพ
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="stats-band page-shell" aria-label="ข้อมูลในระบบ">
        <div className="stats-intro">
          <span className="orange-dot" />
          <span>ข้อมูลจากระบบกลาง</span>
        </div>
        <div className="stat">
          <strong>{loaded ? String(games.length).padStart(2, '0') : '—'}</strong>
          <span>เกม</span>
        </div>
        <div className="stat">
          <strong>{loaded ? String(teams.length).padStart(2, '0') : '—'}</strong>
          <span>ทีม</span>
        </div>
        <div className="stat">
          <strong>{loaded ? String(tournaments.length).padStart(2, '0') : '—'}</strong>
          <span>รายการแข่งขัน</span>
        </div>
        <span className="stats-side-note">TECHNO TAKORAI</span>
      </section>

      <section className="games-section page-shell">
        <div className="section-heading">
          <div>
            <div className="page-kicker">
              <span className="orange-dot" /> GAMES
            </div>
            <h2>
              เกมใน<span>ระบบ</span>
            </h2>
          </div>
          <div className="search-box">
            <Icon name="search" />
            <input
              aria-label="ค้นหารายการแข่งขัน"
              placeholder="ค้นหาเกมหรือรายการ"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌕</kbd>
          </div>
        </div>
        <div className="game-strip">
          {games.length ? (
            games.slice(0, 6).map((game, index) => (
              <div className="game-tile" key={game.id}>
                <span className={`game-mark game-mark-${index % 4}`}>
                  <Icon name="game" />
                </span>
                <span>
                  <strong>{game.name}</strong>
                  <small>{game.category || game.publisher || ''}</small>
                </span>
                <Icon name="chevron" className="tile-chevron" />
              </div>
            ))
          ) : (
            <div className="game-placeholder">{loaded ? 'ยังไม่มีข้อมูลเกม' : 'กำลังโหลดข้อมูลเกม'}</div>
          )}
        </div>
      </section>

      <section className="tournaments-section">
        <div className="page-shell">
          <div className="section-heading tournament-heading">
            <div>
              <div className="page-kicker">
                <span className="orange-dot" /> TOURNAMENTS
              </div>
              <h2>การแข่งขัน</h2>
            </div>
            <Link href="/tournaments" className="text-link">
              ดูทั้งหมด <span>↗</span>
            </Link>
          </div>
          {visibleTournaments.length ? (
            <div className="tournament-grid">
              {visibleTournaments.slice(0, 3).map((item, index) => (
                <TournamentCard key={item.id} tournament={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="home-empty">
              <div className="empty-icon">
                <Icon name={query ? 'search' : 'trophy'} />
              </div>
              <div>
                <strong>{loaded ? (query ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีการแข่งขัน') : 'กำลังโหลดรายการแข่งขัน'}</strong>
                <p>{query ? 'ลองใช้คำค้นอื่น' : 'รายการจะแสดงเมื่อมีการสร้างและบันทึกในระบบ'}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="shop-section page-shell" id="club-merch">
        <div className="shop-section-heading">
          <div>
            <div className="page-kicker">
              <span className="orange-dot" /> CLUB MERCHANDISE
            </div>
            <h2>สินค้าชมรม</h2>
            <p>ราคาและตัวเลือกสินค้าตามที่ผู้ดูแลบันทึกไว้</p>
          </div>
          <Link href="/shop" className="section-arrow">
            ไปที่ร้านค้า <Icon name="arrow" />
          </Link>
        </div>
        {products.length ? (
          <div className="shop-product-grid">
            {products.slice(0, 4).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-state compact-empty">
            <Icon name="bag" />
            <h2>{loaded ? 'ยังไม่มีสินค้า' : 'กำลังโหลดสินค้า'}</h2>
            <p>เมื่อผู้ดูแลเพิ่มสินค้า รายการจะปรากฏตรงนี้</p>
          </div>
        )}
      </section>
    </main>
  );
}
