import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

interface Property {
  id: number;
  slug: string;
  title: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  city: string;
  state: string;
  image: string | null;
  lister: { name: string; is_professionally_verified: boolean } | null;
}

interface MapFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    id: number;
    title: string;
    slug: string;
    price: string;
    type: string;
    bedrooms: number;
    image: string | null;
  };
}

const NIGERIA_REGION: Region = {
  latitude: 9.082,
  longitude: 8.6753,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export default function BrowseScreen() {
  const navigation = useNavigation<any>();

  // List state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved] = useState<Set<number>>(new Set());

  // Map state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  const fetchProperties = useCallback(async (pageNum: number, query: string, append: boolean) => {
    const { data } = await api.get('/properties', {
      params: { page: pageNum, search: query || undefined, per_page: 15 },
    });
    const items: Property[] = data.data?.data ?? data.data ?? [];
    const meta = data.data?.meta ?? data.meta;
    setHasMore(meta ? pageNum < meta.last_page : items.length === 15);
    setProperties(prev => append ? [...prev, ...items] : items);
  }, []);

  const fetchMapFeatures = useCallback(async (query?: string) => {
    setMapLoading(true);
    try {
      const { data } = await api.get('/search/geojson', {
        params: { search: query || undefined },
      });
      setMapFeatures(data.features ?? []);
    } catch {}
    finally { setMapLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProperties(1, '', false).finally(() => setLoading(false));
  }, [fetchProperties]);

  // Load map data when switching to map view
  useEffect(() => {
    if (viewMode === 'map' && mapFeatures.length === 0) {
      fetchMapFeatures(searchQuery);
    }
  }, [viewMode]);

  const handleSearch = async () => {
    setLoading(true);
    setPage(1);
    setSearchQuery(search);
    try { await fetchProperties(1, search, false); } catch {}
    setLoading(false);
    if (viewMode === 'map') fetchMapFeatures(search);
  };

  const handleClear = () => {
    setSearch('');
    setSearchQuery('');
    setLoading(true);
    setPage(1);
    fetchProperties(1, '', false).finally(() => setLoading(false));
    if (viewMode === 'map') fetchMapFeatures('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    try { await fetchProperties(1, searchQuery, false); } catch {}
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try { await fetchProperties(next, searchQuery, true); } catch {}
    setPage(next);
    setLoadingMore(false);
  };

  const handleSave = async (id: number) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    try {
      await api.post(`/properties/${id}/save`);
    } catch {
      setSaved(prev => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
    }
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden border border-gray-100"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
      onPress={() => navigation.navigate('PropertyDetail', { slug: item.slug })}
      activeOpacity={0.8}
    >
      <View style={{ height: 176 }} className="bg-gray-200">
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: 176 }} resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="home-outline" size={40} color="#d1d5db" />
          </View>
        )}
        <View className="absolute top-3 left-3 bg-primary-600 rounded-full px-2.5 py-1">
          <Text className="text-white text-xs font-semibold capitalize">{item.type}</Text>
        </View>
        <TouchableOpacity
          className="absolute top-3 right-3 bg-white/90 rounded-full w-8 h-8 items-center justify-center"
          onPress={() => handleSave(item.id)}
        >
          <Ionicons
            name={saved.has(item.id) ? 'heart' : 'heart-outline'}
            size={16}
            color={saved.has(item.id) ? '#dc2626' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>
      <View className="p-4">
        <Text className="text-primary-600 font-bold text-lg">
          ₦{(item.price ?? 0).toLocaleString()}
          <Text className="text-gray-400 text-sm font-normal">/yr</Text>
        </Text>
        <Text className="text-gray-900 font-semibold text-base mt-0.5" numberOfLines={2}>{item.title}</Text>
        <View className="flex-row items-center mt-2 gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="bed-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.bedrooms} bed</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="water-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.bathrooms} bath</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{item.city}, {item.state}</Text>
          </View>
        </View>
        {item.lister && (
          <View className="flex-row items-center mt-2 gap-1">
            <Text className="text-gray-400 text-xs">{item.lister.name}</Text>
            {item.lister.is_professionally_verified && (
              <View className="flex-row items-center gap-0.5 bg-green-50 border border-green-100 rounded-full px-1.5 py-0.5">
                <Ionicons name="checkmark-circle" size={10} color="#16a34a" />
                <Text className="text-green-700 text-xs font-medium">Verified</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search + view toggle bar */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 text-sm text-gray-900"
              placeholder="Search properties, cities..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          {/* List / Map toggle */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 gap-0.5">
            <TouchableOpacity
              className={`w-9 h-9 rounded-lg items-center justify-center ${viewMode === 'list' ? 'bg-white' : ''}`}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#16a34a' : '#9ca3af'} />
            </TouchableOpacity>
            <TouchableOpacity
              className={`w-9 h-9 rounded-lg items-center justify-center ${viewMode === 'map' ? 'bg-white' : ''}`}
              onPress={() => setViewMode('map')}
            >
              <Ionicons name="map-outline" size={18} color={viewMode === 'map' ? '#16a34a' : '#9ca3af'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : (
          <FlatList
            data={properties}
            keyExtractor={item => String(item.id)}
            renderItem={renderProperty}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} color="#16a34a" /> : null}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Ionicons name="home-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-4 text-base">No properties found</Text>
              </View>
            }
          />
        )
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <View className="flex-1">
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={NIGERIA_REGION}
            showsUserLocation
            showsMyLocationButton
          >
            {mapFeatures.map(f => {
              const [lng, lat] = f.geometry.coordinates;
              return (
                <Marker
                  key={f.properties.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  pinColor="#16a34a"
                >
                  <Callout
                    tooltip
                    onPress={() => navigation.navigate('PropertyDetail', { slug: f.properties.slug })}
                  >
                    <View style={{
                      backgroundColor: '#fff', borderRadius: 12, padding: 10,
                      width: 200, shadowColor: '#000', shadowOpacity: 0.1,
                      shadowRadius: 8, elevation: 4,
                    }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: '#15803d' }}>
                        {f.properties.price}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#111827', marginTop: 2 }} numberOfLines={2}>
                        {f.properties.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                        <Text style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>
                          {f.properties.type}
                        </Text>
                        {f.properties.bedrooms > 0 && (
                          <Text style={{ fontSize: 11, color: '#6b7280' }}>
                            · {f.properties.bedrooms} bed
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: '#16a34a', marginTop: 6, fontWeight: '600' }}>
                        Tap to view →
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>

          {mapLoading && (
            <View className="absolute top-4 self-center bg-white rounded-full px-4 py-2 flex-row items-center gap-2"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text className="text-gray-600 text-xs font-medium">Loading map…</Text>
            </View>
          )}

          {!mapLoading && mapFeatures.length === 0 && (
            <View className="absolute top-4 self-center bg-white rounded-full px-4 py-2"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
              <Text className="text-gray-500 text-xs">No pinned properties in this area yet</Text>
            </View>
          )}

          {!mapLoading && mapFeatures.length > 0 && (
            <View className="absolute top-4 self-center bg-white rounded-full px-4 py-2"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}>
              <Text className="text-gray-600 text-xs font-medium">{mapFeatures.length} properties on map</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
