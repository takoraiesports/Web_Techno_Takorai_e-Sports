'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { DynamicBracket } from '@/components/dynamic-bracket';
import { apiGet, formatDate, type Tournament } from '@/lib/api';

type Tab = 'BRACKET' | 'MATCHES' | 'TEAMS' | 'RULES';

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('BRACKET');
  useEffect(() => { let active = true; apiGet<Tournament>(`/tournaments/${id}`).then((value) => { if (active) setTournament(value); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลการแข่งขันไม่ได้'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);

  if (loading) return <main className="page-shell detail-page"><div className="loading-state"><span className="spinner"/> กำลังโหลดข้อมูลการแข่งขัน</div></main>;
  if (!tournament) return <main className="page-shell detail-page"><Link href="/tournaments" className="back-link">← กลับไปรายการแข่งขัน</Link><section className="empty-state"><Icon name="trophy"/><h1>ไม่พบการแข่งขัน</h1><p>{error}</p></section></main>;

  const tabs: { id: Tab; label: string; icon: 'bracket' | 'trophy' | 'users' | 'file' }[] = [{ id: 'BRACKET', label: 'สายการแข่งขัน', icon: 'bracket' }, { id: 'MATCHES', label: 'แมตช์', icon: 'trophy' }, { id: 'TEAMS', label: 'ทีมที่เข้าร่วม', icon: 'users' }, { id: 'RULES', label: 'กติกา', icon: 'file' }];
  return <main className="page-shell detail-page"><Link href="/tournaments" className="back-link">← กลับไปรายการแข่งขัน</Link><div className="detail-kicker"><span className="orange-dot"/> {tournament.game?.name || 'เกม'} · {tournament.format?.replaceAll('_',' ') || 'ยังไม่ระบุรูปแบบ'}</div><h1 className="tournament-detail-title">{tournament.title}</h1><p className="detail-description">{tournament.description || 'ผู้จัดยังไม่ได้เพิ่มรายละเอียดการแข่งขัน'}</p>
    <div className="detail-facts"><div><Icon name="game"/><div><span>เกม</span><strong>{tournament.game?.name || 'ยังไม่ระบุ'}</strong></div></div><div><Icon name="trophy"/><div><span>เงินรางวัล</span><strong>{tournament.prize_pool || 'ยังไม่ระบุ'}</strong></div></div><div><Icon name="users"/><div><span>จำนวนทีมสูงสุด</span><strong>{tournament.max_teams || 'ยังไม่ระบุ'}</strong></div></div><div><Icon name="calendar"/><div><span>กำหนดการแข่งขัน</span><strong>{formatDate(tournament.tournament_start)}</strong></div></div></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="button button-orange"
        style={{ minHeight: 44, padding: '0 24px', fontSize: 12, fontWeight: 800 }}
        onClick={() => {
          const user = sessionStorage.getItem('arena_user') || sessionStorage.getItem('arena_token');
          if (!user) {
            window.location.assign('/login?mode=login&notice=require_auth_tournament');
            return;
          }
          alert('คุณได้สมัครเข้าร่วมรายการนี้ในสิทธิ์สมาชิกชมรมเรียบร้อยแล้ว!');
        }}
      >
        🏆 สมัครเข้าร่วมการแข่งขัน
      </button>
      <span style={{ fontSize: 11, color: '#777' }}>* สมาชิกชมรมสามารถส่งรายชื่อทีมเพื่อลงแข่งได้</span>
    </div>
    <div className="dashboard-tabs">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`button ${activeTab === tab.id ? 'button-dark' : 'button-white'}`}><Icon name={tab.icon}/> {tab.label}</button>)}</div>
    {activeTab === 'BRACKET' && <DynamicBracket tournamentTitle={tournament.title} matches={tournament.matches ?? []}/>}
    {activeTab === 'MATCHES' && <section className="dashboard-panel"><h2>แมตช์การแข่งขัน</h2>{tournament.matches?.length ? <div className="stack-list">{tournament.matches.map((match) => <article key={match.id} className="dashboard-item"><div><small>รอบ {match.round} · {match.status}</small><strong>{match.team1?.name || 'รอทีม'} {match.score_team1} – {match.score_team2} {match.team2?.name || 'รอทีม'}</strong></div><span>{match.status}</span></article>)}</div> : <p>ยังไม่มีแมตช์ในระบบ</p>}</section>}
    {activeTab === 'TEAMS' && <section className="dashboard-panel"><h2>ทีมที่เข้าร่วม</h2><p>ข้อมูลทีมสมัครยังไม่มีในระบบ</p></section>}
    {activeTab === 'RULES' && <section className="dashboard-panel"><h2>กติกาการแข่งขัน</h2><p>{tournament.rules || 'ผู้จัดยังไม่ได้เพิ่มกติกา'}</p></section>}
  </main>;
}
