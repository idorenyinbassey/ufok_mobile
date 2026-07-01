import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

interface Ticket {
  id: number;
  reference: string;
  subject: string;
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed' | string;
  created_at: string;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:     { color: '#2563eb', bg: '#eff6ff' },
  pending:  { color: '#d97706', bg: '#fffbeb' },
  resolved: { color: '#16a34a', bg: '#f0fdf4' },
  closed:   { color: '#6b7280', bg: '#f9fafb' },
};

export default function SupportScreen() {
  const navigation = useNavigation<any>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    const { data } = await api.get('/support');
    setTickets(data.data?.data ?? data.data ?? []);
  }, []);

  useEffect(() => {
    fetchTickets().catch(() => {}).finally(() => setLoading(false));
  }, [fetchTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets().catch(() => {});
    setRefreshing(false);
  };

  const renderTicket = ({ item }: { item: Ticket }) => {
    const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.closed;
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl border border-gray-100 mx-4 mb-3 p-4"
        style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
        onPress={() => navigation.navigate('SupportTicketDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View className="flex-row items-start justify-between">
          <Text className="text-gray-900 font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
            {item.subject}
          </Text>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: style.bg }}>
            <Text className="text-xs font-semibold capitalize" style={{ color: style.color }}>
              {item.status}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mt-2 gap-2">
          <Text className="text-gray-400 text-xs font-mono">{item.reference}</Text>
          <Text className="text-gray-300 text-xs">•</Text>
          <Text className="text-gray-400 text-xs capitalize">{item.category}</Text>
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
        data={tickets}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-24 px-8">
            <Ionicons name="help-buoy-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-900 font-semibold text-lg mt-4">No support tickets</Text>
            <Text className="text-gray-500 text-sm text-center mt-2">
              Need help? Open a ticket and our team will respond shortly.
            </Text>
          </View>
        }
        renderItem={renderTicket}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-5 bg-primary-600 rounded-full px-5 py-3.5 flex-row items-center gap-2"
        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
        onPress={() => navigation.navigate('NewSupportTicket')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text className="text-white font-bold text-sm">New Ticket</Text>
      </TouchableOpacity>
    </View>
  );
}
