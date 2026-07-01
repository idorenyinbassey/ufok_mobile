import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuthStore } from '../stores/auth';
import type { RootScreenProps } from '../navigation/types';
import PaymentWebView from '../components/PaymentWebView';

const { width } = Dimensions.get('window');

interface PropertyDetail {
  id: number;
  slug: string;
  title: string;
  price: number;
  type: string;
  transaction_type: string;
  is_featured: boolean;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  state: string;
  description: string;
  amenities: string[];
  images: { id: number; url: string }[];
  reservation: {
    is_reserved: boolean;
    reserved_by_me: boolean;
    expires_at: string | null;
    fee: number;
  };
  lister: {
    id: number;
    name: string;
    role: string;
    is_professionally_verified: boolean;
  } | null;
}

function timeUntil(dateStr: string): string {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs <= 0) return 'soon';
  const hours = Math.round(diffMs / 3_600_000);
  return hours <= 1 ? '1 hour' : `${hours} hours`;
}

export default function PropertyDetailScreen({ route, navigation }: RootScreenProps<'PropertyDetail'>) {
  const { slug } = route.params;
  const { user } = useAuthStore();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'reserve' | 'pay' | null>(null);

  const fetchProperty = () =>
    api.get(`/properties/${slug}`)
      .then(({ data }) => setProperty(data.data?.property ?? data.data));

  useEffect(() => {
    fetchProperty()
      .catch(() => Alert.alert('Error', 'Could not load property.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      await api.post(`/properties/${property.id}/save`);
    } catch {
      setSaved(!newSaved);
    } finally {
      setSaving(false);
    }
  };

  const handleContact = async () => {
    if (!property) return;
    setContacting(true);
    try {
      const { data } = await api.post('/conversations', { property_id: property.id });
      const conv = data.data;
      navigation.navigate('ChatWindow', {
        conversationId: conv.id,
        title: property.lister?.name ?? 'Lister',
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not start conversation.');
    } finally {
      setContacting(false);
    }
  };

  const handleReserve = async () => {
    if (!property) return;
    setReserving(true);
    try {
      const { data } = await api.post(`/properties/${property.id}/reserve`);
      if (data.data?.already_reserved) {
        Alert.alert('Already Reserved', data.message ?? 'You already have an active reservation for this listing.');
        await fetchProperty().catch(() => {});
        return;
      }
      setPaymentMode('reserve');
      setPaymentUrl(data.data.authorization_url);
      setPaymentVisible(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not initialize reservation. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const handlePay = () => {
    if (!property) return;
    const type = ['rent', 'lease'].includes(property.transaction_type) ? 'rent_payment' : 'sale_deposit';
    Alert.alert(
      'Inspect Before Paying',
      'Only release payment after physically inspecting the property and confirming it matches the listing. Ufok is not liable for payments made without a physical inspection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I've Inspected — Pay Now",
          onPress: async () => {
            if (!property) return;
            setPaying(true);
            try {
              const { data } = await api.post('/payments/initialize', {
                property_id: property.id,
                type,
              });
              setPaymentMode('pay');
              setPaymentUrl(data.data.authorization_url);
              setPaymentVisible(true);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message ?? 'Could not initialize payment. Please try again.');
            } finally {
              setPaying(false);
            }
          },
        },
      ],
    );
  };

  const handlePaymentClose = async (txRef?: string) => {
    const mode = paymentMode;
    setPaymentVisible(false);
    setPaymentUrl('');
    setPaymentMode(null);

    if (!txRef || !mode) return;

    try {
      if (mode === 'reserve') {
        const { data } = await api.post('/reservations/activate', { tx_ref: txRef });
        Alert.alert('Listing Reserved', data.message ?? 'Contact the landlord/agent within 24 hours to keep your reservation active.');
      } else {
        const { data } = await api.post('/payments/activate', { tx_ref: txRef });
        Alert.alert('Payment Confirmed', data.message ?? 'Your payment is being processed.');
      }
    } catch (err: any) {
      Alert.alert('Verify Payment', err?.response?.data?.message ?? 'Payment could not be verified. It may take a moment to reflect.');
    } finally {
      await fetchProperty().catch(() => {});
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!property) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Ionicons name="home-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-500 mt-4 text-center">Property not found.</Text>
      </View>
    );
  }

  const images = property.images ?? [];
  const isTenant = user?.role === 'tenant';
  const isOwner = user?.id === property.lister?.id;

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={{ height: 264 }} className="bg-gray-200">
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={e => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              scrollEventThrottle={16}
            >
              {images.map(img => (
                <Image
                  key={img.id}
                  source={{ uri: img.url }}
                  style={{ width, height: 264 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="home-outline" size={56} color="#d1d5db" />
            </View>
          )}
          {images.length > 1 && (
            <View className="absolute bottom-3 self-center flex-row gap-1">
              {images.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === imgIndex ? 16 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View className="px-5 pt-5 pb-8">
          <Text className="text-primary-600 font-bold text-2xl">
            ₦{(property.price ?? 0).toLocaleString()}
            <Text className="text-gray-400 text-base font-normal">/yr</Text>
          </Text>
          <Text className="text-gray-900 font-bold text-xl mt-1">{property.title}</Text>

          <View className="flex-row items-center gap-1 mt-2">
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Text className="text-gray-500 text-sm flex-1" numberOfLines={2}>
              {property.address}, {property.city}, {property.state}
            </Text>
          </View>

          {/* Stats */}
          <View className="flex-row gap-3 mt-5">
            {[
              { icon: 'bed-outline' as const, label: `${property.bedrooms} Bed` },
              { icon: 'water-outline' as const, label: `${property.bathrooms} Bath` },
              { icon: 'home-outline' as const, label: property.type },
            ].map(s => (
              <View key={s.label} className="flex-1 bg-gray-50 rounded-xl py-3 items-center gap-1">
                <Ionicons name={s.icon} size={18} color="#16a34a" />
                <Text className="text-gray-700 text-xs font-semibold capitalize">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {!!property.description && (
            <>
              <Text className="text-gray-900 font-bold text-base mt-6 mb-2">Description</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">{property.description}</Text>
            </>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <>
              <Text className="text-gray-900 font-bold text-base mt-6 mb-3">Amenities</Text>
              <View className="flex-row flex-wrap gap-2">
                {property.amenities.map(a => (
                  <View key={a} className="bg-primary-50 rounded-full px-3 py-1.5">
                    <Text className="text-primary-700 text-xs font-medium capitalize">{a.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Lister */}
          {property.lister && (
            <>
              <Text className="text-gray-900 font-bold text-base mt-6 mb-3">Listed by</Text>
              <View className="flex-row items-center gap-3 bg-gray-50 rounded-2xl p-4">
                <View className="w-12 h-12 bg-primary-600 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-lg">
                    {property.lister.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-gray-900 font-semibold">{property.lister.name}</Text>
                    {property.lister.is_professionally_verified && (
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    )}
                  </View>
                  <Text className="text-gray-500 text-xs capitalize mt-0.5">{property.lister.role}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {!isOwner && isTenant && (
        <View className="px-5 py-4 bg-white border-t border-gray-100 gap-3">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary-600 rounded-xl py-4 items-center"
              onPress={handleContact}
              disabled={contacting}
            >
              {contacting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                  <Text className="text-white font-bold text-base">Contact Lister</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="w-14 rounded-xl border border-gray-200 items-center justify-center"
              onPress={handleSave}
              disabled={saving}
            >
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={22}
                color={saved ? '#dc2626' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>
          {property.reservation.reserved_by_me ? (
            <View className="flex-row items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <View>
                <Text className="text-green-800 font-semibold text-xs">Reserved by you</Text>
                {property.reservation.expires_at && (
                  <Text className="text-green-600 text-xs">Expires in {timeUntil(property.reservation.expires_at)}</Text>
                )}
              </View>
            </View>
          ) : property.reservation.is_reserved ? (
            <View className="flex-row items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5">
              <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" />
              <View>
                <Text className="text-gray-600 font-semibold text-xs">Currently reserved</Text>
                {property.reservation.expires_at && (
                  <Text className="text-gray-400 text-xs">Available in {timeUntil(property.reservation.expires_at)}</Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              className={`w-full border rounded-xl py-3.5 items-center ${reserving ? 'border-gray-200' : 'border-primary-600'}`}
              onPress={handleReserve}
              disabled={reserving}
            >
              {reserving ? (
                <ActivityIndicator color="#16a34a" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="bookmark-outline" size={18} color="#16a34a" />
                  <Text className="text-primary-600 font-bold text-base">
                    Reserve Listing (₦{property.reservation.fee.toLocaleString()})
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className={`w-full rounded-xl py-3.5 items-center ${paying ? 'bg-gray-300' : 'bg-yellow-400'}`}
            onPress={handlePay}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="card-outline" size={18} color="#111827" />
                <Text className="text-gray-900 font-bold text-base">Pay Now via Flutterwave</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      <PaymentWebView
        url={paymentUrl}
        visible={paymentVisible}
        title={paymentMode === 'reserve' ? 'Reserve Listing' : 'Complete Payment'}
        onClose={handlePaymentClose}
      />
    </View>
  );
}
