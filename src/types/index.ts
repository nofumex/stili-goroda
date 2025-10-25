import { User, Product, Order, Category, Review, Lead, Address, OrderItem, ProductVariant } from '@prisma/client';

// Re-export Prisma types
export type { User, Product, Order, Category, Review, Lead, Address, OrderItem, ProductVariant };

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'VIEWER';
export type OrderStatus = 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryType = 'PICKUP' | 'COURIER' | 'TRANSPORT';
export type ProductCategory = 'ECONOMY' | 'MIDDLE' | 'LUXURY';
export type ProductVisibility = 'VISIBLE' | 'HIDDEN' | 'DRAFT';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

// Extended types with relations
export interface ProductWithDetails extends Product {
  categoryObj: Category;
  variants: ProductVariant[];
  reviews: Review[];
  _count?: {
    reviews: number;
  };
  averageRating?: number;
}

export interface OrderWithDetails extends Order {
  user: User;
  items: (OrderItem & {
    product: Product;
  })[];
  address?: Address;
}

export interface UserWithDetails extends User {
  orders: Order[];
  addresses: Address[];
}

export interface CategoryWithProducts extends Category {
  products: Product[];
  children: Category[];
  parent?: Category;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  company?: string;
  phone?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: Product;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemsCount: number;
}

// Filter types
export interface ProductFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  productCategory?: ProductCategory;
  material?: string;
  search?: string;
  sortBy?: 'price' | 'name' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  search?: string;
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
}

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email: string;
  notes?: string;
  deliveryType: DeliveryType;
  addressId?: string;
  promoCode?: string;
}

export interface AddressForm {
  name: string;
  street: string;
  city: string;
  region: string;
  zipCode: string;
  phone?: string;
  isMain?: boolean;
}

// Admin types
export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Order[];
  topProducts: Product[];
  lowStockProducts: Product[];
}

export interface CSVImportResult {
  success: boolean;
  processed: number;
  errors: string[];
  warnings: string[];
}

// SEO types
export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

// Settings types
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  workingHours: string;
  socialLinks: {
    vk?: string;
    telegram?: string;
    whatsapp?: string;
    instagram?: string;
  };
  deliverySettings: {
    freeDeliveryFrom: number;
    defaultDeliveryPrice: number;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
  };
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: ValidationError[];
  statusCode?: number;
}

// File upload types
export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  properties?: Record<string, any>;
}

export interface ConversionData {
  event: 'purchase' | 'add_to_cart' | 'view_item' | 'lead_form';
  value?: number;
  currency?: string;
  items?: {
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }[];
}

// Export/Import types
export interface ExportData {
  schemaVersion: string;
  exportedAt: string;
  products: ExportProduct[];
  categories: ExportCategory[];
  mediaIndex: MediaFile[];
  settings?: ExportSettings;
}

export interface ExportProduct {
  id: string;
  slug: string;
  sku: string;
  title: string;
  description?: string;
  content?: string;
  price: number;
  oldPrice?: number;
  currency: string;
  stock: number;
  minOrder: number;
  weight?: number;
  dimensions?: string;
  material?: string;
  category: string;
  tags: string[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  isInStock: boolean;
  visibility: string;
  seo: {
    title?: string;
    description?: string;
    metaTitle?: string;
    metaDesc?: string;
  };
  gallery: string[];
  thumbnail: string;
  variants: ExportProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportProductVariant {
  id: string;
  sku: string;
  attrs: {
    color?: string;
    size?: string;
    material?: string;
  };
  priceDiff: number;
  stock: number;
  imageRef?: string;
  isActive: boolean;
}

export interface ExportCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  seo: {
    title?: string;
    description?: string;
  };
  children?: ExportCategory[];
}

export interface MediaFile {
  fileName: string;
  checksum: string;
  originalUrl?: string;
  size?: number;
  mimeType?: string;
}

export interface ExportSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  workingHours: string;
  socialLinks: {
    vk?: string;
    telegram?: string;
    whatsapp?: string;
    instagram?: string;
  };
  deliverySettings: {
    freeDeliveryFrom: number;
    defaultDeliveryPrice: number;
  };
}

export interface ImportResult {
  success: boolean;
  processed: {
    products: number;
    categories: number;
    media: number;
  };
  errors: string[];
  warnings: string[];
  skipped: {
    products: string[];
    categories: string[];
    media: string[];
  };
}

export interface ImportOptions {
  skipExisting?: boolean;
  updateExisting?: boolean;
  importMedia?: boolean;
  categoryMapping?: Record<string, string>;
}


