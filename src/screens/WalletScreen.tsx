import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
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
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'fund' | 'withdraw'>('history');
  const [amount, setAmount] = useState('');
  const [acting, setActing] = useState(false);

  const fetchWallet = async () => {
    const { data } = await api.get('/wallet');
    const walletData = data.data;
    setWallet({ balance: walletData.balance, currency: walletData.currency });
    setTransactions(walletData.transactions?.data ?? []);
  };

  useEffect(() => {
    fetchWallet().catch(() => {}).finally(() => setLoading(false));
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
      const link = data.data?.payment_link ?? data.data?.authorization_url;
      if (link) {
        Alert.alert(
          'Fund Wallet',
          `You will be redirected to complete a payment of ₦${amt.toLocaleString()}.\n\nOpen link: ${link}`,
          [{ text: 'OK' }],
        );
      }
      setAmount('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not initialize payment.');
    } finally {
      setActing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.is_kyc_verified) {
      Alert.alert(
        'KYC Required',
        'You must complete identity verification before withdrawing funds.',
        [
          { text: 'Verify Now', onPress: () => navigation.navigate('Kyc') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal is ₦100.');
      return;
    }
    if (wallet && amt > wallet.balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds to withdraw this amount.');
      return;
    }
    setActing(true);
    try {
      await api.post('/wallet/withdraw', { amount: amt });
      Alert.alert('Success', 'Withdrawal request submitted. You will receive your funds shortly.', [
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
      {/* Balance card */}
      <View className="bg-primary-600 pt-6 pb-10 px-5 items-center">
        <Text className="text-primary-100 text-sm mb-1">Available Balance</Text>
        <Text className="text-white font-bold text-4xl">
          ₦{(wallet?.balance ?? 0).toLocaleString()}
        </Text>
        <Text className="text-primary-200 text-xs mt-1">{wallet?.currency ?? 'NGN'}</Text>
      </View>

      {/* Action buttons */}
      <View className="mx-4 -mt-5 flex-row gap-3">
        <TouchableOpacity
          className={`flex-1 rounded-2xl py-3.5 items-center ${activeTab === 'fund' ? 'bg-primary-600' : 'bg-white border border-gray-100'}`}
          onPress={() => { setActiveTab('fund'); setAmount(''); }}
        >
          <Ionicons name="add-circle-outline" size={18} color={activeTab === 'fund' ? '#fff' : '#16a34a'} />
          <Text className={`text-xs font-semibold mt-1 ${activeTab === 'fund' ? 'text-white' : 'text-primary-600'}`}>
            Fund
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-2xl py-3.5 items-center ${activeTab === 'withdraw' ? 'bg-primary-600' : 'bg-white border border-gray-100'}`}
          onPress={() => { setActiveTab('withdraw'); setAmount(''); }}
        >
          <Ionicons name="arrow-up-circle-outline" size={18} color={activeTab === 'withdraw' ? '#fff' : '#6b7280'} />
          <Text className={`text-xs font-semibold mt-1 ${activeTab === 'withdraw' ? 'text-white' : 'text-gray-600'}`}>
            Withdraw
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-2xl py-3.5 items-center ${activeTab === 'history' ? 'bg-primary-600' : 'bg-white border border-gray-100'}`}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time-outline" size={18} color={activeTab === 'history' ? '#fff' : '#6b7280'} />
          <Text className={`text-xs font-semibold mt-1 ${activeTab === 'history' ? 'text-white' : 'text-gray-600'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fund / Withdraw form */}
      {activeTab !== 'history' && (
        <View className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
          {activeTab === 'withdraw' && !user?.is_kyc_verified && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <Text className="text-amber-800 text-xs font-semibold">⚠ KYC Required</Text>
              <Text className="text-amber-700 text-xs mt-0.5">
                Complete identity verification before withdrawing.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Kyc')} className="mt-2">
                <Text className="text-amber-900 text-xs font-bold underline">Verify Identity →</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'withdraw' && (
            <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <Text className="text-blue-700 text-xs">
                ⚠ Only withdraw after confirming your transactions are valid. Funds will be sent to your registered bank account.
              </Text>
            </View>
          )}

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Amount (₦)
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-4"
            placeholder="0.00"
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
      )}

      {/* Transaction history */}
      {activeTab === 'history' && (
        <FlatList
          data={transactions}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
          ListHeaderComponent={
            <Text className="text-gray-900 font-semibold text-base mb-3">Transaction History</Text>
          }
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
                <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>
                  {item.description}
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">{formatDate(item.created_at)}</Text>
              </View>
              <Text
                className="text-sm font-bold ml-2"
                style={{ color: typeColor(item.type) }}
              >
                {item.type === 'credit' || item.type === 'fund' ? '+' : '-'}₦{item.amount.toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
