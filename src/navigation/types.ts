import type { StackScreenProps } from '@react-navigation/stack';

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;

export type RootStackParamList = {
  Startup: undefined;
  Dashboard: undefined;
  InvoiceCreate: { invoiceId?: string } | undefined;
  InvoicePreview: { invoiceId: string };
  InvoiceHistory: undefined;
  CompanyProfile: undefined;
  ClientManagement: undefined;
  AddClient: { clientId?: string } | undefined;
  ClientHistory: { clientId: string };
  Settings: undefined;
};