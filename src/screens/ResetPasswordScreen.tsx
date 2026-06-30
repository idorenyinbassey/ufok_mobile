import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { AuthScreenProps } from '../navigation/types';

export default function ResetPasswordScreen({ navigation, route }: AuthScreenProps<'ResetPassword'>) {
  const prefillEmail = route.params?.email ?? '';

  const [email, setEmail] = useState(prefillEmail);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!token.trim()) {
      setError('Please enter the reset token from your email.');
      return;
    }
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
      });
      Alert.alert(
        'Password Reset',
        'Your password has been reset successfully. Please sign in with your new password.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 422) {
        setError('Invalid or expired reset token. Please request a new one.');
      } else {
        setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-10 pb-10">
          {/* Header */}
          <View className="w-16 h-16 bg-primary-50 rounded-2xl items-center justify-center mb-6">
            <Ionicons name="lock-closed" size={28} color="#16a34a" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Reset Password</Text>
          <Text className="text-gray-500 text-sm mb-8 leading-relaxed">
            Enter the token from your email and choose a new password.
          </Text>

          {/* Error banner */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex-row items-start gap-2">
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" style={{ marginTop: 1 }} />
              <Text className="text-red-700 text-sm flex-1">{error}</Text>
            </View>
          )}

          {/* Email */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Email Address
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => tokenRef.current?.focus()}
            editable={!loading}
          />

          {/* Reset Token */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Reset Token
          </Text>
          <TextInput
            ref={tokenRef}
            className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-4"
            placeholder="Paste token from email"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            value={token}
            onChangeText={setToken}
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!loading}
          />

          {/* New Password */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            New Password
          </Text>
          <View className="border border-gray-200 rounded-xl flex-row items-center bg-white mb-4">
            <TextInput
              ref={passwordRef}
              className="flex-1 px-4 py-3.5 text-base text-gray-900"
              placeholder="At least 8 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              returnKeyType="next"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => confirmRef.current?.focus()}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              className="px-4 py-3.5"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </Text>
          <View className="border border-gray-200 rounded-xl flex-row items-center bg-white mb-8">
            <TextInput
              ref={confirmRef}
              className="flex-1 px-4 py-3.5 text-base text-gray-900"
              placeholder="Repeat new password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPasswordConfirmation}
              returnKeyType="done"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPasswordConfirmation(v => !v)}
              className="px-4 py-3.5"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPasswordConfirmation ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center mb-5 ${loading ? 'bg-gray-300' : 'bg-primary-600'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back to login */}
          <View className="flex-row justify-center">
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-primary-600 text-sm font-semibold">Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
