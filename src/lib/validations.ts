import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

// User validations
export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(6, 'Новый пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

// Address validations
export const addressSchema = z.object({
  name: z.string().min(2, 'Название адреса обязательно'),
  street: z.string().min(5, 'Адрес должен содержать минимум 5 символов'),
  city: z.string().min(2, 'Город обязателен'),
  region: z.string().min(2, 'Регион обязателен'),
  zipCode: z.string().min(6, 'Почтовый индекс должен содержать 6 цифр'),
  phone: z.string().optional(),
  isMain: z.boolean().default(false),
});

// Product validations
export const productSchema = z.object({
  sku: z.string().min(1, 'Артикул обязателен'),
  title: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  slug: z.string().min(2, 'URL должен содержать минимум 2 символа'),
  description: z.string().optional(),
  content: z.string().optional(),
  price: z.number().positive('Цена должна быть положительной'),
  oldPrice: z.number().optional(),
  currency: z.string().default('RUB'),
  stock: z.number().min(0, 'Количество не может быть отрицательным'),
  minOrder: z.number().min(1, 'Минимальный заказ должен быть больше 0'),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  category: z.enum(['ECONOMY', 'MIDDLE', 'LUXURY']),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isInStock: z.boolean().default(true),
  visibility: z.enum(['VISIBLE', 'HIDDEN', 'DRAFT']).default('VISIBLE'),
  categoryId: z.string().min(1, 'Категория обязательна'),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export const productVariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  price: z.number().positive('Цена должна быть положительной'),
  stock: z.number().min(0, 'Количество не может быть отрицательным'),
  sku: z.string().min(1, 'Артикул обязателен'),
  isActive: z.boolean().default(true),
  // Accept both absolute URLs and relative upload paths
  imageUrl: z.string().min(1).optional(),
});

// Category validations
export const categorySchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  slug: z.string().min(2, 'URL должен содержать минимум 2 символа'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
});

// Order validations
export const checkoutSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  company: z.string().optional(),
  phone: z.string().min(10, 'Некорректный номер телефона'),
  email: z.string().email('Некорректный email'),
  notes: z.string().optional(),
  deliveryType: z.enum(['PICKUP', 'COURIER', 'TRANSPORT']),
  addressId: z.string().optional(),
  address: z.string().optional(),
  promoCode: z.string().optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Review validations
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Минимальная оценка - 1').max(5, 'Максимальная оценка - 5'),
  title: z.string().optional(),
  content: z.string().min(10, 'Отзыв должен содержать минимум 10 символов'),
});

// Lead validations
export const leadSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z.string().optional(),
  email: z.string().email('Некорректный email').optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(10, 'Некорректный номер телефона'),
  company: z.string().optional(),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
});

// Page validations
export const pageSchema = z.object({
  title: z.string().min(2, 'Заголовок должен содержать минимум 2 символа'),
  slug: z.string().min(2, 'URL должен содержать минимум 2 символа'),
  content: z.string().min(10, 'Содержимое должно содержать минимум 10 символов'),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Settings validations (admin panel)
export const settingsSchema = z.object({
  // Contact section
  contactEmail: z.string().email('Некорректный email'),
  contactPhone: z.string().min(5, 'Некорректный номер телефона'),
  address: z.string().min(2, 'Укажите адрес'),
  // Commerce: minimum order subtotal (RUB)
  minOrderTotal: z.coerce.number().min(0).default(0),

  // Socials: dynamic list of label/url pairs
  socialLinks: z
    .array(
      z.object({
        label: z.string().min(1, 'Название обязательно'),
        url: z.string().min(1, 'Ссылка обязательна'),
      })
    )
    .default([]),

  // Additional contacts: list where each item can contain multiple values
  extraContacts: z
    .array(
      z.object({
        title: z.string().min(1, 'Название обязательно'),
        values: z.array(z.string().min(1)).default([]),
      })
    )
    .default([]),

  // Custom: external links
  photoPricesUrl: z.union([z.string().url('Некорректная ссылка'), z.literal('')]).optional(),

  // Popup configuration
  popupEnabled: z.boolean().default(false),
  popupTemplate: z.enum(['center', 'image-right', 'image-left']).default('center'),
  popupTitle: z.string().optional(),
  popupText: z.string().optional(),
  popupImageUrl: z.string().optional(),
  popupButtonLabel: z.string().optional(),
  popupButtonUrl: z.string().optional(),
  popupDelaySeconds: z.coerce.number().min(0).default(3),

  // Email settings for order notifications
  emailSettings: z
    .object({
      smtpHost: z.string().optional(),
      smtpPort: z.coerce.number().optional(),
      smtpUser: z.string().optional(),
      smtpPassword: z.string().optional(),
      fromEmail: z.union([z.string().email('Некорректный email'), z.literal('')]).optional(),
      companyEmail: z.union([z.string().email('Некорректный email'), z.literal('')]).optional(),
    })
    .partial()
    .optional(),

  // Legacy/optional fields kept for backward compatibility (ignored by UI)
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  workingHours: z.string().optional(),
});

// File upload validations
export const fileUploadSchema = z.object({
  file: z.any(),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
});

// CSV import validations
export const csvImportSchema = z.object({
  file: z.any(),
  mapping: z.record(z.string()),
  validateOnly: z.boolean().default(false),
});

// Query parameters validations
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  productCategory: z.enum(['ECONOMY', 'MIDDLE', 'LUXURY']).optional(),
  material: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'name', 'createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).merge(paginationSchema);

export const orderFiltersSchema = z.object({
  status: z.enum(['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

// API response validations
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type PageInput = z.infer<typeof pageSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;


