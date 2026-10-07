import type { Match } from '@/lib/api';
import { Icon } from './icons';

export function DynamicBracket({ matches, tournamentTitle }: { matches: Match[]; tournamentTitle: string }) {
  const rounds = [...matches].sort((a, b) => a.round - b.round).reduce<Record<number, Match[]>>((groups, match) => {
    (groups[match.round] ??= []).push(match);
    return groups;
  }, {});
  return <section className="dashboard-panel"><span className="page-kicker"><span className="orange-dot"/> MATCH BRACKET</span><h2>{tournamentTitle}</h2>{matches.length === 0 ? <div className="empty-state compact-empty"><Icon name="bracket"/><h2>ยังไม่มีสายการแข่งขัน</h2><p>สายแข่งจะแสดงหลังผู้จัดสร้างแมตช์ในระบบ</p></div> : <div className="bracket-rounds">{Object.entries(rounds).map(([round, roundMatches]) => <section className="bracket-round" key={round}><h3>รอบ {round}</h3>{roundMatches.map((match) => <article className="bracket-match" key={match.id}><small>{match.status}</small><strong>{match.team1?.name ?? 'รอทีม'} <span>{match.score_team1}</span></strong><strong>{match.team2?.name ?? 'รอทีม'} <span>{match.score_team2}</span></strong></article>)}</section>)}</div>}</section>;
}
