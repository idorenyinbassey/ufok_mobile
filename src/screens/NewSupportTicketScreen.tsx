import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/client';

type Category = 'billing' | 'technical' | 'property' | 'account' | 'abuse' | 'other';
type Priority = 'low' | 'medium' | 'high' | 'critical';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'property', label: 'Property Listing' },
  { value: 'account', label: 'Account & Profile' },
  { value: 'abuse', label: 'Report Abuse' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function ChipPicker<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
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
            <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-600'}`}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function NewSupportTicketScreen() {
  const navigation = useNavigation<any>();
  const [category, setCategory] = useState<Category>('technical');
  const [priority, setPriority] = useState<Priority>('medium');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Missing information', 'Please fill in both the subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/support', {
        category, priority, subject: subject.trim(), body: body.trim(),
      });
      navigation.replace('SupportTicketDetail', { id: data.data.id });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</Text>
        <ChipPicker options={CATEGORIES} value={category} onChange={setCategory} />

        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-5">Priority</Text>
        <ChipPicker options={PRIORITIES} value={priority} onChange={setPriority} />

        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 mt-5">Subject</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white"
          placeholder="Brief description of your issue"
          placeholderTextColor="#9ca3af"
          value={subject}
          onChangeText={setSubject}
          editable={!submitting}
        />

        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Description</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white"
          placeholder="Please describe your issue in detail..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          style={{ minHeight: 140 }}
          value={body}
          onChangeText={setBody}
          maxLength={5000}
          editable={!submitting}
        />

        <TouchableOpacity
          className={`rounded-xl py-4 items-center mt-6 ${submitting ? 'bg-gray-300' : 'bg-primary-600'}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Submit Ticket</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
