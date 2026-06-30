import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import api from '../api/client';
import { useAuthStore } from '../stores/auth';
import type { RootScreenProps } from '../navigation/types';

const REG_BODIES = ['ESVARBON', 'NIESV', 'NITP', 'CORBON', 'Other'];

export default function ProfileEditScreen({ navigation }: RootScreenProps<'ProfileEdit'>) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [regBody, setRegBody] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const isAgent = user?.role === 'agent';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string> = { name: name.trim() };
      if (phone.trim()) payload.phone = phone.trim();
      if (bio.trim()) payload.bio = bio.trim();
      if (isAgent) {
        if (regBody) payload.professional_reg_body = regBody;
        if (regNumber.trim()) payload.professional_reg_number = regNumber.trim();
      }
      const { data } = await api.patch('/profile', payload);
      setUser({ ...user!, ...data.data });
      Alert.alert('Saved', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const first = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
      Alert.alert('Error', first ?? err?.response?.data?.message ?? 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-6 pb-10">
          {/* Basic info */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            placeholder="+234 800 000 0000"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-4"
            placeholder="Tell tenants a bit about yourself..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
            style={{ minHeight: 80 }}
          />

          {/* Agent professional info */}
          {isAgent && (
            <>
              <View className="h-px bg-gray-200 my-4" />
              <Text className="text-gray-900 font-semibold text-base mb-4">Professional Information</Text>

              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Regulatory Body
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {REG_BODIES.map(b => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setRegBody(b)}
                    className={`rounded-full px-3 py-1.5 border ${
                      regBody === b
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${regBody === b ? 'text-white' : 'text-gray-600'}`}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Registration Number
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
                placeholder="e.g. ESV/ABC/12345"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                value={regNumber}
                onChangeText={setRegNumber}
              />
            </>
          )}

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center mt-4"
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
