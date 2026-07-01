import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';

interface DashboardData {
  wallet_balance?: number;
  properties_count?: number;
  active_conversations?: number;
  renter_score?: number;
  unread_notifications?: number;
  recent_activity?: { label: string; time: string }[];
}

interface TenantQuota {
  daily_used: number;
  daily_limit: number;
  pack_type: string | null;
  has_unlimited: boolean;
}

const TENANT_ACTIONS = [
  { icon: 'wallet-outline' as const, label: 'Wallet', screen: 'Wallet', params: undefined },
  { icon: 'bookmark-outline' as const, label: 'My Reservations', screen: 'Reservations', params: undefined },
  { icon: 'star-outline' as const, label: 'Subscription', screen: 'Subscription', params: undefined },
  { icon: 'people-outline' as const, label: 'Referrals', screen: 'Referrals', params: undefined },
  { icon: 'trophy-outline' as const, label: 'Leaderboard', screen: 'Leaderboard', params: undefined },
  { icon: 'notifications-outline' as const, label: 'Notifications', screen: 'Notifications', params: undefined },
  { icon: 'shield-checkmark-outline' as const, label: 'KYC', screen: 'Kyc', params: undefined },
  { icon: 'help-buoy-outline' as const, label: 'Help & Support', screen: 'Support', params: undefined },
];

const LISTING_ACTIONS = [
  { icon: 'wallet-outline' as const, label: 'Wallet', screen: 'Wallet', params: undefined },
  { icon: 'star-outline' as const, label: 'Subscription', screen: 'Subscription', params: undefined },
  { icon: 'people-outline' as const, label: 'Referrals', screen: 'Referrals', params: undefined },
  { icon: 'trophy-outline' as const, label: 'Leaderboard', screen: 'Leaderboard', params: undefined },
  { icon: 'notifications-outline' as const, label: 'Notifications', screen: 'Notifications', params: undefined },
  { icon: 'shield-checkmark-outline' as const, label: 'KYC', screen: 'Kyc', params: undefined },
  { icon: 'help-buoy-outline' as const, label: 'Help & Support', screen: 'Support', params: undefined },
];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [quota, setQuota] = useState<TenantQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isTenant = user?.role === 'tenant';

  const fetchDashboard = async () => {
    const { data: res } = await api.get('/dashboard');
    setData(res.data ?? {});
    if (isTenant) {
      try {
        const { data: sub } = await api.get('/subscriptions');
        if (sub.data?.quota) setQuota(sub.data.quota);
      } catch {
        // Non-critical — quota card just won't show
      }
    }
  };

  useEffect(() => {
    fetchDashboard().catch(() => setData({})).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard().catch(() => {});
    setRefreshing(false);
  };

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isListing = user?.role === 'landlord' || user?.role === 'agent';
  const quickActions = isTenant ? TENANT_ACTIONS : LISTING_ACTIONS;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
    >
      {/* Header */}
      <View className="bg-primary-600 pt-6 pb-8 px-5">
        <Text className="text-primary-100 text-sm">{greetingTime()},</Text>
        <Text className="text-white text-xl font-bold mt-0.5">{user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        <View className="flex-row items-center mt-1 gap-1.5">
          <View className="bg-white/20 rounded-full px-2.5 py-1">
            <Text className="text-white text-xs font-medium capitalize">{user?.role}</Text>
          </View>
          {user?.is_kyc_verified && (
            <View className="bg-white/20 rounded-full px-2.5 py-1 flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={11} color="#fff" />
              <Text className="text-white text-xs font-medium">KYC Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Wallet card */}
      <View className="mx-4 -mt-5">
        <TouchableOpacity
          className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
          onPress={() => navigation.navigate('Wallet')}
          activeOpacity={0.85}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 text-xs font-medium">Wallet Balance</Text>
              <Text className="text-gray-900 font-bold text-2xl mt-1">
                ₦{(data?.wallet_balance ?? 0).toLocaleString()}
              </Text>
            </View>
            <View className="w-12 h-12 bg-primary-50 rounded-2xl items-center justify-center">
              <Ionicons name="wallet-outline" size={22} color="#16a34a" />
            </View>
          </View>
          <View className="flex-row items-center mt-3 gap-1">
            <Text className="text-primary-600 text-sm font-semibold">Manage wallet</Text>
            <Ionicons name="chevron-forward" size={14} color="#16a34a" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Subscription / match quota card (tenant) */}
      {isTenant && quota && (
        <View className="mx-4 mt-4">
          <TouchableOpacity
            className="bg-white rounded-2xl p-5 border border-gray-100"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs font-medium">Match Quota</Text>
                <Text className="text-gray-900 font-bold text-lg mt-1">
                  {quota.has_unlimited
                    ? 'Unlimited'
                    : `${quota.daily_used} / ${quota.daily_limit} used today`}
                </Text>
                {quota.pack_type && !quota.has_unlimited && (
                  <Text className="text-primary-600 text-xs font-medium mt-0.5 capitalize">
                    {quota.pack_type.replace('_', ' ')} pack active
                  </Text>
                )}
              </View>
              <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center">
                <Ionicons name="star-outline" size={22} color="#d97706" />
              </View>
            </View>
            {!quota.has_unlimited && (
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                <View
                  className="h-2 rounded-full bg-primary-600"
                  style={{ width: `${quota.daily_limit > 0 ? Math.min((quota.daily_used / quota.daily_limit) * 100, 100) : 0}%` }}
                />
              </View>
            )}
            <View className="flex-row items-center mt-3 gap-1">
              <Text className="text-primary-600 text-sm font-semibold">View plans</Text>
              <Ionicons name="chevron-forward" size={14} color="#16a34a" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats grid */}
      <View className="flex-row mx-4 mt-4 gap-3">
        {isTenant && data?.renter_score !== undefined && (
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-gray-500 text-xs font-medium mb-1">Renter Score</Text>
            <Text className="text-gray-900 font-bold text-2xl">{data.renter_score}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">out of 100</Text>
          </View>
        )}
        {isListing && (
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-gray-500 text-xs font-medium mb-1">Listings</Text>
            <Text className="text-gray-900 font-bold text-2xl">{data?.properties_count ?? 0}</Text>
            <Text className="text-gray-400 text-xs mt-0.5">active</Text>
          </View>
        )}
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-medium mb-1">Conversations</Text>
          <Text className="text-gray-900 font-bold text-2xl">{data?.active_conversations ?? 0}</Text>
          <Text className="text-gray-400 text-xs mt-0.5">active</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View className="mx-4 mt-4">
        <Text className="text-gray-900 font-semibold text-base mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3">
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.screen}
              className="bg-white rounded-2xl p-4 border border-gray-100 items-center"
              style={{ width: '47%' }}
              onPress={() => navigation.navigate(action.screen, action.params)}
              activeOpacity={0.8}
            >
              <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center mb-2">
                <Ionicons name={action.icon} size={20} color="#16a34a" />
              </View>
              <Text className="text-gray-700 text-xs font-semibold">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Referral card */}
      {user?.referral_code && (
        <TouchableOpacity
          className="mx-4 mt-4 mb-8"
          onPress={() => navigation.navigate('Referrals')}
          activeOpacity={0.85}
        >
          <View className="bg-primary-600 rounded-2xl p-5">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-primary-100 text-xs font-medium">Your referral code</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
            </View>
            <Text className="text-white font-mono text-sm font-semibold">
              ufok.ng/ref/{user.referral_code}
            </Text>
            <Text className="text-primary-200 text-xs mt-2">
              Earn ₦1,000 for every friend who joins — tap to see your referrals
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
