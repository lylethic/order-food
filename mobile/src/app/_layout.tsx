import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CustomDrawerContent } from '@/components/custom-drawer-content';
import '@/i18n'; // Initialize i18n

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AnimatedSplashOverlay />
        <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
          <Drawer.Screen
            name="index"
            options={{
              drawerLabel: t('menu'),
              title: t('menu'),
            }}
          />
          <Drawer.Screen
            name="orders"
            options={{
              drawerLabel: t('orders'),
              title: t('orders'),
            }}
          />
          {/* Hide explore screen from drawer if not needed */}
          <Drawer.Screen
            name="explore"
            options={{
              drawerItemStyle: { display: 'none' }
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
