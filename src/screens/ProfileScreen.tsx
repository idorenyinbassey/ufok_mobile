import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

function MenuItem({ icon, label, onPress, danger, badge }: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-5 py-4 bg-white border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
        <Ionicons name={icon} size={16} color={danger ? '#dc2626' : '#6b7280'} />
      </View>
      <Text className={`flex-1 text-sm font-medium ${danger ? 'text-red-600' : 'text-gray-800'}`}>
        {label}
      </Text>
      {badge && (
        <View className="bg-primary-600 rounded-full px-2 py-0.5 mr-2">
          <Text className="text-white text-xs font-semibold">{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert('Sign Out All Devices', 'This will sign you out everywhere. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out All',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/auth/logout-all');
          } catch {}
          await logout();
        },
      },
    ]);
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile header */}
      <View className="bg-white px-5 pt-8 pb-6 items-center border-b border-gray-100">
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            className="w-20 h-20 rounded-full"
          />
        ) : (
          <View className="w-20 h-20 bg-primary-600 rounded-full items-center justify-center">
            <Text className="text-white font-bold text-3xl">{initial}</Text>
          </View>
        )}
        <Text className="text-gray-900 font-bold text-xl mt-3">{user?.name}</Text>
        <Text className="text-gray-500 text-sm mt-0.5">{user?.email}</Text>

        {/* Badges row */}
        <View className="flex-row gap-2 mt-3">
          <View className="bg-gray-100 rounded-full px-3 py-1.5">
            <Text className="text-gray-600 text-xs font-medium capitalize">{user?.role}</Text>
          </View>
          {user?.is_kyc_verified && (
            <View className="bg-green-50 border border-green-100 rounded-full px-3 py-1.5 flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
              <Text className="text-green-700 text-xs font-medium">KYC Verified</Text>
            </View>
          )}
          {user?.is_professionally_verified && (
            <View className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 flex-row items-center gap-1">
              <Ionicons name="ribbon" size={12} color="#2563eb" />
              <Text className="text-blue-700 text-xs font-medium">Verified Agent</Text>
            </View>
          )}
        </View>

        {user?.renter_score !== undefined && (
          <View className="mt-4 bg-primary-50 rounded-2xl px-6 py-3 items-center">
            <Text className="text-primary-700 font-bold text-2xl">{user.renter_score}</Text>
            <Text className="text-primary-600 text-xs font-medium">Renter Score</Text>
          </View>
        )}
      </View>

      {/* Account section */}
      <View className="mt-4">
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-2">Account</Text>
        <MenuItem icon="person-outline" label="Edit Profile" onPress={() => navigation.navigate('ProfileEdit')} />
        <MenuItem icon="wallet-outline" label="My Wallet" onPress={() => navigation.navigate('Wallet')} />
        <MenuItem icon="heart-outline" label="Saved Properties" onPress={() => navigation.navigate('Saved')} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="shield-checkmark-outline" label="Identity Verification (KYC)" onPress={() => navigation.navigate('Kyc')} />
        <MenuItem icon="calendar-outline" label="My Inspections" onPress={() => navigation.navigate('Inspections', {})} />
      </View>

      {/* Referrals & Rewards */}
      <View className="mt-4">
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-2">Rewards</Text>
        <MenuItem icon="people-outline" label="Referrals" onPress={() => navigation.navigate('Referrals')} />
        <MenuItem icon="trophy-outline" label="Leaderboard" onPress={() => navigation.navigate('Leaderboard')} />
        <MenuItem icon="star-outline" label="Subscription" onPress={() => navigation.navigate('Subscription')} />
      </View>

      {/* Settings */}
      <View className="mt-4">
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 py-2">Settings</Text>
        <MenuItem icon="settings-outline" label="Account Settings" onPress={() => navigation.navigate('AccountSettings')} />
        <MenuItem
          icon="lock-closed-outline"
          label="HTTPS Secured Connection"
          onPress={() => Alert.alert('Security', 'Your connection to Ufok is secured via HTTPS encryption.')}
        />
      </View>

      {/* Sign out */}
      <View className="mt-4 mb-10">
        <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        <MenuItem icon="log-out-outline" label="Sign Out All Devices" onPress={handleLogoutAll} danger />
      </View>
    </ScrollView>
  );
}
