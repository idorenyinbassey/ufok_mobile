import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';

interface Reply {
  id: number;
  body: string;
  is_admin_reply: boolean;
  user: { id: number; name: string } | null;
  created_at: string;
}

interface Ticket {
  id: number;
  reference: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  status: 'open' | 'pending' | 'resolved' | 'closed' | string;
  created_at: string;
  replies: Reply[];
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:     { color: '#2563eb', bg: '#eff6ff' },
  pending:  { color: '#d97706', bg: '#fffbeb' },
  resolved: { color: '#16a34a', bg: '#f0fdf4' },
  closed:   { color: '#6b7280', bg: '#f9fafb' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function SupportTicketDetailScreen({ route }: RootScreenProps<'SupportTicketDetail'>) {
  const { id } = route.params;
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTicket = useCallback(async () => {
    const { data } = await api.get(`/support/${id}`);
    setTicket(data.data);
  }, [id]);

  useEffect(() => {
    fetchTicket().catch(() => Alert.alert('Error', 'Could not load ticket.')).finally(() => setLoading(false));
  }, [fetchTicket]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/${id}/reply`, { body: reply.trim() });
      setReply('');
      await fetchTicket();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not send reply.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-gray-500 text-center">Ticket not found.</Text>
      </View>
    );
  }

  const style = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.closed;
  const closed = ['resolved', 'closed'].includes(ticket.status);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-gray-400 text-xs font-mono">{ticket.reference}</Text>
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: style.bg }}>
            <Text className="text-xs font-semibold capitalize" style={{ color: style.color }}>{ticket.status}</Text>
          </View>
        </View>
        <Text className="text-gray-900 font-bold text-lg mb-4">{ticket.subject}</Text>

        {/* Original message */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-8 h-8 bg-primary-50 rounded-full items-center justify-center">
              <Text className="text-primary-700 text-xs font-bold">{user ? initials(user.name) : '?'}</Text>
            </View>
            <View>
              <Text className="text-gray-900 text-sm font-semibold">{user?.name ?? 'You'}</Text>
              <Text className="text-gray-400 text-xs">{formatDate(ticket.created_at)}</Text>
            </View>
          </View>
          <Text className="text-gray-700 text-sm leading-relaxed">{ticket.body}</Text>
        </View>

        {/* Replies */}
        {ticket.replies.map(r => (
          <View
            key={r.id}
            className={`rounded-2xl border p-4 mb-3 ${r.is_admin_reply ? 'bg-green-50 border-green-200 ml-6' : 'bg-white border-gray-100'}`}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${r.is_admin_reply ? 'bg-primary-600' : 'bg-gray-200'}`}>
                <Text className={`text-xs font-bold ${r.is_admin_reply ? 'text-white' : 'text-gray-600'}`}>
                  {r.is_admin_reply ? 'U' : (r.user ? initials(r.user.name) : '?')}
                </Text>
              </View>
              <View>
                <Text className="text-gray-900 text-sm font-semibold">
                  {r.is_admin_reply ? 'Ufok Support' : r.user?.name ?? 'User'}
                </Text>
                <Text className="text-gray-400 text-xs">{formatDate(r.created_at)}</Text>
              </View>
            </View>
            <Text className="text-gray-700 text-sm leading-relaxed">{r.body}</Text>
          </View>
        ))}

        {closed && (
          <Text className="text-gray-400 text-sm text-center py-4">This ticket is {ticket.status}.</Text>
        )}
      </ScrollView>

      {!closed && (
        <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white gap-2">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
            placeholder="Type your reply..."
            placeholderTextColor="#9ca3af"
            multiline
            value={reply}
            onChangeText={setReply}
            editable={!sending}
          />
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ${reply.trim() ? 'bg-primary-600' : 'bg-gray-200'}`}
            onPress={handleReply}
            disabled={!reply.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className={`font-bold ${reply.trim() ? 'text-white' : 'text-gray-400'}`}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
