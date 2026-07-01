import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api/client';
import type { RootStackParams } from '../navigation/types';

export default function NotificationBell() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      api.get('/notifications', { params: { per_page: 1 } })
        .then(({ data }) => {
          if (!cancelled) setUnreadCount(data.data?.unread_count ?? 0);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ marginRight: 16 }}
    >
      <Ionicons name="notifications-outline" size={24} color="#111827" />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute', top: -4, right: -6,
            backgroundColor: '#dc2626', borderRadius: 9,
            minWidth: 18, height: 18, paddingHorizontal: 3,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
