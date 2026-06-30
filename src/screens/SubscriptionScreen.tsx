import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';
import { useAuthStore } from '../stores/auth';
import PaymentWebView from '../components/PaymentWebView';

// ---------- Tenant types ----------
interface MatchQuota {
  daily_used: number;
  daily_limit: number;
  pack_remaining: number;
  pack_type: string | null;
  pack_expires_at: string | null;
  has_unlimited: boolean;
}

interface MatchPacks {
  pack_30: { price: number; matches: number };
  unlimited: { price: number; days: number };
}

interface TenantSubscription {
  type: 'match_quota';
  quota: MatchQuota;
  packs: MatchPacks;
}

// ---------- Landlord/Agent types ----------
interface Plan {
  key: string;
  name: string;
  price: number;
  formatted_price: string;
  max_listings: number | string;
  analytics: boolean;
  featured_per_month: number;
  leaderboard: boolean;
  is_current: boolean;
}

interface LandlordSubscription {
  current_plan: string;
  remaining_listings: number;
  subscription: object | null;
  plans: Plan[];
}

type SubscriptionData = TenantSubscription | LandlordSubscription;

function isTenantData(d: SubscriptionData): d is TenantSubscription {
  return (d as TenantSubscription).type === 'match_quota';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------- Tenant quota bar ----------
function QuotaBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#16a34a';
  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-600 text-xs">Daily matches used</Text>
        <Text className="text-gray-900 text-xs font-semibold">
          {used} / {limit}
        </Text>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-2 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </View>
    </View>
  );
}

