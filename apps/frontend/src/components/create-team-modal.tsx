'use client';

import { useEffect, useState } from 'react';
import { apiGet, type Game } from '@/lib/api';
import { Icon } from './icons';

export type TeamFormInput = { name: string; tag: string; gameId: string };

const DEFAULT_GAMES: Game[] = [
  { id: 'g1', name: 'VALORANT', category: 'FPS' },
  { id: 'g2', name: 'ROV (Realm of Valor)', category: 'MOBA' },
  { id: 'g3', name: 'League of Legends', category: 'MOBA' },
  { id: 'g4', name: 'PUBG Mobile', category: 'BATTLE ROYALE' },
  { id: 'g5', name: 'Free Fire', category: 'BATTLE ROYALE' },
];

export function CreateTeamModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (team: TeamFormInput) => void }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [gameId, setGameId] = useState('VALORANT');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    apiGet<Game[]>('/games').then((items) => {
      if (!active) return;
      if (Array.isArray(items) && items.length > 0) {
        setGames(items);
        setGameId((current) => current || items[0]?.name || 'VALORANT');
      } else {
        setGames(DEFAULT_GAMES);
        setGameId((current) => current || 'VALORANT');
      }
    }).catch(() => {
      if (!active) return;
      setGames(DEFAULT_GAMES);
      setGameId((current) => current || 'VALORANT');
    });
    return () => { active = false; };
  }, [open]);

  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userToken = sessionStorage.getItem('arena_token') || sessionStorage.getItem('arena_user');
    if (!userToken) {
      setError('เข้าสู่ระบบก่อนสร้างทีม');
      return;
    }
    setError('');
    onCreate({ name: name.trim(), tag: tag.trim().toUpperCase(), gameId: gameId || 'VALORANT' });
    onClose();
  }

  return (
    <div className="cart-overlay" style={{ zIndex: 9999 }}>
      <button className="cart-scrim" onClick={onClose} aria-label="ปิด" />
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="create-team-title" style={{ zIndex: 10000 }}>
        <div className="panel-heading">
          <div>
            <span className="page-kicker"><span className="orange-dot" /> TEAM REGISTRATION</span>
            <h2 id="create-team-title">สร้างทีมใหม่</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="dispute-form" onSubmit={submit}>
          <label>ชื่อทีม *<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="ชื่อทีมของคุณ" /></label>
          <label>ชื่อย่อทีม *<input required minLength={2} maxLength={8} value={tag} onChange={(event) => setTag(event.target.value.toUpperCase())} placeholder="ชื่อย่อ 2–8 ตัวอักษร" /></label>
          <label>เกม *<select required value={gameId} onChange={(event) => setGameId(event.target.value)}>{games.map((game) => <option key={game.id} value={game.name}>{game.name}</option>)}</select></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="dashboard-actions">
            <button type="button" className="button button-white" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="button button-orange">สร้างทีม</button>
          </div>
        </form>
      </section>
    </div>
  );
}
