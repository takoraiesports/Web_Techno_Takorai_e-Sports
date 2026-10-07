import Link from 'next/link';
import { formatDate, type Tournament } from '@/lib/api';
import { Icon } from './icons';

const statusText: Record<string, string> = {
  REGISTRATION_OPEN: 'เปิดรับสมัคร',
  REGISTRATION_CLOSED: 'ปิดรับสมัคร',
  ONGOING: 'กำลังแข่งขัน',
  COMPLETED: 'จบการแข่งขัน',
  CANCELLED: 'ยกเลิก',
  DRAFT: 'เร็ว ๆ นี้',
};

export function TournamentCard({ tournament, index = 0 }: { tournament: Tournament; index?: number }) {
  const live = tournament.status === 'ONGOING';
  return (
    <article className={`tournament-card card-tone-${index % 3}`}>
      <div className="tournament-card-top">
        <span className={live ? 'status-pill live' : 'status-pill'}><i />{statusText[tournament.status] ?? tournament.status}</span>
        <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="game-label"><Icon name="game" />{tournament.game?.name ?? 'ยังไม่ระบุเกม'}</div>
      <h3>{tournament.title}</h3>
      <p className="tournament-description">{tournament.description || 'ผู้จัดยังไม่ได้เพิ่มรายละเอียดการแข่งขัน'}</p>
      <div className="card-meta">
        <span><Icon name="calendar" />{formatDate(tournament.tournament_start ?? tournament.registration_end)}</span>
        {tournament.prize_pool && <span className="prize-label"><Icon name="trophy" />{tournament.prize_pool}</span>}
      </div>
      <Link href={`/tournaments/${tournament.id}`} className="card-link">ดูรายละเอียด <Icon name="arrow" /></Link>
    </article>
  );
}
