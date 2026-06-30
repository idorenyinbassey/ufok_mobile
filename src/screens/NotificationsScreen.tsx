import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

interface Notification {
  id: string;
  data: {
    message: string;
    url?: string;
    type?: string;
  };
  read_at: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function typeIcon(type?: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'property_approved': return 'checkmark-circle-outline';
    case 'property_rejected': return 'close-circle-outline';
    case 'new_message': return 'chatbubble-outline';
    case 'payment': return 'wallet-outline';
    case 'referral': return 'people-outline';
    default: return 'notifications-outline';
  }
}

function typeColor(type?: string): string {
  switch (type) {
    case 'property_approved': return '#16a34a';
    case 'property_rejected': return '#dc2626';
    case 'new_message': return '#2563eb';
    case 'payment': return '#d97706';
    case 'referral': return '#7c3aed';
    default: return '#6b7280';
  }
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchNotifications = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data.data?.data ?? data.data ?? []);
  };

  useEffect(() => {
    fetchNotifications().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications().catch(() => {});
    setRefreshing(false);
  };

  const markRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n),
    );
    await api.post('/notifications/mark-read', { id }).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    await api.post('/notifications/mark-read').catch(() => {});
  };

  const deleteNotification = async (id: string) => {
    setDeleting(id);
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDeleting(null);
  };

  const deleteAll = () => {
    Alert.alert(
      'Delete All',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await api.delete('/notifications').catch(() => {});
            setNotifications([]);
          },
        },
      ],
    );
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header actions */}
      {notifications.length > 0 && (
        <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-primary-600 text-sm font-semibold">Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity onPress={deleteAll}>
            <Text className="text-red-500 text-sm font-semibold">Delete all</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-24 px-8">
            <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-900 font-semibold text-lg mt-4">No notifications</Text>
            <Text className="text-gray-500 text-sm text-center mt-2">
              You're all caught up! Notifications for property updates, messages, and payments appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.read_at;
          const color = typeColor(item.data.type);

          return (
            <TouchableOpacity
              className={`flex-row items-start px-5 py-4 border-b border-gray-100 ${isUnread ? 'bg-green-50' : 'bg-white'}`}
              onPress={() => {
                if (isUnread) markRead(item.id);
              }}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5"
                style={{ backgroundColor: color + '15' }}
              >
                <Ionicons name={typeIcon(item.data.type)} size={18} color={color} />
              </View>

              {/* Content */}
              <View className="flex-1 min-w-0">
                <Text className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {item.data.message ?? 'New notification'}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">{timeAgo(item.created_at)}</Text>
              </View>

              {/* Unread dot + delete */}
              <View className="items-center gap-2 ml-2">
                {isUnread && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                )}
                <TouchableOpacity
                  onPress={() => deleteNotification(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color="#9ca3af" />
                  ) : (
                    <Ionicons name="close" size={16} color="#d1d5db" />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
