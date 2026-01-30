import type { RootStackParamList } from '@/navigation/types';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Paths } from '@/navigation/paths';
import { useTheme } from '@/theme';

import {
  Startup, Dashboard, InvoiceCreate, InvoicePreview, InvoiceHistory,
  CompanyProfile, ClientManagement, AddClient, ClientHistory, Settings
} from '@/screens';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { navigationTheme, variant } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator key={variant} screenOptions={{ headerShown: false }}>
          <Stack.Screen component={Startup} name={Paths.Startup} />
          <Stack.Screen component={Dashboard} name={Paths.Dashboard} />
          <Stack.Screen component={InvoiceCreate} name={Paths.InvoiceCreate} />
          <Stack.Screen component={InvoicePreview} name={Paths.InvoicePreview} />
          <Stack.Screen component={InvoiceHistory} name={Paths.InvoiceHistory} />
          <Stack.Screen component={CompanyProfile} name={Paths.CompanyProfile} />
          <Stack.Screen component={ClientManagement} name={Paths.ClientManagement} />
          <Stack.Screen component={AddClient} name={Paths.AddClient} />
          <Stack.Screen component={ClientHistory} name={Paths.ClientHistory} />
          <Stack.Screen component={Settings} name={Paths.Settings} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;
