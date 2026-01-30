import { z } from 'zod';

export const CompanyProfileSchema = z.object({
  id: z.string(),
  companyName: z.string().min(2),
  businessAddress: z.string().min(5),
  phoneNumber: z.string().min(10),
  email: z.string().email(),
  website: z.string().optional(),
  logoUri: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  clientName: z.string().min(2),
  clientAddress: z.string().min(5),
  contactNumber: z.string().min(10),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Client = z.infer<typeof ClientSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string(),
  productServiceName: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  tax: z.number().nonnegative().optional(),
  taxType: z.enum(['percentage', 'fixed']).optional(),
  total: z.number().nonnegative(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceStatusSchema = z.enum(['Draft', 'Final', 'Paid', 'Sent', 'Overdue']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  status: InvoiceStatusSchema,
  currency: z.string(),
  companyProfile: CompanyProfileSchema,
  client: ClientSchema,
  items: z.array(InvoiceItemSchema),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  discountType: z.enum(['percentage', 'fixed']),
  tax: z.number().nonnegative(),
  taxType: z.enum(['percentage', 'fixed']),
  grandTotal: z.number().nonnegative(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const CurrencySchema = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
});

export type Currency = z.infer<typeof CurrencySchema>;

export const ExchangeRateSchema = z.object({
  base: z.string(),
  rates: z.record(z.number()),
  timestamp: z.number(),
});

export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

export const AppSettingsSchema = z.object({
  defaultCurrency: z.string(),
  isPremium: z.boolean().default(false),
  lastSyncDate: z.string().optional(),
  cachedExchangeRates: ExchangeRateSchema.optional(),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
