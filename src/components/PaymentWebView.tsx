import React from 'react';
import { Modal, View, TouchableOpacity, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  url: string;
  visible: boolean;
  title?: string;
  onClose: (txRef?: string) => void;
}

export default function PaymentWebView({ url, visible, title = 'Complete Payment', onClose }: Props) {
  const extractTxRef = (navUrl: string): string | undefined => {
    try {
      const u = new URL(navUrl);
      return u.searchParams.get('tx_ref') ?? u.searchParams.get('transaction_id') ?? undefined;
    } catch {
      return undefined;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <TouchableOpacity onPress={() => onClose()} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontWeight: '600', fontSize: 15, color: '#111827' }}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="lock-closed" size={11} color="#16a34a" />
            <Text style={{ color: '#16a34a', fontSize: 11, fontWeight: '500' }}>Secured</Text>
          </View>
        </View>
        <WebView
          source={{ uri: url }}
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          )}
          onNavigationStateChange={state => {
            const txRef = extractTxRef(state.url);
            if (
              state.url.includes('ufok.ng/payment') ||
              state.url.includes('callback') ||
              state.url.includes('redirect')
            ) {
              onClose(txRef);
            }
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
