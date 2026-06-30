import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const isAgent = user?.role === 'agent';

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
        const { data } = await api.post('/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUser({ ...user!, avatar: data.data?.avatar ?? user!.avatar });
        Alert.alert('Updated', 'Profile photo updated.');
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message ?? 'Photo upload failed.');
        setAvatarUri(null);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

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

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setChangingPw(true);
    try {
      await api.put('/profile/password', {
        current_password: currentPw,
        password: newPw,
        password_confirmation: confirmPw,
      });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Done', 'Password changed successfully.');
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const first = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
      Alert.alert('Error', first ?? err?.response?.data?.message ?? 'Password change failed.');
    } finally {
      setChangingPw(false);
    }
  };

  const avatarSource = avatarUri ?? user?.avatar ?? null;
  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-6 pb-10">

          {/* Avatar */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar}>
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} className="w-24 h-24 rounded-full" />
              ) : (
                <View className="w-24 h-24 bg-primary-600 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-3xl">{initial}</Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full items-center justify-center border-2 border-white">
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera" size={14} color="#fff" />
                }
              </View>
            </TouchableOpacity>
            <Text className="text-gray-400 text-xs mt-2">Tap to change photo</Text>
          </View>

          {/* Basic info */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            value={name} onChangeText={setName} autoCapitalize="words"
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            placeholder="+234 800 000 0000" placeholderTextColor="#9ca3af"
            keyboardType="phone-pad" value={phone} onChangeText={setPhone}
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-4"
            placeholder="Tell people about yourself..." placeholderTextColor="#9ca3af"
            multiline numberOfLines={3} textAlignVertical="top"
            value={bio} onChangeText={setBio} style={{ minHeight: 80 }}
          />

          {isAgent && (
            <>
              <View className="h-px bg-gray-200 my-4" />
              <Text className="text-gray-900 font-semibold text-base mb-4">Professional Information</Text>
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Regulatory Body</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {REG_BODIES.map(b => (
                  <TouchableOpacity
                    key={b} onPress={() => setRegBody(b)}
                    className={`rounded-full px-3 py-1.5 border ${regBody === b ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-sm font-medium ${regBody === b ? 'text-white' : 'text-gray-600'}`}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Registration Number</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
                placeholder="e.g. ESV/ABC/12345" placeholderTextColor="#9ca3af"
                autoCapitalize="characters" value={regNumber} onChangeText={setRegNumber}
              />
            </>
          )}

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center mt-2"
            onPress={handleSave} disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Changes</Text>}
          </TouchableOpacity>

          {/* Password change section */}
          <View className="h-px bg-gray-200 my-6" />
          <Text className="text-gray-900 font-semibold text-base mb-4">Change Password</Text>

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            placeholder="Enter current password" placeholderTextColor="#9ca3af"
            secureTextEntry={!showPw} value={currentPw} onChangeText={setCurrentPw}
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Password</Text>
          <View className="relative mb-4">
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white pr-12"
              placeholder="Enter new password" placeholderTextColor="#9ca3af"
              secureTextEntry={!showPw} value={newPw} onChangeText={setNewPw}
            />
            <TouchableOpacity
              className="absolute right-4 top-0 bottom-0 justify-center"
              onPress={() => setShowPw(v => !v)}
            >
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            placeholder="Repeat new password" placeholderTextColor="#9ca3af"
            secureTextEntry={!showPw} value={confirmPw} onChangeText={setConfirmPw}
          />

          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${changingPw ? 'bg-gray-300' : 'bg-gray-800'}`}
            onPress={handleChangePassword} disabled={changingPw}
          >
            {changingPw ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Change Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
