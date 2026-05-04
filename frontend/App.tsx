import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StackNavigator from './app/navigation/StackNavigator';
import { useAppDispatch, useAppSelector } from './app/store/hooks';
import { store } from './app/store/index';
import { clearAuth, setToken, setUser } from './app/store/slices/authSlice';
import { initSocket, disconnectSocket } from './app/utils/socket';
import { API } from './app/store/api';

// Avoids Android native-screen bridge crashes from version drift while setup stabilizes.
enableScreens(false);

const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const navigationRef = useNavigationContainerRef();
  const currentRouteNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet(['token', 'user']);

        if (storedToken) {
          let parsedUser = null;

          if (storedUser) {
            try {
              parsedUser = JSON.parse(storedUser);
            } catch {
              parsedUser = null;
            }
          }

          dispatch(setToken(storedToken));
          dispatch(setUser(parsedUser));
        } else {
          dispatch(clearAuth());
        }
      } catch {
        dispatch(clearAuth());
      } finally {
        if (isMounted) {
          setIsHydratingAuth(false);
        }
      }
    };

    hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Initialize socket when token becomes available and subscribe to invitation events
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      if (!token) return;

      const s = await initSocket(token);
      if (!s || !mounted) return;

      s.on('invitation:received', () => {
        store.dispatch(API.util.invalidateTags(['Notifications']));
      });

      s.on('invitation:accepted', () => {
        store.dispatch(API.util.invalidateTags(['Workspaces', 'Notifications']));
      });

      s.on('invitation:declined', () => {
        store.dispatch(API.util.invalidateTags(['Notifications']));
      });
    };

    setupSocket();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [token]);

  if (isHydratingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  const initialRouteName = token ? 'MainTabs' : 'Login';

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const initialRoute = navigationRef.getCurrentRoute()?.name;
        currentRouteNameRef.current = initialRoute;
        if (initialRoute) {
          console.log(initialRoute);
        }
      }}
      onStateChange={() => {
        const nextRoute = navigationRef.getCurrentRoute()?.name;
        if (nextRoute && currentRouteNameRef.current !== nextRoute) {
          currentRouteNameRef.current = nextRoute;
          console.log(nextRoute);
        }
      }}
    >
      <StackNavigator
        initialRouteName={initialRouteName}
        navigatorKey={token ? 'authenticated' : 'unauthenticated'}
      />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppNavigator />
        <StatusBar style="auto" />
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
});
