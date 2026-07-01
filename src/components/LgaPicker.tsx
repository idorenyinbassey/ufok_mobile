import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NIGERIA_LGAS } from '../data/nigeriaLgas';

interface Props {
  state: string;
  value: string;
  onChange: (lga: string) => void;
}

export default function LgaPicker({ state, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const lgas = state ? (NIGERIA_LGAS[state] ?? []) : [];
  const filtered = query
    ? lgas.filter(l => l.toLowerCase().includes(query.toLowerCase()))
    : lgas;

  return (
    <View>
      <TouchableOpacity
        className={`border border-gray-200 rounded-xl px-4 py-3.5 bg-white mb-1 flex-row items-center justify-between ${!state ? 'opacity-50' : ''}`}
        onPress={() => {
          if (!state) return;
          setOpen(v => !v);
          setQuery('');
        }}
        activeOpacity={0.7}
        disabled={!state}
      >
        <Text className={value ? 'text-base text-gray-900' : 'text-base text-gray-400'}>
          {value || (state ? 'Select LGA' : 'Select a state first')}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
      </TouchableOpacity>

      {open && (
        <View className="border border-gray-200 rounded-xl bg-white mb-4 overflow-hidden">
          <View className="border-b border-gray-100 px-3 py-2 flex-row items-center">
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-sm text-gray-900 py-0"
              placeholder="Search LGA..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {filtered.map(l => (
              <TouchableOpacity
                key={l}
                className={`px-4 py-3 border-b border-gray-50 flex-row items-center justify-between ${value === l ? 'bg-primary-50' : ''}`}
                onPress={() => {
                  onChange(l);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <Text className={`text-sm ${value === l ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}>
                  {l}
                </Text>
                {value === l && <Ionicons name="checkmark" size={16} color="#16a34a" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {!open && <View className="mb-4" />}
    </View>
  );
}
