import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import type { RootScreenProps } from '../navigation/types';

interface Agent {
  rank: number;
  id: number;
  name: string;
  avatar: string | null;
  deals_count: number;
  listings_count: number;
  is_kyc_verified: boolean;
}

const NIGERIAN_STATES = [
  'All', 'Lagos', 'Abuja', 'Rivers', 'Kano',
  'Oyo', 'Delta', 'Enugu', 'Anambra', 'Edo',
];

const MEDAL_COLORS: Record<number, string> = {
  1: '#f59e0b',
  2: '#9ca3af',
  3: '#d97706',
};

interface AgentAvatarProps {
  agent: Agent;
  size: number;
}

function AgentAvatar({ agent, size }: AgentAvatarProps) {
  if (agent.avatar) {
    return (
      <Image
        source={{ uri: agent.avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      className="bg-primary-100 items-center justify-center"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text
        className="text-primary-700 font-bold"
        style={{ fontSize: Math.round(size * 0.38) }}
      >
        {agent.name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen({ navigation }: RootScreenProps<'Leaderboard'>) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedState, setSelectedState] = useState('All');

  const fetchLeaderboard = useCallback(async (state: string) => {
    const params = state !== 'All' ? { state } : {};
    const { data } = await api.get('/leaderboard', { params });
    setAgents(data.data?.agents ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(selectedState).catch(() => {}).finally(() => setLoading(false));
  }, [selectedState, fetchLeaderboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard(selectedState).catch(() => {});
    setRefreshing(false);
  };

  const top3 = agents.filter(a => a.rank <= 3);
  const rest = agents.filter(a => a.rank > 3);

  // Podium display order: rank2 left, rank1 centre, rank3 right
  const rank1 = top3.find(a => a.rank === 1);
  const rank2 = top3.find(a => a.rank === 2);
  const rank3 = top3.find(a => a.rank === 3);
  const podiumSlots: Array<{ agent: Agent | undefined; isCenter: boolean }> = [
    { agent: rank2, isCenter: false },
    { agent: rank1, isCenter: true },
    { agent: rank3, isCenter: false },
  ];

  const PodiumSlot = ({ agent, isCenter }: { agent: Agent | undefined; isCenter: boolean }) => {
    if (!agent) return <View style={{ flex: isCenter ? 1.2 : 1 }} />;
    const avatarSize = isCenter ? 68 : 52;
    const medalColor = MEDAL_COLORS[agent.rank] ?? '#6b7280';

    return (
      <View
        className="items-center"
        style={{ flex: isCenter ? 1.2 : 1, marginBottom: isCenter ? 0 : 18 }}
      >
        <View
          style={{
            borderRadius: (avatarSize + 6) / 2,
            padding: 3,
            borderWidth: 2.5,
            borderColor: medalColor,
            marginBottom: 6,
          }}
        >
          <AgentAvatar agent={agent} size={avatarSize} />
        </View>
        <View
          className="w-6 h-6 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: medalColor }}
        >
          <Text className="text-white text-xs font-bold">{agent.rank}</Text>
        </View>
        <Text
          className="text-white font-semibold text-center"
          style={{ fontSize: isCenter ? 13 : 11 }}
          numberOfLines={2}
        >
          {agent.name}
        </Text>
        <Text className="text-primary-100 text-xs mt-0.5">
          {agent.deals_count} deals
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* State filter chips */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {NIGERIAN_STATES.map(state => (
            <TouchableOpacity
              key={state}
              className={`rounded-full px-4 py-2 ${selectedState === state ? 'bg-primary-600' : 'bg-gray-100'}`}
              onPress={() => setSelectedState(state)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-medium ${selectedState === state ? 'text-white' : 'text-gray-600'}`}
              >
                {state}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : agents.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="trophy-outline" size={56} color="#d1d5db" />
          <Text className="text-gray-900 font-semibold text-lg mt-4 text-center">
            No agents found
          </Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            No agents found for this state.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />
          }
          ListHeaderComponent={
            top3.length > 0 ? (
              <View className="bg-primary-600 pt-6 pb-8 px-6 mb-4">
                <Text className="text-white font-bold text-xl text-center mb-6">
                  Top Agents
                </Text>
                <View className="flex-row items-end justify-center gap-2">
                  {podiumSlots.map((slot, index) => (
                    <PodiumSlot key={index} agent={slot.agent} isCenter={slot.isCenter} />
                  ))}
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            rest.length === 0 && top3.length === 0 ? null : (
              <View className="px-4 pt-2 pb-2">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Rankings
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View
              className="flex-row items-center bg-white mx-4 mb-2.5 rounded-2xl px-4 py-3.5 border border-gray-100"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
            >
              {/* Rank number */}
              <Text className="text-gray-400 font-bold text-base w-8">
                #{item.rank}
              </Text>

              {/* Avatar */}
              <AgentAvatar agent={item} size={44} />

              {/* Name + stats */}
              <View className="flex-1 ml-3 min-w-0">
                <View className="flex-row items-center gap-1.5">
                  <Text
                    className="text-gray-900 font-semibold text-sm flex-shrink"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.is_kyc_verified && (
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  )}
                </View>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {item.deals_count} deals · {item.listings_count} listings
                </Text>
              </View>

              {/* Deals highlight */}
              <View className="items-end">
                <Text className="text-primary-600 font-bold text-sm">{item.deals_count}</Text>
                <Text className="text-gray-400 text-xs">deals</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
