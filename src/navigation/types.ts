import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParams = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string };
};

export type AppTabsParams = {
  Browse: undefined;
  Matches: undefined;
  Properties: undefined;
  Chat: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  App: undefined;
  PropertyDetail: { slug: string };
  ChatWindow: { conversationId: number; title: string };
  ProfileEdit: undefined;
  Wallet: undefined;
  Notifications: undefined;
  Kyc: undefined;
  Reservations: undefined;
  Subscription: undefined;
  Saved: undefined;
  Referrals: undefined;
  Leaderboard: undefined;
  AccountSettings: undefined;
  CreateProperty: undefined;
  EditProperty: { id: number };
  Support: undefined;
  NewSupportTicket: undefined;
  SupportTicketDetail: { id: number };
};

export type AuthScreenProps<T extends keyof AuthStackParams> = NativeStackScreenProps<AuthStackParams, T>;
export type RootScreenProps<T extends keyof RootStackParams> = NativeStackScreenProps<RootStackParams, T>;
export type TabScreenProps<T extends keyof AppTabsParams> = BottomTabScreenProps<AppTabsParams, T>;
