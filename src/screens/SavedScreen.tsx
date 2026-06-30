import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';

interface SavedProperty {
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
  lister: { name: string } | null;
}

export default function SavedScreen({ navigation }: RootScreenProps<'Saved'>) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    const { data } = await api.get('/properties/saved');
    setProperties(data.data?.data ?? []);
  }, []);

  useEffect(() => {
    fetchSaved().catch(() => {}).finally(() => setLoading(false));
  }, [fetchSaved]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSaved().catch(() => {});
    setRefreshing(false);
  };

  const renderProperty = ({ item }: { item: SavedProperty }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden border border-gray-100"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
      onPress={() => navigation.navigate('PropertyDetail', { slug: item.slug })}
      activeOpacity={0.8}
    >
      <View style={{ height: 176 }} className="bg-gray-200">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: 176 }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="home-outline" size={40} color="#d1d5db" />
          </View>
        )}
        <View className="absolute top-3 left-3 bg-primary-600 rounded-full px-2.5 py-1">
          <Text className="text-white text-xs font-semibold capitalize">{item.type}</Text>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-primary-600 font-bold text-lg">
          ₦{(item.price ?? 0).toLocaleString()}
          <Text className="text-gray-400 text-sm font-normal">/yr</Text>
        </Text>
        <Text className="text-gray-900 font-semibold text-base mt-0.5" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="flex-row items-center mt-2 gap-3">
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
            <Text className="text-gray-500 text-xs">{item.city}, {item.state}</Text>
          </View>
        </View>
        {item.lister && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="person-outline" size={11} color="#9ca3af" />
            <Text className="text-gray-400 text-xs ml-1">{item.lister.name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <FlatList
      data={properties}
      keyExtractor={item => String(item.id)}
      renderItem={renderProperty}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, flexGrow: 1 }}
      style={{ backgroundColor: '#f9fafb' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-24 px-8">
          <Ionicons name="bookmark-outline" size={56} color="#d1d5db" />
          <Text className="text-gray-900 font-semibold text-lg mt-4 text-center">
            No saved properties yet
          </Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            Browse and save properties you like.
          </Text>
        </View>
      }
    />
  );
}
