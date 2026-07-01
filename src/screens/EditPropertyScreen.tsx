import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import LgaPicker from '../components/LgaPicker';
import PropertyImagePicker, { PickedImage, ExistingImage } from '../components/PropertyImagePicker';
import { useAuthStore } from '../stores/auth';
import {
  AMENITY_OPTIONS, COMMISSION_RATES, pricePeriodOptionsFor, defaultPricePeriodFor,
} from '../utils/propertyForm';
import type { RootScreenProps } from '../navigation/types';

// ─── Constants (shared with CreatePropertyScreen) ────────────────────────────

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const PROPERTY_TYPES = [
  { value: 'apartment',   label: 'Apartment' },
  { value: 'house',       label: 'House' },
  { value: 'land',        label: 'Land' },
  { value: 'commercial',  label: 'Commercial' },
  { value: 'shortlet',    label: 'Shortlet' },
];

const TRANSACTION_TYPES = [
  { value: 'rent',     label: 'Rent' },
  { value: 'sale',     label: 'Sale' },
  { value: 'lease',    label: 'Lease' },
  { value: 'shortlet', label: 'Shortlet' },
];

const FURNISHINGS = [
  { value: 'furnished',       label: 'Furnished' },
  { value: 'semi-furnished',  label: 'Semi-Furnished' },
  { value: 'unfurnished',     label: 'Unfurnished' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {children}
    </Text>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 px-4 pt-4 pb-1 mb-4">
      {children}
    </View>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <Text className="text-gray-900 font-semibold text-base mb-4">{children}</Text>
  );
}

