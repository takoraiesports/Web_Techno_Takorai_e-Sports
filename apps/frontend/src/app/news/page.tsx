import { Icon } from '@/components/icons';

export default function NewsPage() {
  return <main className="page-shell collection-page"><div className="collection-heading"><div><span className="page-kicker"><span className="orange-dot"/> CLUB NEWS</span><h1>ข่าวสาร & <em>ประกาศ</em></h1><p>ข่าวและกิจกรรมจะปรากฏเมื่อผู้ดูแลเผยแพร่จากระบบ</p></div></div><section className="empty-state"><Icon name="file"/><h2>ยังไม่มีข่าวสาร</h2><p>ยังไม่มีบทความที่เผยแพร่</p></section></main>;
}
