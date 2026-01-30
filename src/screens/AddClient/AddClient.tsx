import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientStorage } from '../../services/storage';
import { generateId } from '../../utils/invoiceUtils';
import { spacing, fontSize } from '../../theme/constants';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import type { RootScreenProps } from '../../navigation/types';
import type { Client } from '../../types/schemas/invoice';
import { useTheme } from '@/theme';

const AddClient = ({ navigation }: RootScreenProps<'AddClient'>) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { variant } = useTheme();
  const isDarkMode = variant === 'dark';

  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Partial<Client>>({
    clientName: '', clientAddress: '', contactNumber: '', email: '',
  });
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
    headerTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
    backLink: { fontSize: fontSize.md, color: colors.error },
    saveLink: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },

    content: { padding: spacing.md, marginTop: spacing.md },
    saveButton: { marginTop: spacing.lg },
  }), [colors, insets]);

  const handleInputChange = (field: keyof Client, value: string) => {
    setClient(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!client.clientName || client.clientName.trim().length < 2) newErrors.clientName = 'Client name is required';
    if (!client.clientAddress || client.clientAddress.trim().length < 5) newErrors.clientAddress = 'Address is required';
    if (!client.contactNumber || client.contactNumber.trim().length < 10) newErrors.contactNumber = 'Valid phone number is required';
    if (!client.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) newErrors.email = 'Valid email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveClient = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const newClient: Client = {
        id: generateId(),
        clientName: client.clientName!,
        clientAddress: client.clientAddress!,
        contactNumber: client.contactNumber!,
        email: client.email!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      clientStorage.add(newClient);
      Alert.alert('Success', 'Client added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
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
          <Icon name="close" size={24} color={colors.error} />
          <Text style={styles.backLink}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Client</Text>
        <TouchableOpacity onPress={saveClient}>
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

          <View style={styles.content}>
            <Input
              label="Client Name *"
              value={client.clientName}
              onChangeText={(text) => handleInputChange('clientName', text)}
              placeholder="Enter client name"
              error={errors.clientName}
            />
            <Input
              label="Address *"
              value={client.clientAddress}
              onChangeText={(text) => handleInputChange('clientAddress', text)}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
              error={errors.clientAddress}
            />
            <Input
              label="Phone Number *"
              value={client.contactNumber}
              onChangeText={(text) => handleInputChange('contactNumber', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              error={errors.contactNumber}
            />
            <Input
              label="Email *"
              value={client.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Button title="Save Client" onPress={saveClient} loading={loading} fullWidth style={styles.saveButton} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddClient;