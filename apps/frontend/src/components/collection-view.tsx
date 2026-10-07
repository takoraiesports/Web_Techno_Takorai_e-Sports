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
        setItems(data);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'โหลดข้อมูลไม่ได้');
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
    if (!window.sessionStorage.getItem('arena_token')) {
      setCreateMessage('กรุณาเข้าสู่ระบบก่อนสร้างทัวร์นาเมนต์ ระบบจะไม่บันทึกข้อมูลแบบไม่ระบุตัวตน');
      return;
    }
    try {
      const saved = await apiPost<Tournament>('/tournaments', {
        title: newTour.title, game_name: newTour.game, description: newTour.description,
        format: newTour.format, max_teams: newTour.maxTeams, prize_pool: newTour.prizePool,
      });
      const createdItem = saved;
      setItems((prev) => [createdItem, ...(prev as Tournament[])]);
      setCreateMessage('สร้างทัวร์นาเมนต์และบันทึกลงฐานข้อมูลแล้ว');
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : 'ไม่สามารถสร้างทัวร์นาเมนต์ได้');
    }
  };

  const handleCreateTeam = async (input: TeamFormInput) => {
    setCreateMessage('');
    if (!window.sessionStorage.getItem('arena_token')) {
      setCreateMessage('กรุณาเข้าสู่ระบบก่อนสร้างทีม ระบบจะไม่บันทึกข้อมูลแบบไม่ระบุตัวตน');
      return;
    }
    try {
      const created = await apiPost<Team>('/teams', { name: input.name, tag: input.tag, game_id: input.gameId });
      setItems((prev) => [created, ...(prev as Team[])]);
      setCreateMessage('สร้างทีมและบันทึกลงฐานข้อมูลแล้ว');
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : 'ไม่สามารถสร้างทีมได้');
    }
  };

  const teams = kind === 'teams';

  return (
    <main className="page-shell collection-page">
      <div className="page-kicker">
        <span className="orange-dot" /> CAMPUS ESPORTS / {teams ? 'TEAMS' : 'TOURNAMENTS'}
      </div>
      {createMessage && <div role="status" className="demo-notice" style={{ marginTop: 10 }}>{createMessage}</div>}

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
              onClick={() => setCreateModalOpen(true)}
              className="button button-orange"
              style={{ padding: '0 20px', minHeight: '46px', fontSize: '12px', fontWeight: 800 }}
            >
              + สร้างทัวร์นาเมนต์ใหม่
            </button>
          )}
          {teams && <button onClick={() => setCreateTeamModalOpen(true)} className="button button-orange" style={{ padding: '0 20px', minHeight: '46px', fontSize: '12px', fontWeight: 800 }}>+ สร้างทีม</button>}

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
            <button onClick={() => setCreateTeamModalOpen(true)} className="button button-orange">+ สร้างทีม <Icon name="arrow" /></button>
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
          <button onClick={() => setCreateModalOpen(true)} className="button button-orange">
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
