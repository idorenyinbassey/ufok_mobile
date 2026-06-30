import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';

interface Conversation {
  id: number;
  property: { title: string; slug: string } | null;
  other_participant: { name: string; avatar: string | null } | null;
  last_message: { body: string | null; created_at: string } | null;
  unread_count: number;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ConversationListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    const { data } = await api.get('/conversations');
    setConversations(data.data?.data ?? data.data ?? []);
  };

  useEffect(() => {
    fetchConversations().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations().catch(() => {});
    setRefreshing(false);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const other = item.other_participant;
    const initials = other?.name
      ? other.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
      : '?';

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3.5 bg-white border-b border-gray-100"
        onPress={() =>
          navigation.navigate('ChatWindow', {
            conversationId: item.id,
            title: other?.name ?? 'Chat',
          })
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="w-12 h-12 bg-primary-600 rounded-full items-center justify-center mr-3">
          <Text className="text-white font-bold">{initials}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-900 font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
              {other?.name ?? 'Unknown'}
            </Text>
            {item.last_message?.created_at && (
              <Text className="text-gray-400 text-xs">{timeAgo(item.last_message.created_at)}</Text>
            )}
          </View>
          {item.property && (
            <Text className="text-primary-600 text-xs font-medium mt-0.5" numberOfLines={1}>
              {item.property.title}
            </Text>
          )}
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
            {item.last_message?.body
              ? item.last_message.body.startsWith('{')
                ? '🔒 Encrypted message'
                : item.last_message.body
              : 'No messages yet'}
          </Text>
        </View>

        {/* Unread badge */}
        {item.unread_count > 0 && (
          <View className="ml-2 bg-primary-600 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {item.unread_count > 9 ? '9+' : item.unread_count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => String(item.id)}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-24 px-8">
              <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No conversations yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                {user?.role === 'tenant'
                  ? 'Enquire about a property to start chatting with the lister.'
                  : 'Conversations appear here when tenants enquire about your listings.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
