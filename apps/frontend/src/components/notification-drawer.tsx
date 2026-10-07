'use client';

import { Icon } from './icons';

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="cart-overlay"><button className="cart-scrim" onClick={onClose} aria-label="ปิดการแจ้งเตือน"/><aside className="cart-drawer" style={{ width: 'min(450px, 100%)' }}><div className="cart-head"><div><span className="page-kicker"><span className="orange-dot"/> NOTIFICATIONS</span><h2>การแจ้งเตือน</h2></div><button onClick={onClose} aria-label="ปิด"><Icon name="close"/></button></div><div className="cart-empty"><strong>ยังไม่มีการแจ้งเตือน</strong><p>การแจ้งเตือนจากระบบจะแสดงที่นี่</p></div></aside></div>;
}
