import { useTheme } from '@/theme';
import { getColors } from '../constants';

export const useThemeColors = () => {
    const { variant } = useTheme();
    return getColors(variant);
};

export default useThemeColors;
