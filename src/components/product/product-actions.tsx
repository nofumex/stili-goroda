'use client';

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/toast';
import { Product, ProductVariant } from '@/types/index';

interface ProductActionsProps {
  product: Product & { variants?: ProductVariant[] };
  selectedVariant?: ProductVariant | null;
  selectedColor?: string;
  selectedSize?: string;
}

export const ProductActions: React.FC<ProductActionsProps> = ({ 
  product, 
  selectedVariant,
  selectedColor,
  selectedSize 
}) => {
  const { addItem, openCart } = useCartStore();
  const { success, error } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const canBuy = selectedVariant 
    ? selectedVariant.stock > 0 
    : product.isInStock && (product.stock ?? 0) > 0;

  const handleAddToCart = async () => {
    if (!canBuy) return;
    
    // Check if variant selection is required - enforce for ALL products with variants
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      error('Выберите вариант', 'Пожалуйста, выберите вариант товара перед добавлением в корзину');
      return;
    }

    setIsAdding(true);
    try {
      const itemToAdd = {
        ...product,
        price: selectedVariant ? Number(selectedVariant.price) : Number(product.price),
        variantId: selectedVariant?.id,
        selectedColor,
        selectedSize,
      };
      
      addItem(itemToAdd, 1);
      success('Товар добавлен', `${product.title} добавлен в корзину`);
      openCart();
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!canBuy) return;
    
    // Check if variant selection is required - enforce for ALL products with variants
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      error('Выберите вариант', 'Пожалуйста, выберите вариант товара перед покупкой');
      return;
    }

    setIsAdding(true);
    try {
      const itemToAdd = {
        ...product,
        price: selectedVariant ? Number(selectedVariant.price) : Number(product.price),
        variantId: selectedVariant?.id,
        selectedColor,
        selectedSize,
      };
      
      addItem(itemToAdd, 1);
      window.location.href = '/checkout';
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        onClick={handleAddToCart}
        disabled={!canBuy || isAdding}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {canBuy ? 'В корзину' : 'Нет в наличии'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleBuyNow}
        disabled={!canBuy || isAdding}
      >
        Купить
      </Button>
    </div>
  );
};

export default ProductActions;


