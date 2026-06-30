import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuthStore } from '../stores/auth';
import type { RootScreenProps } from '../navigation/types';

const { width } = Dimensions.get('window');

interface PropertyDetail {
  id: number;
  slug: string;
  title: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  state: string;
  description: string;
  amenities: string[];
  images: { id: number; cloudinary_url: string }[];
  lister: {
    id: number;
    name: string;
    role: string;
    is_professionally_verified: boolean;
  } | null;
}

export default function PropertyDetailScreen({ route, navigation }: RootScreenProps<'PropertyDetail'>) {
  const { slug } = route.params;
  const { user } = useAuthStore();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    api.get(`/properties/${slug}`)
      .then(({ data }) => setProperty(data.data))
      .catch(() => Alert.alert('Error', 'Could not load property.'))
      .finally(() => setLoading(false));
  }, [slug]);

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
                  source={{ uri: img.cloudinary_url }}
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
            ₦{property.price.toLocaleString()}
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
        <View className="px-5 py-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
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
        </View>
      )}
    </View>
  );
}
