'use client';

import { useEffect, useState } from 'react';
import { apiGet, type Game } from '@/lib/api';
import { Icon } from './icons';

export type TeamFormInput = { name: string; tag: string; gameId: string };

export function CreateTeamModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (team: TeamFormInput) => void }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    apiGet<Game[]>('/games').then((items) => {
      if (!active) return;
      setGames(items);
      setGameId((current) => current || items[0]?.id || '');
    }).catch(() => { if (active) setError('โหลดรายชื่อเกมไม่ได้ กรุณาลองใหม่'); });
    return () => { active = false; };
  }, [open]);

  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.sessionStorage.getItem('arena_token')) {
      setError('เข้าสู่ระบบก่อนสร้างทีม');
      return;
    }
    if (!gameId) {
      setError('เลือกรายการเกมก่อนสร้างทีม');
      return;
    }
    setError('');
    onCreate({ name: name.trim(), tag: tag.trim().toUpperCase(), gameId });
    onClose();
  }

  return (
    <div className="cart-overlay">
      <button className="cart-scrim" onClick={onClose} aria-label="ปิด" />
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="create-team-title">
        <div className="panel-heading"><div><span className="page-kicker"><span className="orange-dot" /> TEAM REGISTRATION</span><h2 id="create-team-title">สร้างทีมใหม่</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button></div>
        <form className="dispute-form" onSubmit={submit}>
          <label>ชื่อทีม<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="ชื่อทีมของคุณ" /></label>
          <label>ชื่อย่อทีม<input required minLength={2} maxLength={8} value={tag} onChange={(event) => setTag(event.target.value.toUpperCase())} placeholder="ชื่อย่อ 2–8 ตัวอักษร" /></label>
          <label>เกม<select required value={gameId} onChange={(event) => setGameId(event.target.value)}><option value="" disabled>เลือกเกม</option>{games.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="dashboard-actions"><button type="button" className="button button-white" onClick={onClose}>ยกเลิก</button><button type="submit" className="button button-orange">สร้างทีม</button></div>
        </form>
      </section>
    </div>
  );
}
