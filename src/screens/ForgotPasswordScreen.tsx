import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../api/client';
import type { AuthScreenProps } from '../navigation/types';

export default function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-6">
          <Text className="text-4xl">📧</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">Check your email</Text>
        <Text className="text-gray-500 text-center text-sm leading-relaxed mb-8">
          If {email} is registered, we've sent a reset link. Check your inbox and spam folder.
        </Text>
        <TouchableOpacity
          className="w-full bg-primary-600 rounded-xl py-4 items-center"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-white font-bold text-base">Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-10 pb-10">
          <View className="w-16 h-16 bg-primary-50 rounded-2xl items-center justify-center mb-6">
            <Text className="text-3xl">🔑</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Forgot password?</Text>
          <Text className="text-gray-500 text-sm mb-8 leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </Text>

          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Email Address
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-gray-50 mb-6"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleSubmit}
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
