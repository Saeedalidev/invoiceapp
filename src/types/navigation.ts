import type { RootStackParamList as BaseRootStackParamList } from '@/navigation/types';

export type { RootScreenProps, RootStackParamList } from '@/navigation/types';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends BaseRootStackParamList { }
  }
}