// ---------- Plan card for landlord/agent ----------
function PlanCard({
  plan,
  onUpgrade,
  upgrading,
}: {
  plan: Plan;
  onUpgrade: (key: string) => void;
  upgrading: boolean;
}) {
  const isCurrent = plan.is_current;
  const isFree = plan.price === 0;

  return (
    <View
      className={`rounded-2xl border p-4 mb-3 ${isCurrent ? 'border-primary-600 bg-primary-50' : 'border-gray-100 bg-white'}`}
      style={isCurrent ? {} : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-gray-900 font-bold text-base">{plan.name}</Text>
            {isCurrent && (
              <View className="bg-primary-600 rounded-full px-2 py-0.5">
                <Text className="text-white text-xs font-semibold">Current</Text>
              </View>
            )}
          </View>
          <Text className={`text-sm font-semibold mt-0.5 ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>
            {plan.formatted_price}
          </Text>
        </View>
        {plan.leaderboard && (
          <View className="bg-amber-100 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <Ionicons name="star" size={11} color="#d97706" />
            <Text className="text-amber-700 text-xs font-semibold">Pro</Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View className="gap-2 mb-4">
        <FeatureLine
          icon="home-outline"
          label={`${plan.max_listings} listing${plan.max_listings === 1 ? '' : 's'}`}
          active={isCurrent}
        />
        <FeatureLine
          icon="bar-chart-outline"
          label="Analytics"
          active={plan.analytics}
          dimIfInactive
        />
        <FeatureLine
          icon="star-outline"
          label={`${plan.featured_per_month} featured listing${plan.featured_per_month === 1 ? '' : 's'}/month`}
          active={isCurrent}
          dimIfInactive={plan.featured_per_month === 0}
        />
        <FeatureLine
          icon="trophy-outline"
          label="Leaderboard placement"
          active={plan.leaderboard}
          dimIfInactive
        />
      </View>

      {!isCurrent && !isFree && (
        <TouchableOpacity
          className={`rounded-xl py-3.5 items-center ${upgrading ? 'bg-gray-300' : 'bg-primary-600'}`}
          onPress={() => onUpgrade(plan.key)}
          disabled={upgrading}
        >
          {upgrading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-sm">Upgrade to {plan.name}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function FeatureLine({
  icon,
  label,
  active,
  dimIfInactive,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  dimIfInactive?: boolean;
}) {
  const muted = dimIfInactive && !active;
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={14} color={muted ? '#d1d5db' : active ? '#16a34a' : '#6b7280'} />
      <Text className={`text-sm ${muted ? 'text-gray-300 line-through' : active ? 'text-gray-700' : 'text-gray-400'}`}>
        {label}
      </Text>
    </View>
  );
}

// ---------- Main screen ----------
export default function SubscriptionScreen(_props: RootScreenProps<'Subscription'>) {
  const { user } = useAuthStore();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentContext, setPaymentContext] = useState<'pack_30' | 'unlimited' | 'plan' | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await api.get('/subscriptions');
    setSubData(data.data ?? data);
  }, []);

  useEffect(() => {
    fetchData().catch(() => {}).finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData().catch(() => {});
    setRefreshing(false);
  };

  // --- Tenant: buy pack ---
  const handleBuyPack = async (pack: 'pack_30' | 'unlimited') => {
    setActingOn(pack);
    try {
      const { data } = await api.post('/match-packs/initialize', { pack });
      const { authorization_url } = data.data;
      setPaymentUrl(authorization_url);
      setPaymentContext(pack);
      setPaymentVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not initialize payment.');
    } finally {
      setActingOn(null);
    }
  };

  // --- Landlord/Agent: upgrade plan ---
  const handleUpgradePlan = async (planKey: string) => {
    setActingOn(planKey);
    try {
      const { data } = await api.post('/subscriptions/initialize', { plan: planKey });
      const { authorization_url } = data.data;
      setPaymentUrl(authorization_url);
      setPaymentContext('plan');
      setPaymentVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not initialize payment.');
    } finally {
      setActingOn(null);
    }
  };

  const handlePaymentClose = async (txRef?: string) => {
    setPaymentVisible(false);
    const ctx = paymentContext;
    setPaymentUrl('');
    setPaymentContext(null);

    if (!txRef) return;

    if (ctx === 'pack_30' || ctx === 'unlimited') {
      // Activate pack with reference
      try {
        await api.post('/match-packs/activate', { reference: txRef });
      } catch {
        // Best-effort — backend may activate via webhook
      }
      await fetchData().catch(() => {});
    } else if (ctx === 'plan') {
      Alert.alert(
        'Payment Submitted',
        'Your payment is being processed. Your plan will activate shortly.',
        [{ text: 'OK' }],
      );
      await fetchData().catch(() => {});
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!subData) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#d1d5db" />
        <Text className="text-gray-500 text-sm mt-3 text-center">Could not load subscription data.</Text>
        <TouchableOpacity className="mt-4" onPress={() => { setLoading(true); fetchData().catch(() => {}).finally(() => setLoading(false)); }}>
          <Text className="text-primary-600 font-semibold text-sm">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ====== Tenant view ======
  if (isTenantData(subData)) {
    const { quota, packs } = subData;

    return (
      <View className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
        >
          {/* Quota card */}
          <View
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
          >
            <Text className="text-gray-900 font-semibold text-base mb-4">Daily Match Quota</Text>
            <QuotaBar used={quota.daily_used} limit={quota.daily_limit} />

            {quota.has_unlimited && (
              <View className="mt-3 bg-primary-50 rounded-xl px-3 py-2 flex-row items-center gap-2">
                <Ionicons name="infinite-outline" size={16} color="#16a34a" />
                <Text className="text-primary-700 text-sm font-semibold">Unlimited matches active</Text>
              </View>
            )}

            {!quota.has_unlimited && quota.pack_remaining > 0 && (
              <View className="mt-3 bg-primary-50 rounded-xl px-3 py-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="layers-outline" size={15} color="#16a34a" />
                    <Text className="text-primary-700 text-sm font-semibold">
                      Pack: {quota.pack_remaining} matches left
                    </Text>
                  </View>
                  {quota.pack_type && (
                    <View className="bg-primary-100 rounded-full px-2 py-0.5">
                      <Text className="text-primary-700 text-xs capitalize">{quota.pack_type}</Text>
                    </View>
                  )}
                </View>
                {quota.pack_expires_at && (
                  <Text className="text-primary-500 text-xs mt-0.5">
                    Expires {formatDate(quota.pack_expires_at)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Pack purchase */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Buy More Matches
          </Text>

          {/* 30 Matches pack */}
          <View
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center">
                  <Ionicons name="layers-outline" size={20} color="#16a34a" />
                </View>
                <View>
                  <Text className="text-gray-900 font-semibold text-sm">30 Matches Pack</Text>
                  <Text className="text-gray-400 text-xs">{packs.pack_30.matches} match credits</Text>
                </View>
              </View>
              <Text className="text-primary-600 font-bold text-base">
                ₦{packs.pack_30.price.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center ${actingOn === 'pack_30' ? 'bg-gray-300' : 'bg-primary-600'}`}
              onPress={() => handleBuyPack('pack_30')}
              disabled={actingOn !== null}
            >
              {actingOn === 'pack_30' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">
                  30 Matches – ₦{packs.pack_30.price.toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Unlimited pack */}
          <View
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center">
                  <Ionicons name="infinite-outline" size={20} color="#d97706" />
                </View>
                <View>
                  <Text className="text-gray-900 font-semibold text-sm">Unlimited Pack</Text>
                  <Text className="text-gray-400 text-xs">
                    Unlimited matches for {packs.unlimited.days} days
                  </Text>
                </View>
              </View>
              <Text className="text-primary-600 font-bold text-base">
                ₦{packs.unlimited.price.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center ${actingOn === 'unlimited' ? 'bg-gray-300' : 'bg-primary-600'}`}
              onPress={() => handleBuyPack('unlimited')}
              disabled={actingOn !== null}
            >
              {actingOn === 'unlimited' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">
                  Unlimited 30 days – ₦{packs.unlimited.price.toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <PaymentWebView
          url={paymentUrl}
          visible={paymentVisible}
          title="Purchase Match Pack"
          onClose={handlePaymentClose}
        />
      </View>
    );
  }

  // ====== Landlord / Agent view ======
  const landlordData = subData as LandlordSubscription;
  const { current_plan, remaining_listings, plans } = landlordData;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
      >
        {/* Current plan summary */}
        <View
          className="bg-white rounded-2xl border border-gray-100 p-4 mb-5"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-0.5">
                Current Plan
              </Text>
              <Text className="text-gray-900 font-bold text-xl capitalize">{current_plan}</Text>
            </View>
            <View className="bg-primary-50 rounded-xl px-3 py-1.5">
              <Text className="text-primary-700 text-xs font-semibold">
                {remaining_listings} listing{remaining_listings === 1 ? '' : 's'} left
              </Text>
            </View>
          </View>
        </View>

        {/* Plan cards */}
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Available Plans
        </Text>

        {plans.map(plan => (
          <PlanCard
            key={plan.key}
            plan={plan}
            onUpgrade={handleUpgradePlan}
            upgrading={actingOn === plan.key}
          />
        ))}
      </ScrollView>

      <PaymentWebView
        url={paymentUrl}
        visible={paymentVisible}
        title="Complete Subscription Payment"
        onClose={handlePaymentClose}
      />
    </View>
  );
}
