'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { apiGet, type Team } from '@/lib/api';

export default function CaptainDashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    try { const user = JSON.parse(sessionStorage.getItem('arena_user') ?? 'null') as { username?: string } | null; setUsername(user?.username ?? ''); }
    catch { setUsername(''); }
    apiGet<Team[]>('/teams').then(setTeams).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'โหลดทีมไม่ได้')).finally(() => setLoading(false));
  }, []);
  const mine = teams.filter((team) => team.captain?.username === username);

  return <main className="page-shell detail-page"><div className="detail-kicker"><span className="orange-dot"/> TEAM CAPTAIN</div><h1 className="admin-title"><Icon name="crown"/> ทีมของฉัน</h1><p className="detail-description">รายชื่อทีมที่สร้างด้วยบัญชีนี้</p>{error && <div role="alert" className="admin-error">{error}</div>}
    {loading ? <div className="loading-state"><span className="spinner"/> กำลังโหลดทีม</div> : !username ? <section className="empty-state"><h2>เข้าสู่ระบบก่อน</h2><p>เข้าสู่ระบบเพื่อดูทีมที่คุณเป็นกัปตัน</p><Link className="button button-orange" href="/login">เข้าสู่ระบบ</Link></section> : mine.length === 0 ? <section className="empty-state"><Icon name="users"/><h2>ยังไม่มีทีมของคุณ</h2><p>สร้างทีมจากหน้าทีม ระบบจะบันทึกกัปตันไว้กับบัญชีนี้</p><Link className="button button-orange" href="/teams">ดูทีมและสร้างทีม</Link></section> : <div className="team-grid">{mine.map((team) => <article key={team.id} className="team-card"><div className="team-avatar">{team.tag}</div><span className="team-count">{team.member_count ?? team.members?.length ?? 0} สมาชิก</span><h2>{team.name}</h2><p>{team.game?.name ?? 'ยังไม่ระบุเกม'}</p><div className="team-card-bottom"><span>กัปตัน: {team.captain?.full_name || username}</span><Link href={`/teams/${team.id}`}>ดูทีม <Icon name="arrow"/></Link></div></article>)}</div>}
    <section className="dashboard-panel" style={{ marginTop: 20 }}><h2>เครื่องมือกัปตัน</h2><p>การเชิญสมาชิก สมัครแข่งขัน เช็กอิน และส่งผล ยังไม่มี API กลาง จึงยังไม่แสดงฟอร์มที่บันทึกได้เฉพาะเครื่อง</p></section>
  </main>;
}
