import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuthStore } from '../stores/auth';
import type { RootScreenProps } from '../navigation/types';

export default function AccountSettingsScreen({ navigation }: RootScreenProps<'AccountSettings'>) {
  const { logout } = useAuthStore();
  const [exporting, setExporting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Export data ────────────────────────────────────────────────────────────
  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/account/export-data');
      await Share.share({
        message: JSON.stringify(data.data, null, 2),
        title: 'My Ufok Data',
      });
    } catch (err: any) {
      Alert.alert(
        'Export Failed',
        err?.response?.data?.message ?? 'Could not export your data. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  };

  // ── Delete account — step 1: confirmation alert ───────────────────────────
  const handleDeletePress = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently erase your account, listings, wallet balance, and all personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete',
          style: 'destructive',
          onPress: () => {
            setDeleteConfirmText('');
            setDeleteModalVisible(true);
          },
        },
      ],
    );
  };

  // ── Delete account — step 2: modal with typed confirmation ────────────────
  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Incorrect', 'Please type DELETE exactly as shown.');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/account/delete', { data: { confirm: 'DELETE' } });
      setDeleteModalVisible(false);
      await logout();
      // RootNavigator reacts to auth state change → navigates to Auth stack
    } catch (err: any) {
      setDeleting(false);
      Alert.alert(
        'Could Not Delete Account',
        err?.response?.data?.message ?? 'Something went wrong. Please try again.',
      );
    }
  };

  const dismissModal = () => {
    if (deleting) return;
    setDeleteModalVisible(false);
  };

  const canConfirmDelete = deleteConfirmText === 'DELETE';

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 48 }}>
        {/* ── Data & Privacy ───────────────────────────────────────────────── */}
        <View className="mt-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-5 pb-2">
            Data & Privacy
          </Text>

          <View className="bg-white border-t border-b border-gray-100">
            <TouchableOpacity
              className="flex-row items-center px-5 py-4"
              onPress={handleExportData}
              disabled={exporting}
              activeOpacity={0.7}
            >
              <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mr-3">
                {exporting ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <Ionicons name="download-outline" size={17} color="#6b7280" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 text-sm font-medium">Export My Data</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  Download a copy of your personal data
                </Text>
              </View>
              {!exporting && <Ionicons name="chevron-forward" size={16} color="#d1d5db" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        <View className="mt-8">
          <Text className="text-red-500 text-xs font-semibold uppercase tracking-wider px-5 pb-2">
            Danger Zone
          </Text>

          <View className="bg-white border-t border-b border-gray-100">
            <TouchableOpacity
              className="flex-row items-center px-5 py-4"
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <View className="w-9 h-9 rounded-full bg-red-50 items-center justify-center mr-3">
                <Ionicons name="trash-outline" size={17} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-red-600 text-sm font-medium">Delete Account</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  Permanently erase your account and all data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#fca5a5" />
            </TouchableOpacity>
          </View>

          <View className="mx-4 mt-3 bg-red-50 border border-red-100 rounded-xl p-3.5">
            <Text className="text-red-700 text-xs leading-5">
              Deleting your account is immediate and irreversible. Your property listings, saved
              properties, wallet balance, messages, and personal data will all be permanently erased.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissModal}
        statusBarTranslucent
      >
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <View
            className="bg-white rounded-2xl w-full p-6"
            style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 }}
          >
            {/* Warning icon */}
            <View className="w-14 h-14 bg-red-50 rounded-full items-center justify-center self-center mb-4">
              <Ionicons name="warning-outline" size={28} color="#dc2626" />
            </View>

            <Text className="text-gray-900 font-bold text-xl text-center mb-1">
              This is permanent
            </Text>
            <Text className="text-gray-500 text-sm text-center leading-5 mb-5">
              Type{' '}
              <Text className="font-bold text-red-600">DELETE</Text>
              {' '}below to confirm. Your account will be erased immediately.
            </Text>

            {/* Confirmation input */}
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white mb-5"
              placeholder="Type DELETE here"
              placeholderTextColor="#9ca3af"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!deleting}
              returnKeyType="done"
            />

            {/* Confirm button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center mb-3 ${canConfirmDelete && !deleting ? 'bg-red-600' : 'bg-gray-200'}`}
              onPress={handleConfirmDelete}
              disabled={!canConfirmDelete || deleting}
              activeOpacity={0.85}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className={`font-bold text-base ${canConfirmDelete ? 'text-white' : 'text-gray-400'}`}
                >
                  Delete My Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              className="items-center py-2"
              onPress={dismissModal}
              disabled={deleting}
              activeOpacity={0.7}
            >
              <Text className="text-gray-500 text-sm font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
