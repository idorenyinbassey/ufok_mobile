import React, { useState, useCallback } from 'react';
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
import type { RootScreenProps } from '../navigation/types';

// ─── Constants ───────────────────────────────────────────────────────────────

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

const PRICE_PERIODS = [
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'daily',    label: 'Daily' },
  { value: 'outright', label: 'Outright' },
];

const FURNISHINGS = [
  { value: 'furnished',       label: 'Furnished' },
  { value: 'semi-furnished',  label: 'Semi-Furnished' },
  { value: 'unfurnished',     label: 'Unfurnished' },
];

const AMENITY_OPTIONS = [
  { value: 'wifi',             label: 'WiFi' },
  { value: 'parking',          label: 'Parking' },
  { value: 'generator',        label: 'Generator' },
  { value: 'security',         label: 'Security' },
  { value: 'pool',             label: 'Pool' },
  { value: 'gym',              label: 'Gym' },
  { value: 'borehole',         label: 'Borehole' },
  { value: 'pop_ceiling',      label: 'POP Ceiling' },
  { value: 'tiled_floor',      label: 'Tiled Floor' },
  { value: 'kitchen_cabinet',  label: 'Kitchen Cabinet' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
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

export default function CreatePropertyScreen({ navigation }: RootScreenProps<'CreateProperty'>) {
  // Basic Info
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');

  // Property Details
  const [type, setType]                       = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [price, setPrice]                     = useState('');
  const [pricePeriod, setPricePeriod]         = useState('');

  // Location
  const [address, setAddress] = useState('');
  const [state, setState]     = useState('');
  const [lga, setLga]         = useState('');
  const [city, setCity]       = useState('');

  // State picker visibility
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [stateQuery, setStateQuery]           = useState('');

  // Features
  const [bedrooms, setBedrooms]         = useState('0');
  const [bathrooms, setBathrooms]       = useState('0');
  const [toilets, setToilets]           = useState('0');
  const [parkingSpaces, setParkingSpaces] = useState('0');
  const [furnishing, setFurnishing]     = useState('');

  // Amenities
  const [amenities, setAmenities] = useState<string[]>([]);

  // Fees
  const [cautionFee, setCautionFee] = useState('');
  const [agencyFee, setAgencyFee]   = useState('');

  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = useCallback((val: string) => {
    setAmenities(prev =>
      prev.includes(val) ? prev.filter(a => a !== val) : [...prev, val],
    );
  }, []);

  const filteredStates = NIGERIAN_STATES.filter(s =>
    s.toLowerCase().includes(stateQuery.toLowerCase()),
  );

  const validate = (): string | null => {
    if (!title.trim())              return 'Title is required.';
    if (title.trim().length > 255)  return 'Title must not exceed 255 characters.';
    if (!description.trim())        return 'Description is required.';
    if (description.trim().length < 30)  return 'Description must be at least 30 characters.';
    if (description.trim().length > 160) return 'Description must not exceed 160 characters.';
    if (!type)                      return 'Property type is required.';
    if (!transactionType)           return 'Transaction type is required.';
    if (!price.trim() || isNaN(Number(price)) || Number(price) < 1)
                                    return 'A valid price (min 1) is required.';
    if (!pricePeriod)               return 'Price period is required.';
    if (!address.trim())            return 'Address is required.';
    if (!state.trim())              return 'State is required.';
    if (!lga.trim())                return 'LGA is required.';
    if (!city.trim())               return 'City is required.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        type,
        transaction_type: transactionType,
        price: Number(price),
        price_period: pricePeriod,
        address: address.trim(),
        state: state.trim(),
        lga: lga.trim(),
        city: city.trim(),
      };

      if (parseInt(bedrooms, 10) > 0)      payload.bedrooms      = parseInt(bedrooms, 10);
      if (parseInt(bathrooms, 10) > 0)     payload.bathrooms     = parseInt(bathrooms, 10);
      if (parseInt(toilets, 10) > 0)       payload.toilets       = parseInt(toilets, 10);
      if (parseInt(parkingSpaces, 10) > 0) payload.parking_spaces = parseInt(parkingSpaces, 10);
      if (furnishing)                       payload.furnishing    = furnishing;
      if (amenities.length > 0)            payload.amenities     = amenities;
      if (cautionFee.trim() && !isNaN(Number(cautionFee))) payload.caution_fee = Number(cautionFee);
      if (agencyFee.trim()  && !isNaN(Number(agencyFee)))  payload.agency_fee  = Number(agencyFee);

      await api.post('/properties', payload);

      Alert.alert('Submitted', 'Property submitted for review.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        Alert.alert(
          'Limit Reached',
          "You've reached your listing limit. Upgrade your plan.",
        );
        return;
      }
      const errors = err?.response?.data?.errors;
      const firstMsg = errors
        ? (Object.values(errors)[0] as string[])?.[0]
        : (err?.response?.data?.message ?? 'Submission failed. Please try again.');
      Alert.alert('Error', firstMsg);
    } finally {
      setSubmitting(false);
    }
  };

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
                placeholder="Describe the property (30–160 characters)..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                maxLength={160}
                style={{ minHeight: 90 }}
              />
            </View>
            <View className="flex-row justify-end mb-4">
              <Text
                className={`text-xs font-medium ${
                  descLen < 30 || descLen > 160 ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {descLen}/160
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
              onChange={setTransactionType}
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
              options={PRICE_PERIODS}
              value={pricePeriod}
              onChange={setPricePeriod}
            />
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
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
              placeholder="Local Government Area"
              placeholderTextColor="#9ca3af"
              value={lga}
              onChangeText={setLga}
              returnKeyType="next"
            />

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

          {/* ── 4. Features (optional) ── */}
          <SectionCard>
            <SectionHeading>Features (Optional)</SectionHeading>

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

          {/* ── 5. Amenities (optional) ── */}
          <SectionCard>
            <SectionHeading>Amenities (Optional)</SectionHeading>
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

          {/* ── 6. Fees (optional) ── */}
          <SectionCard>
            <SectionHeading>Additional Fees (Optional)</SectionHeading>

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

          {/* ── 7. Submit ── */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-2 ${
              submitting ? 'bg-primary-600 opacity-70' : 'bg-primary-600'
            }`}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Submit Listing</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
