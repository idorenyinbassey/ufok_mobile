import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export interface ExistingImage {
  id: number;
  url: string;
  is_primary: boolean;
}

interface Props {
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  existingImages?: ExistingImage[];
  onDeleteExisting?: (id: number) => void;
  deletingId?: number | null;
  max?: number;
}

export default function PropertyImagePicker({
  images, onChange, existingImages = [], onDeleteExisting, deletingId, max = 10,
}: Props) {
  const hasCover = existingImages.some(i => i.is_primary) || (existingImages.length === 0 && images.length > 0);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: max,
      quality: 0.8,
    });
    if (result.canceled) return;

    const picked: PickedImage[] = result.assets.map((asset, i) => ({
      uri: asset.uri,
      name: asset.fileName ?? `photo-${Date.now()}-${i}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    }));
    onChange([...images, ...picked].slice(0, max));
  };

  const removePicked = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Text className="text-xs text-gray-400 mb-2">The first photo is used as the listing cover image.</Text>

      <TouchableOpacity
        className="border-2 border-dashed border-gray-200 rounded-xl py-6 items-center justify-center mb-3"
        onPress={pickImages}
        activeOpacity={0.7}
      >
        <Ionicons name="image-outline" size={28} color="#9ca3af" />
        <Text className="text-gray-500 text-sm mt-2">Tap to add photos</Text>
        <Text className="text-gray-400 text-xs mt-0.5">Up to {max} · JPG, PNG, WebP</Text>
      </TouchableOpacity>

      {(existingImages.length > 0 || images.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
          {existingImages.map(img => (
            <View key={`existing-${img.id}`} className="relative">
              <Image source={{ uri: img.url }} style={{ width: 88, height: 88, borderRadius: 12 }} />
              {img.is_primary && (
                <View className="absolute top-1 left-1 bg-primary-600 rounded px-1.5 py-0.5">
                  <Text className="text-white text-xs font-medium">Cover</Text>
                </View>
              )}
              {onDeleteExisting && (
                <TouchableOpacity
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                  onPress={() => onDeleteExisting(img.id)}
                  disabled={deletingId === img.id}
                >
                  {deletingId === img.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="close" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
          {images.map((img, i) => (
            <View key={`new-${i}`} className="relative">
              <Image source={{ uri: img.uri }} style={{ width: 88, height: 88, borderRadius: 12 }} />
              {existingImages.length === 0 && i === 0 && (
                <View className="absolute top-1 left-1 bg-primary-600 rounded px-1.5 py-0.5">
                  <Text className="text-white text-xs font-medium">Cover</Text>
                </View>
              )}
              <TouchableOpacity
                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                onPress={() => removePicked(i)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
