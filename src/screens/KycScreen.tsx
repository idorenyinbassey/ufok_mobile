import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api/client';
import { useAuthStore } from '../stores/auth';

const DOCUMENT_TYPES = [
  { value: 'nin', label: 'NIN (National ID)', icon: 'card-outline' as const },
  { value: 'passport', label: 'International Passport', icon: 'document-outline' as const },
  { value: 'drivers_license', label: "Driver's License", icon: 'car-outline' as const },
  { value: 'voters_card', label: "Voter's Card", icon: 'people-outline' as const },
];

interface KycDocument {
  id: number;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

function statusColor(status: string): string {
  switch (status) {
    case 'approved': return '#16a34a';
    case 'rejected': return '#dc2626';
    default: return '#d97706';
  }
}

function statusIcon(status: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (status) {
    case 'approved': return 'checkmark-circle';
    case 'rejected': return 'close-circle';
    default: return 'time';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return 'Under Review';
  }
}

export default function KycScreen() {
  const { user, setUser } = useAuthStore();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    const { data } = await api.get('/profile/kyc');
    setDocuments(data.data?.submissions ?? []);
  };

  useEffect(() => {
    fetchDocuments().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!docType) {
      Alert.alert('Required', 'Please select a document type.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Required', 'Please select a document to upload.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('document', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType ?? 'application/octet-stream',
      } as any);

      await api.post('/profile/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Submitted',
        'Your document has been submitted for review. We will notify you once it has been verified.',
        [{ text: 'OK' }],
      );
      setDocType('');
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      const first = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
      Alert.alert('Error', first ?? err?.response?.data?.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const isVerified = user?.is_kyc_verified;
  const hasPending = documents.some(d => d.status === 'pending');

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="px-5 pt-6 pb-10">

        {/* Verified status */}
        {isVerified ? (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 items-center">
            <Ionicons name="shield-checkmark" size={40} color="#16a34a" />
            <Text className="text-green-800 font-bold text-lg mt-3">Identity Verified</Text>
            <Text className="text-green-700 text-sm text-center mt-1">
              Your identity has been verified. You can now withdraw funds and access all platform features.
            </Text>
          </View>
        ) : (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <Text className="text-amber-800 font-semibold text-sm">⚠ Verification Required</Text>
            <Text className="text-amber-700 text-xs mt-1">
              Verify your identity to unlock wallet withdrawals and build trust with other users.
            </Text>
          </View>
        )}

        {/* Submitted documents */}
        {documents.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-900 font-semibold text-base mb-3">Submitted Documents</Text>
            {documents.map(doc => (
              <View
                key={doc.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 mb-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="document-text-outline" size={18} color="#6b7280" />
                    <Text className="text-gray-800 text-sm font-medium capitalize">
                      {doc.type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name={statusIcon(doc.status)} size={14} color={statusColor(doc.status)} />
                    <Text className="text-xs font-semibold" style={{ color: statusColor(doc.status) }}>
                      {statusLabel(doc.status)}
                    </Text>
                  </View>
                </View>
                {doc.status === 'rejected' && doc.rejection_reason && (
                  <Text className="text-red-600 text-xs mt-2 bg-red-50 rounded-lg px-2 py-1.5">
                    {doc.rejection_reason}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Upload form */}
        {!isVerified && !hasPending && (
          <View>
            <Text className="text-gray-900 font-semibold text-base mb-4">
              {documents.length > 0 ? 'Submit New Document' : 'Verify Your Identity'}
            </Text>

            {/* Document type picker */}
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Document Type
            </Text>
            <View className="gap-2 mb-4">
              {DOCUMENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setDocType(type.value)}
                  className={`flex-row items-center px-4 py-3.5 rounded-xl border ${
                    docType === type.value
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Ionicons
                    name={type.icon}
                    size={18}
                    color={docType === type.value ? '#fff' : '#6b7280'}
                  />
                  <Text
                    className={`ml-3 text-sm font-medium ${
                      docType === type.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </Text>
                  {docType === type.value && (
                    <View className="ml-auto">
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* File picker */}
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Document File
            </Text>
            <TouchableOpacity
              onPress={pickDocument}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 items-center bg-white mb-4"
            >
              {selectedFile ? (
                <View className="items-center">
                  <Ionicons name="document-text" size={32} color="#16a34a" />
                  <Text className="text-gray-800 text-sm font-medium mt-2" numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ''}
                  </Text>
                  <Text className="text-primary-600 text-xs mt-2 font-semibold">Tap to change</Text>
                </View>
              ) : (
                <View className="items-center">
                  <Ionicons name="cloud-upload-outline" size={32} color="#9ca3af" />
                  <Text className="text-gray-600 text-sm font-medium mt-2">Select Document</Text>
                  <Text className="text-gray-400 text-xs mt-1">JPG, PNG, or PDF · Max 10 MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Submit button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                uploading || !docType || !selectedFile ? 'bg-gray-200' : 'bg-primary-600'
              }`}
              onPress={handleSubmit}
              disabled={uploading || !docType || !selectedFile}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className={`font-bold text-base ${
                    !docType || !selectedFile ? 'text-gray-400' : 'text-white'
                  }`}
                >
                  Submit for Verification
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {hasPending && !isVerified && (
          <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 items-center">
            <Ionicons name="hourglass-outline" size={28} color="#2563eb" />
            <Text className="text-blue-800 font-semibold text-sm mt-2">Under Review</Text>
            <Text className="text-blue-600 text-xs text-center mt-1">
              Your document is being reviewed. This usually takes 1–2 business days. We'll notify you when it's done.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
