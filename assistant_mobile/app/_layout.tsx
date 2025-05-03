import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { useRouter, useSegments } from 'expo-router';
import Auth from '../src/utils/auth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    const checkAuth = async () => {
      try {
        const loggedIn = await Auth.loggedIn();
        if (!loggedIn && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (loggedIn && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsAuthChecked(true);
      }
    };

    if (loaded) {
      checkAuth();
    }
  }, [segments, loaded]);

  if (!loaded || !isAuthChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
