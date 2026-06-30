import { createRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParams } from './types';

export const navigationRef = createRef<NavigationContainerRef<RootStackParams>>();
