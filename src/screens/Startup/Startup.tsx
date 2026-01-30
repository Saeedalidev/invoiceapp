import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme/hooks/useThemeColors';
import admobService, { SHOW_ADS } from '../../services/admobService';
import type { RootScreenProps } from '../../navigation/types';

const Startup = ({ navigation }: RootScreenProps<'Startup'>) => {
  const colors = useThemeColors();

  useEffect(() => {
    // Initialize app and navigate to Dashboard
    const init = async () => {
      try {
        // Initialize AdMob
        if (SHOW_ADS) {
          await admobService.initialize();
          console.log('[Startup] AdMob initialized successfully');
        } else {
          console.log('[Startup] AdMob disabled via SHOW_ADS flag');
        }
      } catch (error) {
        console.error('[Startup] AdMob initialization failed:', error);
        // Continue anyway - ads are not critical for app functionality
      }

      setTimeout(() => {
        navigation.replace('Dashboard');
      }, 1000);
    };

    init();
  }, [navigation]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export default Startup;
