'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { TournamentCard } from '@/components/tournament-card';
import { apiGet, type Game, type Team, type Tournament } from '@/lib/api';

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      apiGet<Tournament[]>('/tournaments'),
      apiGet<Game[]>('/games'),
      apiGet<Team[]>('/teams'),
    ]).then(([t, g, tm]) => {
      if (t.status === 'fulfilled') setTournaments(t.value);
      if (g.status === 'fulfilled') setGames(g.value);
      if (tm.status === 'fulfilled') setTeams(tm.value);
      setApiOffline([t, g, tm].every((result) => result.status === 'rejected'));
      setLoaded(true);
    });
  }, []);

  const visibleTournaments = useMemo(() => tournaments.filter((item) => {
    const searchText = `${item.title} ${item.game?.name ?? ''} ${item.description ?? ''}`.toLocaleLowerCase('th');
    return searchText.includes(query.trim().toLocaleLowerCase('th'));
  }), [tournaments, query]);

  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <div className="page-kicker"><span className="orange-dot" /> TECHNO TAKORAI E-SPORTS CLUB</div>
          <h1>เกมของคุณ<br />มี<span>สนาม</span>ของมัน</h1>
          <p className="hero-lead">ติดตามทีม เกม และการแข่งขันของชมรม<br className="desktop-break" /> จากข้อมูลที่บันทึกไว้ในระบบ</p>
          <div className="hero-actions"><Link href="/tournaments" className="button button-orange">สำรวจการแข่งขัน <Icon name="arrow" /></Link><Link href="/teams" className="text-link">รู้จักคอมมูนิตี้ <span>↗</span></Link></div>
          <div className="hero-social-proof"><span><strong>ข้อมูลจากระบบกลาง</strong><small>รายการจริงที่ผู้ดูแลเพิ่มไว้</small></span></div>
        </div>
        <div className="hero-art" aria-label="กราฟิกชมรม Techno Takorai">
          <div className="hero-art-grid" />
          <div className="hero-art-circle circle-one" /><div className="hero-art-circle circle-two" />
          <div className="art-index">TECHNO / TAKORAI</div><div className="art-vertical">E-SPORTS CLUB</div>
          <div className="art-monogram">T<span>.</span></div>
          <div className="art-crosshair">+</div><div className="art-note"><span>EST.</span><strong>PLAY<br />TOGETHER</strong></div>
          <div className="art-bottom"><span>TECHNO TAKORAI<br />E-SPORTS CLUB</span><span className="art-line" /><span>TH</span></div>
        </div>
      </section>

      <section className="stats-band page-shell" aria-label="ภาพรวมคอมมูนิตี้">
        <div className="stats-intro"><span className="orange-dot" /><span>ข้อมูลปัจจุบัน</span></div>
        <div className="stat"><strong>{loaded && !apiOffline ? String(games.length).padStart(2, '0') : '—'}</strong><span>เกมในคอมมูนิตี้</span></div>
        <div className="stat"><strong>{loaded && !apiOffline ? String(teams.length).padStart(2, '0') : '—'}</strong><span>ทีมที่พร้อมแข่ง</span></div>
        <div className="stat"><strong>{loaded && !apiOffline ? String(tournaments.length).padStart(2, '0') : '—'}</strong><span>รายการแข่งขัน</span></div>
        <span className="stats-side-note">TECHNO TAKORAI</span>
      </section>

      <section className="games-section page-shell">
        <div className="section-heading">
          <div><div className="page-kicker"><span className="orange-dot" /> FIND YOUR GAME</div><h2>เกมที่เรา<span>เล่น</span></h2></div>
          <div className="search-box"><Icon name="search" /><input aria-label="ค้นหารายการแข่งขัน" placeholder="ค้นหารายการแข่งขัน" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌕</kbd></div>
        </div>
        <div className="game-strip">
          {games.length ? games.slice(0, 6).map((game, index) => <div className="game-tile" key={game.id}><span className={`game-mark game-mark-${index % 4}`}><Icon name="game" /></span><span><strong>{game.name}</strong><small>{game.category || game.publisher || 'COMPETITIVE'}</small></span><Icon name="chevron" className="tile-chevron" /></div>) : <div className="game-placeholder"><Icon name="spark" /><span>{loaded ? (apiOffline ? 'ยังเชื่อมต่อข้อมูลจากระบบไม่ได้' : 'เกมใหม่จะปรากฏที่นี่เมื่อแอดมินเพิ่มรายการ') : 'กำลังโหลดเกมในคอมมูนิตี้…'}</span></div>}
        </div>
      </section>

      <section className="tournaments-section">
        <div className="page-shell">
          <div className="section-heading tournament-heading">
            <div><div className="page-kicker"><span className="orange-dot" /> THE NEXT MATCH</div><h2>สนาม<span>ถัดไป</span></h2></div>
            <Link href="/tournaments" className="text-link">ดูการแข่งขันทั้งหมด <span>↗</span></Link>
          </div>
          {visibleTournaments.length ? <div className="tournament-grid">{visibleTournaments.slice(0, 3).map((item, index) => <TournamentCard key={item.id} tournament={item} index={index} />)}</div> : <div className="home-empty"><div className="empty-icon"><Icon name={query ? 'search' : 'trophy'} /></div><div><strong>{loaded ? (query ? 'ไม่พบรายการที่ตรงกับการค้นหา' : apiOffline ? 'ยังเชื่อมต่อข้อมูลจากระบบไม่ได้' : 'เวทีต่อไปกำลังรอคุณอยู่') : 'กำลังโหลดรายการแข่งขัน'}</strong><p>{loaded ? (query ? 'ลองค้นหาด้วยชื่อเกมหรือชื่อรายการอื่น' : apiOffline ? 'กรุณาตรวจสอบว่า backend เปิดใช้งานอยู่' : 'รายการแข่งขันจะปรากฏตรงนี้เมื่อเปิดรับสมัคร') : 'เชื่อมต่อข้อมูลจากคอมมูนิตี้'}</p></div>{loaded && !query && !apiOffline && <Link className="small-arrow-link" href="/login?mode=register">เข้าร่วมคอมมูนิตี้ <Icon name="arrow" /></Link>}</div>}
        </div>
      </section>

      <section className="join-banner page-shell">
        <div className="join-banner-mark">AC<span>+</span></div>
        <div className="join-banner-copy"><span className="page-kicker">YOUR NEXT MOVE</span><h2>พร้อมลงสนาม<br /><em>หรือยัง?</em></h2></div>
        <p>สร้างโปรไฟล์ผู้เล่น ค้นหาทีมที่ใช่<br />แล้วไปเจอกันในเกม</p>
        <Link href="/login?mode=register" className="button button-white">เข้าร่วมเลย <Icon name="arrow" /></Link>
        <span className="banner-decoration">PLAY<br />YOUR<br />GAME</span>
      </section>
    </main>
  );
}
