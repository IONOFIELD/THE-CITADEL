// Bitcoin Observer - Design System
// Aesthetic: Military-grade terminal meets Bitcoin amber
// Typography: Monospace dominant, minimal ornamentation

export const COLORS = {
  // Backgrounds
  bgDeep: '#050804',
  bgPanel: '#080c06',
  bgCard: '#0a0e08',
  bgElevated: '#0e1410',
  bgInput: '#0c100a',

  // Bitcoin orange spectrum
  btc: '#f7931a',
  btcDim: '#6a3000',
  btcGlow: '#f7931a44',
  btcSubtle: '#f7931a0a',
  btcMid: '#c47515',

  // Greens (for positive / network health)
  green: '#00ff41',
  greenDim: '#1a3a1a',
  greenMid: '#4a6a4a',

  // Reds (for negative / errors)
  red: '#ff4136',
  redDim: '#3a0a08',

  // Text hierarchy
  textPrimary: '#c0c8b8',
  textSecondary: '#8a9a8a',
  textTertiary: '#5a6a5a',
  textMuted: '#3a4a3a',
  textGhost: '#2a3a24',

  // Borders
  border: '#151f12',
  borderDim: '#0e160c',
  borderActive: '#f7931a44',

  // Status
  statusOk: '#f7931a',
  statusWarn: '#ff851b',
  statusError: '#ff4136',
};

export const FONTS = {
  mono: 'SpaceMono-Regular',
  monoBold: 'SpaceMono-Bold',
  // Fallback for systems without custom fonts loaded
  system: 'monospace',
};

// Header typography — Cascadia Code (the terminal/PowerShell font, matches the
// app icon). Loaded via expo-font in App.js under the family name 'CascadiaCode'.
export const HEADER_FONT = 'CascadiaCode';

// Amber "bloom" applied to all headers so they glow like the icon.
export const HEADER_GLOW = {
  textShadowColor: '#f7931a99',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 14,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const FONT_SIZES = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 24,
  hero: 32,
};

// Chart config for CryptoCompare (US-friendly, no auth, real OHLC)
// All timeframes target ~155 candles for consistent readability
export const CHART_CONFIG = {
  1:    { endpoint: 'minute', aggregate: 10, limit: 144 },  // 1D: 10-min candles
  7:    { endpoint: 'hour',   aggregate: 1,  limit: 168 },  // 7D: hourly
  30:   { endpoint: 'hour',   aggregate: 5,  limit: 144 },  // 1M: 5-hour candles
  90:   { endpoint: 'hour',   aggregate: 14, limit: 154 },  // 3M: ~14-hour candles
  365:  { endpoint: 'day',    aggregate: 2,  limit: 182 },  // 1Y: 2-day candles
  1095: { endpoint: 'day',    aggregate: 7,  limit: 156 },  // 3Y: weekly candles
  max:  { endpoint: 'day',    aggregate: 14, limit: 155 },  // ALL: bi-weekly candles
};

// API endpoints
export const API = {
  // CoinGecko - price summary only (1 call every 30s, well within limits)
  price: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true',

  // CryptoCompare - chart data (US-friendly, no auth, 100K calls/month)
  chart: (endpoint, aggregate, limit) =>
    `https://min-api.cryptocompare.com/data/v2/histo${endpoint}?fsym=BTC&tsym=USD&aggregate=${aggregate}&limit=${limit}`,
  
  // Mempool.space - blockchain data
  blockHeight: 'https://mempool.space/api/blocks/tip/height',
  blocks: 'https://mempool.space/api/v1/blocks',
  fees: 'https://mempool.space/api/v1/fees/recommended',
  mempool: 'https://mempool.space/api/mempool',
  difficulty: 'https://mempool.space/api/v1/difficulty-adjustment',
  mempoolBlocks: 'https://mempool.space/api/v1/fees/mempool-blocks',
  
  // Mempool.space - Mining
  hashrate: 'https://mempool.space/api/v1/mining/hashrate/1m',

  // Mempool.space - Lightning
  lightningStats: 'https://mempool.space/api/v1/lightning/statistics/latest',
  lightningTopNodes: 'https://mempool.space/api/v1/lightning/nodes/rankings/connectivity',
  lightningTopCapacity: 'https://mempool.space/api/v1/lightning/nodes/rankings/liquidity',
  
  // News - Bitcoin Magazine RSS via rss2json
  news: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fbitcoinmagazine.com%2Ffeed',

  // Blockchain.info - address lookups
  addressInfo: (addr) => `https://mempool.space/api/address/${addr}`,
  addressTxs: (addr) => `https://mempool.space/api/address/${addr}/txs`,
};

// Timeframe options for chart
export const TIMEFRAMES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: 'ALL', days: 'max' },
];

// Donation address - replace with your own
export const DONATE_ADDRESS = 'bc1qYOUR_ADDRESS_HERE';
export const DONATE_LIGHTNING = 'lnurl1YOUR_LNURL_HERE';
