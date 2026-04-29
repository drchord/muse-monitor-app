import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConnectScreen }    from './src/screens/ConnectScreen';
import { DashboardScreen }  from './src/screens/DashboardScreen';
import { SoundscapeScreen } from './src/screens/SoundscapeScreen';
import { HistoryScreen }    from './src/screens/HistoryScreen';
import { StreamScreen }     from './src/screens/StreamScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Connect"
            screenOptions={{
              headerStyle:     { backgroundColor: '#0f172a' },
              headerTintColor: '#f1f5f9',
              headerTitleStyle: { fontWeight: '700' },
              contentStyle:    { backgroundColor: '#09090f' },
            }}
          >
            <Stack.Screen name="Connect"    component={ConnectScreen}    options={{ title: 'Muse Plus' }} />
            <Stack.Screen name="Dashboard"  component={DashboardScreen}  options={{ title: 'Dashboard' }} />
            <Stack.Screen name="Soundscape" component={SoundscapeScreen} options={{ title: 'Soundscapes' }} />
            <Stack.Screen name="History"    component={HistoryScreen}    options={{ title: 'Sessions' }} />
            <Stack.Screen name="Stream"     component={StreamScreen}     options={{ title: 'OSC Stream' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
