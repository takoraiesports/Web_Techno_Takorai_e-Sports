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
  UPCOMING: 'เร็ว ๆ นี้ (เปิดรับสมัคร)',
};

export function TournamentCard({ tournament, index = 0 }: { tournament: Tournament; index?: number }) {
  const live = tournament.status === 'ONGOING';
  const targetUrl = `/tournaments/${tournament.id}`;

  return (
    <article
      className={`tournament-card card-tone-${index % 3}`}
      style={{ cursor: 'pointer' }}
      onClick={() => {
        window.location.assign(targetUrl);
      }}
    >
      <div className="tournament-card-top">
        <span className={live ? 'status-pill live' : 'status-pill'}>
          <i />
          {statusText[tournament.status] ?? tournament.status}
        </span>
        <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="game-label">
        <Icon name="game" />
        {tournament.game?.name ?? 'ยังไม่ระบุเกม'}
      </div>
      <h3>
        <Link href={targetUrl} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
          {tournament.title}
        </Link>
      </h3>
      <p className="tournament-description">{tournament.description || 'ผู้จัดยังไม่ได้เพิ่มรายละเอียดการแข่งขัน'}</p>
      <div className="card-meta">
        <span>
          <Icon name="calendar" />
          {formatDate(tournament.tournament_start ?? tournament.registration_end)}
        </span>
        {tournament.prize_pool && (
          <span className="prize-label">
            <Icon name="trophy" />
            {tournament.prize_pool}
          </span>
        )}
      </div>
      <Link href={targetUrl} className="card-link" onClick={(e) => e.stopPropagation()}>
        ดูรายละเอียด <Icon name="arrow" />
      </Link>
    </article>
  );
}
