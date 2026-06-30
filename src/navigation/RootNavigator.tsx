import React, { createRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/auth';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import ChatWindowScreen from '../screens/ChatWindowScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import WalletScreen from '../screens/WalletScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import KycScreen from '../screens/KycScreen';
import type { RootStackParams } from './types';

export const navigationRef = createRef<NavigationContainerRef<RootStackParams>>();

const Stack = createNativeStackNavigator<RootStackParams>();

export default function RootNavigator() {
  const { user } = useAuthStore();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen
              name="PropertyDetail"
              component={PropertyDetailScreen}
              options={{ headerShown: true, title: 'Property Details', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="ChatWindow"
              component={ChatWindowScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params.title,
                headerBackTitle: '',
              })}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              options={{ headerShown: true, title: 'Edit Profile', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ headerShown: true, title: 'My Wallet', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: true, title: 'Notifications', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Kyc"
              component={KycScreen}
              options={{ headerShown: true, title: 'Identity Verification', headerBackTitle: '' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
