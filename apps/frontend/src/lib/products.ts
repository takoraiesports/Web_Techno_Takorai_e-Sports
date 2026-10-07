export type ProductCategory = 'jersey' | 'apparel' | 'accessory' | 'other';
export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';

export const CLOTHING_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

export interface ProductVariant {
  id: string;
  size: ShirtSize;
  color: string;
  sku: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  category: ProductCategory;
  color: string;
  sku: string;
  image_url: string;
  stock: number;
  has_sizes: boolean;
  is_active: boolean;
  variants: ProductVariant[];
}

export const getProductPrice = (product: Product, size?: ShirtSize): number => {
  if (!size || !product.has_sizes) return product.price;
  return product.variants?.find((variant) => variant.size === size)?.price ?? product.price;
};

export const formatPrice = (value: number) => `฿${value.toLocaleString('th-TH')}`;
