'use client';

import React, { useState } from 'react';
import { ProductVariant } from '@prisma/client';
import { ProductWithDetails } from '@/types/index';
import ProductVariants from './product-variants';
import ProductActions from './product-actions';

interface ProductDetailsProps {
  product: ProductWithDetails;
  compact?: boolean;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, compact = false }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>(Number(product.price));
  const [currentImage, setCurrentImage] = useState<string>(product.images?.[0] || '');

  const handleVariantChange = (variant: ProductVariant | null, price: number, imageUrl?: string) => {
    setSelectedVariant(variant);
    setCurrentPrice(price);
    
    if (variant) {
      setSelectedColor(variant.color || '');
      setSelectedSize(variant.size || '');
      if (imageUrl) setCurrentImage(imageUrl);
    } else {
      setSelectedColor('');
      setSelectedSize('');
      setCurrentImage(product.images?.[0] || '');
    }
  };

  return (
    <div>
      {/* Image Gallery */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'lg:grid-cols-2'} gap-8 mb-8 items-start`}>
        <div className={compact ? '' : 'lg:sticky lg:top-24'}>
          <div className={`bg-gray-100 rounded-lg overflow-hidden ${compact ? 'max-h-[400px] aspect-square' : 'max-h-[60vh] md:max-h-[70vh] aspect-[4/5] md:aspect-square'}`}>
            <img
              src={currentImage || product.images?.[0] || 'https://placehold.co/800x800?text=No+Image'}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
          {!compact && product.images?.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.slice(0, 8).map((src: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  className="aspect-square bg-gray-100 rounded overflow-hidden h-20"
                  onClick={() => setCurrentImage(src)}
                >
                  <img src={src || 'https://placehold.co/200x200?text=No+Image'} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {!compact && (
            <div className="mb-4">
              <a href="/catalog" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {/* simple chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Назад в каталог
              </a>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>
          {product.material && <p className="text-gray-600 mb-6">{product.material}</p>}

          {/* Variants selector with dynamic price */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <ProductVariants
                variants={product.variants}
                basePrice={Number(product.price)}
                productSlug={product.slug}
                productId={product.id}
                onVariantChange={handleVariantChange}
              />
            </div>
          )}

          {/* Fallback price if no variants */}
          {(!product.variants || product.variants.length === 0) && (
            <div className="flex items-baseline space-x-3 mb-6">
              <span className="text-3xl font-bold">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(currentPrice)}
              </span>
              {product.oldPrice && (
                <span className="text-gray-400 line-through">
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(product.oldPrice))}
                </span>
              )}
            </div>
          )}

          {/* Product Description */}
          <div className="prose max-w-none mb-6">
            {(() => {
              const desc = (product.description || '').trim();
              const html = (product.content || '').trim();
              const htmlText = html
                ? html
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                : '';
              const isDuplicate = desc && htmlText && htmlText.includes(desc);
              return (
                <>
                  {desc && !isDuplicate && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Описание</h3>
                      <p className="text-gray-700 leading-relaxed">{desc}</p>
                    </div>
                  )}
                  {html && (
                    <div className="text-gray-700 leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Product Specifications */}
          <div className="space-y-2 text-sm mb-6">
            {product.dimensions && <div>Размеры: {product.dimensions}</div>}
            {product.weight && <div>Вес: {product.weight.toString()} кг</div>}
            <div>
              Наличие: {product.isInStock ? (
                <span className="text-green-600">В наличии</span>
              ) : (
                <span className="text-red-600">Нет в наличии</span>
              )}
            </div>
            <div>Артикул: {product.sku}</div>
            {product.categoryObj && (
              <div>Категория: {product.categoryObj.name}</div>
            )}
          </div>

          {/* Product Actions */}
          <div className="mb-8">
            <ProductActions
              product={product}
              selectedVariant={selectedVariant}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
            />
          </div>

          {/* Description already moved above */}
        </div>
      </div>
      {/* Content now fully inside the right column */}
    </div>
  );
};

export default ProductDetails;

