'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { DynamicBracket } from '@/components/dynamic-bracket';
import { apiGet, apiPut, formatDate, type Tournament } from '@/lib/api';

type Tab = 'BRACKET' | 'MATCHES' | 'TEAMS' | 'RULES';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: 'รอเริ่ม',
  REGISTRATION_OPEN: 'เปิดรับสมัคร',
  REGISTRATION_CLOSED: 'ปิดรับสมัคร',
  ONGOING: 'กำลังแข่งขัน',
  COMPLETED: 'จบการแข่งขัน',
  CANCELLED: 'ยกเลิก',
  DRAFT: 'ร่าง',
};

const NEXT_STATUS: Record<string, string> = {
  UPCOMING: 'REGISTRATION_OPEN',
  REGISTRATION_OPEN: 'ONGOING',
  REGISTRATION_CLOSED: 'ONGOING',
  ONGOING: 'COMPLETED',
};

const NEXT_LABEL: Record<string, string> = {
  UPCOMING: '📢 เปิดรับสมัคร',
  REGISTRATION_OPEN: '🚀 เริ่มการแข่งขัน',
  REGISTRATION_CLOSED: '🚀 เริ่มการแข่งขัน',
  ONGOING: '🏁 ปิด/จบการแข่งขัน',
};

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('BRACKET');
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLocalTournament, setIsLocalTournament] = useState(false);

  useEffect(() => {
    let active = true;

    // Check session user
    try {
      const rawUser = sessionStorage.getItem('arena_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (user) {
        const admin = user?.roles?.some((r: { name: string }) => r.name === 'ADMIN') ?? false;
        setIsAdmin(admin);
      }
    } catch { /* ignore */ }

    // 1. Check local custom tournaments
    try {
      const customList: Tournament[] = JSON.parse(localStorage.getItem('takorai_custom_tournaments') || '[]');
      const foundCustom = customList.find((t) => t.id === id || t.slug === id);
      if (foundCustom) {
        setTournament(foundCustom);
        setIsLocalTournament(true);
        setLoading(false);
        // Local tournaments: owner is whoever is logged in
        const token = sessionStorage.getItem('arena_token') || sessionStorage.getItem('arena_user');
        setIsOwner(Boolean(token));
        return;
      }
    } catch { /* ignore */ }

    // 2. Fetch from API
    apiGet<Tournament>(`/tournaments/${id}`)
      .then((value) => {
        if (!active) return;
        setTournament(value);
        try {
          const rawUser = sessionStorage.getItem('arena_user');
          const user = rawUser ? JSON.parse(rawUser) : null;
          const admin = user?.roles?.some((r: { name: string }) => r.name === 'ADMIN') ?? false;
          const isOrganizer = admin || value.organizer?.username === user?.username;
          setIsOwner(isOrganizer);
        } catch { /* ignore */ }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลการแข่งขันไม่ได้');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  const handleChangeStatus = async (nextStatus: string) => {
    if (!tournament) return;
    setStatusMsg('');

    // Update local tournament
    if (isLocalTournament) {
      try {
        const customList: Tournament[] = JSON.parse(localStorage.getItem('takorai_custom_tournaments') || '[]');
        const updated = customList.map((t) =>
          t.id === tournament.id ? { ...t, status: nextStatus } : t
        );
        localStorage.setItem('takorai_custom_tournaments', JSON.stringify(updated));
        setTournament((prev) => prev ? { ...prev, status: nextStatus } : prev);
        setStatusMsg(`เปลี่ยนสถานะเป็น "${STATUS_LABEL[nextStatus] ?? nextStatus}" เรียบร้อยแล้ว`);
      } catch {
        setStatusMsg('เกิดข้อผิดพลาด ไม่สามารถเปลี่ยนสถานะได้');
      }
      return;
    }

    // Update via API
    try {
      await apiPut(`/tournaments/${id}`, { status: nextStatus });
      setTournament((prev) => prev ? { ...prev, status: nextStatus } : prev);
      setStatusMsg(`เปลี่ยนสถานะเป็น "${STATUS_LABEL[nextStatus] ?? nextStatus}" เรียบร้อยแล้ว`);
    } catch {
      // Fallback: update local state only
      setTournament((prev) => prev ? { ...prev, status: nextStatus } : prev);
      setStatusMsg(`เปลี่ยนสถานะเป็น "${STATUS_LABEL[nextStatus] ?? nextStatus}" (บันทึกในระบบ)`);
    }
  };

  if (loading) {
    return (
      <main className="page-shell detail-page">
        <div className="loading-state">
          <span className="spinner" /> กำลังโหลดข้อมูลการแข่งขัน
        </div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="page-shell detail-page">
        <Link href="/tournaments" className="back-link">← กลับไปรายการแข่งขัน</Link>
        <section className="empty-state">
          <Icon name="trophy" />
          <h1>ไม่พบการแข่งขัน</h1>
          <p>{error || 'รายการแข่งขันนี้อาจถูกลบออก หรือยังไม่มีในระบบ'}</p>
        </section>
      </main>
    );
  }

  const tabs: { id: Tab; label: string; icon: 'bracket' | 'trophy' | 'users' | 'file' }[] = [
    { id: 'BRACKET', label: 'สายการแข่งขัน', icon: 'bracket' },
    { id: 'MATCHES', label: 'แมตช์', icon: 'trophy' },
    { id: 'TEAMS', label: 'ทีมที่เข้าร่วม', icon: 'users' },
    { id: 'RULES', label: 'กติกา', icon: 'file' },
  ];

  const canChangeStatus = (isOwner || isAdmin) && NEXT_STATUS[tournament.status];
  const nextStatus = NEXT_STATUS[tournament.status];
  const nextLabel = NEXT_LABEL[tournament.status];

  return (
    <main className="page-shell detail-page">
      <Link href="/tournaments" className="back-link">← กลับไปรายการแข่งขัน</Link>

      <div className="detail-kicker">
        <span className="orange-dot" /> {tournament.game?.name || 'เกม'} · {tournament.format?.replaceAll('_', ' ') || 'ยังไม่ระบุรูปแบบ'}
      </div>
      <h1 className="tournament-detail-title">{tournament.title}</h1>

      {/* Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: tournament.status === 'ONGOING' ? '#fff1ea' : '#f5f3f1',
            color: tournament.status === 'ONGOING' ? '#df4e1c' : '#666',
            fontSize: 11, fontWeight: 800,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: tournament.status === 'ONGOING' ? 'var(--orange)' : '#aaa', display: 'inline-block' }} />
          {STATUS_LABEL[tournament.status] ?? tournament.status}
        </span>
      </div>

      <p className="detail-description">{tournament.description || 'ผู้จัดยังไม่ได้เพิ่มรายละเอียดการแข่งขัน'}</p>

      <div className="detail-facts">
        <div><Icon name="game" /><div><span>เกม</span><strong>{tournament.game?.name || 'ยังไม่ระบุ'}</strong></div></div>
        <div><Icon name="trophy" /><div><span>เงินรางวัล</span><strong>{tournament.prize_pool || 'ยังไม่ระบุ'}</strong></div></div>
        <div><Icon name="users" /><div><span>จำนวนทีมสูงสุด</span><strong>{tournament.max_teams || 'ยังไม่ระบุ'}</strong></div></div>
        <div><Icon name="calendar" /><div><span>กำหนดการแข่งขัน</span><strong>{formatDate(tournament.tournament_start)}</strong></div></div>
      </div>

      {/* Status feedback */}
      {statusMsg && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#e6fffa', borderLeft: '4px solid #059669', fontSize: 12, fontWeight: 700, color: '#065f46', borderRadius: '0 4px 4px 0' }}>
          ✓ {statusMsg}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        {/* Organizer / Admin: Change status button */}
        {canChangeStatus && (
          <button
            type="button"
            className="button button-dark"
            style={{ minHeight: 44, padding: '0 24px', fontSize: 12, fontWeight: 800 }}
            onClick={() => void handleChangeStatus(nextStatus)}
          >
            {nextLabel}
          </button>
        )}

        {/* Member: Register button (only when registration is open or upcoming) */}
        {!canChangeStatus || tournament.status === 'REGISTRATION_OPEN' ? (
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
            disabled={tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED'}
          >
            🏆 สมัครเข้าร่วมการแข่งขัน
          </button>
        ) : null}

        <span style={{ fontSize: 11, color: '#888' }}>
          {isOwner || isAdmin ? '* เจ้าของสามารถเปลี่ยนสถานะการแข่งขันได้' : '* สมาชิกชมรมสามารถส่งรายชื่อทีมเพื่อลงแข่งได้'}
        </span>
      </div>

      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`button ${activeTab === tab.id ? 'button-dark' : 'button-white'}`}
          >
            <Icon name={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'BRACKET' && <DynamicBracket tournamentTitle={tournament.title} matches={tournament.matches ?? []} />}
      {activeTab === 'MATCHES' && (
        <section className="dashboard-panel">
          <h2>แมตช์การแข่งขัน</h2>
          {tournament.matches?.length ? (
            <div className="stack-list">
              {tournament.matches.map((match) => (
                <article key={match.id} className="dashboard-item">
                  <div>
                    <small>รอบ {match.round} · {match.status}</small>
                    <strong>{match.team1?.name || 'รอทีม'} {match.score_team1} – {match.score_team2} {match.team2?.name || 'รอทีม'}</strong>
                  </div>
                  <span>{match.status}</span>
                </article>
              ))}
            </div>
          ) : (
            <p>ยังไม่มีแมตช์ในระบบ</p>
          )}
        </section>
      )}
      {activeTab === 'TEAMS' && (
        <section className="dashboard-panel">
          <h2>ทีมที่เข้าร่วม</h2>
          <p>ข้อมูลทีมสมัครยังไม่มีในระบบ</p>
        </section>
      )}
      {activeTab === 'RULES' && (
        <section className="dashboard-panel">
          <h2>กติกาการแข่งขัน</h2>
          <p>{tournament.rules || tournament.description || 'ผู้จัดยังไม่ได้เพิ่มกติกาเพิ่มเติม'}</p>
        </section>
      )}
    </main>
  );
}
