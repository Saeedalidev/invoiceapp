import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { invoiceStorage, companyProfileStorage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { useTheme } from '@/theme';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import Button from '../../components/atoms/Button';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { FINAL_BANNER_ID, SHOW_ADS } from '../../services/admobService';
import type { RootScreenProps } from '../../navigation/types';
import type { Invoice } from '../../types/schemas/invoice';

const Dashboard = ({ navigation }: RootScreenProps<'Dashboard'>) => {
  const { variant, changeTheme } = useTheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ outstanding: 0, unpaidCount: 0 });

  // Preload rewarded ad on dashboard mount
  // The hook handles loading automatically on mount
  const { loadAd } = useRewardedAd({
    onRewarded: () => {
      // No-op on dashboard
    },
    onError: (error) => {
      console.warn('[Dashboard] Ad preload failed:', error);
    }
  });

  // Ensure loadAd is not marked as unused
  useEffect(() => {
    if (SHOW_ADS) {
      console.log('[Dashboard] Ad preloading system active');
    }
  }, [loadAd]);

  const isDarkMode = variant === 'dark';

  const handleThemeToggle = () => {
    changeTheme(isDarkMode ? 'default' : 'dark');
  };

  // Initial load
  useEffect(() => {
    loadData();
    checkCompanyProfile();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const checkCompanyProfile = () => {
    const profile = companyProfileStorage.get();
    if (!profile) {
      Alert.alert('Company Info', 'Please set up your company profile before creating invoices.', [
        { text: 'Set Up Now', onPress: () => navigation.navigate('CompanyProfile') },
        { text: 'Later', style: 'cancel' },
      ]);
    }
  };

  const loadData = () => {
    const allInvoices = invoiceStorage.getSortedByDate('desc');
    setInvoices(allInvoices.slice(0, 5));
    const outstanding = allInvoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.grandTotal, 0);
    const unpaidCount = allInvoices.filter(inv => inv.status !== 'Paid').length;
    setStats({ outstanding, unpaidCount });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  };


  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: spacing.xl },
    header: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.text },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    themeButton: { padding: spacing.sm, backgroundColor: colors.card, borderRadius: borderRadius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    themeIcon: { fontSize: 20 },
    profileButton: { padding: spacing.sm, backgroundColor: colors.card, borderRadius: borderRadius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    profileIcon: { fontSize: 20 },

    card: {
      backgroundColor: colors.card,
      margin: spacing.md,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 4,
      alignItems: 'center',
    },
    outstandingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, opacity: 0.8 },
    iconContainer: {
      width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent + '15',
      justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm
    },
    dollarSign: { color: colors.accent, fontWeight: '800', fontSize: fontSize.lg },
    cardTitle: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
    outstandingAmount: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: spacing.xs, letterSpacing: -1 },
    outstandingSubtext: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },

    section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    viewAllText: { fontSize: fontSize.sm, color: colors.accent, fontWeight: '600' },

    quickActions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm },
    actionButton: {
      flex: 1, backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.lg,
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    actionIconContainer: {
      width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md
    },
    actionIcon: { fontSize: 20, fontWeight: '600' },
    actionText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text },

    invoiceRow: {
      backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
    },
    clientName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
    invoiceDate: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
    amountContainer: { alignItems: 'flex-end' },
    invoiceAmount: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: 6 },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    statusPaid: { backgroundColor: colors.success + '20' },
    statusSent: { backgroundColor: colors.accent + '20' },
    statusDraft: { backgroundColor: colors.textSecondary + '20' },

    statusText: { fontSize: 10, fontWeight: '700' },
    textPaid: { color: colors.success },
    textSent: { color: colors.accent },
    textDraft: { color: colors.textSecondary },

    emptyState: { alignItems: 'center', padding: spacing.xl },
    emptyStateText: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.md },
  }), [colors, insets]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleThemeToggle} style={styles.themeButton}>
            <Icon name={isDarkMode ? 'sunny' : 'moon'} size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CompanyProfile')} style={styles.profileButton}>
            <Icon name="business" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={styles.outstandingHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.dollarSign}>$</Text>
              </View>
              <Text style={styles.cardTitle}>Outstanding</Text>
            </View>
          </View>
          <Text style={styles.outstandingAmount}>{formatCurrency(stats.outstanding, 'USD')}</Text>
          <Text style={styles.outstandingSubtext}>{stats.unpaidCount} unpaid invoices</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('InvoiceCreate', {})}>
              <View style={[styles.actionIconContainer, { backgroundColor: colors.accent + '20' }]}>
                <Icon name="add" size={24} color={colors.accent} />
              </View>
              <Text style={styles.actionText}>Create Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ClientManagement')}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#E1E1EF' }]}>
                <Icon name="people" size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Add Client</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('InvoiceHistory')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.viewAllText}>View all</Text>
              <Icon name="chevron-forward" size={16} color={colors.accent} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {invoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No invoices yet</Text>
              <Button title="Create Your First Invoice" onPress={() => navigation.navigate('InvoiceCreate', {})} />
            </View>
          ) : (
            invoices.map(invoice => (
              <TouchableOpacity key={invoice.id} style={styles.invoiceRow} onPress={() => navigation.navigate('InvoicePreview', { invoiceId: invoice.id })}>
                <View>
                  <Text style={styles.clientName}>{invoice.client.clientName}</Text>
                  <Text style={styles.invoiceDate}>{invoice.invoiceNumber} • {new Date(invoice.issueDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.invoiceAmount}>{formatCurrency(invoice.grandTotal, invoice.currency)}</Text>
                  <View style={[styles.statusBadge,
                  invoice.status === 'Paid' ? styles.statusPaid :
                    invoice.status === 'Sent' ? styles.statusSent : styles.statusDraft
                  ]}>
                    <Text style={[styles.statusText,
                    invoice.status === 'Paid' ? styles.textPaid :
                      invoice.status === 'Sent' ? styles.textSent : styles.textDraft
                    ]}>{invoice.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      {SHOW_ADS && (
        <View style={{
          alignItems: 'center',
          backgroundColor: colors.card,
          // borderTopWidth: 1,
          // borderTopColor: colors.border,
          // paddingTop: spacing.sm,
          // paddingBottom: Math.max(insets.bottom, spacing.sm),
          marginBottom: 40,
        }}>
          <BannerAd
            unitId={FINAL_BANNER_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Dashboard;