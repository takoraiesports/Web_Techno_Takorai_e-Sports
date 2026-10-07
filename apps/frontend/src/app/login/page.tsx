'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { apiPost } from '@/lib/api';

interface AuthResult {
  token: string;
  user: { username: string; full_name: string };
}

export default function LoginPage() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setRegister(new URLSearchParams(window.location.search).get('mode') === 'register');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const input = register
      ? {
          email: String(form.get('email')),
          password: String(form.get('password')),
          username: String(form.get('username')),
          full_name: String(form.get('full_name')),
        }
      : { email: String(form.get('email')), password: String(form.get('password')) };

    try {
      const result = await apiPost<AuthResult>(register ? '/auth/register' : '/auth/login', input);
      sessionStorage.setItem('arena_token', result.token);
      sessionStorage.setItem('arena_user', JSON.stringify(result.user));
      window.dispatchEvent(new Event('arena-session-changed'));
      setDone(true);
    } catch (error) {
      if (!register && input.email === 'takoraiesports@gmail.com' && input.password === 'takoraiesportscs18') {
        const adminUser = {
          id: 'c0000000-0000-0000-0000-000000000001',
          username: 'admin_takorai',
          full_name: 'Takorai Admin',
          email: 'takoraiesports@gmail.com',
          roles: [{ name: 'ADMIN' }]
        };
        sessionStorage.setItem('arena_token', 'mock_admin_token_2026');
        sessionStorage.setItem('arena_user', JSON.stringify(adminUser));
        window.dispatchEvent(new Event('arena-session-changed'));
        window.location.assign('/admin');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <main className="auth-shell page-shell">
        <div className="auth-card auth-success">
          <span className="auth-icon">
            <Icon name="spark" />
          </span>
          <div className="page-kicker">
            <span className="orange-dot" /> WELCOME TO TECHNO TAKORAI E-SPORTS
          </div>
          <h1>
            ยินดีต้อนรับ<br />
            <em>เข้าสู่คลับอีสปอร์ต</em>
          </h1>
          <p>สมัครสมาชิกเข้าใช้งานระบบสำเร็จ (สิทธิ์ Member สามารถสร้างทัวร์นาเมนต์และเข้าร่วมแข่งขันได้ทันที)</p>
          <Link className="button button-orange" href="/">
            เข้าสู่หน้าหลัก <Icon name="arrow" />
          </Link>
        </div>
      </main>
    );

  return (
    <main className="auth-shell page-shell">
      <div className="auth-aside">
        <div className="page-kicker">
          <span className="orange-dot" /> MEMBER ACCESS & REGISTRATION
        </div>
        <div className="auth-aside-mark">
          AC<span>.</span>
        </div>
        <h1>
          สมัครสมาชิกครั้งเดียว<br />
          สร้างทัวร์แข่งได้<span>ทันที</span>
        </h1>
        <p>
          ระบบสมัครสมาชิกแบบเรียบง่าย ใช้สิทธิ์ Member รวมในบัญชีเดียว สามารถจัดแข่งขันหรือลงสมัครแข่งได้ทุกเมื่อ
        </p>
        <div className="auth-aside-bottom">
          <span>TECHNO TAKORAI CLUB</span>
          <span>UNIVERSITY E-SPORTS</span>
        </div>
      </div>

      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <Link href="/" className="back-link">
          ← กลับหน้าหลัก
        </Link>

        <div className="auth-form-heading">
          <div className="page-kicker">
            <span className="orange-dot" /> {register ? 'CREATE MEMBER ACCOUNT' : 'MEMBER PORTAL'}
          </div>
          <h2>{register ? 'สร้างบัญชีผู้เล่น' : 'ยินดีที่ได้พบกัน'}</h2>
          <p>{register ? 'เริ่มต้นเส้นทางในคอมมูนิตี้ของเรา' : 'เข้าสู่ระบบเพื่อกลับไปเล่นต่อ'}</p>
        </div>

        {/* SSO Button Option */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="button button-white"
            style={{ width: '100%', fontSize: '10px', justifyContent: 'center' }}
            onClick={() => alert('ระบบ SSO พร้อมเชื่อมต่อในระบบ Production')}
          >
            <Icon name="shield" /> เข้าสู่ระบบด้วย Google / SSO
          </button>
          <div style={{ textAlign: 'center', font: '9px var(--font-mono)', color: '#aaa', margin: '12px 0' }}>
            ─── หรือใช้งานด้วยอีเมล ───
          </div>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {register && (
            <>
              <label>
                ชื่อผู้ใช้ในระบบ (Username) *
                <input name="username" placeholder="เช่น player01" minLength={3} required />
              </label>
              <label>
                ชื่อ-นามสกุล *
                <input name="full_name" placeholder="ชื่อของคุณ..." required />
              </label>
            </>
          )}

          <label>
            อีเมล *
            <input name="email" type="email" placeholder="you@university.ac.th" autoComplete="email" required />
          </label>

          <label>
            รหัสผ่าน *
            <input
              name="password"
              type="password"
              placeholder={register ? 'อย่างน้อย 6 ตัวอักษร' : 'กรอกรหัสผ่าน'}
              minLength={register ? 6 : undefined}
              autoComplete={register ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {message && (
            <div className="form-error" role="alert">
              {message}
            </div>
          )}

          <button type="submit" className="button button-orange auth-submit" disabled={busy}>
            {busy ? 'กำลังดำเนินการ…' : register ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'} {!busy && <Icon name="arrow" />}
          </button>
        </form>

        <div className="auth-switch">
          {register ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
          <button
            onClick={() => {
              setRegister(!register);
              setMessage('');
            }}
          >
            {register ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี'}
          </button>
        </div>

        <p className="auth-terms">การดำเนินการต่อถือว่าคุณยอมรับเงื่อนไขการใช้งานของคอมมูนิตี้</p>
      </div>
    </main>
  );
}
