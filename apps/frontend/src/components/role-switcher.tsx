'use client';

import { useEffect, useState } from 'react';

export const Role = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

type SessionUser = { username?: string; full_name?: string; roles?: { name: string }[] };

export function RoleSwitcher() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = window.sessionStorage.getItem('arena_user');
        setUser(raw ? JSON.parse(raw) as SessionUser : null);
      } catch {
        setUser(null);
      }
    };
    load();
    window.addEventListener('arena-session-changed', load);
    return () => window.removeEventListener('arena-session-changed', load);
  }, []);

  const role = user?.roles?.some((item) => item.name === Role.ADMIN) ? Role.ADMIN : user ? Role.MEMBER : null;

  function signOut() {
    window.sessionStorage.removeItem('arena_token');
    window.sessionStorage.removeItem('arena_user');
    setUser(null);
    window.dispatchEvent(new Event('arena-session-changed'));
    window.location.assign('/');
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid var(--line)', background: '#f8f6f4', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: role === Role.ADMIN ? '#dc2626' : role === Role.MEMBER ? '#059669' : '#9ca3af' }} />
        {role ? `${role}${user?.username ? ` · ${user.username}` : ''}` : 'ผู้เยี่ยมชม'}
      </span>
      {user && <button type="button" onClick={signOut} className="login-link" style={{ border: 0, background: 'none', cursor: 'pointer' }}>ออกจากระบบ</button>}
    </div>
  );
}
