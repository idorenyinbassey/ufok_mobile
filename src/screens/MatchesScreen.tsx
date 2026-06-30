import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

interface Match {
  id: number;
  slug: string;
  title: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  state: string;
  primary_image_url: string | null;
  score: number;
}

interface Quota {
  daily_used: number;
  daily_limit: number;
  pack_type: string | null;
  pack_remaining: number | null;
}

const scoreColor = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#6b7280';

export default function MatchesScreen() {
  const navigation = useNavigation<any>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = async () => {
    const { data } = await api.get('/matches');
    setMatches(data.data?.data ?? data.data ?? []);
    if (data.quota) setQuota(data.quota);
  };

  useEffect(() => {
    fetchMatches().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatches().catch(() => {});
    setRefreshing(false);
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden border border-gray-100"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
      onPress={() => navigation.navigate('PropertyDetail', { slug: item.slug })}
      activeOpacity={0.8}
    >
      <View style={{ height: 160 }} className="bg-gray-200">
        {item.primary_image_url ? (
          <Image
            source={{ uri: item.primary_image_url }}
            style={{ width: '100%', height: 160 }}
            resizeMode="cover"
          />
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
      </View>
      <View className="p-4">
        <Text className="text-primary-600 font-bold text-lg">₦{item.price.toLocaleString()}/yr</Text>
        <Text className="text-gray-900 font-semibold" numberOfLines={1}>{item.title}</Text>
        <View className="flex-row items-center mt-1.5 gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="bed-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.bedrooms} bed</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="water-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.bathrooms} bath</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.city}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {quota && (
        <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
          <Text className="text-gray-600 text-sm">
            This week:{' '}
            <Text className="font-semibold text-gray-900">{quota.daily_used}/{quota.daily_limit}</Text>
            {' '}free matches
          </Text>
          {!quota.pack_type && (
            <TouchableOpacity
              className="bg-primary-50 rounded-full px-3 py-1.5"
              onPress={() => navigation.navigate('Wallet')}
            >
              <Text className="text-primary-600 text-xs font-semibold">Upgrade</Text>
            </TouchableOpacity>
          )}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <Ionicons name="heart-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No matches yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Complete your preferences in your profile to find matching properties.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
