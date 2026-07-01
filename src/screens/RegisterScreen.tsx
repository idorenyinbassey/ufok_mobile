import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../stores/auth';
import type { AuthScreenProps } from '../navigation/types';
import Logo from '../components/Logo';

const ROLES = [
  { value: 'tenant' as const, label: 'Tenant', emoji: '🏠' },
  { value: 'landlord' as const, label: 'Landlord', emoji: '🏢' },
  { value: 'agent' as const, label: 'Agent', emoji: '🤝' },
];

export default function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord' | 'agent'>('tenant');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const { register, loading } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !passwordConfirm) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirm,
        role,
      });
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const first = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
      const msg = first ?? err?.response?.data?.message ?? 'Registration failed.';
      Alert.alert('Registration Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary-600 pt-16 pb-10 px-6 items-center">
          <Logo size={64} style={{ marginBottom: 16 }} />
          <Text className="text-white text-2xl font-bold">Create Account</Text>
          <Text className="text-primary-100 text-sm mt-1">Join Ufok today</Text>
        </View>

        {/* Form */}
        <View className="px-6 pt-8 pb-10">
          {/* Role picker */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">I am a</Text>
          <View className="flex-row gap-2 mb-5">
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRole(r.value)}
                className={`flex-1 rounded-xl py-3 items-center border ${
                  role === r.value ? 'bg-primary-600 border-primary-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className="text-base mb-0.5">{r.emoji}</Text>
                <Text className={`text-xs font-semibold ${role === r.value ? 'text-white' : 'text-gray-600'}`}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-4"
            placeholder="Your full name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-4"
            placeholder="At least 8 characters"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-6"
            placeholder="Repeat your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary-600 text-sm font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
