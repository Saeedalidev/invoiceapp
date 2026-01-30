import ky from 'ky';
import type { ExchangeRate, Currency } from '../types/schemas/invoice';
import { exchangeRateStorage } from './storage';

const API_KEY = '4ee745f30e598b3ff54a3fc0';
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
};

export const getCurrencySymbol = (code: string): string => {
  const currency = getCurrencyByCode(code);
  return currency?.symbol || code;
};

export const formatCurrency = (
  amount: number,
  currencyCode: string,
  showSymbol: boolean = true
): string => {
  const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  if (showSymbol) {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${formatted}`;
  }
  
  return `${formatted} ${currencyCode}`;
};

export const fetchExchangeRates = async (): Promise<ExchangeRate | null> => {
  try {
    const response = await ky
      .get(`${BASE_URL}/${API_KEY}/latest/USD`)
      .json<{
        result: string;
        conversion_rates: Record<string, number>;
      }>();

    if (response.result === 'success') {
      const exchangeRate: ExchangeRate = {
        base: 'USD',
        rates: response.conversion_rates,
        timestamp: Date.now(),
      };

      exchangeRateStorage.set(exchangeRate);
      
      return exchangeRate;
    }

    return null;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};

export const getExchangeRates = async (
  forceRefresh: boolean = false
): Promise<ExchangeRate | null> => {
  if (!forceRefresh) {
    const cached = exchangeRateStorage.get();
    if (cached && !exchangeRateStorage.isStale(24)) {
      return cached;
    }
  }

  const fresh = await fetchExchangeRates();
  if (fresh) return fresh;

  return exchangeRateStorage.get();
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> => {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();
  if (!rates) return null;

  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount / rates.rates[fromCurrency];

  const convertedAmount = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * rates.rates[toCurrency];

  return convertedAmount;
};

export const convertCurrencySync = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number | null => {
  if (fromCurrency === toCurrency) return amount;

  const rates = exchangeRateStorage.get();
  if (!rates) return null;

  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount / rates.rates[fromCurrency];

  const convertedAmount = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * rates.rates[toCurrency];

  return convertedAmount;
};

export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> => {
  if (fromCurrency === toCurrency) return 1;

  const rates = await getExchangeRates();
  if (!rates) return null;

  const rate = fromCurrency === 'USD'
    ? rates.rates[toCurrency]
    : rates.rates[toCurrency] / rates.rates[fromCurrency];

  return rate;
};

export default {
  SUPPORTED_CURRENCIES,
  getCurrencyByCode,
  getCurrencySymbol,
  formatCurrency,
  fetchExchangeRates,
  getExchangeRates,
  convertCurrency,
  convertCurrencySync,
  getExchangeRate,
};
