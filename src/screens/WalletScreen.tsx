import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, FlatList, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import PaymentWebView from '../components/PaymentWebView';
import type { RootScreenProps } from '../navigation/types';
import { useAuthStore } from '../stores/auth';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_after: number;
}

interface WalletData {
  balance: number;
  currency: string;
  is_locked: boolean;
}

interface Bank {
  code: string;
  name: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (type === 'credit' || type === 'fund') return 'arrow-down-circle-outline';
  if (type === 'withdrawal') return 'arrow-up-circle-outline';
  return 'swap-horizontal-outline';
}

function typeColor(type: string): string {
  if (type === 'credit' || type === 'fund') return '#16a34a';
  if (type === 'withdrawal') return '#dc2626';
  return '#6b7280';
}

export default function WalletScreen({ navigation }: RootScreenProps<'Wallet'>) {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'fund' | 'withdraw'>('history');
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [acting, setActing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const fetchWallet = async () => {
    const { data } = await api.get('/wallet');
    const d = data.data;
    setWallet({ balance: d.balance, currency: d.currency ?? 'NGN', is_locked: d.is_locked });
    setTransactions(d.transactions?.data ?? []);
  };

  const fetchBanks = async () => {
    try {
      const { data } = await api.get('/wallet/banks');
      setBanks(data.data?.banks ?? []);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchWallet(), fetchBanks()]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWallet().catch(() => {});
    setRefreshing(false);
  };

  const handleFund = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) {
      Alert.alert('Invalid Amount', 'Minimum funding amount is ₦100.');
      return;
    }
    setActing(true);
    try {
      const { data } = await api.post('/wallet/fund', { amount: amt });
      const url = data.data?.authorization_url ?? data.data?.payment_link;
      const ref = data.data?.reference;
      if (url && ref) {
        setPaymentUrl(url);
        setPaymentRef(ref);
        setShowPayment(true);
      }
      setAmount('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not initialize payment.');
    } finally {
      setActing(false);
    }
  };

  const handlePaymentClose = async (txRef?: string) => {
    setShowPayment(false);
    if (txRef || paymentRef) {
      try {
        await api.post('/wallet/topup/activate', { tx_ref: txRef ?? paymentRef });
        await fetchWallet();
        Alert.alert('Wallet Funded', 'Your wallet has been topped up successfully.');
      } catch (err: any) {
        Alert.alert('Verify Payment', err?.response?.data?.message ?? 'Payment could not be verified. It may take a moment to reflect.');
      }
    }
    setPaymentRef('');
    setPaymentUrl('');
  };

  const handleWithdraw = async () => {
    if (!user?.is_kyc_verified) {
      Alert.alert('KYC Required', 'Complete identity verification before withdrawing.', [
        { text: 'Verify Now', onPress: () => navigation.navigate('Kyc') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt < 500) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal is ₦500.');
      return;
    }
    if (wallet && amt > wallet.balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds.');
      return;
    }
    setActing(true);
    try {
      await api.post('/wallet/withdraw', { amount: amt });
      Alert.alert('Withdrawal Requested', 'Your withdrawal is being processed. Funds will arrive in your bank shortly.', [
        { text: 'OK', onPress: () => { setAmount(''); setActiveTab('history'); fetchWallet(); } },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Withdrawal failed.');
    } finally {
      setActing(false);
    }
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
      <PaymentWebView
        url={paymentUrl}
        visible={showPayment}
        title="Fund Wallet"
        onClose={handlePaymentClose}
      />

      {/* Bank picker modal */}
      <Modal visible={showBankPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 16, color: '#111827' }}>Select Bank</Text>
            <TouchableOpacity onPress={() => setShowBankPicker(false)}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={banks}
            keyExtractor={b => b.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                onPress={() => { setSelectedBank(item); setShowBankPicker(false); }}
              >
                <Text style={{ flex: 1, fontSize: 15, color: '#111827' }}>{item.name}</Text>
                {selectedBank?.code === item.code && <Ionicons name="checkmark" size={18} color="#16a34a" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Balance card */}
      <View className="bg-primary-600 pt-6 pb-10 px-5 items-center">
        <Text className="text-primary-100 text-sm mb-1">Available Balance</Text>
        <Text className="text-white font-bold text-4xl">₦{(wallet?.balance ?? 0).toLocaleString()}</Text>
        <Text className="text-primary-200 text-xs mt-1">{wallet?.currency ?? 'NGN'}</Text>
      </View>

      {/* Action tabs */}
      <View className="mx-4 -mt-5 flex-row gap-3">
        {(['fund', 'withdraw', 'history'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 rounded-2xl py-3.5 items-center ${activeTab === tab ? 'bg-primary-600' : 'bg-white border border-gray-100'}`}
            onPress={() => { setActiveTab(tab); setAmount(''); }}
          >
            <Ionicons
              name={tab === 'fund' ? 'add-circle-outline' : tab === 'withdraw' ? 'arrow-up-circle-outline' : 'time-outline'}
              size={18}
              color={activeTab === tab ? '#fff' : tab === 'fund' ? '#16a34a' : '#6b7280'}
            />
            <Text className={`text-xs font-semibold mt-1 capitalize ${activeTab === tab ? 'text-white' : tab === 'fund' ? 'text-primary-600' : 'text-gray-600'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fund / Withdraw form */}
      {activeTab !== 'history' && (
        <ScrollView className="mx-4 mt-4" keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-2xl p-5 border border-gray-100">
            {activeTab === 'withdraw' && !user?.is_kyc_verified && (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <Text className="text-amber-800 text-xs font-semibold">KYC Required</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Kyc')} className="mt-1">
                  <Text className="text-amber-900 text-xs font-bold underline">Verify Identity →</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'withdraw' && banks.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bank Account</Text>
                <TouchableOpacity
                  className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 flex-row items-center justify-between"
                  onPress={() => setShowBankPicker(true)}
                >
                  <Text className={selectedBank ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
                    {selectedBank ? selectedBank.name : 'Select your bank'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            )}

            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₦)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-4"
              placeholder={activeTab === 'fund' ? 'Min ₦100' : 'Min ₦500'}
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${acting ? 'bg-gray-300' : 'bg-primary-600'}`}
              onPress={activeTab === 'fund' ? handleFund : handleWithdraw}
              disabled={acting}
            >
              {acting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {activeTab === 'fund' ? 'Fund Wallet' : 'Request Withdrawal'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Transaction history */}
      {activeTab === 'history' && (
        <FlatList
          data={transactions}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
          ListHeaderComponent={<Text className="text-gray-900 font-semibold text-base mb-3">Transaction History</Text>}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
              <Text className="text-gray-500 text-sm mt-3">No transactions yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-white rounded-2xl p-4 mb-2 border border-gray-100">
              <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                <Ionicons name={typeIcon(item.type)} size={20} color={typeColor(item.type)} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>{item.description}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">{formatDate(item.created_at)}</Text>
              </View>
              <Text className="text-sm font-bold ml-2" style={{ color: typeColor(item.type) }}>
                {item.type === 'credit' || item.type === 'fund' ? '+' : '-'}₦{item.amount.toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
