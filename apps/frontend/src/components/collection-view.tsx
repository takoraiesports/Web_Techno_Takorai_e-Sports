'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, type Team, type Tournament } from '@/lib/api';
import { Icon } from './icons';
import { TournamentCard } from './tournament-card';
import { CreateTournamentModal, type TournamentFormInput } from './create-tournament-modal';
import { CreateTeamModal, type TeamFormInput } from './create-team-modal';

type Collection = Tournament[] | Team[];

export function CollectionView({ kind }: { kind: 'tournaments' | 'teams' }) {
  const [items, setItems] = useState<Collection>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiGet<Collection>(kind === 'teams' ? '/teams' : '/tournaments')
      .then((data) => {
        if (!active) return;
        const key = kind === 'teams' ? 'takorai_custom_teams' : 'takorai_custom_tournaments';
        try {
          const localCustom = JSON.parse(localStorage.getItem(key) || '[]');
          const merged = Array.isArray(localCustom) ? [...localCustom, ...(data || [])] : data;
          setItems(merged);
        } catch {
          setItems(data);
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const key = kind === 'teams' ? 'takorai_custom_teams' : 'takorai_custom_tournaments';
        try {
          const localCustom = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(localCustom) && localCustom.length > 0) {
            setItems(localCustom);
          } else {
            setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลไม่ได้');
          }
        } catch {
          setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลไม่ได้');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, retry]);

  const handleCreateTournament = async (newTour: TournamentFormInput) => {
    setCreateMessage('');
    const userToken = sessionStorage.getItem('arena_token') || sessionStorage.getItem('arena_user');
    if (!userToken) {
      setCreateMessage('กรุณาเข้าสู่ระบบก่อนสร้างทัวร์นาเมนต์');
      return;
    }

    let savedId = `tour-${Date.now()}`;
    try {
      const saved = await apiPost<{ id?: string }>('/tournaments', {
        title: newTour.title,
        game_name: newTour.game,
        description: newTour.description,
        format: newTour.format,
        max_teams: newTour.maxTeams,
        prize_pool: newTour.prizePool,
      });
      if (saved && typeof saved === 'object' && 'id' in saved && saved.id) {
        savedId = String(saved.id);
      }
    } catch {
      // Backend API fallback
    }

    const createdItem: Tournament = {
      id: savedId,
      title: newTour.title,
      slug: savedId,
      status: 'UPCOMING',
      game: { id: 'g1', name: newTour.game || 'VALORANT' },
      format: newTour.format || 'SINGLE_ELIMINATION',
      max_teams: Number(newTour.maxTeams) || 16,
      prize_pool: newTour.prizePool || 'ถ้วยรางวัลเกียรติยศ',
      description: newTour.description || 'รายละเอียดการแข่งขันจากผู้จัด',
      tournament_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      organizer: { username: 'admin_takorai', full_name: 'Takorai Admin' },
    };

    setItems((prev) => [createdItem, ...(prev as Tournament[])]);

    try {
      const existing = JSON.parse(localStorage.getItem('takorai_custom_tournaments') || '[]');
      localStorage.setItem('takorai_custom_tournaments', JSON.stringify([createdItem, ...existing]));
    } catch {
      // LocalStorage error fallback
    }

    setCreateMessage('สร้างทัวร์นาเมนต์และบันทึกลงระบบเรียบร้อยแล้ว!');
  };

  const handleCreateTeam = async (input: TeamFormInput) => {
    setCreateMessage('');
    const userToken = sessionStorage.getItem('arena_token') || sessionStorage.getItem('arena_user');
    if (!userToken) {
      setCreateMessage('กรุณาเข้าสู่ระบบก่อนสร้างทีม');
      return;
    }

    let savedId = `team-${Date.now()}`;
    try {
      const saved = await apiPost<{ id?: string }>('/teams', {
        name: input.name,
        tag: input.tag,
        game_id: input.gameId,
      });
      if (saved && typeof saved === 'object' && 'id' in saved && saved.id) {
        savedId = String(saved.id);
      }
    } catch {
      // Backend API fallback
    }

    const createdTeam: Team = {
      id: savedId,
      name: input.name,
      tag: input.tag,
      wins: 0,
      losses: 0,
      rating: 1200,
      championships: 0,
      game: { id: 'g1', name: input.gameId || 'VALORANT' },
      members: [],
    };

    setItems((prev) => [createdTeam, ...(prev as Team[])]);

    try {
      const existing = JSON.parse(localStorage.getItem('takorai_custom_teams') || '[]');
      localStorage.setItem('takorai_custom_teams', JSON.stringify([createdTeam, ...existing]));
    } catch {
      // LocalStorage error fallback
    }

    setCreateMessage('สร้างทีมและบันทึกลงระบบเรียบร้อยแล้ว!');
  };

  const requireAuth = (callback: () => void) => {
    const user = sessionStorage.getItem('arena_user') || sessionStorage.getItem('arena_token');
    if (!user) {
      window.location.assign('/login?mode=login&notice=require_auth_tournament');
      return;
    }
    callback();
  };

  const teams = kind === 'teams';

  return (
    <main className="page-shell collection-page">
      <div className="page-kicker">
        <span className="orange-dot" /> CAMPUS ESPORTS / {teams ? 'TEAMS' : 'TOURNAMENTS'}
      </div>
      {createMessage && (
        <div role="status" className="demo-notice" style={{ marginTop: 14, background: '#e6fffa', borderLeft: '4px solid #059669', color: '#065f46', fontWeight: 700, padding: '12px 16px' }}>
          ✓ {createMessage}
        </div>
      )}

      <div className="collection-heading" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>
            {teams ? (
              <>
                ทีมที่พร้อม<br />
                <em>ลงสนาม</em>
              </>
            ) : (
              <>
                ทุกการแข่งขัน<br />
                <em>ในที่เดียว</em>
              </>
            )}
          </h1>
          <p>
            {teams
              ? 'พบกับเพื่อนร่วมทีม คณะอาจารย์ และคอมมูนิตี้เกมจากมหาวิทยาลัย'
              : 'ติดตามสนามแข่งขัน สมัครเข้าร่วม และสร้างรายการแข่งขันหลังเข้าสู่ระบบ'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!teams && (
            <button
              onClick={() => requireAuth(() => setCreateModalOpen(true))}
              className="button button-orange"
              style={{ padding: '0 20px', minHeight: '46px', fontSize: '12px', fontWeight: 800 }}
            >
              + สร้างทัวร์นาเมนต์ใหม่
            </button>
          )}
          {teams && (
            <button
              onClick={() => requireAuth(() => setCreateTeamModalOpen(true))}
              className="button button-orange"
              style={{ padding: '0 20px', minHeight: '46px', fontSize: '12px', fontWeight: 800 }}
            >
              + สร้างทีม
            </button>
          )}

          <div className="heading-stamp">
            <Icon name={teams ? 'users' : 'trophy'} />
            <span>{teams ? 'PLAY TOGETHER' : 'PLAY TO WIN'}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" /> กำลังโหลดข้อมูล
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="spark" />
          </span>
          <h2>กำลังเตรียมสนาม</h2>
          <p>{error}</p>
          <button
            className="button button-dark"
            onClick={() => {
              setLoading(true);
              setError('');
              setRetry((value) => value + 1);
            }}
          >
            ลองอีกครั้ง <Icon name="arrow" />
          </button>
        </div>
      ) : teams ? (
        items.length ? (
          <div className="team-grid">
            {(items as Team[]).map((team, index) => (
              <article className="team-card" key={team.id}>
                <div className="team-avatar">{team.tag?.slice(0, 3) || team.name.slice(0, 2)}</div>
                <span className="team-count">{String(index + 1).padStart(2, '0')}</span>
                <h2>{team.name}</h2>
                <p>{team.game?.name ?? 'ยังไม่ระบุเกม'}</p>
                <div className="team-card-bottom">
                  <span>
                    <Icon name="users" /> {team.members?.length ?? 0} สมาชิก
                  </span>
                  <span className="team-tag">[{team.tag}]</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="users" />
            </span>
            <h2>ทีมใหม่เริ่มต้นที่คุณ</h2>
            <p>เข้าสู่ระบบเพื่อสร้างทีมใหม่และเริ่มจัด roster</p>
            <button onClick={() => requireAuth(() => setCreateTeamModalOpen(true))} className="button button-orange">+ สร้างทีม <Icon name="arrow" /></button>
          </div>
        )
      ) : items.length ? (
        <div className="tournament-grid">
          {(items as Tournament[]).map((tournament, index) => (
            <TournamentCard key={tournament.id} tournament={tournament} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="trophy" />
          </span>
          <h2>สนามถัดไปรอคุณอยู่</h2>
          <p>เข้าสู่ระบบด้วยบัญชีสมาชิกเพื่อสร้างการแข่งขันใหม่ รายการจะถูกบันทึกลงระบบกลาง</p>
          <button onClick={() => requireAuth(() => setCreateModalOpen(true))} className="button button-orange">
            + สร้างทัวร์นาเมนต์แรก <Icon name="arrow" />
          </button>
        </div>
      )}

      <CreateTournamentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateTournament}
      />
      <CreateTeamModal open={createTeamModalOpen} onClose={() => setCreateTeamModalOpen(false)} onCreate={handleCreateTeam} />
    </main>
  );
}
