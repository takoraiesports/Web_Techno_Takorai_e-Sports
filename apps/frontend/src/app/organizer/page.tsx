'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { apiGet, type Tournament } from '@/lib/api';

export default function OrganizerDashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    try { const user = JSON.parse(sessionStorage.getItem('arena_user') ?? 'null') as { username?: string } | null; setUsername(user?.username ?? ''); }
    catch { setUsername(''); }
    apiGet<Tournament[]>('/tournaments').then(setTournaments).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'โหลดทัวร์นาเมนต์ไม่ได้')).finally(() => setLoading(false));
  }, []);
  const mine = tournaments.filter((tournament) => tournament.organizer?.username === username);

  return <main className="page-shell detail-page"><div className="detail-kicker"><span className="orange-dot"/> TOURNAMENT ORGANIZER</div><h1 className="admin-title"><Icon name="chart"/> รายการแข่งขันของฉัน</h1><p className="detail-description">รายการแข่งขันที่สร้างด้วยบัญชีนี้</p>{error && <div role="alert" className="admin-error">{error}</div>}
    {loading ? <div className="loading-state"><span className="spinner"/> กำลังโหลดรายการ</div> : !username ? <section className="empty-state"><h2>เข้าสู่ระบบก่อน</h2><p>เข้าสู่ระบบเพื่อจัดการรายการแข่งขันของคุณ</p><Link href="/login" className="button button-orange">เข้าสู่ระบบ</Link></section> : mine.length === 0 ? <section className="empty-state"><Icon name="trophy"/><h2>ยังไม่มีรายการแข่งขันของคุณ</h2><p>สร้างรายการจากหน้าทัวร์นาเมนต์ รายการจะผูกกับบัญชีนี้</p><Link href="/tournaments" className="button button-orange">ไปที่ทัวร์นาเมนต์</Link></section> : <div className="tournament-grid">{mine.map((tournament,index) => <article key={tournament.id} className={`tournament-card card-tone-${index%3}`}><div className="tournament-card-top"><span className="status-pill">{tournament.status}</span></div><div className="game-label"><Icon name="game"/>{tournament.game?.name || 'ยังไม่ระบุเกม'}</div><h3>{tournament.title}</h3><p className="tournament-description">{tournament.description || 'ยังไม่ได้เพิ่มรายละเอียด'}</p><Link className="card-link" href={`/tournaments/${tournament.id}`}>ดูหน้ารายการ <Icon name="arrow"/></Link></article>)}</div>}
    <section className="dashboard-panel" style={{ marginTop: 20 }}><h2>เครื่องมือผู้จัด</h2><p>อนุมัติผู้สมัคร เช็กอิน วาง Seed สร้าง bracket และจัดการข้อพิพาท ยังไม่มี API กลางที่บันทึกการเปลี่ยนแปลง จึงยังไม่เปิดปุ่มจำลอง</p></section>
  </main>;
}
