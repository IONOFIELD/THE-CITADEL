import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  portfolio: '@btc_portfolio',
  alerts: '@btc_alerts',
  watchlist: '@btc_watchlist',
  settings: '@btc_settings',
};

export async function loadPortfolio() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.portfolio);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePortfolio(entries) {
  await AsyncStorage.setItem(KEYS.portfolio, JSON.stringify(entries));
}

export async function loadAlerts() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.alerts);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveAlerts(alerts) {
  await AsyncStorage.setItem(KEYS.alerts, JSON.stringify(alerts));
}

export async function loadWatchlist() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.watchlist);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveWatchlist(list) {
  await AsyncStorage.setItem(KEYS.watchlist, JSON.stringify(list));
}

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.settings);
    return raw ? JSON.parse(raw) : { currency: 'usd', donateAddress: '' };
  } catch { return { currency: 'usd', donateAddress: '' }; }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
