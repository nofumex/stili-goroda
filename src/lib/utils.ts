import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency: string = 'RUB'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (currency === 'RUB') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  }
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(numPrice);
}

export function formatDate(date: Date | string, locale: string = 'ru-RU'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: Date | string, locale: string = 'ru-RU'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-я]/g, (char) => {
      const translit: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return translit[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TK-${timestamp}-${random}`;
}

export function generateSKU(category: string, title: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const titleCode = title.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${categoryCode}${titleCode}${timestamp}`;
}

export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('8')) {
    return '+7' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('7')) {
    return '+' + cleaned;
  }
  
  return phone;
}

export function calculateDiscount(originalPrice: number, discountPrice: number): number {
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/images/placeholder.jpg';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `/uploads/${imagePath}`;
}

export function generateProductImages(title: string, count: number = 1): string[] {
  // Generate placeholder images for demo
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/800/600?random=${Date.now() + i}&text=${encodeURIComponent(title)}`);
  }
  return images;
}

export function getStockStatus(stock: number): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  message: string;
  color: string;
} {
  if (stock === 0) {
    return {
      status: 'out_of_stock',
      message: 'Нет в наличии',
      color: 'text-red-600'
    };
  }
  
  if (stock <= 5) {
    return {
      status: 'low_stock',
      message: `Осталось ${stock} шт.`,
      color: 'text-orange-600'
    };
  }
  
  return {
    status: 'in_stock',
    message: 'В наличии',
    color: 'text-green-600'
  };
}

export function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'NEW': 'Новый',
    'PROCESSING': 'В обработке',
    'SHIPPED': 'Отгружен',
    'DELIVERED': 'Доставлен',
    'CANCELLED': 'Отменён'
  };
  
  return statusMap[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'NEW': 'bg-blue-100 text-blue-800',
    'PROCESSING': 'bg-yellow-100 text-yellow-800',
    'SHIPPED': 'bg-purple-100 text-purple-800',
    'DELIVERED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800'
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj: any = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    data.push(obj);
  }
  
  return data;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  
  document.body.removeChild(textArea);
  return Promise.resolve();
}


