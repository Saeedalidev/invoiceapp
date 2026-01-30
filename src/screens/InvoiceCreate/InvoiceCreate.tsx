import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { clientStorage } from '../../services/storage';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import { useTheme } from '@/theme';
import Button from '../../components/atoms/Button';
import type { RootScreenProps } from '../../navigation/types';
import { generateId, updateInvoiceTotals } from '../../utils/invoiceUtils';
import { invoiceStorage, companyProfileStorage } from '../../services/storage';
import type { Client, Invoice, InvoiceItem } from '../../types/schemas/invoice';
import { getCurrencySymbol, getExchangeRates, SUPPORTED_CURRENCIES } from '../../services/currency';

const InvoiceCreate = ({ navigation, route }: RootScreenProps<'InvoiceCreate'>) => {
  const { variant } = useTheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isDarkMode = variant === 'dark';

  const existingInvoiceId = route.params?.invoiceId;
  const isEditMode = !!existingInvoiceId;
  const [clientName, setClientName] = useState('');
  // We can store the full client object if selected, or just name if manual
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [items, setItems] = useState([{ id: 1, title: '', description: '', quantity: '1', price: '0.00' }]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(Math.random() * 10000)}`);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  // Tax & Discount State
  const [tax, setTax] = useState('0');
  const [taxType, setTaxType] = useState<'percentage' | 'fixed'>('percentage');
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [showDiscount, setShowDiscount] = useState(false);

  // Client Selection State
  const [isClientModalVisible, setClientModalVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Currency Selection State
  const [currency, setCurrency] = useState('USD');
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: spacing.xl },
    header: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md),
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border
    },
    backLink: { fontSize: fontSize.md, color: colors.textSecondary },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    saveLink: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },

    card: { backgroundColor: colors.card, margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.md },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    cardTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    selectClientLink: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },

    input: {
      backgroundColor: isDarkMode ? colors.background : colors.gray100, borderRadius: borderRadius.sm, padding: spacing.sm,
      fontSize: fontSize.md, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md
    },
    row: { flexDirection: 'row', gap: spacing.md },
    halfInput: { flex: 1 },
    label: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 },

    sectionTitleContainer: { paddingHorizontal: spacing.md, marginBottom: spacing.xs },
    sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },

    itemCard: {
      backgroundColor: colors.card, marginHorizontal: spacing.md, marginBottom: spacing.md,
      padding: spacing.md, borderRadius: borderRadius.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    itemTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    deleteLink: { fontSize: fontSize.sm, color: colors.error },
    itemTitleInput: { fontWeight: '400', marginBottom: spacing.sm },
    itemDesc: { marginBottom: spacing.sm, height: 60, textAlignVertical: 'top' },
    qtyContainer: { flex: 1 },
    priceContainer: { flex: 2 },
    totalContainer: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 },
    itemTotal: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },

    addItemButton: {
      marginHorizontal: spacing.md, padding: spacing.md, borderRadius: borderRadius.md,
      borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed', alignItems: 'center', marginBottom: spacing.lg
    },
    addItemText: { color: colors.accent, fontWeight: '600', fontSize: fontSize.md },

    footer: { backgroundColor: colors.card, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    totalLabel: { fontSize: fontSize.md, color: colors.textSecondary },
    totalValue: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
    grandTotalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
    grandTotalLabel: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text },
    grandTotalValue: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.primary },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalContent: { flex: 1, padding: spacing.md },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg,
      paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.card
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
    closeLink: { fontSize: fontSize.md, color: colors.accent },
    clientItem: { padding: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.sm },
    clientName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
    clientSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary },
    emptyState: { alignItems: 'center', marginTop: spacing.xxl },
    emptyStateText: { marginBottom: spacing.md, color: colors.textSecondary },

    // Tax Styles
    taxInputContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: spacing.md },
    taxTypeSelector: { flexDirection: 'row', borderRadius: borderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
    taxTypeButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.background },
    taxTypeActive: { backgroundColor: colors.primary },
    taxTypeText: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
    taxTypeTextActive: { color: 'white' },
    taxInput: { width: 80, textAlign: 'right', marginBottom: 0 },
    addDiscountHeader: { paddingVertical: spacing.sm, marginBottom: spacing.md, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, borderStyle: 'dashed' },
    addDiscountText: { color: colors.accent, fontWeight: '600', fontSize: fontSize.sm },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: fontSize.xs, marginTop: -spacing.sm, marginBottom: spacing.md },

    // Refined Footer Styles
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    inputLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    inputRowLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
    removeLink: { fontSize: fontSize.xs, color: colors.error, fontWeight: '500' },
    inputControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    taxTypeSelectorSmall: { flexDirection: 'row', borderRadius: borderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    taxTypeButtonSmall: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.card },
    taxTypeTextSmall: { fontSize: fontSize.xs, color: colors.text, fontWeight: '600' },
    inputSmall: {
      backgroundColor: isDarkMode ? colors.background : colors.gray100, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6,
      fontSize: fontSize.sm, color: colors.text, borderWidth: 1, borderColor: colors.border, width: 70, textAlign: 'right'
    },
    discountInput: {},
    taxInputSmall: {},
    addDiscountHeaderRefined: { paddingVertical: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.xs },
    addDiscountTextRefined: { color: colors.accent, fontWeight: '600', fontSize: fontSize.sm },
    summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    summaryValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
    grandTotalRowRefined: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    grandTotalLabelRefined: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.text },
    grandTotalValueRefined: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.primary },
  }), [colors, isDarkMode, insets]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    loadClients();
    getExchangeRates(); // Fetch rates on mount

    if (isEditMode && existingInvoiceId) {
      loadInvoiceData(existingInvoiceId);
    }
  }, [existingInvoiceId]);

  const loadInvoiceData = (id: string) => {
    const invoice = invoiceStorage.getById(id);
    if (!invoice) {
      Alert.alert('Error', 'Invoice not found');
      navigation.goBack();
      return;
    }

    setClientName(invoice.client.clientName);
    setSelectedClient(invoice.client);
    setInvoiceNumber(invoice.invoiceNumber);
    setDueDate(invoice.dueDate);
    setCurrency(invoice.currency);
    setTax(invoice.tax.toString());
    setTaxType(invoice.taxType);
    setDiscount((invoice.discount || 0).toString());
    setDiscountType(invoice.discountType || 'percentage');
    setShowDiscount((invoice.discount || 0) > 0);

    // Map invoice items to local state format
    const mappedItems = invoice.items.map((item, index) => ({
      id: index + 1, // local id for list rendering
      title: item.productServiceName || '',
      description: item.description || '',
      quantity: item.quantity.toString(),
      price: item.unitPrice.toString(),
    }));
    setItems(mappedItems);
  };

  const loadClients = () => {
    const allClients = clientStorage.getAll();
    setClients(allClients.sort((a, b) => a.clientName.localeCompare(b.clientName)));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientName(client.clientName);
    setClientModalVisible(false);
  };

  const addItem = () => {
    setItems([...items, { id: items.length + 1, title: '', description: '', quantity: '1', price: '0.00' }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
    const discVal = parseFloat(discount) || 0;
    const discAmt = discountType === 'percentage' ? (subtotal * discVal / 100) : discVal;

    // Tax is after discount
    const afterDiscount = subtotal - discAmt;
    const taxVal = parseFloat(tax) || 0;
    const taxAmt = taxType === 'percentage' ? (afterDiscount * taxVal / 100) : taxVal;

    return {
      subtotal,
      discountAmount: discAmt,
      taxAmount: taxAmt,
      grandTotal: subtotal - discAmt + taxAmt
    };
  };

  const handleSave = () => {
    // 1. Validation
    if (!selectedClient && !clientName) {
      setErrors(prev => ({ ...prev, clientName: 'Please select a client or enter a client name.' }));
      Alert.alert('Validation Error', 'Please select a client or enter a client name.');
      return;
    }

    // Validate Item Titles
    const invalidItemIndex = items.findIndex(item => item.title.trim().length === 0);
    if (invalidItemIndex !== -1) {
      setErrors(prev => ({ ...prev, [`item_title_${items[invalidItemIndex].id}`]: 'Title is required.' }));
      Alert.alert('Validation Error', 'All items must have a title.');
      return;
    }

    // Check for company profile
    const companyProfile = companyProfileStorage.get();
    if (!companyProfile) {
      Alert.alert('Profile Missing', 'Please set up your company profile first.', [
        { text: 'Go to Profile', onPress: () => navigation.navigate('CompanyProfile') },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    // 2. Prepare Data
    const clientData: Client = selectedClient || {
      id: generateId(),
      clientName: clientName,
      clientAddress: '',
      contactNumber: '',
      email: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const calculatedTax = parseFloat(tax) || 0;

    const partialInvoice: Partial<Invoice> = {
      items: items.map(item => ({
        id: generateId(),
        productServiceName: item.title,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.price) || 0,
        tax: 0, // Item level tax unused for now
        taxType: 'percentage',
        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)
      })),
      tax: calculatedTax,
      taxType: taxType,
      discount: parseFloat(discount) || 0,
      discountType: discountType,
    };

    const totals = updateInvoiceTotals(partialInvoice);

    const newInvoice: Invoice = {
      id: isEditMode && existingInvoiceId ? existingInvoiceId : generateId(),
      invoiceNumber,
      issueDate: new Date().toISOString(), // Using today as issue date 
      dueDate: dueDate,
      status: 'Draft', // Default status
      currency,
      companyProfile,
      client: clientData,
      items: partialInvoice.items as InvoiceItem[],
      subtotal: totals.subtotal || 0,
      discount: parseFloat(discount) || 0,
      discountType: discountType,
      tax: totals.tax || 0, // This logic in invoiceUtils might need check if it returns taxAmount vs rate
      taxType: taxType,
      grandTotal: totals.grandTotal || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Save to Storage
    if (isEditMode && existingInvoiceId) {
      invoiceStorage.update(existingInvoiceId, newInvoice);
    } else {
      invoiceStorage.add(newInvoice);
    }

    // 4. Feedback & Navigation
    Alert.alert('Success', 'Invoice saved successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="chevron-back" size={24} color={colors.textSecondary} />
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Invoice' : 'New Invoice'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveLink}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Bill To</Text>
              <TouchableOpacity onPress={() => setClientModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="add-circle-outline" size={18} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={styles.selectClientLink}>Select Client</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, errors.clientName && styles.inputError]}
              placeholder="Client Name"
              value={clientName}
              onChangeText={(text) => {
                setClientName(text);
                clearError('clientName');
                if (selectedClient && text !== selectedClient.clientName) {
                  setSelectedClient(null); // Clear selected client if manually edited
                }
              }}
              placeholderTextColor={colors.textSecondary}
            />
            {errors.clientName && <Text style={styles.errorText}>{errors.clientName}</Text>}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Invoice No</Text>
                <TextInput style={styles.input} value={invoiceNumber} onChangeText={setInvoiceNumber} placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity onPress={() => setDatePickerOpen(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      style={styles.input}
                      value={dueDate}
                      placeholder="YYYY-MM-DD"
                      editable={false}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
                <DatePicker
                  modal
                  open={isDatePickerOpen}
                  theme={isDarkMode ? 'dark' : 'light'}
                  date={(() => {
                    if (!dueDate) return new Date();
                    const [y, m, d] = dueDate.split('-').map(Number);
                    return new Date(y, m - 1, d);
                  })()}
                  mode="date"
                  onConfirm={(date) => {
                    setDatePickerOpen(false);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setDueDate(`${year}-${month}-${day}`);
                  }}
                  onCancel={() => {
                    setDatePickerOpen(false);
                  }}
                  minimumDate={new Date()}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Currency</Text>
                <TouchableOpacity style={styles.input} onPress={() => setCurrencyModalVisible(true)}>
                  <Text style={{ fontSize: fontSize.md, color: colors.text }}>{currency} ({getCurrencySymbol(currency)})</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Items</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Text style={styles.deleteLink}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.itemTitleInput, errors[`item_title_${item.id}`] && styles.inputError]}
                placeholder="Title (Required)"
                value={item.title}
                onChangeText={(text) => {
                  updateItem(item.id, 'title', text);
                  clearError(`item_title_${item.id}`);
                }}
                placeholderTextColor={colors.textSecondary}
              />
              {errors[`item_title_${item.id}`] && <Text style={styles.errorText}>{errors[`item_title_${item.id}`]}</Text>}
              <TextInput
                style={[styles.input, styles.itemDesc]}
                placeholder="Description (Optional)"
                value={item.description}
                onChangeText={(text) => updateItem(item.id, 'description', text)}
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <View style={styles.row}>
                <View style={styles.qtyContainer}>
                  <Text style={styles.label}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity}
                    keyboardType="numeric"
                    onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.label}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={item.price}
                    keyboardType="numeric"
                    onChangeText={(text) => updateItem(item.id, 'price', text)}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.totalContainer}>
                  <Text style={styles.label}>Total</Text>
                  <Text style={styles.itemTotal}>
                    {getCurrencySymbol(currency)}{((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
            <Icon name="add-circle-outline" size={20} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            {/* Input Row: Discount */}
            {showDiscount ? (
              <View style={styles.inputRow}>
                <View style={styles.inputLabelContainer}>
                  <Text style={styles.inputRowLabel}>Discount</Text>
                  <TouchableOpacity onPress={() => { setShowDiscount(false); setDiscount('0'); }}>
                    <Text style={styles.removeLink}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputControls}>
                  <View style={styles.taxTypeSelectorSmall}>
                    <TouchableOpacity
                      style={[styles.taxTypeButtonSmall, discountType === 'percentage' && styles.taxTypeActive]}
                      onPress={() => setDiscountType('percentage')}
                    >
                      <Text style={[styles.taxTypeTextSmall, discountType === 'percentage' && styles.taxTypeTextActive]}>%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.taxTypeButtonSmall, discountType === 'fixed' && styles.taxTypeActive]}
                      onPress={() => setDiscountType('fixed')}
                    >
                      <Text style={[styles.taxTypeTextSmall, discountType === 'fixed' && styles.taxTypeTextActive]}>$</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.inputSmall, styles.discountInput]}
                    value={discount}
                    onChangeText={setDiscount}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addDiscountHeaderRefined, { flexDirection: 'row', alignItems: 'center' }]}
                onPress={() => setShowDiscount(true)}
              >
                <Icon name="add-circle-outline" size={16} color={colors.accent} style={{ marginRight: 4 }} />
                <Text style={styles.addDiscountTextRefined}>Add Discount</Text>
              </TouchableOpacity>
            )}

            {/* Input Row: Tax */}
            <View style={styles.inputRow}>
              <Text style={styles.inputRowLabel}>Tax</Text>
              <View style={styles.inputControls}>
                <View style={styles.taxTypeSelectorSmall}>
                  <TouchableOpacity
                    style={[styles.taxTypeButtonSmall, taxType === 'percentage' && styles.taxTypeActive]}
                    onPress={() => setTaxType('percentage')}
                  >
                    <Text style={[styles.taxTypeTextSmall, taxType === 'percentage' && styles.taxTypeTextActive]}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.taxTypeButtonSmall, taxType === 'fixed' && styles.taxTypeActive]}
                    onPress={() => setTaxType('fixed')}
                  >
                    <Text style={[styles.taxTypeTextSmall, taxType === 'fixed' && styles.taxTypeTextActive]}>$</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.inputSmall, styles.taxInputSmall]}
                  value={tax}
                  onChangeText={setTax}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.summaryDivider} />

            {/* Summary Section */}
            {(() => {
              const totals = calculateTotal();
              return (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{getCurrencySymbol(currency)}{totals.subtotal.toFixed(2)}</Text>
                  </View>

                  {showDiscount && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Discount {discountType === 'percentage' ? `(${discount || 0}%)` : ''}</Text>
                      <Text style={[styles.summaryValue, { color: colors.success }]}>
                        -{getCurrencySymbol(currency)}{totals.discountAmount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax {taxType === 'percentage' ? `(${tax || 0}%)` : ''}</Text>
                    <Text style={styles.summaryValue}>
                      {getCurrencySymbol(currency)}{totals.taxAmount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.summaryRow, styles.grandTotalRowRefined]}>
                    <Text style={styles.grandTotalLabelRefined}>Total</Text>
                    <Text style={styles.grandTotalValueRefined}>
                      {getCurrencySymbol(currency)}{totals.grandTotal.toFixed(2)}
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Client Selection Modal */}
      <Modal visible={isClientModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setClientModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Client</Text>
            <TouchableOpacity onPress={() => setClientModalVisible(false)}>
              <Text style={styles.closeLink}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <FlatList
              data={clients}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.clientItem} onPress={() => handleSelectClient(item)}>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.clientSubtitle}>{item.email}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No clients found.</Text>
                  <Button title="Create new client" onPress={() => {
                    setClientModalVisible(false);
                    navigation.navigate('AddClient');
                  }} />
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal visible={isCurrencyModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCurrencyModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
              <Text style={styles.closeLink}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.clientItem} onPress={() => {
                  setCurrency(item.code);
                  setCurrencyModalVisible(false);
                }}>
                  <Text style={styles.clientName}>{item.code} - {item.name}</Text>
                  <Text style={styles.clientSubtitle}>{item.symbol}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default InvoiceCreate;
