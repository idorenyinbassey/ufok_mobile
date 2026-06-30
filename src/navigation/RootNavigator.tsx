import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import InspectionScreen from '../screens/InspectionScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SavedScreen from '../screens/SavedScreen';
import ReferralScreen from '../screens/ReferralScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import CreatePropertyScreen from '../screens/CreatePropertyScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';
import { navigationRef } from './navigationRef';
import type { RootStackParams } from './types';

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
            <Stack.Screen
              name="Inspections"
              component={InspectionScreen}
              options={{ headerShown: true, title: 'Inspections', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ headerShown: true, title: 'Subscription', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Saved"
              component={SavedScreen}
              options={{ headerShown: true, title: 'Saved Properties', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Referrals"
              component={ReferralScreen}
              options={{ headerShown: true, title: 'Referrals', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="Leaderboard"
              component={LeaderboardScreen}
              options={{ headerShown: true, title: 'Leaderboard', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="AccountSettings"
              component={AccountSettingsScreen}
              options={{ headerShown: true, title: 'Account Settings', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="CreateProperty"
              component={CreatePropertyScreen}
              options={{ headerShown: true, title: 'New Listing', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="EditProperty"
              component={EditPropertyScreen}
              options={{ headerShown: true, title: 'Edit Listing', headerBackTitle: '' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
