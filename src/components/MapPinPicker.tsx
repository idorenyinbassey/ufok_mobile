import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface Props {
  visible: boolean;
  initial?: LatLng;
  onConfirm: (coords: LatLng) => void;
  onClose: () => void;
}

const NIGERIA_CENTER: Region = {
  latitude: 9.082,
  longitude: 8.6753,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export default function MapPinPicker({ visible, initial, onConfirm, onClose }: Props) {
  const mapRef = useRef<MapView>(null);
  const [pin, setPin] = useState<LatLng | null>(initial ?? null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (visible && initial) setPin(initial);
  }, [visible]);

  const handleMapPress = (e: MapPressEvent) => {
    setPin(e.nativeEvent.coordinate);
  };

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPin(coords);
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    } catch {}
    finally { setLocating(false); }
  };

  const handleConfirm = () => {
    if (pin) onConfirm(pin);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 14,
          borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
        }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontWeight: '700', fontSize: 16, color: '#111827' }}>
            Pin Property Location
          </Text>
          <TouchableOpacity
            onPress={goToMyLocation}
            style={{ marginRight: 12 }}
            disabled={locating}
          >
            {locating
              ? <ActivityIndicator size="small" color="#16a34a" />
              : <Ionicons name="locate-outline" size={22} color="#16a34a" />
            }
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#15803d', fontSize: 12 }}>
            Tap the map to drop a pin at the property's exact location.
          </Text>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={
            initial
              ? { ...initial, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : NIGERIA_CENTER
          }
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {pin && (
            <Marker
              coordinate={pin}
              draggable
              onDragEnd={e => setPin(e.nativeEvent.coordinate)}
              pinColor="#16a34a"
            />
          )}
        </MapView>

        {/* Footer */}
        <View style={{
          paddingHorizontal: 16, paddingVertical: 14,
          borderTopWidth: 1, borderTopColor: '#e5e7eb',
          backgroundColor: '#fff',
          paddingBottom: Platform.OS === 'ios' ? 24 : 14,
        }}>
          {pin && (
            <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginBottom: 10 }}>
              {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
            </Text>
          )}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!pin}
            style={{
              backgroundColor: pin ? '#16a34a' : '#d1d5db',
              borderRadius: 12, paddingVertical: 16, alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {pin ? 'Confirm Location' : 'Tap map to place pin'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
