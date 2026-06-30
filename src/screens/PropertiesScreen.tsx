import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

interface Property {
  id: number;
  slug: string;
  title: string;
  price: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  bedrooms: number;
  city: string;
  state: string;
  views_count?: number;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  approved: { color: '#16a34a', bg: '#f0fdf4' },
  pending:  { color: '#d97706', bg: '#fffbeb' },
  draft:    { color: '#6b7280', bg: '#f9fafb' },
  rejected: { color: '#dc2626', bg: '#fef2f2' },
  archived: { color: '#9ca3af', bg: '#f3f4f6' },
};

export default function PropertiesScreen() {
  const navigation = useNavigation<any>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    const { data } = await api.get('/properties/mine');
    setProperties(data.data?.data ?? data.data ?? []);
  };

  useEffect(() => {
    fetchProperties().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProperties().catch(() => {});
    setRefreshing(false);
  };

  const confirmDelete = (id: number, title: string) => {
    Alert.alert('Delete Listing', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/properties/${id}`);
            setProperties(prev => prev.filter(p => p.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Could not delete listing.');
          }
        },
      },
    ]);
  };

  const confirmAction = (id: number, currentStatus: string) => {
    const isArchived = currentStatus === 'archived';
    Alert.alert(
      isArchived ? 'Restore Listing' : 'Archive Listing',
      isArchived
        ? 'Restore this property to draft?'
        : 'Archive this property? It will be hidden from search and free your listing slot.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchived ? 'Restore' : 'Archive',
          style: isArchived ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/properties/${id}/${isArchived ? 'unarchive' : 'archive'}`);
              fetchProperties().catch(() => {});
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message ?? 'Action failed.');
            }
          },
        },
      ],
    );
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.draft;
    return (
      <View
        className="bg-white rounded-2xl mx-4 mb-3 p-4 border border-gray-100"
        style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-gray-900 font-semibold text-base" numberOfLines={2}>{item.title}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="location-outline" size={12} color="#6b7280" />
              <Text className="text-gray-500 text-xs">{item.city}, {item.state}</Text>
            </View>
            <Text className="text-primary-600 font-bold mt-2 text-base">
              ₦{(item.price ?? 0).toLocaleString()}/yr
            </Text>
          </View>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: style.bg }}>
            <Text className="text-xs font-semibold capitalize" style={{ color: style.color }}>
              {item.status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100 gap-4">
          <View className="flex-row items-center gap-1">
            <Ionicons name="eye-outline" size={14} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.views_count ?? 0} views</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="bed-outline" size={14} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.bedrooms} bed</Text>
          </View>
          <View className="flex-1" />
          <TouchableOpacity
            className="flex-row items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-full mr-1"
            onPress={() => navigation.navigate('EditProperty', { id: item.id })}
          >
            <Ionicons name="pencil-outline" size={13} color="#6b7280" />
            <Text className="text-gray-600 text-xs font-medium">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-full mr-1"
            onPress={() => confirmAction(item.id, item.status)}
          >
            <Ionicons
              name={item.status === 'archived' ? 'refresh-outline' : 'archive-outline'}
              size={13}
              color="#6b7280"
            />
            <Text className="text-gray-600 text-xs font-medium">
              {item.status === 'archived' ? 'Restore' : 'Archive'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-7 h-7 bg-red-50 rounded-full items-center justify-center"
            onPress={() => confirmDelete(item.id, item.title)}
          >
            <Ionicons name="trash-outline" size={13} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (<>
        <FlatList
          data={properties}
          keyExtractor={item => String(item.id)}
          renderItem={renderProperty}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <Ionicons name="home-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No listings yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Create your first property listing below.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-600 rounded-xl px-6 py-3"
                onPress={() => navigation.navigate('CreateProperty')}
              >
                <Text className="text-white font-semibold text-sm">Create Listing</Text>
              </TouchableOpacity>
            </View>
          }
        />
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center"
          style={{ shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}
          onPress={() => navigation.navigate('CreateProperty')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </>)}
    </View>
  );
}
