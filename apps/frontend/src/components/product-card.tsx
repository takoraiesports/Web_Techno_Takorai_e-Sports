'use client';

import { useMemo, useState } from 'react';
import { useStore } from './store-provider';
import { Icon } from './icons';
import { CLOTHING_SIZES, formatPrice, getProductPrice, type Product, type ShirtSize } from '@/lib/products';

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { cart, addToCart, setCartOpen } = useStore();
  const [selectedSize, setSelectedSize] = useState<ShirtSize | ''>('');
  const sizeOptions = useMemo(() => CLOTHING_SIZES.filter((size) => product.variants.some((variant) => variant.size === size && variant.stock > 0)), [product.variants]);
  const selectedVariant = product.variants.find((variant) => variant.size === selectedSize);
  const inCart = cart.find((line) => line.product.id === product.id && line.size === (selectedSize || undefined))?.quantity ?? 0;
  const selectedStock = product.has_sizes ? selectedVariant?.stock ?? 0 : product.stock;
  const outOfStock = product.has_sizes ? sizeOptions.length === 0 : product.stock <= 0;
  const maxed = Boolean(selectedSize || !product.has_sizes) && inCart >= selectedStock;
  const needsSize = product.has_sizes && !selectedSize;

  function add() {
    if (outOfStock || needsSize || maxed) return;
    addToCart(product, selectedSize || undefined);
    setCartOpen(true);
  }

  return (
    <article className="shop-product-card" id={`product-${product.id}`}>
      <div className="product-photo">
        <span className="product-number">{String(index + 1).padStart(2, '0')}</span>
        {product.image_url ? <img src={product.image_url} alt={product.name} className="product-real-image" /> : <div className="product-no-image"><Icon name="bag" /><span>ยังไม่มีรูปสินค้า</span></div>}
      </div>
      <div className="product-info">
        <div><h3>{product.name}</h3><p>{product.subtitle || product.color || product.category}</p></div>
        <div style={{ textAlign: 'right' }}><span className="product-price">{formatPrice(getProductPrice(product, selectedSize || undefined))}</span>{product.has_sizes && selectedVariant && <small style={{ display: 'block', color: '#777' }}>คงเหลือ {selectedVariant.stock}</small>}</div>
      </div>
      {product.has_sizes && <fieldset className="product-size-fieldset"><legend>เลือกไซส์</legend><div className="product-size-options">{CLOTHING_SIZES.map((size) => {
        const available = sizeOptions.includes(size);
        return <button key={size} type="button" disabled={!available} aria-pressed={selectedSize === size} onClick={() => setSelectedSize(size)} className={`product-size-option ${selectedSize === size ? 'selected' : ''}`}>{size}</button>;
      })}</div><small>{selectedSize ? (selectedVariant?.color || product.color) : 'เลือกไซส์ก่อนเพิ่มลงตะกร้า'}</small></fieldset>}
      {!product.has_sizes && <p className="product-stock">{outOfStock ? 'สินค้าหมด' : `คงเหลือ ${product.stock} ชิ้น`}</p>}
      <button className="add-line" type="button" disabled={outOfStock || needsSize} onClick={add}>
        <span>{outOfStock || maxed ? 'สินค้าไม่พอในสต็อก' : needsSize ? 'เลือกไซส์ก่อน' : 'เพิ่มลงตะกร้า'}</span><Icon name="arrow" />
      </button>
    </article>
  );
}
