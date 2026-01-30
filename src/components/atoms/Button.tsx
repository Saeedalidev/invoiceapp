import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { spacing, fontSize } from '../../theme';
import { useThemeColors } from '../../theme/hooks/useThemeColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
    },
    buttonSm: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    buttonLg: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    danger: {
      backgroundColor: colors.error,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    disabled: {
      opacity: 0.6,
    },
    fullWidth: {
      width: '100%',
    },
    text: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textInverse,
    },
    textSm: {
      fontSize: fontSize.sm,
    },
    textLg: {
      fontSize: fontSize.lg,
    },
    textPrimary: {
      color: colors.primary,
    },
    textOutline: {
      color: colors.primary,
    },
  }), [colors]);

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.button];

    if (size === 'sm') baseStyles.push(styles.buttonSm);
    if (size === 'lg') baseStyles.push(styles.buttonLg);

    if (variant === 'primary') baseStyles.push(styles.primary);
    if (variant === 'secondary') baseStyles.push(styles.secondary);
    if (variant === 'danger') baseStyles.push(styles.danger);
    if (variant === 'outline') baseStyles.push(styles.outline);
    if (variant === 'ghost') baseStyles.push(styles.ghost);

    if (disabled || loading) baseStyles.push(styles.disabled);
    if (fullWidth) baseStyles.push(styles.fullWidth);
    if (style) baseStyles.push(style);

    return baseStyles;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.text];

    if (size === 'sm') baseStyles.push(styles.textSm);
    if (size === 'lg') baseStyles.push(styles.textLg);

    if (variant === 'outline' || variant === 'ghost') {
      baseStyles.push(styles.textPrimary);
    }

    if (textStyle) baseStyles.push(textStyle);

    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
