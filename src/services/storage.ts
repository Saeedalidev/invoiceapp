import { MMKV } from 'react-native-mmkv';
import type {
  CompanyProfile,
  Client,
  Invoice,
  ExchangeRate,
  AppSettings,
} from '../types/schemas/invoice';

export const storage = new MMKV({
  id: 'invoice-creator-storage',
  encryptionKey: 'invoice-creator-encryption-key',
});

const KEYS = {
  COMPANY_PROFILE: 'company_profile',
  CLIENTS: 'clients',
  INVOICES: 'invoices',
  SETTINGS: 'settings',
  EXCHANGE_RATES: 'exchange_rates',
  INVOICE_COUNTER: 'invoice_counter',
} as const;

const getItem = <T>(key: string): T | null => {
  try {
    const data = storage.getString(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

const setItem = <T>(key: string, value: T): boolean => {
  try {
    storage.set(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
};

const deleteItem = (key: string): boolean => {
  try {
    storage.delete(key);
    return true;
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    return false;
  }
};

export const companyProfileStorage = {
  get: (): CompanyProfile | null => getItem<CompanyProfile>(KEYS.COMPANY_PROFILE),
  
  set: (profile: CompanyProfile): boolean => setItem(KEYS.COMPANY_PROFILE, profile),
  
  update: (updates: Partial<CompanyProfile>): boolean => {
    const current = companyProfileStorage.get();
    if (!current) return false;
    
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return setItem(KEYS.COMPANY_PROFILE, updated);
  },
  
  delete: (): boolean => deleteItem(KEYS.COMPANY_PROFILE),
};

export const clientStorage = {
  getAll: (): Client[] => getItem<Client[]>(KEYS.CLIENTS) || [],
  
  getById: (id: string): Client | null => {
    const clients = clientStorage.getAll();
    return clients.find(c => c.id === id) || null;
  },
  
  add: (client: Client): boolean => {
    const clients = clientStorage.getAll();
    clients.push(client);
    return setItem(KEYS.CLIENTS, clients);
  },
  
  update: (id: string, updates: Partial<Client>): boolean => {
    const clients = clientStorage.getAll();
    const index = clients.findIndex(c => c.id === id);
    
    if (index === -1) return false;
    
    clients[index] = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return setItem(KEYS.CLIENTS, clients);
  },
  
  delete: (id: string): boolean => {
    const clients = clientStorage.getAll();
    const filtered = clients.filter(c => c.id !== id);
    return setItem(KEYS.CLIENTS, filtered);
  },
  
  search: (query: string): Client[] => {
    const clients = clientStorage.getAll();
    const lowerQuery = query.toLowerCase();
    
    return clients.filter(
      c =>
        c.clientName.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery) ||
        c.contactNumber.includes(query)
    );
  },
};

export const invoiceStorage = {
  getAll: (): Invoice[] => getItem<Invoice[]>(KEYS.INVOICES) || [],
  
  getById: (id: string): Invoice | null => {
    const invoices = invoiceStorage.getAll();
    return invoices.find(inv => inv.id === id) || null;
  },
  
  add: (invoice: Invoice): boolean => {
    const invoices = invoiceStorage.getAll();
    invoices.push(invoice);
    return setItem(KEYS.INVOICES, invoices);
  },
  
  update: (id: string, updates: Partial<Invoice>): boolean => {
    const invoices = invoiceStorage.getAll();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index === -1) return false;
    
    invoices[index] = {
      ...invoices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return setItem(KEYS.INVOICES, invoices);
  },
  
  delete: (id: string): boolean => {
    const invoices = invoiceStorage.getAll();
    const filtered = invoices.filter(inv => inv.id !== id);
    return setItem(KEYS.INVOICES, filtered);
  },
  
  getByStatus: (status: Invoice['status']): Invoice[] => {
    const invoices = invoiceStorage.getAll();
    return invoices.filter(inv => inv.status === status);
  },
  
  getByClient: (clientId: string): Invoice[] => {
    const invoices = invoiceStorage.getAll();
    return invoices.filter(inv => inv.client.id === clientId);
  },
  
  getSortedByDate: (order: 'asc' | 'desc' = 'desc'): Invoice[] => {
    const invoices = invoiceStorage.getAll();
    return invoices.sort((a, b) => {
      const dateA = new Date(a.issueDate).getTime();
      const dateB = new Date(b.issueDate).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },
  
  getNextInvoiceNumber: (): string => {
    const counter = storage.getNumber(KEYS.INVOICE_COUNTER) || 1000;
    const nextNumber = counter + 1;
    storage.set(KEYS.INVOICE_COUNTER, nextNumber);
    return `INV-${nextNumber}`;
  },
};

export const exchangeRateStorage = {
  get: (): ExchangeRate | null => getItem<ExchangeRate>(KEYS.EXCHANGE_RATES),
  
  set: (rates: ExchangeRate): boolean => setItem(KEYS.EXCHANGE_RATES, rates),
  
  isStale: (maxAgeHours: number = 24): boolean => {
    const rates = exchangeRateStorage.get();
    if (!rates) return true;
    
    const ageMs = Date.now() - rates.timestamp;
    const ageHours = ageMs / (1000 * 60 * 60);
    
    return ageHours > maxAgeHours;
  },
};

export const settingsStorage = {
  get: (): AppSettings => {
    return getItem<AppSettings>(KEYS.SETTINGS) || {
      defaultCurrency: 'USD',
    };
  },
  
  set: (settings: AppSettings): boolean => setItem(KEYS.SETTINGS, settings),
  
  update: (updates: Partial<AppSettings>): boolean => {
    const current = settingsStorage.get();
    const updated = { ...current, ...updates };
    return setItem(KEYS.SETTINGS, updated);
  },
};

export const clearAllData = (): boolean => {
  try {
    storage.clearAll();
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};

export default {
  companyProfile: companyProfileStorage,
  client: clientStorage,
  invoice: invoiceStorage,
  exchangeRate: exchangeRateStorage,
  settings: settingsStorage,
  clearAll: clearAllData,
};
