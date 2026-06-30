import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuthStore } from '../stores/auth';
import type { AuthScreenProps } from '../navigation/types';

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary-600 pt-20 pb-12 px-6 items-center">
          <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-4 shadow-md">
            <Text className="text-primary-600 text-3xl font-black">U</Text>
          </View>
          <Text className="text-white text-2xl font-bold">Welcome back</Text>
          <Text className="text-primary-100 text-sm mt-1">Sign in to your Ufok account</Text>
        </View>

        {/* Form */}
        <View className="px-6 pt-8">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Email Address
          </Text>
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

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Password
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-2"
            placeholder="Your password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            className="self-end mb-6"
          >
            <Text className="text-primary-600 text-sm font-semibold">Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Sign In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-primary-600 text-sm font-semibold">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
