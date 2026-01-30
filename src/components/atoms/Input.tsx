import React, { useMemo } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { spacing, fontSize } from '../../theme';
import { useThemeColors } from '../../theme/hooks/useThemeColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...rest
}) => {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
    },
    inputError: {
      borderColor: colors.error,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    inputWithLeftIcon: {
      paddingLeft: spacing.xs,
    },
    inputWithRightIcon: {
      paddingRight: spacing.xs,
    },
    leftIcon: {
      paddingLeft: spacing.md,
    },
    rightIcon: {
      paddingRight: spacing.md,
    },
    errorText: {
      fontSize: fontSize.xs,
      color: colors.error,
      marginTop: spacing.xs,
    },
  }), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputError]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...rest}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default Input;
