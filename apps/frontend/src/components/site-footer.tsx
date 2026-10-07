import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="brand footer-brand" href="/"><span className="brand-mark"><span>TT</span><i /></span><span className="brand-name">TECHNO TAKORAI<span>E-SPORTS CLUB</span></span></Link>
      <p>ชมรมอีสปอร์ต มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี</p>
      <span className="footer-note">© TECHNO TAKORAI E-SPORTS CLUB</span>
    </footer>
  );
}
