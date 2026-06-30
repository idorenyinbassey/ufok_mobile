import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';
import PaymentWebView from '../components/PaymentWebView';

interface InspectionProperty {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  state: string;
  city: string;
}

interface Inspection {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
  payment_status: string;
  scheduled_at: string;
  notes: string | null;
  fee: number;
  property: InspectionProperty;
  created_at: string;
}

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed': return '#16a34a';
    case 'pending': return '#d97706';
    case 'cancelled': return '#dc2626';
    default: return '#6b7280';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'confirmed': return '#f0fdf4';
    case 'pending': return '#fffbeb';
    case 'cancelled': return '#fef2f2';
    default: return '#f9fafb';
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function InspectionScreen({ route }: RootScreenProps<'Inspections'>) {
  const propertyId = route.params?.propertyId;
  const propertyTitle = route.params?.propertyTitle;

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Booking form state
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Payment
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentVisible, setPaymentVisible] = useState(false);

  const fetchInspections = useCallback(async () => {
    const { data } = await api.get('/inspections');
    setInspections(data.data?.data ?? data.data ?? []);
  }, []);

  useEffect(() => {
    fetchInspections().catch(() => {}).finally(() => setLoading(false));
  }, [fetchInspections]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInspections().catch(() => {});
    setRefreshing(false);
  };

  const handleBook = async () => {
    setBookingError(null);

    if (!scheduledAt.trim()) {
      setBookingError('Please enter a date for the inspection.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduledAt.trim())) {
      setBookingError('Please enter the date in YYYY-MM-DD format.');
      return;
    }

    const chosen = new Date(scheduledAt.trim());
    const tomorrow = new Date(getTomorrow());
    chosen.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (chosen < tomorrow) {
      setBookingError('Inspection must be scheduled for at least tomorrow.');
      return;
    }

    if (notes.length > 500) {
      setBookingError('Notes cannot exceed 500 characters.');
      return;
    }

    setBooking(true);
    try {
      const payload: { scheduled_at: string; notes?: string } = {
        scheduled_at: new Date(scheduledAt.trim()).toISOString(),
      };
      if (notes.trim()) payload.notes = notes.trim();

      const { data } = await api.post(`/inspections/${propertyId}/initialize`, payload);
      const { authorization_url } = data.data;

      setPaymentUrl(authorization_url);
      setPaymentVisible(true);
    } catch (err: any) {
      setBookingError(err?.response?.data?.message ?? 'Could not initialize booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handlePaymentClose = async (txRef?: string) => {
    setPaymentVisible(false);
    setPaymentUrl('');
    if (txRef) {
      Alert.alert(
        'Booking Submitted',
        'Your inspection booking has been submitted and is awaiting confirmation.',
        [{ text: 'OK' }],
      );
      setScheduledAt('');
      setNotes('');
      setLoading(true);
      await fetchInspections().catch(() => {});
      setLoading(false);
    }
  };

  const renderInspection = ({ item }: { item: Inspection }) => (
    <View
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
            {item.property.title}
          </Text>
          <View className="flex-row items-center mt-0.5 gap-1">
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text className="text-gray-400 text-xs">
              {item.property.city}, {item.property.state}
            </Text>
          </View>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: statusBg(item.status) }}
        >
          <Text
            className="text-xs font-semibold capitalize"
            style={{ color: statusColor(item.status) }}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 pt-2 border-t border-gray-50">
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={13} color="#6b7280" />
          <Text className="text-gray-500 text-xs">{formatDate(item.scheduled_at)}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="cash-outline" size={13} color="#6b7280" />
          <Text className="text-gray-500 text-xs">
            ₦{item.fee?.toLocaleString() ?? '500'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="card-outline" size={13} color="#6b7280" />
          <Text className="text-gray-500 text-xs capitalize">{item.payment_status}</Text>
        </View>
      </View>

      {item.notes ? (
        <Text className="text-gray-400 text-xs mt-2 italic" numberOfLines={2}>
          {item.notes}
        </Text>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Book mode: show booking form + list below
  if (propertyId) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Property + fee card */}
          <View
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center">
                <Ionicons name="home-outline" size={20} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
                  {propertyTitle ?? 'Property Inspection'}
                </Text>
                <Text className="text-gray-400 text-xs mt-0.5">Book a viewing appointment</Text>
              </View>
            </View>
            <View className="mt-3 pt-3 border-t border-gray-50 flex-row items-center justify-between">
              <Text className="text-gray-500 text-sm">Inspection Fee</Text>
              <Text className="text-primary-600 font-bold text-sm">₦500</Text>
            </View>
          </View>

          {/* Booking form */}
          <View
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
          >
            <Text className="text-gray-900 font-semibold text-base mb-4">Schedule Inspection</Text>

            {bookingError && (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-start gap-2">
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" style={{ marginTop: 1 }} />
                <Text className="text-red-700 text-sm flex-1">{bookingError}</Text>
              </View>
            )}

            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Preferred Date
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={scheduledAt}
              onChangeText={setScheduledAt}
              keyboardType="numbers-and-punctuation"
              returnKeyType="next"
              editable={!booking}
            />

            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Notes{' '}
              <Text className="text-gray-400 font-normal normal-case">(optional)</Text>
            </Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-1"
              placeholder="Any specific requests or questions for the landlord..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 96 }}
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              editable={!booking}
            />
            <Text className="text-gray-400 text-xs text-right mb-4">{notes.length}/500</Text>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${booking ? 'bg-gray-300' : 'bg-primary-600'}`}
              onPress={handleBook}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text className="text-white font-bold text-base">Initialize Booking & Pay</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Previous inspections for this property */}
          {inspections.filter(i => i.property.id === propertyId).length > 0 && (
            <View>
              <Text className="text-gray-900 font-semibold text-base mb-3">Your Bookings</Text>
              {inspections
                .filter(i => i.property.id === propertyId)
                .map(item => (
                  <View key={item.id}>{renderInspection({ item })}</View>
                ))}
            </View>
          )}
        </ScrollView>

        <PaymentWebView
          url={paymentUrl}
          visible={paymentVisible}
          title="Pay Inspection Fee"
          onClose={handlePaymentClose}
        />
      </View>
    );
  }

  // List mode: all inspections
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={inspections}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
        }
        ListHeaderComponent={
          inspections.length > 0 ? (
            <Text className="text-gray-900 font-semibold text-base mb-3">
              My Inspections ({inspections.length})
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-24 px-8">
            <View className="w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="search-outline" size={32} color="#d1d5db" />
            </View>
            <Text className="text-gray-900 font-semibold text-lg">No inspections yet</Text>
            <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
              Browse properties and book an inspection to see them here.
            </Text>
          </View>
        }
        renderItem={renderInspection}
      />
    </View>
  );
}
