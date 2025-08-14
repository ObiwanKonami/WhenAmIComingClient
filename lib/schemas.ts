import * as z from 'zod';

// ================================
// FAQ Formu için Şema
// ================================
export const faqFormSchema = z.object({
  question: z.string().min(5, { message: "Question must be at least 5 characters long." }),
  answer: z.string().min(10, { message: "Answer must be at least 10 characters long." }),
  isActive: z.boolean(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;


// ================================
// Sayfa (Page) Formu için Şema
// ================================
export const pageFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  slug: z.string()
    .min(3, { message: "Slug must be at least 3 characters." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens." }),
  content: z.string().optional(),
  details: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean(),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;

// ================================
// Testimoinal Formu için Şema
// ================================

export const testimonialFormSchema = z.object({
  name: z.string().min(3, { message: "Customer name is required." }),
  designation: z.string().min(2, { message: "Designation is required." }),
  feedback: z.string().min(10, { message: "Feedback must be at least 10 characters." }),
  imageUrl: z.string().url({ message: "Please upload a valid image." }).optional().or(z.literal('')),
  isVisible: z.boolean(),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

// ================================
// Categories Formu için Şema
// ================================


export const serviceCategoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  description: z.string().optional(),
  isActive: z.boolean(),
});
export type ServiceCategoryFormValues = z.infer<typeof serviceCategoryFormSchema>;

// ================================
// Register Formu için Şema
// ================================
export const registerFormSchema = z.object({
  companySlug: z.string().min(3, "Company URL must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format."),
  companyName: z.string().min(3, "Company name is required."),
  category: z.string().min(1, "Category is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(5, "A valid phone number is required."), // Daha basit bir kural
  countryCode: z.string().min(1, "Country code is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Hata mesajının hangi alanda gösterileceği
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

// ================================
// Login Formu için Şema
// ================================
export const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

// ================================
// Users Formu için Şema
// ================================

export const SUBSCRIPTION_TYPES = ['Monthly','Yearly','Lifetime'] as const;

// YENİ: Backend'deki enum (Success=1, Pending=0, vb.) ile frontend'deki gösterim ('Paid', 'Pending') arasındaki
// ayrımı netleştirelim. Formda gösterilecek etiketler ve backend'e gönderilecek değerler.
export const PAYMENT_STATUSES_FOR_FORM = [
    { value: 'Success',   label: 'Paid' },
    { value: 'Pending',   label: 'Pending' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Refunded',  label: 'Refunded' },
    { value: 'Failed',    label: 'Failed' },
] as const;

// Sadece değerleri içeren bir array. Zod enum için bunu kullanacağız.
const paymentStatusValues = PAYMENT_STATUSES_FOR_FORM.map(s => s.value);

export const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  
  // Not: `slug` alanı sadece `CreateUserCommand`'da var, `UpdateUserAndSubscriptionCommand`'da yok.
  // Bu nedenle edit modunda bu alan gönderilmeyecek ama create için şemada kalmalı.
  slug: z.string()
    .min(2, { message: 'Slug is required.' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens.' }),
  
  email: z.string().email({ message: 'Please enter a valid email.' }),

  // Edit’te boş string gelebilir; submit’te '' => undefined’a çevireceğiz
  password: z.string().min(6, 'Password must be at least 6 characters.').optional().or(z.literal('')),

  phone: z.string().optional(),

  // Plan adı UI’de string (örn. "Premium" veya "Free")
  plan: z.string().optional().nullable(),

  subscriptionType: z.enum(SUBSCRIPTION_TYPES).optional(),
  
  // YENİ: Zod enum artık backend'e gidecek değerleri kontrol ediyor.
  paymentStatus: z.enum(paymentStatusValues as [string, ...string[]]).optional(),

  status: z.boolean(),
  roles: z.array(z.string()).optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const defaultUserFormValues: UserFormValues = {
  name: '',
  slug: '',
  email: '',
  password: '',
  phone: '',
  plan: 'Free',
  subscriptionType: 'Monthly',
  paymentStatus: 'Pending',
  status: true,
  roles: [],
};


// ================================
// Marka (Brand) Formu için Şema
// ================================
export const brandFormSchema = z.object({
  name: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  logoUrl: z.string().url({ message: "Please provide a valid image URL." }).or(z.literal('')),
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0, { message: "Sort order must be a positive number." }),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

// ================================
// Özellik (Feature) Formu için Şema
// ================================

export const featureTypeEnum = z.enum(['Limit', 'Boolean']);

export const featureFormSchema = z.object({
  name: z.string().min(3, { message: "Feature name must be at least 3 characters." }),
  key: z.string().min(3, { message: "Key must be at least 3 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Key can only contain letters, numbers, and underscores." }),
  type: featureTypeEnum.optional().refine(val => val !== undefined, { message: "Please select a feature type." }),
});

export type FeatureFormValues = z.infer<typeof featureFormSchema>;
// ================================
// Blog Kategorisi Formu için Şema
// ================================
export const blogCategoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  slug: z.string().min(2, { message: "Slug is required." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Invalid slug format." }),
  isActive: z.boolean(),
});
export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;

// ================================
// Blog Gönderisi Formu için Şema
// ================================
export const blogPostFormSchema = z.object({
  title: z.string().min(3, { message: "Title is required." }),
  slug: z.string().min(3, { message: "Slug is required." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Invalid slug format." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  featuredImageUrl: z.string().url({ message: "Please provide a valid image URL." }).optional().or(z.literal('')),
  isPublished: z.boolean(),
  blogCategoryId: z.number().positive({ message: "Please select a category." }),
});
export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

// ================================
// Personel (Staff) Formu için Şema
// ================================
export const staffFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean(),
  // YENİ: Hizmet ID'lerinin bir dizi sayı olmasını bekliyoruz.
  serviceIds: z.array(z.number()).optional(),
  locationIds: z.array(z.number()).optional(),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

// ================================
// Plan (Plan) Formu için Şema
// ================================

// Plan'a atanacak her bir özelliği temsil eden alt şema
export const planFeatureSchema = z.object({
  featureKey: z.string(), // Özelliğin benzersiz anahtarı (örn: "user_limit")
  isAssigned: z.boolean(), // Bu özellik plana atanmış mı? (Toggle)
  value: z.string().optional(), // Eğer 'Limit' tipi ise, değeri (örn: "10" veya "-1")
});

// Plan düzenleme formunun tamamını kapsayan ana şema
export const planFormSchema = z.object({
  name: z.string().min(3, { message: "Plan name must be at least 3 characters." }),
  
  // GEÇİCİ DEĞİŞİKLİK: Sayısal validasyonu şimdilik kaldıralım.
  // Bu, tip sorunlarının sayısal dönüşümden kaynaklanıp kaynaklanmadığını anlamamızı sağlar.
  monthlyPrice: z.string().min(1, "Monthly price is required."),
  yearlyPrice: z.string().min(1, "Yearly price is required."),
  lifetimePrice: z.string().min(1, "Lifetime price is required."),

  features: z.array(planFeatureSchema),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

// ================================
// Affiliate Ayarları Formu için Şema
// ================================
export const affiliateSettingsFormSchema = z.object({
  enableReferral: z.boolean(),
  // Sayısal alanları string olarak alıp validasyon yapıyoruz.
  commissionRate: z.string()
    .min(1, "Commission rate is required.")
    .refine(val => !isNaN(parseFloat(val)), { message: "Must be a valid number." })
    .refine(val => parseFloat(val) >= 0 && parseFloat(val) <= 100, { message: "Must be between 0 and 100." }),
  minimumPayout: z.string()
    .min(1, "Minimum payout is required.")
    .refine(val => !isNaN(parseFloat(val)), { message: "Must be a valid number." })
    .refine(val => parseFloat(val) >= 0, { message: "Cannot be negative." }),
  referralGuidelines: z.string().optional(),
});

export type AffiliateSettingsFormValues = z.infer<typeof affiliateSettingsFormSchema>;

// ================================
// Website Ayarları Formu için Şema
// ================================
export const websiteSettingsFormSchema = z.object({
  favicon: z.string().optional(),
  logo: z.string().optional(),
  logoLight: z.string().optional(),
  applicationName: z.string().min(1, "Application name is required."),
  applicationTitle: z.string().min(1, "Application title is required."),
  keywords: z.string().optional(),
  description: z.string().optional(),
  footerAbout: z.string().optional(),
  copyright: z.string().optional(),
  adminEmail: z.string().email({ message: "Please enter a valid email address." }),
  currency: z.string().min(1, "Currency is required."),
  currencyPosition: z.string().min(1, "Currency position is required."),
  numberFormat: z.string().min(1, "Number format is required."),
  trialDays: z.string()
    .min(1, "Trial days is required.")
    .refine(val => !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0, {
      message: "Must be a non-negative number.",
    }),
  timeZone: z.string().min(1, "Time zone is required."),
  appointmentReminder: z.string().min(1, "Reminder setting is required."),
  couponSystem: z.boolean()
});

export type WebsiteSettingsFormValues = z.infer<typeof websiteSettingsFormSchema> & {
  couponSystem: boolean;
};

// ================================
// Kupon (Coupon) Formu için Şema
// ================================

export const couponFormSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters'),
  discountType: z.union([z.literal('Percentage'), z.literal('FixedAmount')]),
  discountValue: z
    .string()
    .min(1, 'Discount value is required')
    .refine((s) => !isNaN(Number(s)), 'Must be a number'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  usageLimit: z
    .string()
    .min(1, 'Usage limit is required')
    .refine((s) => /^\d+$/.test(s), 'Must be an integer'),
  isActive: z.boolean()
}).superRefine((val, ctx) => {
  if (val.startDate && val.endDate) {
    const sd = new Date(val.startDate)
    const ed = new Date(val.endDate)
    if (sd > ed) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be after start date' })
    }
  }
  const num = Number(val.discountValue)
  if (val.discountType === 'Percentage') {
    if (num > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Percentage discount cannot exceed 100' })
    if (num <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Percentage must be > 0' })
  } else {
    if (num <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountValue'], message: 'Amount must be > 0' })
  }
})

export type CouponFormValues = z.infer<typeof couponFormSchema>

// ================================
// Konum (Location) Formu için Şema
// ================================
export const locationFormSchema = z.object({
  name: z.string().min(3, { message: "Location name must be at least 3 characters." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean(),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const defaultLocationFormValues: LocationFormValues = {
  name: '',
  phone: '',
  address: '',
  isActive: true,
};