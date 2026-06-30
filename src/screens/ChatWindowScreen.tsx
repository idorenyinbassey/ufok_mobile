import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';

interface Message {
  id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender: { name: string } | null;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindowScreen({ route }: RootScreenProps<'ChatWindow'>) {
  const { conversationId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdRef = useRef(0);

  const fetchMessages = async (after = 0, append = false) => {
    const params: Record<string, any> = {};
    if (after) params.after = after;
    const { data } = await api.get(`/conversations/${conversationId}/poll`, { params });
    const msgs: Message[] = data.data ?? [];
    if (msgs.length > 0) {
      lastIdRef.current = msgs[msgs.length - 1].id;
      setMessages(prev => append ? [...prev, ...msgs] : msgs);
    }
    return msgs;
  };

  useEffect(() => {
    fetchMessages(0, false)
      .catch(() => {})
      .finally(() => setLoading(false));

    pollRef.current = setInterval(() => {
      fetchMessages(lastIdRef.current, true).catch(() => {});
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);
    try {
      await api.post(`/conversations/${conversationId}/messages`, { body });
      await fetchMessages(lastIdRef.current, true);
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    const isEncrypted = item.body?.startsWith('{');

    return (
      <View className={`flex-row mb-3 px-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && (
          <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center mr-2 mt-1">
            <Text className="text-gray-600 text-xs font-bold">
              {item.sender?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
          <View
            className={`rounded-2xl px-4 py-2.5 ${
              isMe ? 'bg-primary-600 rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'
            }`}
          >
            <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`}>
              {isEncrypted ? '🔒 Encrypted message' : item.body}
            </Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1">{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Security badge */}
      <View className="flex-row items-center justify-center py-2 border-b border-gray-100 gap-1 bg-white">
        <Ionicons name="lock-closed" size={11} color="#16a34a" />
        <Text className="text-green-700 text-xs font-medium">HTTPS Secured</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16 px-8">
              <Ionicons name="chatbubble-outline" size={40} color="#d1d5db" />
              <Text className="text-gray-500 text-sm mt-4 text-center">
                No messages yet. Say hello!
              </Text>
            </View>
          }
        />
      )}

      {/* Input area */}
      <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white gap-2">
        <TextInput
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          multiline
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          className={`w-10 h-10 rounded-full items-center justify-center ${
            text.trim() ? 'bg-primary-600' : 'bg-gray-200'
          }`}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={text.trim() ? '#fff' : '#9ca3af'} />
          ) : (
            <Ionicons name="send" size={16} color={text.trim() ? '#fff' : '#9ca3af'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
