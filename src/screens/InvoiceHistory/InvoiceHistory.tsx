import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import { useTheme } from '@/theme';
import { invoiceStorage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import type { RootScreenProps } from '../../navigation/types';
import type { Invoice } from '../../types/schemas/invoice';

const InvoiceHistory = ({ navigation }: RootScreenProps<'InvoiceHistory'>) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { variant } = useTheme();
  const isDarkMode = variant === 'dark';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md),
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border
    },
    backButton: { padding: spacing.xs },
    backText: { fontSize: fontSize.md, color: colors.textSecondary },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },

    searchContainer: { padding: spacing.md, backgroundColor: colors.background },
    searchInput: {
      backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md,
      fontSize: fontSize.md, color: colors.text, borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },

    listContent: { padding: spacing.md },
    invoiceCard: {
      backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    clientName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
    amount: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },

    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    invoiceNumber: { fontSize: fontSize.sm, color: colors.textSecondary },
    date: { fontSize: fontSize.sm, color: colors.textSecondary },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    statusPaid: { backgroundColor: colors.success + '20' },
    statusSent: { backgroundColor: colors.accent + '20' },
    statusDraft: { backgroundColor: colors.textSecondary + '20' },

    statusText: { fontSize: 10, fontWeight: '700' },
    textPaid: { color: colors.success },
    textSent: { color: colors.accent },
    textDraft: { color: colors.textSecondary },

    emptyState: { alignItems: 'center', marginTop: spacing.xxl },
    emptyText: { color: colors.textSecondary, fontSize: fontSize.md },
  }), [colors, insets]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const loadInvoices = () => {
    const allInvoices = invoiceStorage.getSortedByDate('desc');
    setInvoices(allInvoices);
    setFilteredInvoices(allInvoices);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredInvoices(invoices);
      return;
    }
    const lowerText = text.toLowerCase();
    const filtered = invoices.filter(inv =>
      inv.client.clientName.toLowerCase().includes(lowerText) ||
      inv.invoiceNumber.toLowerCase().includes(lowerText)
    );
    setFilteredInvoices(filtered);
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('InvoicePreview', { invoiceId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.client.clientName}</Text>
        <Text style={styles.amount}>{formatCurrency(item.grandTotal, item.currency)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
        <Text style={styles.date}>{new Date(item.issueDate).toLocaleDateString()}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'Paid' ? styles.statusPaid :
            item.status === 'Sent' ? styles.statusSent : styles.statusDraft
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Paid' ? styles.textPaid :
              item.status === 'Sent' ? styles.textSent : styles.statusDraft
          ]}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { flexDirection: 'row', alignItems: 'center' }]}>
          <Icon name="chevron-back" size={24} color={colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search client or invoice #"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={item => item.id}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No invoices found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default InvoiceHistory;