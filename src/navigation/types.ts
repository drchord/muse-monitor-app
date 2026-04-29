import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Connect:    undefined;
  Dashboard:  undefined;
  Soundscape: undefined;
  History:    undefined;
  Stream:     undefined;
};

export type ConnectNavProp   = NativeStackNavigationProp<RootStackParamList, 'Connect'>;
export type DashboardNavProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
