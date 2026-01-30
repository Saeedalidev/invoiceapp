import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';

import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { invoiceStorage } from '../../services/storage';
import { generateInvoiceHTML, InvoiceTemplate } from '../../services/pdfGenerator';
import { formatCurrency } from '../../services/currency';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import Button from '../../components/atoms/Button';
import AdConfirmDialog from '../../components/AdConfirmDialog';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { SHOW_ADS } from '../../services/admobService';
import type { RootScreenProps } from '../../navigation/types';
import type { Invoice } from '../../types/schemas/invoice';
// import { Variant } from '@/theme/_config';
import { useTheme } from '@/theme';

const InvoicePreview = ({ route, navigation }: RootScreenProps<'InvoicePreview'>) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { variant } = useTheme();
  const isDarkMode = variant === 'dark';

  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
  const [isAdDialogVisible, setAdDialogVisible] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>('classic');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: Math.max(insets.top, spacing.md), // Handle status bar height
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border
    },
    backButton: { padding: spacing.xs },
    backText: { fontSize: fontSize.md, color: colors.textSecondary },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    deleteText: { fontSize: fontSize.md, color: colors.error, marginRight: spacing.md },
    editButton: {},
    editText: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },

    content: { padding: spacing.md },
    previewCard: {
      backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
    },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusPaid: { backgroundColor: colors.success + '20' },
    statusSent: { backgroundColor: colors.accent + '20' },
    statusDraft: { backgroundColor: colors.textSecondary + '20' },
    statusText: { fontSize: 12, fontWeight: '700' },
    textPaid: { color: colors.success },
    textSent: { color: colors.accent },
    textDraft: { color: colors.textSecondary },
    date: { fontSize: fontSize.sm, color: colors.textSecondary },

    amount: { fontSize: 32, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 4 },
    invoiceNumber: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },

    divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.lg },

    section: { marginBottom: spacing.lg },
    label: { fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' },
    value: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
    subValue: { fontSize: fontSize.sm, color: colors.textSecondary },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    itemText: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
    itemDescription: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    itemSubText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
    itemTotal: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },

    totalSection: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    totalLabel: { fontSize: fontSize.md, color: colors.textSecondary },
    totalValue: { fontSize: fontSize.md, color: colors.text },
    bold: { fontWeight: '700', color: colors.text, fontSize: fontSize.lg },

    updateStatusButton: {
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    updateStatusText: {
      fontSize: fontSize.md,
      color: colors.accent,
      fontWeight: '600'
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 300,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      marginBottom: spacing.md,
      textAlign: 'center',
      color: colors.text
    },
    statusOption: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statusOptionText: {
      fontSize: fontSize.md,
      color: colors.text
    },
    selectedStatusText: {
      color: colors.accent,
      fontWeight: 'bold'
    },
    checkmark: {
      color: colors.accent,
      fontSize: fontSize.lg
    },
    cancelButton: {
      marginTop: spacing.md,
      padding: spacing.md,
      alignItems: 'center'
    },
    cancelButtonText: {
      color: colors.error,
      fontSize: fontSize.md,
      fontWeight: '600'
    },

    footer: { padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },

    // Bottom Sheet Styles
    bottomSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      width: '100%',
      position: 'absolute',
      bottom: 0,
    },
    bottomSheetHeader: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    bottomSheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginBottom: spacing.md,
    },
    bottomSheetTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.text,
    },
    templateGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
    },
    templateOption: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: spacing.xs,
    },
    templatePreview: {
      width: '100%',
      aspectRatio: 1 / 1.4,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      padding: spacing.xs,
      marginBottom: spacing.sm,
      justifyContent: 'space-between',
    },
    templateHeaderLine: {
      height: 8,
      borderRadius: 2,
      width: '100%',
    },
    templateBodyLines: {
      gap: 4,
    },
    templateLine: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      width: '100%',
    },
    templateName: {
      fontSize: fontSize.sm,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    templateDesc: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    closeBottomSheet: {
      padding: spacing.md,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    closeBottomSheetText: {
      color: colors.textSecondary,
      fontSize: fontSize.md,
      fontWeight: '600',
    },
  }), [colors, insets]);

  const rewardEarnedRef = React.useRef(false);

  // Rewarded ad hook
  const {
    isAdLoaded,
    isAdLoading,
    showAd,
    loadAd,
  } = useRewardedAd({
    onRewarded: () => {
      // User watched the ad, set flag to export after ad closes
      console.log('[InvoicePreview] User earned reward, flagging for export after close');
      rewardEarnedRef.current = true;
      setAdError(null);
    },
    onAdClosed: () => {
      console.log('[InvoicePreview] Ad closed');
      setAdDialogVisible(false);
      setAdError(null);

      // If reward was earned, perform export after a small delay
      // This ensures the ad modal is completely dismissed before launching Share sheet
      if (rewardEarnedRef.current) {
        rewardEarnedRef.current = false;
        setTimeout(() => {
          performPDFExport(selectedTemplate);
        }, 300);
      }
    },
    onError: (error) => {
      console.warn('[InvoicePreview] Ad error:', error);
      setAdError('Unable to load ad. You can still export your PDF.');
      rewardEarnedRef.current = false;
      // Keep dialog visible to show the error state
    },
  });

  // useFocusEffect ensures the invoice is reloaded when we return from Edit screen
  useFocusEffect(
    React.useCallback(() => {
      loadInvoice();
    }, [invoiceId])
  );

  // Initial load
  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = () => {
    const data = invoiceStorage.getById(invoiceId);
    if (!data) {
      Alert.alert('Error', 'Invoice not found');
      navigation.goBack();
      return;
    }
    setInvoice(data);
  };

  const handleUpdateStatus = (newStatus: Invoice['status']) => {
    if (!invoice) return;

    const success = invoiceStorage.update(invoice.id, { status: newStatus });
    if (success) {
      setInvoice({ ...invoice, status: newStatus });
      setStatusModalVisible(false);
    } else {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleEdit = () => {
    if (!invoice) return;
    navigation.navigate('InvoiceCreate', { invoiceId: invoice.id });
  };

  const performPDFExport = async (template: InvoiceTemplate) => {
    if (!invoice) return;
    setGenerating(true);
    console.log('[InvoicePreview] Starting PDF Export process...');

    try {
      const html = generateInvoiceHTML(invoice, template);
      console.log('[InvoicePreview] HTML generated, length:', html.length);

      // Use invoice number for filename (sanitize strictly invalid chars only)
      const safeFileName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '_');

      const options = {
        html,
        fileName: safeFileName,
        base64: true,
      };

      console.log('[InvoicePreview] Calling generatePDF with name:', safeFileName);
      let file;
      try {
        file = await generatePDF(options);
      } catch (genError: any) {
        console.error('[InvoicePreview] generatePDF exception:', genError);
        throw new Error(`[Generation ERROR] ${genError.message}`);
      }

      if (!file) {
        throw new Error('PDF file object is null/undefined after generation.');
      }

      console.log('[InvoicePreview] generatePDF returned. Path:', file.filePath ? 'Exists' : 'MISSING');

      // DEBUG: CHECK FILE PATH (kept for verification if needed, but user should see proper name now)
      /*
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Debug Filename',
          `Generated Path:\n${file.filePath}\n\nFileName Option:\n${safeFileName}`,
          [{ text: 'OK', onPress: () => resolve() }]
        );
      });
      */

      const isAndroid = Platform.OS === 'android';
      let shareUrl = '';

      if (isAndroid) {
        // On Android, we MUST use base64 and let react-native-share write the file 
        // to ensure the filename corresponds exactly to what we pass in options.
        if (file.base64) {
          shareUrl = `data:application/pdf;base64,${file.base64}`;
        } else if (file.filePath) {
          // Fallback if base64 missing for some reason
          const cleanPath = file.filePath.replace(/^file:\/\//, '');
          shareUrl = `file://${cleanPath}`;
        }
      } else {
        const cleanPath = file.filePath?.replace(/^file:\/\//, '') || '';
        shareUrl = `file://${cleanPath}`;
      }

      console.log('[InvoicePreview] Constructed URL:', shareUrl.substring(0, 40));

      if (!shareUrl || shareUrl.length < 10) {
        throw new Error(`Constructed Share URL is invalid or empty.`);
      }

      try {
        await Share.open({
          url: shareUrl,
          type: 'application/pdf',
          filename: safeFileName, // This is INV-XXXX
          title: `Invoice ${invoice.invoiceNumber}`,
          subject: `Invoice ${invoice.invoiceNumber} from ${invoice.companyProfile.companyName}`,
          failOnCancel: false,
        });
      } catch (shareErr: any) {
        console.error('[InvoicePreview] Share.open exception:', shareErr);
        if (shareErr.message !== 'User did not share') {
          throw new Error(`[Sharing ERROR] ${shareErr.message}`);
        }
      }
    } catch (error: any) {
      console.error('[InvoicePreview] Final catch:', error);
      Alert.alert('Export Failed', error.message);
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Handle share PDF - show ad confirmation dialog first
   */
  const handleSharePDF = (template: InvoiceTemplate = 'classic') => {
    if (!invoice) return;
    setTemplateModalVisible(false);
    setSelectedTemplate(template);
    setAdError(null);
    rewardEarnedRef.current = false;

    // Show ad confirmation dialog if ads are enabled
    if (SHOW_ADS) {
      setAdDialogVisible(true);
    } else {
      // Ads disabled, proceed directly to export
      performPDFExport(template);
    }
  };

  /**
   * Handle ad confirmation - show the rewarded ad
   */
  const handleAdConfirm = () => {
    if (isAdLoaded) {
      showAd();
    } else {
      // Ad not loaded, try to load it
      // The dialog will automatically show the loading spinner because isAdLoading will become true
      loadAd();
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete }
    ]);
  };

  const handleDelete = () => {
    if (invoice) {
      invoiceStorage.delete(invoice.id);
      navigation.goBack();
    }
  };

  if (!invoice) return null;

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
        <Text style={styles.headerTitle}>Invoice Preview</Text>
        <TouchableOpacity onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewCard}>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusBadge,
              invoice.status === 'Paid' ? styles.statusPaid :
                invoice.status === 'Sent' ? styles.statusSent : styles.statusDraft
            ]}>
              <Text style={[
                styles.statusText,
                invoice.status === 'Paid' ? styles.textPaid :
                  invoice.status === 'Sent' ? styles.textSent : styles.textDraft
              ]}>{invoice.status}</Text>
            </View>
            <Text style={styles.date}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
          </View>

          <Text style={styles.amount}>{formatCurrency(invoice.grandTotal, invoice.currency)}</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{invoice.client.clientName}</Text>
            <Text style={styles.subValue}>{invoice.client.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Items</Text>
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{item.productServiceName}</Text>
                  {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                  <Text style={styles.itemSubText}>{item.quantity} x {formatCurrency(item.unitPrice, invoice.currency)}</Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total, invoice.currency)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
            </View>
            {invoice.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: colors.success }]}>
                  -{formatCurrency(invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount / 100) : invoice.discount, invoice.currency)}
                </Text>
              </View>
            )}
            {invoice.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.taxType === 'percentage' ? ((invoice.subtotal - (invoice.discountType === 'percentage' ? (invoice.subtotal * invoice.discount / 100) : invoice.discount)) * invoice.tax / 100) : invoice.tax, invoice.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.bold]}>Total</Text>
              <Text style={[styles.totalValue, styles.bold]}>{formatCurrency(invoice.grandTotal, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.updateStatusButton} onPress={() => setStatusModalVisible(true)}>
          <Text style={styles.updateStatusText}>Update Status</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isTemplateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTemplateModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Choose Template</Text>
            </View>

            <View style={styles.templateGrid}>
              {[
                { id: 'classic' as const, name: 'Classic Blue', color: '#4F46E5', desc: 'Professional & Refined' },
                { id: 'modern' as const, name: 'Modern Teal', color: '#059669', desc: 'Bold & Contemporary' },
                { id: 'minimalist' as const, name: 'Minimalist', color: '#000000', desc: 'Clean & Simple' },
              ].map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  style={styles.templateOption}
                  onPress={() => handleSharePDF(tpl.id)}
                >
                  <View style={[styles.templatePreview, { backgroundColor: tpl.color + '10', borderColor: tpl.color }]}>
                    <View style={[styles.templateHeaderLine, { backgroundColor: tpl.color }]} />
                    <View style={styles.templateBodyLines}>
                      <View style={styles.templateLine} />
                      <View style={styles.templateLine} />
                      <View style={[styles.templateLine, { width: '60%' }]} />
                    </View>
                  </View>
                  <Text style={styles.templateName}>{tpl.name}</Text>
                  <Text style={styles.templateDesc}>{tpl.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeBottomSheet}
              onPress={() => setTemplateModalVisible(false)}
            >
              <Text style={styles.closeBottomSheetText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Ad Confirmation Dialog */}
      <AdConfirmDialog
        visible={isAdDialogVisible}
        onConfirm={handleAdConfirm}
        onCancel={() => setAdDialogVisible(false)}
        isLoading={isAdLoading}
        hasError={!!adError}
        errorMessage={adError || undefined}
        onExportAnyway={() => {
          setAdDialogVisible(false);
          // Small delay to allow the AdConfirmDialog to dismiss before launching Share sheet
          setTimeout(() => {
            performPDFExport(selectedTemplate);
          }, 300);
        }}
      />

      <Modal
        visible={isStatusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {['Draft', 'Sent', 'Paid', 'Unpaid'].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.statusOption}
                onPress={() => handleUpdateStatus(status as Invoice['status'])}
              >
                <Text style={[
                  styles.statusOptionText,
                  status === invoice.status && styles.selectedStatusText
                ]}>
                  {status}
                </Text>
                {status === invoice.status && <Icon name="checkmark-sharp" size={24} color={colors.accent} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.footer}>
        <Button
          title={generating ? "Generating..." : "Share Invoice PDF"}
          onPress={() => setTemplateModalVisible(true)}
          loading={generating}
          fullWidth
        />
      </View>
    </SafeAreaView >
  );
};

export default InvoicePreview;
