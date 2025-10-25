'use client';

import React, { useState, useEffect } from 'react';
import { ProductVariant } from '@prisma/client';

interface ProductVariantsProps {
  variants: ProductVariant[];
  basePrice: number;
  productSlug: string;
  productId: string;
  onVariantChange: (variant: ProductVariant | null, price: number, imageUrl?: string) => void;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  basePrice,
  productSlug,
  productId,
  onVariantChange,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>(basePrice);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);


  // Get unique colors and sizes from variants (preserve original labels, compare case-insensitively)
  const isExcludedColor = (val: string) => {
    const categoryKeywords = ['пестротканное', 'пестротканые', 'гладкокрашеное', 'гладкокрашеные'];
    return categoryKeywords.some(keyword => val.toLowerCase().includes(keyword.toLowerCase()));
  };
  const colorLabelByNorm = new Map<string, string>();
  for (const v of variants) {
    const c = v.color?.trim();
    if (!c) continue;
    if (isExcludedColor(c)) continue;
    const norm = c.toLowerCase();
    if (!colorLabelByNorm.has(norm)) colorLabelByNorm.set(norm, c);
  }
  const colors = Array.from(colorLabelByNorm.values());
  const sizes = Array.from(new Set(
    variants
      .map(v => v.size)
      .filter(size => size && size !== '0' && size.trim() !== '')
  )) as string[];

  // Find current variant based on selections
  const currentVariant = variants.find(v => {
    const variantColor = (v.color || '').toLowerCase();
    const normalizedSelectedColor = selectedColor.toLowerCase();
    if (selectedColor && selectedSize) {
      return variantColor === normalizedSelectedColor && v.size === selectedSize;
    } else if (selectedColor && !selectedSize) {
      return variantColor === normalizedSelectedColor;
    } else if (!selectedColor && selectedSize) {
      return v.size === selectedSize;
    }
    return false;
  });

  // Function to fetch variant data from API
  const fetchVariantData = async (color: string, size: string) => {
    if (!color && !size) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (color) params.append('color', color);
      if (size) params.append('size', size);
      const response = await fetch(`/api/products/${productSlug}/variant?${params}`);
      if (response.ok) {
        const json = await response.json();
        const payload = json?.data;
        if (payload?.price != null) setCurrentPrice(payload.price);
        if (payload?.variant) {
          const image = payload.variant.imageUrl || '';
          if (image) setCurrentImage(image);
          onVariantChange(payload.variant, payload.price, image || undefined);
        } else {
          onVariantChange(null, payload?.price ?? currentPrice, undefined);
        }
      }
    } catch (error) {
      console.error('Ошибка при получении данных вариации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-select first available options if only one of each
  useEffect(() => {
    if (colors.length === 1 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
    if (sizes.length === 1 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
    
    // If no valid colors but we have variants, auto-select first size if only one
    if (colors.length === 0 && sizes.length === 1 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [colors, sizes, selectedColor, selectedSize]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    // Reset size if the selected size is not available for this color
    const availableSizes = variants
      .filter(v => (v.color || '').toLowerCase() === color.toLowerCase())
      .map(v => v.size)
      .filter(Boolean);
    
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize('');
    }
    
    // Fetch variant image/price preferably with both color+current size if selected, otherwise with first available size for this color
    const sizeForRequest = selectedSize && availableSizes.includes(selectedSize)
      ? selectedSize
      : (availableSizes[0] || '');
    fetchVariantData(color, sizeForRequest);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    // Reset color if the selected color is not available for this size
    const availableColors = variants
      .filter(v => v.size === size)
      .map(v => (v.color || '').toLowerCase())
      .filter(Boolean);
    
    if (selectedColor && !availableColors.includes(selectedColor.toLowerCase())) {
      setSelectedColor('');
    }
    
    // Fetch variant data
    fetchVariantData(selectedColor, size);
  };

  const handleResetSelection = () => {
    setSelectedColor('');
    setSelectedSize('');
    setCurrentPrice(basePrice);
    setCurrentImage('');
    onVariantChange(null, basePrice, undefined);
  };

  const getAvailableSizes = (): string[] => {
    if (!selectedColor) return sizes;
    return variants
      .filter(v => (v.color || '').toLowerCase() === selectedColor.toLowerCase())
      .map(v => v.size)
      .filter(Boolean) as string[];
  };

  const getAvailableColors = () => colors;

  const isVariantInStock = (color: string, size: string) => {
    const variant = variants.find(v => (v.color || '').toLowerCase() === color.toLowerCase() && v.size === size);
    return variant ? variant.stock > 0 : false;
  };

  const isVariantInStockForSize = (size: string) => {
    // Check if any variant with this size is in stock (regardless of color)
    return variants.some(v => v.size === size && v.stock > 0);
  };

  const getVariantPrice = (color: string, size: string) => {
    const variant = variants.find(v => v.color === color && v.size === size);
    return variant ? Number(variant.price) : basePrice;
  };

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Цвет</h3>
          <div className="flex flex-wrap gap-2">
            {getAvailableColors().map((color) => {
              // Keep stable color order; compute availability dynamically
              const hasStock = selectedSize
                ? variants.some(v => (v.color || '').toLowerCase() === color.toLowerCase() && v.size === selectedSize && v.stock > 0)
                : variants.some(v => (v.color || '').toLowerCase() === color.toLowerCase() && v.stock > 0);
              
              return (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  disabled={!hasStock}
                  className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                    selectedColor === color
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : hasStock
                      ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {color}
                  {!hasStock && <span className="ml-1 text-xs">(нет в наличии)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Размер</h3>
          <div className="flex flex-wrap gap-2">
            {getAvailableSizes().map((size) => {
              const inStock = selectedColor 
                ? isVariantInStock(selectedColor, size)
                : isVariantInStockForSize(size);
              // no price delta display per request
              
              return (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  disabled={!inStock}
                  className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                    selectedSize === size
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : inStock
                      ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{size}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Display */}
      <div className="flex items-baseline space-x-3">
        <span className="text-3xl font-bold text-gray-900">
          {isLoading ? (
            <span className="animate-pulse">Загрузка...</span>
          ) : (
            new Intl.NumberFormat('ru-RU', { 
              style: 'currency', 
              currency: 'RUB' 
            }).format(currentPrice)
          )}
        </span>
      </div>

      {/* Reset Selection */}
      <div>
        <button
          type="button"
          onClick={handleResetSelection}
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          Сбросить выбор
        </button>
      </div>

      {/* Stock Status */}
      {/* Stock indicator moved to specs on the right column; keep minimal status here if needed */}
    </div>
  );
};

export default ProductVariants;

