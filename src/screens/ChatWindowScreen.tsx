import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../stores/auth';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';

interface Message {
  id: number;
  sender_id: number;
  body: string | null;
  type: 'text' | 'image' | 'audio' | 'video' | 'file';
  attachment_url: string | null;
  media_name: string | null;
  is_encrypted: boolean;
  created_at: string;
  sender: { name: string; avatar?: string } | null;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWindowScreen({ route }: RootScreenProps<'ChatWindow'>) {
  const { conversationId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdRef = useRef(0);

  // Initial full history load
  const loadHistory = async () => {
    const { data } = await api.get(`/conversations/${conversationId}/messages`, {
      params: { per_page: 50 },
    });
    const msgs: Message[] = data.data?.data ?? [];
    if (msgs.length > 0) {
      lastIdRef.current = msgs[msgs.length - 1].id;
      setMessages(msgs);
    }
  };

  // Poll for new messages only
  const pollNew = async () => {
    if (!lastIdRef.current) return;
    const { data } = await api.get(`/conversations/${conversationId}/poll`, {
      params: { after: lastIdRef.current },
    });
    const msgs: Message[] = data.data?.messages ?? [];
    if (msgs.length > 0) {
      lastIdRef.current = data.data?.last_id ?? msgs[msgs.length - 1].id;
      setMessages(prev => [...prev, ...msgs]);
    }
  };

  useEffect(() => {
    loadHistory().catch(() => {}).finally(() => setLoading(false));
    pollRef.current = setInterval(() => { pollNew().catch(() => {}); }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
      const { data } = await api.post(`/conversations/${conversationId}/messages`, { body });
      const newMsg = data.data;
      if (newMsg) {
        lastIdRef.current = newMsg.id;
        setMessages(prev => [...prev, newMsg]);
      }
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const uploadMedia = async (uri: string, type: 'image' | 'file', name: string, mimeType: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri, name, type: mimeType } as any);
      formData.append('type', type);
      formData.append('media_name', name);
      const { data } = await api.post(`/conversations/${conversationId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.data?.message_id) {
        await pollNew();
      }
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.message ?? 'Could not upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleAttach = () => {
    Alert.alert('Attach', 'Choose attachment type', [
      {
        text: 'Photo / Image',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const name = asset.fileName ?? 'image.jpg';
            await uploadMedia(asset.uri, 'image', name, asset.mimeType ?? 'image/jpeg');
          }
        },
      },
      {
        text: 'File / Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            await uploadMedia(asset.uri, 'file', asset.name, asset.mimeType ?? 'application/octet-stream');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;

    let content: React.ReactNode;
    if (item.is_encrypted) {
      content = <Text className={`text-sm ${isMe ? 'text-white/70' : 'text-gray-400'}`}>🔒 Encrypted message</Text>;
    } else if (item.type === 'image' && item.attachment_url) {
      content = (
        <View>
          <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`}>📷 {item.media_name ?? 'Image'}</Text>
        </View>
      );
    } else if ((item.type === 'file' || item.type === 'audio' || item.type === 'video') && item.attachment_url) {
      const icons = { file: '📎', audio: '🎵', video: '🎬' } as const;
      content = <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`}>{icons[item.type]} {item.media_name ?? item.type}</Text>;
    } else {
      content = <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`}>{item.body}</Text>;
    }

    return (
      <View className={`flex-row mb-3 px-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && (
          item.sender?.avatar ? (
            <Image
              source={{ uri: item.sender.avatar }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, marginTop: 4 }}
            />
          ) : (
            <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center mr-2 mt-1">
              <Text className="text-gray-600 text-xs font-bold">
                {item.sender?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )
        )}
        <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
          <View className={`rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary-600 rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'}`}>
            {content}
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
              <Text className="text-gray-500 text-sm mt-4 text-center">No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      {uploading && (
        <View className="flex-row items-center px-4 py-2 bg-primary-50 border-t border-primary-100">
          <ActivityIndicator size="small" color="#16a34a" />
          <Text className="text-primary-600 text-xs ml-2">Uploading...</Text>
        </View>
      )}

      <View className="flex-row items-end px-4 py-3 border-t border-gray-100 bg-white gap-2">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          onPress={handleAttach}
          disabled={uploading}
        >
          <Ionicons name="attach" size={18} color="#6b7280" />
        </TouchableOpacity>
        <TextInput
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 max-h-24"
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          multiline
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          className={`w-10 h-10 rounded-full items-center justify-center ${text.trim() ? 'bg-primary-600' : 'bg-gray-200'}`}
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
