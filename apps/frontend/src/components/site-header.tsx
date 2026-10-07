'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Icon } from './icons';
import { formatPrice, getProductPrice } from '@/lib/products';
import { useStore } from './store-provider';
import { NotificationDrawer } from './notification-drawer';
import { RoleSwitcher } from './role-switcher';
import { CheckoutModal } from './checkout-modal';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const unreadNotifCount = 0;
  const [signedIn, setSignedIn] = useState(false);
  const { cart, itemCount, cartOpen, setCartOpen, changeQuantity } = useStore();

  useEffect(() => {
    const updateSession = () => setSignedIn(Boolean(sessionStorage.getItem('arena_token')));
    updateSession();
    window.addEventListener('arena-session-changed', updateSession);
    return () => window.removeEventListener('arena-session-changed', updateSession);
  }, []);

  return (
    <>
      <div className="store-announcement">
        <span>TECHNO TAKORAI E-SPORTS CLUB</span>
        <i /> OFFICIAL CAMPUS PORTAL & MERCH <span className="announcement-thai">ระบบจัดการแข่งขันและร้านค้าชมรม</span>
      </div>

      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Techno Takorai E-Sports หน้าแรก">
            <span className="brand-mark">
              <span>TT</span>
              <i />
            </span>
            <span className="brand-name">
              TECHNO TAKORAI<span>E-SPORTS CLUB</span>
            </span>
          </Link>

          <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="เมนูหลัก">
            <Link href="/" onClick={() => setOpen(false)} className={pathname === '/' ? 'nav-link active' : 'nav-link'}>
              หน้าแรก
            </Link>
            <Link href="/tournaments" onClick={() => setOpen(false)} className={pathname.startsWith('/tournaments') ? 'nav-link active' : 'nav-link'}>
              ทัวร์นาเมนต์
            </Link>
            <Link href="/teams" onClick={() => setOpen(false)} className={pathname.startsWith('/teams') ? 'nav-link active' : 'nav-link'}>
              ทีมแข่งขัน
            </Link>
            <Link href="/players" onClick={() => setOpen(false)} className={pathname.startsWith('/players') ? 'nav-link active' : 'nav-link'}>
              ทำเนียบผู้เล่น
            </Link>
            <Link href="/live" onClick={() => setOpen(false)} className={pathname === '/live' ? 'nav-link active' : 'nav-link'}>
              ถ่ายทอดสด
            </Link>
            <Link href="/news" onClick={() => setOpen(false)} className={pathname === '/news' ? 'nav-link active' : 'nav-link'}>
              ข่าวสาร
            </Link>
            <Link href="/shop" onClick={() => setOpen(false)} className={pathname === '/shop' ? 'nav-link active' : 'nav-link'}>
              ร้านค้าชมรม
            </Link>

            <details className="nav-more">
              <summary>
                แดชบอร์ด <Icon name="chevron" />
              </summary>
              <div className="nav-more-menu">
                <Link href="/admin">จัดการสินค้า</Link>
                <Link href="/organizer">แดชบอร์ดผู้จัด</Link>
                <Link href="/captain">แดชบอร์ดกัปตัน</Link>
                <Link href="/community">คอมมูนิตี้</Link>
              </div>
            </details>
          </nav>

          <div className="header-actions">
            <RoleSwitcher />

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              style={{
                position: 'relative',
                border: 0,
                background: 'none',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="การแจ้งเตือน"
            >
              <Icon name="bell" />
              {unreadNotifCount > 0 && (
                <b
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '14px',
                    height: '14px',
                    background: 'var(--orange)',
                    color: '#fff',
                    borderRadius: '50%',
                    font: '8px var(--font-mono)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {unreadNotifCount}
                </b>
              )}
            </button>

            {!signedIn && <Link href="/login" className="login-link">เข้าสู่ระบบ</Link>}

            <button className="cart-button" onClick={() => setCartOpen(!cartOpen)} aria-expanded={cartOpen}>
              <Icon name="bag" />
              <span>ตะกร้า</span>
              <b>{itemCount}</b>
            </button>
          </div>

          <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </header>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="cart-overlay">
          <button className="cart-scrim" onClick={() => setCartOpen(false)} aria-label="ปิดตะกร้า" />
          <aside className="cart-drawer" aria-label="ตะกร้าสินค้า">
            <div className="cart-head">
              <div>
                <span className="page-kicker">
                  <span className="orange-dot" /> YOUR BAG
                </span>
                <h2>
                  ตะกร้าของคุณ <small>({itemCount})</small>
                </h2>
              </div>
              <button onClick={() => setCartOpen(false)} aria-label="ปิดตะกร้า">
                <Icon name="close" />
              </button>
            </div>
            {cart.length ? (
              <>
                <div className="cart-lines">
                  {cart.map(({ product, quantity, size }) => {
                    const unitPrice = getProductPrice(product, size);
                    return (
                      <div className="cart-line" key={`${product.id}-${size || 'nosize'}`}>
                        <div className="cart-thumb">
                          <span>AC</span>
                        </div>
                        <div className="cart-product">
                          <strong>{product.name}</strong>
                          <small>
                            {product.subtitle} {size && <span style={{ color: 'var(--orange)', fontWeight: 700 }}>[ไซส์ {size}]</span>}
                          </small>
                          <span>{formatPrice(unitPrice)}</span>
                          <div className="quantity-control">
                            <button onClick={() => changeQuantity(product.id, -1, size)} aria-label={`ลดจำนวน ${product.name}`}>
                              <Icon name="minus" />
                            </button>
                            <span>{quantity}</span>
                            <button onClick={() => changeQuantity(product.id, 1, size)} aria-label={`เพิ่มจำนวน ${product.name}`}>
                              <Icon name="plus" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="cart-foot">
                  <div className="cart-subtotal">
                    <span>ยอดรวมสินค้า</span>
                    <strong>
                      {formatPrice(
                        cart.reduce((sum, line) => sum + getProductPrice(line.product, line.size) * line.quantity, 0)
                      )}
                    </strong>
                  </div>
                  <button
                    className="button button-orange"
                    style={{ width: '100%' }}
                    onClick={() => {
                      const user = sessionStorage.getItem('arena_user') || sessionStorage.getItem('arena_token');
                      setCartOpen(false);
                      if (!user) {
                        window.location.assign('/login?mode=login&notice=require_auth_cart');
                        return;
                      }
                      setCheckoutOpen(true);
                    }}
                  >
                    ดำเนินการสั่งซื้อ →
                  </button>
                </div>
              </>
            ) : (
              <div className="cart-empty">
                <span className="empty-icon">
                  <Icon name="bag" />
                </span>
                <strong>ยังไม่มีสินค้าในตะกร้า</strong>
                <p>เลือกซื้อสินค้าเสื้อแข่งและของที่ระลึกจากชมรม</p>
                <button className="button button-orange" onClick={() => setCartOpen(false)}>
                  เลือกชมสินค้า <Icon name="arrow" />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
