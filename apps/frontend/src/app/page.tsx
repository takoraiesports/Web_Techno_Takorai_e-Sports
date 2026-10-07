'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { Icon } from '@/components/icons';
import { TournamentCard } from '@/components/tournament-card';
import { apiGet, type Game, type Team, type Tournament } from '@/lib/api';
import { type Product } from '@/lib/products';

export default function StorefrontPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([apiGet<Game[]>('/games'), apiGet<Team[]>('/teams'), apiGet<Tournament[]>('/tournaments'), apiGet<Product[]>('/products')]).then(([g, tm, t, p]) => {
      if (g.status === 'fulfilled') setGames(g.value);
      if (tm.status === 'fulfilled') setTeams(tm.value);
      if (t.status === 'fulfilled') setTournaments(t.value);
      if (p.status === 'fulfilled') setProducts(p.value);
      setLoaded(true);
    });
  }, []);

  const visibleTournaments = useMemo(() => tournaments.filter((item) => `${item.title} ${item.game?.name ?? ''}`.toLocaleLowerCase('th').includes(query.trim().toLocaleLowerCase('th'))), [tournaments, query]);

  return <main>
    <section className="hero page-shell">
      <div className="hero-copy"><div className="page-kicker"><span className="orange-dot" /> TECHNO TAKORAI E-SPORTS CLUB</div><h1>พื้นที่ของ<br /><span>คนรักเกม</span></h1><p className="hero-lead">ติดตามทีม การแข่งขัน และสินค้าของชมรม<br className="desktop-break" />จากข้อมูลจริงที่ผู้ดูแลเพิ่มในระบบ</p><div className="hero-actions"><Link href="/tournaments" className="button button-orange">ดูการแข่งขัน <Icon name="arrow" /></Link><Link href="/shop" className="text-link">ไปที่ร้านค้าชมรม <span>↗</span></Link></div><div className="hero-social-proof"><span><strong>รวมข่าวสารและกิจกรรมของชมรม</strong><small>ข้อมูลจะปรากฏเมื่อมีการเพิ่มในระบบ</small></span></div></div>
      <div className="hero-art" aria-label="กราฟิกชมรม"><div className="hero-art-grid"/><div className="hero-art-circle circle-one"/><div className="hero-art-circle circle-two"/><div className="art-index">TECHNO / TAKORAI</div><div className="art-vertical">E-SPORTS CLUB</div><div className="art-monogram">T<span>.</span></div><div className="art-note"><span>PLAY</span><strong>TOGETHER</strong></div><div className="art-bottom"><span>TECHNO TAKORAI<br/>E-SPORTS CLUB</span><span className="art-line"/><span>TH</span></div></div>
    </section>
    <section className="stats-band page-shell" aria-label="ข้อมูลในระบบ"><div className="stats-intro"><span className="orange-dot"/><span>ข้อมูลจากระบบกลาง</span></div><div className="stat"><strong>{loaded ? String(games.length).padStart(2,'0') : '—'}</strong><span>เกม</span></div><div className="stat"><strong>{loaded ? String(teams.length).padStart(2,'0') : '—'}</strong><span>ทีม</span></div><div className="stat"><strong>{loaded ? String(tournaments.length).padStart(2,'0') : '—'}</strong><span>รายการแข่งขัน</span></div><span className="stats-side-note">TECHNO TAKORAI</span></section>
    <section className="games-section page-shell"><div className="section-heading"><div><div className="page-kicker"><span className="orange-dot"/> GAMES</div><h2>เกมใน<span>ระบบ</span></h2></div><div className="search-box"><Icon name="search"/><input aria-label="ค้นหารายการแข่งขัน" placeholder="ค้นหาเกมหรือรายการ" value={query} onChange={(event) => setQuery(event.target.value)}/><kbd>⌕</kbd></div></div><div className="game-strip">{games.length ? games.slice(0,6).map((game,index) => <div className="game-tile" key={game.id}><span className={`game-mark game-mark-${index%4}`}><Icon name="game"/></span><span><strong>{game.name}</strong><small>{game.category || game.publisher || ''}</small></span><Icon name="chevron" className="tile-chevron"/></div>) : <div className="game-placeholder">{loaded ? 'ยังไม่มีข้อมูลเกม' : 'กำลังโหลดข้อมูลเกม'}</div>}</div></section>
    <section className="tournaments-section"><div className="page-shell"><div className="section-heading tournament-heading"><div><div className="page-kicker"><span className="orange-dot"/> TOURNAMENTS</div><h2>การแข่งขัน</h2></div><Link href="/tournaments" className="text-link">ดูทั้งหมด <span>↗</span></Link></div>{visibleTournaments.length ? <div className="tournament-grid">{visibleTournaments.slice(0,3).map((item,index)=><TournamentCard key={item.id} tournament={item} index={index}/>)}</div> : <div className="home-empty"><div className="empty-icon"><Icon name={query?'search':'trophy'}/></div><div><strong>{loaded ? (query?'ไม่พบรายการที่ค้นหา':'ยังไม่มีการแข่งขัน') : 'กำลังโหลดรายการแข่งขัน'}</strong><p>{query?'ลองใช้คำค้นอื่น':'รายการจะแสดงเมื่อมีการสร้างและบันทึกในระบบ'}</p></div></div>}</div></section>
    <section className="shop-section page-shell" id="club-merch"><div className="shop-section-heading"><div><div className="page-kicker"><span className="orange-dot"/> CLUB MERCHANDISE</div><h2>สินค้าชมรม</h2><p>ราคาและตัวเลือกสินค้าตามที่ผู้ดูแลบันทึกไว้</p></div><Link href="/shop" className="section-arrow">ไปที่ร้านค้า <Icon name="arrow"/></Link></div>{products.length ? <div className="shop-product-grid">{products.slice(0,4).map((product,index)=><ProductCard key={product.id} product={product} index={index}/>)}</div> : <div className="empty-state compact-empty"><Icon name="bag"/><h2>{loaded?'ยังไม่มีสินค้า':'กำลังโหลดสินค้า'}</h2><p>เมื่อผู้ดูแลเพิ่มสินค้า รายการจะปรากฏตรงนี้</p></div>}</section>
  </main>;
}
