import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BitcoinProvider } from './src/context/BitcoinContext';
import { COLORS } from './src/utils/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import NewsTicker from './src/components/NewsTicker';

const Tab = createBottomTabNavigator();

// SVG lightning bolt icon — classic jagged bolt shape
function LightningBoltIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 2 L8 12 L12 12 L9.5 22 L18 10 L13 10 L14.5 2Z"
        fill={color}
      />
    </Svg>
  );
}

// Minimal monospace tab icons
function TabIcon({ label, focused }) {
  const icons = {
    Dashboard: '₿',
    Portfolio: '◈',
    Alerts: '!',
    Watchlist: '◎',
  };
  const color = focused ? COLORS.btc : COLORS.textGhost;

  return (
    <View style={tabStyles.iconWrap}>
      {label === 'Network' ? (
        <LightningBoltIcon color={color} size={18} />
      ) : (
        <Text style={[tabStyles.icon, { color }]}>
          {icons[label] || '●'}
        </Text>
      )}
      <Text style={[tabStyles.label, { color }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const DarkTheme = {
  dark: true,
  colors: {
    primary: COLORS.btc,
    background: COLORS.bgDeep,
    card: COLORS.bgPanel,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.btc,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <BitcoinProvider>
        <NavigationContainer theme={DarkTheme}>
          <StatusBar style="light" backgroundColor={COLORS.bgDeep} />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
              tabBarShowLabel: false,
              tabBarStyle: {
                backgroundColor: COLORS.bgPanel,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 6,
              },
              header: ({ options }) => (
                <View style={{
                  backgroundColor: COLORS.bgPanel,
                  borderBottomColor: COLORS.border,
                  borderBottomWidth: 1,
                }}>
                  <View style={{ paddingTop: 44, paddingBottom: 10, alignItems: 'center' }}>
                    <Text style={{
                      color: COLORS.btc,
                      fontFamily: 'monospace',
                      fontSize: 22,
                      letterSpacing: 3,
                      fontWeight: '700',
                      textShadowColor: '#f7931a88',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 16,
                    }}>{typeof options.headerTitle === 'string' ? options.headerTitle : options.title}</Text>
                  </View>
                  <NewsTicker />
                </View>
              ),
            })}
          >
            <Tab.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerTitle: 'THE CITADEL' }}
            />
            <Tab.Screen
              name="Portfolio"
              component={PortfolioScreen}
              options={{ headerTitle: 'PORTFOLIO' }}
            />
            <Tab.Screen
              name="Alerts"
              component={AlertsScreen}
              options={{ headerTitle: 'ALERTS' }}
            />
            <Tab.Screen
              name="Network"
              component={NetworkScreen}
              options={{ headerTitle: 'NETWORK' }}
            />
            <Tab.Screen
              name="Watchlist"
              component={WatchlistScreen}
              options={{ headerTitle: 'WATCHLIST' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </BitcoinProvider>
    </SafeAreaProvider>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 7,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 2,
  },
});
