const lightColors = {
  primary: '#005a8d', // Professional Blue
  secondary: '#2C3E50', // Dark Slate
  accent: '#00A8E8', // Bright Blue for actions
  background: '#F4F6F8', // Light Gray background
  card: '#FFFFFF',
  text: '#1C252C',
  textSecondary: '#637381',
  border: '#DFE3E8',
  success: '#36B37E', // Paid
  warning: '#FFAB00', // Pending
  error: '#FF5630', // Overdue
  textInverse: '#FFFFFF',
  gray100: '#F9FAFB',
} as const;

const darkColors = {
  primary: '#4A9EFF', // Lighter blue for dark mode
  secondary: '#E8EAED', // Light gray for dark mode
  accent: '#00A8E8', // Keep accent consistent
  background: '#121212', // Dark background
  card: '#1E1E1E', // Dark card background
  text: '#FFFFFF', // White text
  textSecondary: '#B0B0B0', // Gray text
  border: '#2C2C2C', // Dark border
  success: '#4CAF50', // Slightly brighter green
  warning: '#FFC107', // Slightly brighter yellow
  error: '#FF6B6B', // Slightly brighter red
  textInverse: '#1C252C', // Dark text for light backgrounds
  gray100: '#2A2A2A', // Dark gray
} as const;

export const getColors = (variant?: 'default' | 'dark') => {
  return variant === 'dark' ? darkColors : lightColors;
};

export const colors = lightColors; // Default export for backward compatibility

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
} as const;

