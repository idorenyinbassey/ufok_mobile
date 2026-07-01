import React from 'react';
import { Image, View, StyleProp, ViewStyle } from 'react-native';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Logo({ size = 64, style }: Props) {
  return (
    <View
      style={[
        {
          width: size, height: size, borderRadius: size * 0.25,
          backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
        },
        style,
      ]}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: size * 0.8, height: size * 0.8 * (267 / 400) }}
        resizeMode="contain"
      />
    </View>
  );
}
