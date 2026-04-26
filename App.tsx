import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConnectScreen }    from './src/screens/ConnectScreen';
import { DashboardScreen }  from './src/screens/DashboardScreen';
import { StreamScreen }     from './src/screens/StreamScreen';
import { HistoryScreen }    from './src/screens/HistoryScreen';
import { SoundscapeScreen } from './src/screens/SoundscapeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Connect"
        screenOptions={{
          headerStyle:     { backgroundColor: '#0f172a' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '700', letterSpacing: 0.3 },
        }}
      >
        <Stack.Screen name="Connect"    component={ConnectScreen}    options={{ title: 'Muse Plus' }} />
        <Stack.Screen name="Dashboard"  component={DashboardScreen}  options={{ title: 'Live EEG' }} />
        <Stack.Screen name="Stream"     component={StreamScreen}     options={{ title: 'OSC Settings' }} />
        <Stack.Screen name="History"    component={HistoryScreen}    options={{ title: 'Sessions' }} />
        <Stack.Screen name="Soundscape" component={SoundscapeScreen} options={{ title: 'Soundscapes' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
