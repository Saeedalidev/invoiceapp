import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { companyProfileStorage } from '../../services/storage';
import { generateId } from '../../utils/invoiceUtils';
import { spacing, fontSize, borderRadius } from '../../theme/constants';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';
import type { RootScreenProps } from '../../navigation/types';
import type { CompanyProfile } from '../../types/schemas/invoice';

import { useTheme } from '@/theme';

const CompanyProfileScreen = ({ navigation }: RootScreenProps<'CompanyProfile'>) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { variant } = useTheme();
  const isDarkMode = variant === 'dark';
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<CompanyProfile>>({
    companyName: '', businessAddress: '', phoneNumber: '', email: '', website: '', logoUri: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const existingProfile = companyProfileStorage.get();
    if (existingProfile) setProfile(existingProfile);
  }, []);

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
    backLink: { fontSize: fontSize.md, color: colors.textSecondary },

    content: { padding: spacing.md },

    logoContainer: { alignItems: 'center', marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md },
    logo: { width: 100, height: 100, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
    logoPlaceholder: {
      width: 100, height: 100, borderRadius: borderRadius.sm, backgroundColor: colors.border + '15',
      justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed'
    },
    logoPlaceholderText: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
    logoHint: { fontSize: fontSize.xs, color: colors.textSecondary },

    saveButton: { marginTop: spacing.lg },
  }), [colors, insets]);

  const handleLogoUpload = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      setProfile({ ...profile, logoUri: result.assets[0].uri });
    }
  };

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
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
    if (!profile.companyName || profile.companyName.trim().length < 2) newErrors.companyName = 'Company name is required';
    if (!profile.businessAddress || profile.businessAddress.trim().length < 5) newErrors.businessAddress = 'Business address is required';
    if (!profile.phoneNumber || profile.phoneNumber.trim().length < 10) newErrors.phoneNumber = 'Valid phone number is required';
    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) newErrors.email = 'Valid email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfile = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const existingProfile = companyProfileStorage.get();
      const profileToSave: CompanyProfile = {
        id: existingProfile?.id || generateId(),
        companyName: profile.companyName!,
        businessAddress: profile.businessAddress!,
        phoneNumber: profile.phoneNumber!,
        email: profile.email!,
        website: profile.website,
        logoUri: profile.logoUri,
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      companyProfileStorage.set(profileToSave);
      Alert.alert('Success', 'Company profile saved successfully');
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
          <Icon name="chevron-back" size={24} color={colors.textSecondary} />
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Profile</Text>
        <View style={{ width: 40 }} />
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
            <TouchableOpacity style={styles.logoContainer} onPress={handleLogoUpload}>
              {profile.logoUri ? (
                <Image source={{ uri: profile.logoUri }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
                </View>
              )}
              <Text style={styles.logoHint}>Tap to change</Text>
            </TouchableOpacity>

            <Input
              label="Company Name *"
              value={profile.companyName}
              onChangeText={(text) => handleInputChange('companyName', text)}
              placeholder="Enter company name"
              error={errors.companyName}
            />
            <Input
              label="Business Address *"
              value={profile.businessAddress}
              onChangeText={(text) => handleInputChange('businessAddress', text)}
              placeholder="Enter business address"
              multiline
              numberOfLines={3}
              error={errors.businessAddress}
            />
            <Input
              label="Phone Number *"
              value={profile.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />
            <Input
              label="Email *"
              value={profile.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Website (Optional)"
              value={profile.website}
              onChangeText={(text) => handleInputChange('website', text)}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
            />

            <Button title="Save Profile" onPress={saveProfile} loading={loading} fullWidth style={styles.saveButton} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CompanyProfileScreen;