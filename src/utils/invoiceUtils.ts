import type { Invoice, InvoiceItem } from '../types/schemas/invoice';

export const calculateItemTotal = (item: InvoiceItem): number => {
  const baseTotal = item.quantity * item.unitPrice;
  
  if (!item.tax) return baseTotal;
  
  const taxAmount = item.taxType === 'percentage'
    ? (baseTotal * item.tax) / 100
    : item.tax;
  
  return baseTotal + taxAmount;
};

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
};

export const calculateItemsTax = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => {
    if (!item.tax) return sum;
    
    const baseTotal = item.quantity * item.unitPrice;
    const taxAmount = item.taxType === 'percentage'
      ? (baseTotal * item.tax) / 100
      : item.tax;
    
    return sum + taxAmount;
  }, 0);
};

export const calculateDiscountAmount = (
  subtotal: number,
  discount: number,
  discountType: 'percentage' | 'fixed'
): number => {
  if (!discount) return 0;
  
  return discountType === 'percentage'
    ? (subtotal * discount) / 100
    : discount;
};

export const calculateTaxAmount = (
  amount: number,
  tax: number,
  taxType: 'percentage' | 'fixed'
): number => {
  if (!tax) return 0;
  
  return taxType === 'percentage'
    ? (amount * tax) / 100
    : tax;
};

export const calculateGrandTotal = (invoice: {
  items: InvoiceItem[];
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxType: 'percentage' | 'fixed';
}): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
} => {
  const subtotal = calculateSubtotal(invoice.items);
  const itemsTax = calculateItemsTax(invoice.items);
  const discountAmount = calculateDiscountAmount(
    subtotal,
    invoice.discount,
    invoice.discountType
  );
  const afterDiscount = subtotal - discountAmount;
  const invoiceTax = calculateTaxAmount(
    afterDiscount,
    invoice.tax,
    invoice.taxType
  );
  const totalTax = itemsTax + invoiceTax;
  const grandTotal = subtotal - discountAmount + totalTax;
  
  return {
    subtotal,
    discountAmount,
    taxAmount: totalTax,
    grandTotal,
  };
};

export const updateInvoiceTotals = (
  invoice: Partial<Invoice>
): Partial<Invoice> => {
  if (!invoice.items || invoice.items.length === 0) {
    return {
      ...invoice,
      subtotal: 0,
      grandTotal: 0,
    };
  }
  
  const calculations = calculateGrandTotal({
    items: invoice.items,
    discount: invoice.discount || 0,
    discountType: invoice.discountType || 'fixed',
    tax: invoice.tax || 0,
    taxType: invoice.taxType || 'percentage',
  });
  
  return {
    ...invoice,
    subtotal: calculations.subtotal,
    grandTotal: calculations.grandTotal,
  };
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'Paid') return false;
  
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  
  return dueDate < now;
};

export const getDaysUntilDue = (invoice: Invoice): number => {
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const formatNumber = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const createEmptyItem = (): InvoiceItem => ({
  id: generateId(),
  productServiceName: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  tax: 0,
  taxType: 'percentage',
  total: 0,
});

export default {
  calculateItemTotal,
  calculateSubtotal,
  calculateItemsTax,
  calculateDiscountAmount,
  calculateTaxAmount,
  calculateGrandTotal,
  updateInvoiceTotals,
  generateId,
  formatDate,
  parseDate,
  isInvoiceOverdue,
  getDaysUntilDue,
  formatNumber,
  isValidEmail,
  isValidPhone,
  createEmptyItem,
};
