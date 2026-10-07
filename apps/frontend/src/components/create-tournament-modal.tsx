'use client';

import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { apiGet, type Game } from '@/lib/api';

export interface TournamentFormInput {
  title: string;
  game: string;
  format: string;
  prizePool: string;
  maxTeams: number;
  description: string;
}

const DEFAULT_GAMES: Game[] = [
  { id: 'g1', name: 'VALORANT', category: 'FPS' },
  { id: 'g2', name: 'ROV (Realm of Valor)', category: 'MOBA' },
  { id: 'g3', name: 'League of Legends', category: 'MOBA' },
  { id: 'g4', name: 'PUBG Mobile', category: 'BATTLE ROYALE' },
  { id: 'g5', name: 'Free Fire', category: 'BATTLE ROYALE' },
];

export function CreateTournamentModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (tournament: TournamentFormInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [game, setGame] = useState('VALORANT');
  const [games, setGames] = useState<Game[]>(DEFAULT_GAMES);
  const [format, setFormat] = useState('SINGLE_ELIMINATION');
  const [prizePool, setPrizePool] = useState('');
  const [maxTeams, setMaxTeams] = useState(16);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    apiGet<Game[]>('/games')
      .then((items) => {
        if (!active) return;
        if (Array.isArray(items) && items.length > 0) {
          setGames(items);
          setGame((current) => current || items[0]?.name || 'VALORANT');
        } else {
          setGames(DEFAULT_GAMES);
          setGame((current) => current || 'VALORANT');
        }
      })
      .catch(() => {
        if (!active) return;
        setGames(DEFAULT_GAMES);
        setGame((current) => current || 'VALORANT');
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      game: game || 'VALORANT',
      format,
      prizePool: prizePool.trim(),
      maxTeams,
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div className="cart-overlay" style={{ zIndex: 9999 }}>
      <button className="cart-scrim" onClick={onClose} aria-label="ปิด" />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(620px, 94%)',
          background: '#fff',
          padding: '28px',
          borderRadius: '6px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10000,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div>
            <span className="page-kicker">
              <span className="orange-dot" /> TOURNAMENT CREATOR (MEMBER CREATION)
            </span>
            <h2 style={{ fontSize: '22px', margin: '4px 0 0', letterSpacing: '-0.5px' }}>
              <Icon name="trophy" /> สร้างรายการแข่งขันใหม่ (Create Tournament)
            </h2>
          </div>
          <button onClick={onClose} style={{ border: 0, background: '#f4f2f0', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              ชื่อการแข่งขัน (Tournament Title) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่อรายการแข่งขัน เช่น Takorai VALORANT Championship 2026"
              style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>เกมที่ใช้แข่ง *</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                style={{ width: '100%', height: '42px', padding: '0 10px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px', background: '#fff' }}
              >
                {games.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>รูปแบบการแข่งขัน (Format)</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{ width: '100%', height: '42px', padding: '0 10px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px', background: '#fff' }}
              >
                <option value="SINGLE_ELIMINATION">Single Elimination (น็อกเอาต์แพ้คัดออก)</option>
                <option value="DOUBLE_ELIMINATION">Double Elimination (สายบน - สายล่าง)</option>
                <option value="TWO_STAGE">Two-Stage (Group Stage → Playoff)</option>
                <option value="ROUND_ROBIN">Round Robin (พบกันหมดสะสมคะแนน)</option>
                <option value="SWISS">Swiss System (จัดคู่ตามสถิติ ชนะ-แพ้)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>เงินรางวัลรวม (Prize Pool)</label>
              <input
                type="text"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="ระบุเงินรางวัล (เช่น 15,000 บาท)"
                style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>จำนวนทีมสูงสุด</label>
              <input
                type="number"
                min={2}
                max={128}
                value={maxTeams}
                onChange={(e) => setMaxTeams(Number(e.target.value))}
                style={{ width: '100%', height: '42px', padding: '0 12px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>รายละเอียด / กติกาการแข่งขันสังเขป</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุกติกา กำหนดการเช็กอิน และเงื่อนไขรางวัล..."
              style={{ width: '100%', padding: '10px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '11px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="button button-white" style={{ minHeight: '42px', fontSize: '11px' }}>
              ยกเลิก
            </button>
            <button type="submit" className="button button-orange" style={{ minHeight: '42px', fontSize: '11px' }}>
              + ยืนยันสร้างทัวร์นาเมนต์ใหม่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
