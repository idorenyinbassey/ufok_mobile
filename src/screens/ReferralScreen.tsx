import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';

interface ReferralStats {
  total: number;
  pending: number;
  completed: number;
  rewarded: number;
  earned: number;
}

interface ReferralItem {
  id: number;
  referee_name: string;
  status: 'rewarded' | 'completed' | 'pending' | string;
  reward_amount: number;
  rewarded_at: string | null;
  joined_at: string;
}

interface ReferralData {
  referral_code: string;
  referral_link: string;
  reward_per_referral: number;
  stats: ReferralStats;
  referrals: ReferralItem[];
}

function statusColor(status: string): string {
  switch (status) {
    case 'rewarded': return '#16a34a';
    case 'completed': return '#2563eb';
    case 'pending': return '#d97706';
    default: return '#6b7280';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'rewarded': return '#f0fdf4';
    case 'completed': return '#eff6ff';
    case 'pending': return '#fffbeb';
    default: return '#f9fafb';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEarned(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}k`;
  return `₦${amount.toLocaleString()}`;
}

export default function ReferralScreen({ navigation }: RootScreenProps<'Referrals'>) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fetchReferrals = useCallback(async () => {
    const { data: res } = await api.get('/referrals');
    setData(res.data);
  }, []);

  useEffect(() => {
    fetchReferrals().catch(() => {}).finally(() => setLoading(false));
  }, [fetchReferrals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReferrals().catch(() => {});
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!data) return;
    setSharing(true);
    try {
      await Share.share({ message: data.referral_link });
    } catch {}
    setSharing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const stats = data?.stats;
  const referrals = data?.referrals ?? [];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
      }
    >
      {/* Referral code share card */}
      <View
        className="bg-primary-600 mx-4 mt-5 rounded-2xl p-5"
        style={{ shadowColor: '#16a34a', shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 }}
      >
        <Text className="text-primary-100 text-sm text-center mb-2">Your Referral Code</Text>
        <Text
          className="text-white text-center text-3xl font-bold mb-5 tracking-widest"
          style={{ fontFamily: 'monospace' }}
        >
          {data?.referral_code ?? '——'}
        </Text>
        <TouchableOpacity
          className="bg-white rounded-xl py-3.5 flex-row items-center justify-center gap-2"
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.85}
        >
          {sharing ? (
            <ActivityIndicator color="#16a34a" />
          ) : (
            <>
              <Ionicons name="share-social-outline" size={18} color="#16a34a" />
              <Text className="text-primary-600 font-bold text-base">Share Link</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Earn info banner */}
      <View
        className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-3"
        style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
      >
        <View className="w-10 h-10 bg-primary-50 rounded-full items-center justify-center">
          <Ionicons name="gift-outline" size={20} color="#16a34a" />
        </View>
        <Text className="text-gray-700 text-sm flex-1">
          Earn{' '}
          <Text className="text-primary-600 font-bold">
            ₦{(data?.reward_per_referral ?? 0).toLocaleString()}
          </Text>
          {' '}for every friend who joins
        </Text>
      </View>

      {/* Stats row */}
      <View className="mx-4 mt-4 flex-row gap-3">
        <View
          className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 items-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
        >
          <Text className="text-gray-900 font-bold text-2xl">{stats?.total ?? 0}</Text>
          <Text className="text-gray-500 text-xs mt-0.5">Total</Text>
        </View>
        <View
          className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 items-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
        >
          <Text className="text-primary-600 font-bold text-2xl">{stats?.rewarded ?? 0}</Text>
          <Text className="text-gray-500 text-xs mt-0.5">Rewarded</Text>
        </View>
        <View
          className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 items-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
        >
          <Text className="text-primary-600 font-bold text-2xl">
            {formatEarned(stats?.earned ?? 0)}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5">Earned</Text>
        </View>
      </View>

      {/* Referrals list */}
      <View className="mx-4 mt-5">
        <Text className="text-gray-900 font-semibold text-base mb-3">Your Referrals</Text>

        {referrals.length === 0 ? (
          <View
            className="bg-white rounded-2xl border border-gray-100 py-10 px-6 items-center"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <Ionicons name="people-outline" size={44} color="#d1d5db" />
            <Text className="text-gray-500 text-sm mt-3 text-center">
              No referrals yet. Share your link to get started.
            </Text>
          </View>
        ) : (
          referrals.map(item => (
            <View
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 flex-row items-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              {/* Avatar initial */}
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                <Text className="text-gray-600 font-bold text-base">
                  {item.referee_name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Name + date */}
              <View className="flex-1 min-w-0">
                <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
                  {item.referee_name}
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  Joined {formatDate(item.joined_at)}
                </Text>
              </View>

              {/* Status badge + reward */}
              <View className="items-end gap-1.5">
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: statusBg(item.status) }}
                >
                  <Text
                    className="text-xs font-semibold capitalize"
                    style={{ color: statusColor(item.status) }}
                  >
                    {item.status}
                  </Text>
                </View>
                {item.reward_amount > 0 && (
                  <Text className="text-primary-600 text-xs font-bold">
                    +₦{item.reward_amount.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
