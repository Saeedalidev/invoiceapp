import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize } from '../../theme';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import type { RootScreenProps } from '../../navigation/types';

const Settings = ({ navigation }: RootScreenProps<'Settings'>) => {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    text: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
    subtitle: { fontSize: fontSize.md, color: colors.textSecondary },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Screen</Text>
      <Text style={styles.subtitle}>To be implemented</Text>
    </View>
  );
};

export default Settings;