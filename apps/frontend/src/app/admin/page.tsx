'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { CLOTHING_SIZES, formatPrice, type Product, type ProductCategory, type ShirtSize } from '@/lib/products';
import { uploadToCloudinary } from '@/lib/cloudinary';

type FormState = {
  name: string;
  sku: string;
  subtitle: string;
  description: string;
  category: ProductCategory;
  price: number;
  image_url: string;
  color: string;
  stock: number;
  is_active: boolean;
  has_sizes: boolean;
};

const emptyForm: FormState = {
  name: '',
  sku: '',
  subtitle: '',
  description: '',
  category: 'jersey',
  price: 0,
  image_url: '',
  color: '',
  stock: 0,
  is_active: true,
  has_sizes: false,
};

const sizes: ShirtSize[] = CLOTHING_SIZES;
const DEFAULT_HERO_IMAGE = '/picshop/HL1.jpg';

export default function AdminDashboardPage() {
  const [authorized, setAuthorized] = useState<'checking' | 'denied' | 'admin'>('checking');
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sizeStock, setSizeStock] = useState<Record<ShirtSize, number>>({
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    '2XL': 0,
    '3XL': 0,
    '4XL': 0,
    '5XL': 0,
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Hero Image Management State
  const [heroImage, setHeroImage] = useState<string>(DEFAULT_HERO_IMAGE);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await apiGet<Product[]>('/admin/products'));
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'โหลดสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load saved hero image
    const savedHero = localStorage.getItem('takorai_hero_image');
    if (savedHero) setHeroImage(savedHero);

    try {
      const user = JSON.parse(sessionStorage.getItem('arena_user') ?? 'null') as { roles?: { name: string }[] } | null;
      const isAdmin =
        Boolean(sessionStorage.getItem('arena_token')) && Boolean(user?.roles?.some((role) => role.name === 'ADMIN'));
      setAuthorized(isAdmin ? 'admin' : 'denied');
      if (isAdmin) void loadProducts();
    } catch {
      setAuthorized('denied');
    }
  }, [loadProducts]);

  function editProduct(product: Product) {
    setEditing(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      subtitle: product.subtitle ?? '',
      description: product.description ?? '',
      category: product.category,
      price: product.price,
      image_url: product.image_url ?? '',
      color: product.color ?? '',
      stock: product.stock,
      is_active: product.is_active,
      has_sizes: product.has_sizes,
    });
    setSizeStock(
      Object.fromEntries(
        sizes.map((size) => [size, product.variants?.find((variant) => variant.size === size)?.stock ?? 0])
      ) as Record<ShirtSize, number>
    );
    setMessage('');
    setError('');
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
    setSizeStock({ S: 0, M: 0, L: 0, XL: 0, '2XL': 0, '3XL': 0, '4XL': 0, '5XL': 0 });
  }

  async function handleProductImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, image_url: url }));
      setMessage('อัปโหลดรูปภาพสินค้าเข้า Cloudinary สำเร็จ!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleHeroFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file);
      setHeroImage(url);
      localStorage.setItem('takorai_hero_image', url);
      setMessage('อัปโหลดรูปภาพ Hero Banner เข้า Cloudinary สำเร็จ!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploadingImage(false);
    }
  }

  function saveHeroImage(url: string) {
    if (!url.trim()) return;
    setHeroImage(url.trim());
    localStorage.setItem('takorai_hero_image', url.trim());
    setMessage('บันทึกรูปภาพ Hero Banner เรียบร้อยแล้ว');
  }

  function resetHeroImage() {
    setHeroImage(DEFAULT_HERO_IMAGE);
    localStorage.removeItem('takorai_hero_image');
    setMessage('คืนค่ารูปภาพ Hero เป็น HL1.jpg (Default) เรียบร้อยแล้ว');
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const variants = form.has_sizes
      ? sizes.map((size) => ({ size, color: form.color, sku: `${form.sku}-${size}`, price: 0, stock: sizeStock[size] }))
      : [];
    const payload = { ...form, variants };
    try {
      if (editing) await apiPut(`/admin/products/${editing}`, payload);
      else await apiPost('/admin/products', payload);
      await loadProducts();
      resetForm();
      setMessage(editing ? 'บันทึกการแก้ไขสินค้าแล้ว' : 'เพิ่มสินค้าในระบบกลางแล้ว');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึกสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`ยืนยันลบสินค้า “${product.name}” หรือไม่?`)) return;
    setError('');
    try {
      await apiDelete(`/admin/products/${product.id}`);
      await loadProducts();
      setMessage('ลบสินค้าแล้ว');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ลบสินค้าไม่สำเร็จ');
    }
  }

  if (authorized === 'checking')
    return (
      <main className="page-shell detail-page">
        <div className="loading-state">
          <span className="spinner" /> กำลังตรวจสอบสิทธิ์
        </div>
      </main>
    );
  if (authorized === 'denied')
    return (
      <main className="page-shell detail-page">
        <div className="empty-state">
          <Icon name="shield" />
          <h1>ต้องใช้บัญชีผู้ดูแล</h1>
          <p>เข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์ ADMIN เพื่อจัดการสินค้าและรูปภาพเว็บไซต์</p>
        </div>
      </main>
    );

  return (
    <main className="page-shell detail-page">
      <div className="detail-kicker">
        <span className="orange-dot" /> TECHNO TAKORAI / ADMIN DASHBOARD
      </div>
      <h1 className="admin-title">
        <Icon name="shield" /> แผงควบคุมผู้ดูแลระบบ (Admin)
      </h1>
      <p className="detail-description">
        จัดการรูปภาพเว็บไซต์ สินค้า สต็อกเสื้อ (S-5XL) ข่าวสาร และทัวร์นาเมนต์ ทั้งหมดจะแสดงผลร่วมกันทั้งระบบ
      </p>

      {message && (
        <div role="status" className="demo-notice">
          {message}
          <button className="notice-dismiss" onClick={() => setMessage('')}>
            ปิด
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="demo-notice admin-error">
          {error}
          <button className="notice-dismiss" onClick={() => setError('')}>
            ปิด
          </button>
        </div>
      )}

      {/* Site Images & Media Manager Panel */}
      <section className="dashboard-panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading">
          <div>
            <h2>🖼️ จัดการรูปภาพและสื่อเว็บไซต์ (Site Media & Banners)</h2>
            <p>ปรับแต่งรูปปกหน้าแรก (Hero), รูปสินค้า, ป้ายการแข่งขัน และสื่อในระบบ</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, alignItems: 'start' }}>
          {/* Hero Banner Management */}
          <div style={{ border: '1px solid var(--line)', padding: 16, background: '#faf8f6', borderRadius: 4 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>📷 รูปภาพ Hero Banner หน้าแรก</h3>
            <p style={{ fontSize: 10, color: '#777', margin: '0 0 12px' }}>
              ปัจจุบันใช้รูป: {heroImage === DEFAULT_HERO_IMAGE ? 'HL1.jpg (Default)' : 'รูปภาพคัสตอม'}
            </p>
            <div style={{ width: '100%', height: 160, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 12, position: 'relative' }}>
              <img src={heroImage} alt="Hero Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="button button-white" style={{ justifyContent: 'center', minHeight: 36, fontSize: 10, cursor: 'pointer' }}>
                {uploadingImage ? 'กำลังอัปโหลด...' : '📤 อัปโหลดรูปใหม่ (Cloudinary)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeroFileUpload} disabled={uploadingImage} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="url"
                  placeholder="หรือระบุ Image URL..."
                  value={heroImage}
                  onChange={(e) => saveHeroImage(e.target.value)}
                  style={{ flex: 1, height: 36, padding: '0 10px', border: '1px solid var(--line)', fontSize: 10 }}
                />
                <button type="button" className="button button-white" onClick={resetHeroImage} style={{ minHeight: 36, fontSize: 10 }}>
                  คืนค่า HL1.jpg
                </button>
              </div>
            </div>
          </div>

          {/* Quick Cloudinary Media Uploader */}
          <div style={{ border: '1px solid var(--line)', padding: 16, background: '#faf8f6', borderRadius: 4 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>☁️ อัปโหลดรูปภาพอิสระเข้า Cloudinary</h3>
            <p style={{ fontSize: 10, color: '#777', margin: '0 0 12px' }}>
              อัปโหลดรูปภาพสินค้า, แบนเนอร์ หรือโลโก้ทีม เพื่อนำ URL ไปใช้งานต่อในระบบ
            </p>
            <label className="button button-orange" style={{ width: '100%', justifyContent: 'center', minHeight: 40, fontSize: 11, cursor: 'pointer' }}>
              {uploadingImage ? 'กำลังอัปโหลด...' : '📤 เลือกไฟล์รูปเพื่ออัปโหลดเข้า Cloudinary'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingImage(true);
                  setError('');
                  try {
                    const url = await uploadToCloudinary(file);
                    navigator.clipboard.writeText(url);
                    setMessage(`อัปโหลดสำเร็จ! คัดลอก URL ลงคลิปบอร์ดแล้ว: ${url}`);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ');
                  } finally {
                    setUploadingImage(false);
                  }
                }}
                disabled={uploadingImage}
              />
            </label>
            <small style={{ display: 'block', color: '#888', marginTop: 10, fontSize: 9, lineHeight: 1.6 }}>
              * รูปภาพที่อัปโหลดจะถูกส่งไปยัง Cloudinary Cloud: <strong>qnv9z1df</strong> และสามารถนำ URL ไปใช้ได้ทันที
            </small>
          </div>
        </div>
      </section>

      {/* Product Management Section */}
      <section className="dashboard-panel admin-product-form">
        <div className="panel-heading">
          <div>
            <h2>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
            <p>กรอกข้อมูลและอัปโหลดรูปสินค้าตามจริงก่อนเปิดขาย</p>
          </div>
          {editing && (
            <button type="button" className="button button-white" onClick={resetForm}>
              ยกเลิกแก้ไข
            </button>
          )}
        </div>
        <form onSubmit={saveProduct} className="product-admin-grid">
          <label>
            ชื่อสินค้า *
            <input required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            SKU *
            <input required maxLength={80} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
          </label>
          <label>
            หมวดหมู่
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ProductCategory })}>
              <option value="jersey">เสื้อแข่ง</option>
              <option value="apparel">เสื้อผ้า</option>
              <option value="accessory">อุปกรณ์</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>
          <label>
            ราคาต่อชิ้น (บาท) *
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.price || ''}
              onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
            />
          </label>
          <label>
            สี
            <input maxLength={80} value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="ระบุสีจริง" />
          </label>

          {/* Product Image Input with Direct Cloudinary Upload */}
          <label className="product-admin-wide">
            รูปสินค้า (อัปโหลดเข้า Cloudinary หรือใส่ URL)
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
              <input
                type="text"
                value={form.image_url}
                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                placeholder="https://... หรืออัปโหลดไฟล์ด้านขวา"
                style={{ flex: 1 }}
              />
              <label className="button button-white" style={{ minHeight: 38, fontSize: 10, cursor: 'pointer', margin: 0, flex: 'none' }}>
                {uploadingImage ? 'กำลังอัปโหลด...' : '📷 อัปโหลดรูปสินค้า'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProductImageUpload} disabled={uploadingImage} />
              </label>
            </div>
            {form.image_url && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={form.image_url} alt="Product Preview" style={{ width: 45, height: 45, objectFit: 'contain', border: '1px solid var(--line)' }} />
                <small style={{ color: '#777', fontSize: 9 }}>ตัวอย่างรูปสินค้า</small>
              </div>
            )}
          </label>

          <label className="product-admin-wide">
            รายละเอียด
            <input maxLength={160} value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
          </label>
          <label className="product-admin-wide">
            คำอธิบาย
            <textarea rows={3} maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="product-admin-check">
            <input type="checkbox" checked={form.has_sizes} onChange={(event) => setForm({ ...form, has_sizes: event.target.checked })} /> แยกสต็อกตามไซส์ (S–5XL)
          </label>
          <label className="product-admin-check">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> แสดงในหน้าร้าน
          </label>
          {form.has_sizes ? (
            <div className="product-size-stock product-admin-wide">
              <strong>จำนวนคงเหลือแต่ละไซส์ (2XL ขึ้นไปปรับเพิ่ม +50฿ อัตโนมัติ)</strong>
              <div>
                {sizes.map((size) => (
                  <label key={size}>
                    {size}
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={sizeStock[size]}
                      onChange={(event) => setSizeStock({ ...sizeStock, [size]: Number(event.target.value) })}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <label>
              จำนวนคงเหลือ
              <input type="number" min="0" max="1000000" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
            </label>
          )}
          <div className="product-admin-actions product-admin-wide">
            <button type="submit" disabled={loading || uploadingImage} className="button button-orange">
              {loading ? 'กำลังบันทึก…' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
            </button>
          </div>
        </form>
      </section>

      {/* Product List Table */}
      <section className="dashboard-panel" style={{ marginTop: 20 }}>
        <div className="panel-heading">
          <div>
            <h2>รายการสินค้า ({products.length})</h2>
            <p>ข้อมูลจากฐานข้อมูลระบบกลาง</p>
          </div>
          <button className="button button-white" onClick={() => void loadProducts()} disabled={loading}>
            โหลดใหม่
          </button>
        </div>
        {loading && products.length === 0 ? (
          <p>กำลังโหลด…</p>
        ) : products.length === 0 ? (
          <p>ยังไม่มีสินค้า เพิ่มรายการแรกจากแบบฟอร์มด้านบน</p>
        ) : (
          <div className="table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>สินค้า / SKU</th>
                  <th>หมวด</th>
                  <th>ราคา</th>
                  <th>สต็อก</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} style={{ width: 36, height: 36, objectFit: 'contain', border: '1px solid var(--line)' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, background: '#eee', display: 'grid', placeItems: 'center', fontSize: 10 }}>ไม่มีรูป</div>
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          <small style={{ display: 'block', color: '#777' }}>{product.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      {product.has_sizes
                        ? (product.variants ?? []).map((variant) => `${variant.size}: ${variant.stock}`).join(' · ')
                        : product.stock}
                    </td>
                    <td>{product.is_active ? 'แสดง' : 'ซ่อน'}</td>
                    <td>
                      <div className="dashboard-actions">
                        <button className="button button-white" onClick={() => editProduct(product)}>
                          แก้ไข
                        </button>
                        <button className="button button-white text-danger" onClick={() => void removeProduct(product)}>
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
