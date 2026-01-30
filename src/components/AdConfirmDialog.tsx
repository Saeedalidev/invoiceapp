import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { spacing, fontSize, borderRadius } from '../theme/constants';
import { useThemeColors } from '../theme/hooks/useThemeColors';

interface AdConfirmDialogProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    onExportAnyway?: () => void;
    title?: string;
    message?: string;
}

const AdConfirmDialog: React.FC<AdConfirmDialogProps> = ({
    visible,
    onConfirm,
    onCancel,
    isLoading = false,
    hasError = false,
    errorMessage = 'Unable to load ad. You can still export your PDF.',
    onExportAnyway,
    title = 'Export Invoice PDF',
    message = 'Watch a short ad to export your invoice as PDF. This helps us keep the app free!',
}) => {
    const colors = useThemeColors();
    const displayTitle = hasError ? 'Ad Unavailable' : title;
    const displayMessage = hasError ? errorMessage : message;

    const styles = useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
        },
        dialog: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        title: {
            fontSize: fontSize.lg,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        message: {
            fontSize: fontSize.md,
            color: colors.textSecondary,
            marginBottom: spacing.lg,
            textAlign: 'center',
            lineHeight: 22,
        },
        loadingContainer: {
            alignItems: 'center',
            paddingVertical: spacing.md,
        },
        loadingText: {
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: spacing.sm,
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: spacing.md,
        },
        button: {
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.md,
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cancelButtonText: {
            fontSize: fontSize.md,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        confirmButton: {
            backgroundColor: colors.primary,
        },
        confirmButtonText: {
            fontSize: fontSize.md,
            fontWeight: '600',
            color: '#FFFFFF',
        },
    }), [colors]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onCancel}
            >
                <View style={styles.dialog} onStartShouldSetResponder={() => true}>
                    <Text style={styles.title}>{displayTitle}</Text>
                    <Text style={styles.message}>{displayMessage}</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Loading ad...</Text>
                        </View>
                    ) : hasError ? (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton, { backgroundColor: colors.accent }]}
                                onPress={onExportAnyway}
                            >
                                <Text style={styles.confirmButtonText}>Export Anyway</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={onConfirm}
                            >
                                <Text style={styles.confirmButtonText}>Watch Ad</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default AdConfirmDialog;
