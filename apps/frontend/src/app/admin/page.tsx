'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { CLOTHING_SIZES, formatPrice, type Product, type ProductCategory, type ShirtSize } from '@/lib/products';

type FormState = { name: string; sku: string; subtitle: string; description: string; category: ProductCategory; price: number; image_url: string; color: string; stock: number; is_active: boolean; has_sizes: boolean };
const emptyForm: FormState = { name: '', sku: '', subtitle: '', description: '', category: 'jersey', price: 0, image_url: '', color: '', stock: 0, is_active: true, has_sizes: false };
const sizes: ShirtSize[] = CLOTHING_SIZES;

export default function AdminDashboardPage() {
  const [authorized, setAuthorized] = useState<'checking' | 'denied' | 'admin'>('checking');
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sizeStock, setSizeStock] = useState<Record<ShirtSize, number>>({ S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0, '5XL': 0 });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try { setProducts(await apiGet<Product[]>('/admin/products')); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'โหลดสินค้าไม่สำเร็จ'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('arena_user') ?? 'null') as { roles?: { name: string }[] } | null;
      const isAdmin = Boolean(sessionStorage.getItem('arena_token')) && Boolean(user?.roles?.some((role) => role.name === 'ADMIN'));
      setAuthorized(isAdmin ? 'admin' : 'denied');
      if (isAdmin) void loadProducts();
    } catch { setAuthorized('denied'); }
  }, [loadProducts]);

  function editProduct(product: Product) {
    setEditing(product.id);
    setForm({ name: product.name, sku: product.sku, subtitle: product.subtitle ?? '', description: product.description ?? '', category: product.category, price: product.price, image_url: product.image_url ?? '', color: product.color ?? '', stock: product.stock, is_active: product.is_active, has_sizes: product.has_sizes });
    setSizeStock(Object.fromEntries(sizes.map((size) => [size, product.variants.find((variant) => variant.size === size)?.stock ?? 0])) as Record<ShirtSize, number>);
    setMessage(''); setError('');
  }

  function resetForm() { setEditing(null); setForm(emptyForm); setSizeStock({ S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0, '5XL': 0 }); }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setLoading(true);
    const variants = form.has_sizes ? sizes.map((size) => ({ size, color: form.color, sku: `${form.sku}-${size}`, price: 0, stock: sizeStock[size] })) : [];
    const payload = { ...form, variants };
    try {
      if (editing) await apiPut(`/admin/products/${editing}`, payload);
      else await apiPost('/admin/products', payload);
      await loadProducts(); resetForm(); setMessage(editing ? 'บันทึกการแก้ไขสินค้าแล้ว' : 'เพิ่มสินค้าในระบบกลางแล้ว');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'บันทึกสินค้าไม่สำเร็จ'); }
    finally { setLoading(false); }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`ยืนยันลบสินค้า “${product.name}” หรือไม่?`)) return;
    setError('');
    try { await apiDelete(`/admin/products/${product.id}`); await loadProducts(); setMessage('ลบสินค้าแล้ว'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'ลบสินค้าไม่สำเร็จ'); }
  }

  if (authorized === 'checking') return <main className="page-shell detail-page"><div className="loading-state"><span className="spinner" /> กำลังตรวจสอบสิทธิ์</div></main>;
  if (authorized === 'denied') return <main className="page-shell detail-page"><div className="empty-state"><Icon name="shield" /><h1>ต้องใช้บัญชีผู้ดูแล</h1><p>เข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์ ADMIN เพื่อจัดการสินค้า</p></div></main>;

  return <main className="page-shell detail-page">
    <div className="detail-kicker"><span className="orange-dot" /> TECHNO TAKORAI / ADMIN</div>
    <h1 className="admin-title"><Icon name="shield" /> จัดการสินค้า</h1>
    <p className="detail-description">สินค้า ราคา รูปภาพ และสต็อกที่บันทึกจากหน้านี้จะใช้ร่วมกันทั้งระบบ</p>
    {message && <div role="status" className="demo-notice">{message}<button className="notice-dismiss" onClick={() => setMessage('')}>ปิด</button></div>}
    {error && <div role="alert" className="demo-notice admin-error">{error}<button className="notice-dismiss" onClick={() => setError('')}>ปิด</button></div>}
    <section className="dashboard-panel admin-product-form">
      <div className="panel-heading"><div><h2>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2><p>กรอกข้อมูลตามสินค้าจริงก่อนเปิดขาย</p></div>{editing && <button type="button" className="button button-white" onClick={resetForm}>ยกเลิกแก้ไข</button>}</div>
      <form onSubmit={saveProduct} className="product-admin-grid">
        <label>ชื่อสินค้า *<input required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>SKU *<input required maxLength={80} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
        <label>หมวดหมู่<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProductCategory })}><option value="jersey">เสื้อแข่ง</option><option value="apparel">เสื้อผ้า</option><option value="accessory">อุปกรณ์</option><option value="other">อื่น ๆ</option></select></label>
        <label>ราคาต่อชิ้น (บาท) *<input required type="number" min="0.01" step="0.01" value={form.price || ''} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label>
        <label>สี<input maxLength={80} value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="ระบุสีจริง" /></label>
        <label>รูปสินค้า (URL)<input type="url" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="https://..." /></label>
        <label className="product-admin-wide">รายละเอียด<input maxLength={160} value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} /></label>
        <label className="product-admin-wide">คำอธิบาย<textarea rows={3} maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="product-admin-check"><input type="checkbox" checked={form.has_sizes} onChange={(event) => setForm({ ...form, has_sizes: event.target.checked })} /> แยกสต็อกตามไซส์</label>
        <label className="product-admin-check"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> แสดงในหน้าร้าน</label>
        {form.has_sizes ? <div className="product-size-stock product-admin-wide"><strong>จำนวนคงเหลือแต่ละไซส์</strong><div>{sizes.map((size) => <label key={size}>{size}<input type="number" min="0" max="1000000" value={sizeStock[size]} onChange={(event) => setSizeStock({ ...sizeStock, [size]: Number(event.target.value) })} /></label>)}</div></div> : <label>จำนวนคงเหลือ<input type="number" min="0" max="1000000" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} /></label>}
        <div className="product-admin-actions product-admin-wide"><button type="submit" disabled={loading} className="button button-orange">{loading ? 'กำลังบันทึก…' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</button></div>
      </form>
    </section>
    <section className="dashboard-panel" style={{ marginTop: 20 }}><div className="panel-heading"><div><h2>รายการสินค้า ({products.length})</h2><p>ข้อมูลจากฐานข้อมูลระบบกลาง</p></div><button className="button button-white" onClick={() => void loadProducts()} disabled={loading}>โหลดใหม่</button></div>
      {loading && products.length === 0 ? <p>กำลังโหลด…</p> : products.length === 0 ? <p>ยังไม่มีสินค้า เพิ่มรายการแรกจากแบบฟอร์มด้านบน</p> : <div className="table-scroll"><table className="dashboard-table"><thead><tr><th>สินค้า / SKU</th><th>หมวด</th><th>ราคา</th><th>สต็อก</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small style={{ display: 'block', color: '#777' }}>{product.sku}</small></td><td>{product.category}</td><td>{formatPrice(product.price)}</td><td>{product.has_sizes ? product.variants.map((variant) => `${variant.size}: ${variant.stock}`).join(' · ') : product.stock}</td><td>{product.is_active ? 'แสดง' : 'ซ่อน'}</td><td><div className="dashboard-actions"><button className="button button-white" onClick={() => editProduct(product)}>แก้ไข</button><button className="button button-white text-danger" onClick={() => void removeProduct(product)}>ลบ</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