interface ChipPickerProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}
function ChipPicker<T extends string>({ options, value, onChange }: ChipPickerProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
    >
      {options.map(opt => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`rounded-full px-4 py-2 border ${
              selected ? 'bg-primary-600 border-primary-600' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface CounterInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}
function CounterInput({ label, value, onChange }: CounterInputProps) {
  const num = parseInt(value, 10) || 0;
  return (
    <View className="flex-1">
      <SectionLabel>{label}</SectionLabel>
      <View className="flex-row items-center border border-gray-200 rounded-xl bg-white mb-4 overflow-hidden">
        <TouchableOpacity
          className="px-3.5 py-3.5 items-center justify-center"
          onPress={() => onChange(String(Math.max(0, num - 1)))}
        >
          <Ionicons name="remove" size={18} color="#6b7280" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-base text-gray-900 font-semibold">{num}</Text>
        </View>
        <TouchableOpacity
          className="px-3.5 py-3.5 items-center justify-center"
          onPress={() => onChange(String(num + 1))}
        >
          <Ionicons name="add" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditPropertyScreen({ navigation, route }: RootScreenProps<'EditProperty'>) {
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Basic Info
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');

  // Property Details
  const [type, setType]                       = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [price, setPrice]                     = useState('');
  const [pricePeriod, setPricePeriod]         = useState('');
  const [commissionRate, setCommissionRate]   = useState('10');

  // Location
  const [address, setAddress] = useState('');
  const [state, setState]     = useState('');
  const [lga, setLga]         = useState('');
  const [city, setCity]       = useState('');

  // State picker
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateQuery, setStateQuery]           = useState('');

  // Features
  const [bedrooms, setBedrooms]             = useState('0');
  const [bathrooms, setBathrooms]           = useState('0');
  const [toilets, setToilets]               = useState('0');
  const [parkingSpaces, setParkingSpaces]   = useState('0');
  const [furnishing, setFurnishing]         = useState('');

  // Amenities
  const [amenities, setAmenities] = useState<string[]>([]);

  // Fees
  const [cautionFee, setCautionFee] = useState('');
  const [agencyFee, setAgencyFee]   = useState('');

  // Photos
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages]           = useState<PickedImage[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const isAgent = user?.role === 'agent';

  const toggleAmenity = useCallback((val: string) => {
    setAmenities(prev =>
      prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val],
    );
  }, []);

  const handleTransactionTypeChange = (val: string) => {
    setTransactionType(val);
    setPricePeriod(defaultPricePeriodFor(val));
  };

  const filteredStates = NIGERIAN_STATES.filter(s =>
    s.toLowerCase().includes(stateQuery.toLowerCase()),
  );

  // ── Fetch current property data ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchProperty = async () => {
      try {
        // Fetch from /properties/mine and find by id
        const { data } = await api.get('/properties/mine', {
          params: { per_page: 50 },
        });
        const list: any[] = data.data?.data ?? data.data ?? [];
        const found = list.find((p: any) => p.id === id);

        if (!found) {
          if (!cancelled) setFetchError('Property not found.');
          return;
        }

        // If we have a slug, try to get the full detail record
        let property = found;
        if (found.slug) {
          try {
            const detail = await api.get(`/properties/${found.slug}`);
            property = detail.data?.data ?? found;
          } catch {
            // Fall back to the listing data
          }
        }

        if (cancelled) return;

        // Pre-fill state
        setTitle(property.title ?? '');
        setDescription(property.description ?? '');
        setType(property.type ?? '');
        setTransactionType(property.transaction_type ?? '');
        setPrice(property.price != null ? String(property.price) : '');
        setPricePeriod(property.price_period ?? '');
        setAddress(property.address ?? '');
        setState(property.state ?? '');
        setLga(property.lga ?? '');
        setCity(property.city ?? '');
        setBedrooms(property.bedrooms != null ? String(property.bedrooms) : '0');
        setBathrooms(property.bathrooms != null ? String(property.bathrooms) : '0');
        setToilets(property.toilets != null ? String(property.toilets) : '0');
        setParkingSpaces(property.parking_spaces != null ? String(property.parking_spaces) : '0');
        setFurnishing(property.furnishing ?? '');
        setAmenities(Array.isArray(property.amenities) ? property.amenities : []);
        setCautionFee(property.caution_fee != null ? String(property.caution_fee) : '');
        setAgencyFee(property.agency_fee != null ? String(property.agency_fee) : '');
        setCommissionRate(property.commission_rate ? String(property.commission_rate) : '10');
        setExistingImages(Array.isArray(property.images) ? property.images : []);
      } catch (err: any) {
        if (!cancelled) {
          setFetchError(
            err?.response?.data?.message ?? 'Failed to load property details.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProperty();
    return () => { cancelled = true; };
  }, [id]);

  // ── Delete an already-uploaded image ──────────────────────────────────────
  const handleDeleteExisting = (imageId: number) => {
    Alert.alert('Remove Photo', 'Remove this photo from the listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeletingImageId(imageId);
          try {
            const { data } = await api.delete(`/properties/${id}/images/${imageId}`);
            setExistingImages(data.data?.images ?? existingImages.filter(i => i.id !== imageId));
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Could not remove photo.');
          } finally {
            setDeletingImageId(null);
          }
        },
      },
    ]);
  };

  // ── Submit partial update ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }
    if (description.trim().length > 0 && description.trim().length < 30) {
      Alert.alert('Validation Error', 'Description must be at least 30 characters.');
      return;
    }
    if (description.trim().length > 600) {
      Alert.alert('Validation Error', 'Description must not exceed 600 characters.');
      return;
    }
    if (price.trim() && (isNaN(Number(price)) || Number(price) < 1)) {
      Alert.alert('Validation Error', 'Price must be a valid number (min 1).');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('_method', 'PUT');

      if (title.trim())        form.append('title', title.trim());
      if (description.trim())  form.append('description', description.trim());
      if (type)                form.append('type', type);
      if (transactionType)     form.append('transaction_type', transactionType);
      if (price.trim())        form.append('price', String(Number(price)));
      if (pricePeriod)         form.append('price_period', pricePeriod);
      if (address.trim())      form.append('address', address.trim());
      if (state.trim())        form.append('state', state.trim());
      if (lga.trim())          form.append('lga', lga.trim());
      if (city.trim())         form.append('city', city.trim());

      form.append('bedrooms', String(parseInt(bedrooms, 10) || 0));
      form.append('bathrooms', String(parseInt(bathrooms, 10) || 0));
      form.append('toilets', String(parseInt(toilets, 10) || 0));
      form.append('parking_spaces', String(parseInt(parkingSpaces, 10) || 0));

      if (furnishing) form.append('furnishing', furnishing);
      amenities.forEach(a => form.append('amenities[]', a));

      if (cautionFee.trim() && !isNaN(Number(cautionFee))) form.append('caution_fee', cautionFee);
      if (agencyFee.trim()  && !isNaN(Number(agencyFee)))  form.append('agency_fee', agencyFee);
      if (isAgent) form.append('commission_rate', commissionRate);

      newImages.forEach(img => {
        form.append('images[]', { uri: img.uri, name: img.name, type: img.type } as any);
      });

      await api.post(`/properties/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Updated', 'Property updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const firstMsg = errors
        ? (Object.values(errors)[0] as string[])?.[0]
        : (err?.response?.data?.message ?? 'Update failed. Please try again.');
      Alert.alert('Error', firstMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-500 text-sm mt-3">Loading property details...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text className="text-gray-900 font-semibold text-base mt-4 text-center">{fetchError}</Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-xl px-6 py-3 mt-6"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-semibold text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const descLen = description.length;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-5 pb-10">

          {/* ── 1. Basic Info ── */}
          <SectionCard>
            <SectionHeading>Basic Info</SectionHeading>

            <SectionLabel>Title</SectionLabel>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="e.g. Spacious 3-Bedroom Flat in Lekki Phase 1"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={255}
              returnKeyType="next"
            />

            <SectionLabel>Description</SectionLabel>
            <View className="border border-gray-200 rounded-xl bg-white mb-1 overflow-hidden">
              <TextInput
                className="px-4 py-3 text-base text-gray-900"
                placeholder="Describe the property (30–600 characters)..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                maxLength={600}
                style={{ minHeight: 90 }}
              />
            </View>
            <View className="flex-row justify-end mb-4">
              <Text
                className={`text-xs font-medium ${
                  descLen > 0 && (descLen < 30 || descLen > 600)
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}
              >
                {descLen}/600
              </Text>
            </View>
          </SectionCard>

          {/* ── 2. Property Details ── */}
          <SectionCard>
            <SectionHeading>Property Details</SectionHeading>

            <SectionLabel>Property Type</SectionLabel>
            <ChipPicker
              options={PROPERTY_TYPES}
              value={type}
              onChange={setType}
            />

            <SectionLabel>Transaction Type</SectionLabel>
            <ChipPicker
              options={TRANSACTION_TYPES}
              value={transactionType}
              onChange={handleTransactionTypeChange}
            />

            <SectionLabel>Price (₦)</SectionLabel>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="e.g. 1500000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={price}
              onChangeText={t => setPrice(t.replace(/[^0-9.]/g, ''))}
              returnKeyType="done"
            />

            <SectionLabel>Price Period</SectionLabel>
            <ChipPicker
              options={pricePeriodOptionsFor(transactionType)}
              value={pricePeriod}
              onChange={setPricePeriod}
            />

            {isAgent && (
              <>
                <SectionLabel>Agent Commission</SectionLabel>
                <ChipPicker
                  options={COMMISSION_RATES as unknown as { value: string; label: string }[]}
                  value={commissionRate}
                  onChange={setCommissionRate}
                />
              </>
            )}
          </SectionCard>

          {/* ── 3. Location ── */}
          <SectionCard>
            <SectionHeading>Location</SectionHeading>

            <SectionLabel>Address</SectionLabel>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="Street address"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
            />

            <SectionLabel>State</SectionLabel>
            <TouchableOpacity
              className="border border-gray-200 rounded-xl px-4 py-3.5 bg-white mb-1 flex-row items-center justify-between"
              onPress={() => {
                setShowStatePicker(v => !v);
                setStateQuery('');
              }}
              activeOpacity={0.7}
            >
              <Text className={state ? 'text-base text-gray-900' : 'text-base text-gray-400'}>
                {state || 'Select state'}
              </Text>
              <Ionicons
                name={showStatePicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>

            {showStatePicker && (
              <View className="border border-gray-200 rounded-xl bg-white mb-4 overflow-hidden">
                <View className="border-b border-gray-100 px-3 py-2 flex-row items-center">
                  <Ionicons name="search-outline" size={16} color="#9ca3af" />
                  <TextInput
                    className="flex-1 ml-2 text-sm text-gray-900 py-0"
                    placeholder="Search state..."
                    placeholderTextColor="#9ca3af"
                    value={stateQuery}
                    onChangeText={setStateQuery}
                    autoFocus
                  />
                </View>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {filteredStates.map(s => (
                    <TouchableOpacity
                      key={s}
                      className={`px-4 py-3 border-b border-gray-50 flex-row items-center justify-between ${
                        state === s ? 'bg-primary-50' : ''
                      }`}
                      onPress={() => {
                        if (s !== state) setLga('');
                        setState(s);
                        setShowStatePicker(false);
                        setStateQuery('');
                      }}
                    >
                      <Text
                        className={`text-sm ${
                          state === s ? 'text-primary-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {s}
                      </Text>
                      {state === s && (
                        <Ionicons name="checkmark" size={16} color="#16a34a" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {!showStatePicker && <View className="mb-4" />}

            <SectionLabel>LGA</SectionLabel>
            <LgaPicker state={state} value={lga} onChange={setLga} />

            <SectionLabel>City</SectionLabel>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="City / Neighbourhood"
              placeholderTextColor="#9ca3af"
              value={city}
              onChangeText={setCity}
              returnKeyType="done"
            />
          </SectionCard>

          {/* ── 4. Features ── */}
          <SectionCard>
            <SectionHeading>Features</SectionHeading>

            <View className="flex-row gap-3">
              <CounterInput label="Bedrooms" value={bedrooms} onChange={setBedrooms} />
              <CounterInput label="Bathrooms" value={bathrooms} onChange={setBathrooms} />
            </View>
            <View className="flex-row gap-3">
              <CounterInput label="Toilets" value={toilets} onChange={setToilets} />
              <CounterInput label="Parking" value={parkingSpaces} onChange={setParkingSpaces} />
            </View>

            <SectionLabel>Furnishing</SectionLabel>
            <ChipPicker
              options={FURNISHINGS}
              value={furnishing}
              onChange={setFurnishing}
            />
          </SectionCard>

          {/* ── 5. Amenities ── */}
          <SectionCard>
            <SectionHeading>Amenities</SectionHeading>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {AMENITY_OPTIONS.map(opt => {
                const selected = amenities.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => toggleAmenity(opt.value)}
                    className={`rounded-full px-3.5 py-2 border flex-row items-center gap-1.5 ${
                      selected
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        selected ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── 6. Additional Fees ── */}
          <SectionCard>
            <SectionHeading>Additional Fees</SectionHeading>

            <SectionLabel>Caution Fee (₦)</SectionLabel>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="e.g. 50000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={cautionFee}
              onChangeText={t => setCautionFee(t.replace(/[^0-9.]/g, ''))}
              returnKeyType="next"
            />

            <SectionLabel>Agency Fee (₦)</SectionLabel>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="e.g. 75000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={agencyFee}
              onChangeText={t => setAgencyFee(t.replace(/[^0-9.]/g, ''))}
              returnKeyType="done"
            />
          </SectionCard>

          {/* ── 7. Photos ── */}
          <SectionCard>
            <SectionHeading>Photos</SectionHeading>
            <PropertyImagePicker
              images={newImages}
              onChange={setNewImages}
              existingImages={existingImages}
              onDeleteExisting={handleDeleteExisting}
              deletingId={deletingImageId}
            />
          </SectionCard>

          {/* ── 8. Save Button ── */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-2 ${
              submitting ? 'bg-primary-600 opacity-70' : 'bg-primary-600'
            }`}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>

          <View className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 flex-row items-start gap-3">
            <Ionicons name="information-circle-outline" size={18} color="#d97706" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-amber-700 text-xs leading-5">
              Saving changes resubmits this listing for admin review.
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
