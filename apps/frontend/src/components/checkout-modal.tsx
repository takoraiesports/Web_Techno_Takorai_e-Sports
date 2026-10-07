'use client';

import { Icon } from './icons';
import { formatPrice, getProductPrice } from '@/lib/products';
import { useStore } from './store-provider';

export function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart } = useStore();
  if (!open) return null;
  const total = cart.reduce((sum, line) => sum + getProductPrice(line.product, line.size) * line.quantity, 0);

  return <div className="cart-overlay">
    <button className="cart-scrim" onClick={onClose} aria-label="ปิด" />
    <section className="checkout-unavailable" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="panel-heading"><div><span className="page-kicker"><span className="orange-dot" /> ORDER STATUS</span><h2 id="checkout-title">สรุปรายการสินค้า</h2></div><button type="button" className="modal-close" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button></div>
      <div className="checkout-items">{cart.map((line) => <div key={`${line.product.id}-${line.size ?? ''}`}><span>{line.product.name}{line.size ? ` · ${line.size}` : ''} × {line.quantity}</span><strong>{formatPrice(getProductPrice(line.product, line.size) * line.quantity)}</strong></div>)}</div>
      <div className="checkout-total"><span>ยอดรวมสินค้า</span><strong>{formatPrice(total)}</strong></div>
      <div role="status" className="demo-notice"><strong>ยังไม่เปิดรับคำสั่งซื้อ</strong><br />ระบบคำสั่งซื้อและช่องทางชำระเงินจริงยังไม่ได้ตั้งค่า รายการนี้ยังไม่ถูกส่งหรือบันทึก และจะไม่มีการเรียกเก็บเงิน</div>
      <button type="button" onClick={onClose} className="button button-dark" style={{ width: '100%', marginTop: 16 }}>กลับไปเลือกสินค้า</button>
    </section>
  </div>;
}
