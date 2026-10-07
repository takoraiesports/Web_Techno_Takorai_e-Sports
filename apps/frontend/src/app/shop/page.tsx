'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { CheckoutModal } from '@/components/checkout-modal';
import { Icon } from '@/components/icons';
import { apiGet } from '@/lib/api';
import { type Product } from '@/lib/products';
import { useStore } from '@/components/store-provider';

export default function MerchandiseShopPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { itemCount } = useStore();

  useEffect(() => {
    apiGet<Product[]>('/products').then(setProducts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'ไม่สามารถโหลดสินค้าได้')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell shop-section">
      <div className="shop-section-heading">
        <div><span className="page-kicker"><span className="orange-dot" /> TECHNO TAKORAI E-SPORTS CLUB</span><h2>สินค้าชมรม</h2><p>รายการสินค้า ราคา และตัวเลือกจะแสดงจากข้อมูลที่ผู้ดูแลเพิ่มไว้</p></div>
        <button onClick={() => setCheckoutOpen(true)} disabled={itemCount === 0} className="button button-orange"><Icon name="card" /> ตะกร้าและสั่งซื้อ ({itemCount}) <Icon name="arrow" /></button>
      </div>
      {loading ? <div className="loading-state"><span className="spinner" /> กำลังโหลดสินค้า</div> : error ? <div role="alert" className="empty-state"><h2>โหลดรายการสินค้าไม่ได้</h2><p>{error}</p></div> : products.length === 0 ? <div className="empty-state"><span className="empty-icon"><Icon name="bag" /></span><h2>ยังไม่มีสินค้าในร้าน</h2><p>เมื่อผู้ดูแลเพิ่มสินค้าแล้ว รายการและตัวเลือกที่มีจริงจะแสดงที่นี่</p></div> : <div className="shop-product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>}
      <CheckoutModal open={checkoutOpen && itemCount > 0} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
