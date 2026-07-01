import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';
import { timeUntil } from '../utils/time';

interface Reservation {
  id: number;
  status: 'active' | 'expired' | 'terminated' | string;
  payment_status: 'paid' | 'unpaid' | string;
  fee: number;
  formatted_fee: string;
  expires_at: string | null;
  contact_deadline_at: string | null;
  property: {
    id: number;
    title: string;
    slug: string;
    image: string | null;
    state: string;
    city: string;
  } | null;
  created_at: string;
}

function statusInfo(r: Reservation): { label: string; color: string; bg: string } {
  if (r.status === 'active' && r.payment_status === 'paid') {
    return { label: 'Reserved', color: '#16a34a', bg: '#f0fdf4' };
  }
  if (r.status === 'active') {
    return { label: 'Awaiting payment', color: '#d97706', bg: '#fffbeb' };
  }
  if (r.status === 'expired') {
    return { label: 'Expired', color: '#6b7280', bg: '#f9fafb' };
  }
  return { label: 'Terminated', color: '#dc2626', bg: '#fef2f2' };
}

export default function ReservationsScreen() {
  const navigation = useNavigation<any>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const fetchReservations = useCallback(async () => {
    const { data } = await api.get('/reservations');
    setReservations(data.data?.data ?? data.data ?? []);
  }, []);

  useEffect(() => {
    fetchReservations().catch(() => {}).finally(() => setLoading(false));
  }, [fetchReservations]);

  // Re-render every minute so countdowns stay current.
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReservations().catch(() => {});
    setRefreshing(false);
  };

  const renderReservation = ({ item }: { item: Reservation }) => {
    const status = statusInfo(item);
    const property = item.property;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl border border-gray-100 mx-4 mb-3 overflow-hidden flex-row"
        style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
        onPress={() => property && navigation.navigate('PropertyDetail', { slug: property.slug })}
        activeOpacity={0.8}
        disabled={!property}
      >
        <View style={{ width: 96, height: 96 }} className="bg-gray-200">
          {property?.image ? (
            <Image source={{ uri: property.image }} style={{ width: 96, height: 96 }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="home-outline" size={28} color="#d1d5db" />
            </View>
          )}
        </View>

        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between">
            <Text className="text-gray-900 font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
              {property?.title ?? 'Property'}
            </Text>
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: status.bg }}>
              <Text className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</Text>
            </View>
          </View>

          {property && (
            <View className="flex-row items-center mt-0.5 gap-1">
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text className="text-gray-400 text-xs">{property.city}, {property.state}</Text>
            </View>
          )}

          <View className="flex-row items-center mt-2 gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={12} color="#6b7280" />
              <Text className="text-gray-500 text-xs">{item.formatted_fee}</Text>
            </View>
            {item.status === 'active' && item.payment_status === 'paid' && item.expires_at && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={12} color="#16a34a" />
                <Text className="text-primary-600 text-xs font-medium">
                  Expires in {timeUntil(item.expires_at)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={reservations}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-24 px-8">
            <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="bookmark-outline" size={32} color="#d1d5db" />
            </View>
            <Text className="text-gray-900 font-semibold text-lg">No reservations yet</Text>
            <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
              Reserve a listing from its property page to hold it while you arrange a viewing.
            </Text>
          </View>
        }
        renderItem={renderReservation}
      />
    </View>
  );
}
