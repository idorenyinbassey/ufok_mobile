import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth';
import BrowseScreen from '../screens/BrowseScreen';
import MatchesScreen from '../screens/MatchesScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { AppTabsParams } from './types';

const Tab = createBottomTabNavigator<AppTabsParams>();

const GREEN = '#16a34a';
const GRAY = '#9ca3af';

export default function AppTabs() {
  const { user } = useAuthStore();
  const isTenant = user?.role === 'tenant';
  const isListingRole = user?.role === 'landlord' || user?.role === 'agent';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: GRAY,
        tabBarStyle: { borderTopColor: '#e5e7eb', paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#fff', shadowColor: 'transparent', elevation: 0 },
        headerTitleStyle: { fontWeight: '700', color: '#111827' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Browse: focused ? 'search' : 'search-outline',
            Matches: focused ? 'heart' : 'heart-outline',
            Properties: focused ? 'home' : 'home-outline',
            Chat: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Dashboard: focused ? 'bar-chart' : 'bar-chart-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={(icons[route.name] ?? 'ellipse') as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse' }} />
      {isTenant && (
        <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Matches' }} />
      )}
      {isListingRole && (
        <Tab.Screen name="Properties" component={PropertiesScreen} options={{ title: 'Listings' }} />
      )}
      <Tab.Screen name="Chat" component={ConversationListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
