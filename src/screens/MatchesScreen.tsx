import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

interface MatchProperty {
  id: number;
  slug: string;
  title: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  state: string;
  image: string | null;
}

interface Match {
  id: number;
  score: number;
  status: string;
  property: MatchProperty;
}

interface Quota {
  daily_used: number;
  daily_limit: number;
  pack_type: string | null;
  pack_remaining: number | null;
  has_unlimited: boolean;
}

const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#6b7280';

export default function MatchesScreen() {
  const navigation = useNavigation<any>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshing2, setRefreshing2] = useState(false);

  const fetchMatches = useCallback(async () => {
    const { data } = await api.get('/matches');
    setMatches(data.data?.data ?? data.data ?? []);
    if (data.data?.quota) setQuota(data.data.quota);
  }, []);

  useEffect(() => {
    fetchMatches().catch(() => {}).finally(() => setLoading(false));
  }, [fetchMatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches().catch(() => {});
    setRefreshing(false);
  };

  const handleTriggerRefresh = async () => {
    setRefreshing2(true);
    try {
      await api.post('/matches/refresh');
      Alert.alert('Matches Refreshing', 'New matches are being found. Pull down to refresh in a moment.');
      setTimeout(() => fetchMatches().catch(() => {}), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not refresh matches.';
      Alert.alert('Quota Reached', msg);
    } finally {
      setRefreshing2(false);
    }
  };

  const handleDismiss = (matchId: number) => {
    Alert.alert('Dismiss Match', 'Remove this property from your matches?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/matches/${matchId}`);
            setMatches(prev => prev.filter(m => m.id !== matchId));
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Could not dismiss match.');
          }
        },
      },
    ]);
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden border border-gray-100"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
      onPress={() => navigation.navigate('PropertyDetail', { slug: item.property.slug })}
      activeOpacity={0.8}
    >
      <View style={{ height: 160 }} className="bg-gray-200">
        {item.property.image ? (
          <Image source={{ uri: item.property.image }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="home-outline" size={36} color="#d1d5db" />
          </View>
        )}
        <View
          className="absolute top-3 right-3 rounded-full px-2.5 py-1"
          style={{ backgroundColor: scoreColor(item.score) }}
        >
          <Text className="text-white text-xs font-bold">{item.score}% match</Text>
        </View>
        <TouchableOpacity
          className="absolute top-3 left-3 bg-white/90 rounded-full w-8 h-8 items-center justify-center"
          onPress={() => handleDismiss(item.id)}
        >
          <Ionicons name="close" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <View className="p-4">
        <Text className="text-primary-600 font-bold text-lg">
          ₦{(item.property.price ?? 0).toLocaleString()}/yr
        </Text>
        <Text className="text-gray-900 font-semibold" numberOfLines={1}>{item.property.title}</Text>
        <View className="flex-row items-center mt-1.5 gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="bed-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.property.bedrooms} bed</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="water-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.property.bathrooms} bath</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.property.city}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {quota && (
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600 text-sm">
              Daily: <Text className="font-semibold text-gray-900">{quota.daily_used}/{quota.daily_limit}</Text>
              {quota.pack_remaining ? (
                <Text className="text-primary-600"> · {quota.pack_remaining} pack remaining</Text>
              ) : null}
            </Text>
            <View className="flex-row gap-2">
              {!quota.pack_type && !quota.has_unlimited && (
                <TouchableOpacity
                  className="bg-primary-50 rounded-full px-3 py-1.5"
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Text className="text-primary-600 text-xs font-semibold">Upgrade</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="bg-gray-100 rounded-full px-3 py-1.5 flex-row items-center gap-1"
                onPress={handleTriggerRefresh}
                disabled={refreshing2}
              >
                {refreshing2
                  ? <ActivityIndicator size="small" color="#16a34a" />
                  : <Ionicons name="refresh-outline" size={13} color="#6b7280" />
                }
                <Text className="text-gray-600 text-xs font-semibold">Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-600 rounded-full"
              style={{ width: `${Math.min((quota.daily_used / quota.daily_limit) * 100, 100)}%` }}
            />
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => String(item.id)}
          renderItem={renderMatch}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <Ionicons name="heart-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No matches yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Complete your preferences and tap Refresh to find matching properties.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-600 rounded-xl px-6 py-3"
                onPress={handleTriggerRefresh}
              >
                <Text className="text-white font-semibold text-sm">Find Matches</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
