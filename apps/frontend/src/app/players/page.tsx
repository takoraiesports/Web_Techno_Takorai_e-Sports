import { Icon } from '@/components/icons';

export default function PlayersDirectoryPage() {
  return <main className="page-shell collection-page"><div className="collection-heading"><div><span className="page-kicker"><span className="orange-dot"/> PLAYER PROFILES</span><h1>ทำเนียบ<span>ผู้เล่น</span></h1><p>โปรไฟล์จะแสดงเมื่อสมาชิกสร้างและยืนยันข้อมูลในระบบ</p></div></div><section className="empty-state"><Icon name="users"/><h2>ยังไม่มีโปรไฟล์ผู้เล่นสาธารณะ</h2><p>ระบบโปรไฟล์ผู้เล่นและสถิติยังไม่เปิดใช้งาน</p></section></main>;
}
