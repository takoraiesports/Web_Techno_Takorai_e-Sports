'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { apiGet, type Team } from '@/lib/api';

type TeamDetail = Team & { rating?: number; wins?: number; losses?: number; championships?: number; captain?: { full_name?: string; username?: string }; members?: { id?: string; role?: string; user?: { full_name?: string; username?: string } }[] };

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; apiGet<TeamDetail>(`/teams/${id}`).then((value) => { if (active) setTeam(value); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลทีมไม่ได้'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);

  return <main className="page-shell detail-page"><Link href="/teams" className="back-link">← กลับไปหน้าทีม</Link>{loading ? <div className="loading-state"><span className="spinner"/> กำลังโหลดข้อมูลทีม</div> : error || !team ? <section className="empty-state"><Icon name="users"/><h1>ไม่พบข้อมูลทีม</h1><p>{error}</p></section> : <>
    <section className="team-detail-banner"><div className="team-detail-mark">{team.tag || team.name.slice(0,2)}</div><div><div className="detail-kicker">TEAM PROFILE</div><h1>{team.name} <small>[{team.tag}]</small></h1><p>{team.game?.name || 'ยังไม่ระบุเกม'} · กัปตัน {team.captain?.full_name || team.captain?.username || 'ยังไม่ระบุ'}</p></div></section>
    <div className="detail-facts"><div><Icon name="users"/><div><span>สมาชิกทีม</span><strong>{team.members?.length ?? 'ยังไม่มีข้อมูล'}</strong></div></div><div><Icon name="trophy"/><div><span>สถิติจากการแข่งขัน</span><strong>{team.wins !== undefined && team.losses !== undefined ? `${team.wins} ชนะ / ${team.losses} แพ้` : 'ยังไม่มีข้อมูล'}</strong></div></div><div><Icon name="chart"/><div><span>Rating</span><strong>{team.rating ?? 'ยังไม่มีข้อมูล'}</strong></div></div></div>
    <section className="dashboard-panel"><h2>รายชื่อสมาชิก</h2>{team.members?.length ? <div className="table-scroll"><table className="dashboard-table"><thead><tr><th>สมาชิก</th><th>ตำแหน่ง</th></tr></thead><tbody>{team.members.map((member) => <tr key={member.id}><td>{member.user?.full_name || member.user?.username || 'สมาชิก'}</td><td>{member.role || 'สมาชิกทีม'}</td></tr>)}</tbody></table></div> : <p>ยังไม่มีสมาชิกใน roster</p>}</section>
  </>}</main>;
}
