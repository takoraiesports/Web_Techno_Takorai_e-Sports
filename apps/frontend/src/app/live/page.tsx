import { Icon } from '@/components/icons';

export default function LiveStreamPage() {
  return <main className="page-shell detail-page"><div className="detail-kicker"><span className="orange-dot"/> LIVE STREAM & VOD</div><h1 className="admin-title"><Icon name="signal"/> ถ่ายทอดสด</h1><p className="detail-description">ถ่ายทอดสดและวิดีโอย้อนหลังจะแสดงเมื่อผู้จัดเพิ่มลิงก์ให้กับแมตช์</p><section className="empty-state"><Icon name="signal"/><h2>ยังไม่มีรายการถ่ายทอดสด</h2><p>ขณะนี้ไม่มีแมตช์ที่เชื่อมต่อ Twitch หรือ YouTube</p></section></main>;
}
