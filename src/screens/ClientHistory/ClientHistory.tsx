import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clientStorage, invoiceStorage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import { useTheme } from '@/theme';
import type { RootScreenProps } from '../../navigation/types';
import type { Client, Invoice } from '../../types/schemas/invoice';

const ClientHistory = ({ route, navigation }: RootScreenProps<'ClientHistory'>) => {
    const { clientId } = route.params;
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { variant } = useTheme();
    const isDarkMode = variant === 'dark';
    const [client, setClient] = useState<Client | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            paddingTop: Math.max(insets.top, spacing.md),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backLink: { fontSize: fontSize.md, color: colors.textSecondary },
        headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },

        content: { flex: 1 },

        // Client Info Card
        clientCard: {
            backgroundColor: colors.card,
            margin: spacing.md,
            padding: spacing.lg,
            borderRadius: borderRadius.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        clientName: {
            fontSize: fontSize.xl,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        clientDetail: {
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: 4,
        },

        // Statistics Cards
        statsContainer: {
            flexDirection: 'row',
            paddingHorizontal: spacing.md,
            gap: spacing.md,
            marginBottom: spacing.md,
        },
        statCard: {
            flex: 1,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        statCardPrimary: { backgroundColor: colors.primary + '15' },
        statCardSecondary: { backgroundColor: colors.secondary + '15' },
        statCardSuccess: { backgroundColor: colors.success + '15' },
        statCardWarning: { backgroundColor: colors.accent + '15' },
        statLabel: {
            fontSize: fontSize.xs,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            fontWeight: '600',
            marginBottom: 4,
        },
        statValue: {
            fontSize: fontSize.lg,
            fontWeight: 'bold',
            color: colors.text,
        },

        // Invoices Section
        invoicesSection: {
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xl,
        },
        sectionTitle: {
            fontSize: fontSize.md,
            fontWeight: '700',
            color: colors.text,
            marginBottom: spacing.md,
        },
        invoicesList: {
            gap: spacing.sm,
        },
        invoiceCard: {
            backgroundColor: colors.card,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        invoiceHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.xs,
        },
        invoiceInfo: {
            flex: 1,
        },
        invoiceNumber: {
            fontSize: fontSize.md,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 2,
        },
        invoiceDate: {
            fontSize: fontSize.sm,
            color: colors.textSecondary,
        },
        invoiceRight: {
            alignItems: 'flex-end',
        },
        invoiceAmount: {
            fontSize: fontSize.md,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 4,
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
        },
        statusText: {
            fontSize: 11,
            fontWeight: '700',
        },
        invoiceItems: {
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: 4,
        },

        // Empty State
        emptyState: {
            alignItems: 'center',
            paddingVertical: spacing.xxl,
        },
        emptyStateText: {
            fontSize: fontSize.md,
            color: colors.textSecondary,
            marginBottom: spacing.md,
        },
        createButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
        },
        createButtonText: {
            color: 'white',
            fontSize: fontSize.md,
            fontWeight: '600',
        },
    }), [colors, insets]);


    // Reload data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadData();
        }, [clientId])
    );

    useEffect(() => {
        loadData();
    }, [clientId]);

    const loadData = () => {
        // Load client details
        const clientData = clientStorage.getById(clientId);
        if (!clientData) {
            navigation.goBack();
            return;
        }
        setClient(clientData);

        // Load all invoices for this client
        const clientInvoices = invoiceStorage.getByClient(clientId);
        // Sort by date, newest first
        const sorted = clientInvoices.sort((a, b) =>
            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
        );
        setInvoices(sorted);
    };

    const calculateStats = () => {
        const totalInvoices = invoices.length;
        const totalAmount = invoices.reduce((sum: number, inv: Invoice) => sum + inv.grandTotal, 0);
        const paidAmount = invoices
            .filter((inv: Invoice) => inv.status === 'Paid')
            .reduce((sum: number, inv: Invoice) => sum + inv.grandTotal, 0);
        const pendingAmount = totalAmount - paidAmount;

        return { totalInvoices, totalAmount, paidAmount, pendingAmount };
    };

    const getStatusColor = (status: Invoice['status']) => {
        switch (status) {
            case 'Paid': return colors.success;
            case 'Sent': return colors.accent;
            case 'Overdue': return colors.error;
            default: return colors.textSecondary;
        }
    };

    const getStatusBgColor = (status: Invoice['status']) => {
        switch (status) {
            case 'Paid': return colors.success + '20';
            case 'Sent': return colors.accent + '20';
            case 'Overdue': return colors.error + '20';
            default: return colors.textSecondary + '20';
        }
    };

    const handleInvoicePress = (invoiceId: string) => {
        navigation.navigate('InvoicePreview', { invoiceId });
    };

    const renderInvoiceItem = ({ item }: { item: Invoice }) => (
        <TouchableOpacity
            style={styles.invoiceCard}
            onPress={() => handleInvoicePress(item.id)}
        >
            <View style={styles.invoiceHeader}>
                <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                    <Text style={styles.invoiceDate}>
                        {new Date(item.issueDate).toLocaleDateString()}
                    </Text>
                </View>
                <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>
                        {formatCurrency(item.grandTotal, item.currency)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>
            {item.items.length > 0 && (
                <Text style={styles.invoiceItems} numberOfLines={1}>
                    {item.items.map(i => i.productServiceName).join(', ')}
                </Text>
            )}
        </TouchableOpacity>
    );

    if (!client) return null;

    const stats = calculateStats();
    const primaryCurrency = invoices[0]?.currency || 'USD';

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
                <Text style={styles.headerTitle}>Client History</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Client Info Card */}
                <View style={styles.clientCard}>
                    <Text style={styles.clientName}>{client.clientName}</Text>
                    <Text style={styles.clientDetail}>{client.email}</Text>
                    <Text style={styles.clientDetail}>{client.contactNumber}</Text>
                    {client.clientAddress && (
                        <Text style={styles.clientDetail}>{client.clientAddress}</Text>
                    )}
                </View>

                {/* Statistics Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <Text style={styles.statLabel}>Total Invoices</Text>
                        <Text style={styles.statValue}>{stats.totalInvoices}</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardSecondary]}>
                        <Text style={styles.statLabel}>Total Amount</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.totalAmount, primaryCurrency)}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, styles.statCardSuccess]}>
                        <Text style={styles.statLabel}>Paid</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.paidAmount, primaryCurrency)}
                        </Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardWarning]}>
                        <Text style={styles.statLabel}>Pending</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.pendingAmount, primaryCurrency)}
                        </Text>
                    </View>
                </View>

                {/* Invoices List */}
                <View style={styles.invoicesSection}>
                    <Text style={styles.sectionTitle}>Invoice History</Text>
                    {invoices.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No invoices found for this client</Text>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={() => navigation.navigate('InvoiceCreate')}
                            >
                                <Text style={styles.createButtonText}>Create First Invoice</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={invoices}
                            renderItem={renderInvoiceItem}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.invoicesList}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ClientHistory;
