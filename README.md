# THE CITADEL

**Sovereign Bitcoin monitoring for iOS and Android. Chain data, chart analysis, portfolio tracking, price alerts, Lightning stats, and address watchlist.**

Built with Expo (React Native). Zero cloud dependencies. All data from public APIs.

---

## Features

### Dashboard
- Real-time BTC price (30s refresh) with 24h change, volume, market cap
- Candlestick + line chart with 6 timeframes (1D/7D/1M/3M/1Y/ALL)
- Block height, mempool stats, fee recommendations
- Difficulty adjustment progress, hashrate
- Halving countdown with epoch + subsidy display
- Recent blocks feed with tx count and size

### Portfolio
- Add BTC positions with optional cost basis
- Track total value and unrealized P&L
- Per-position performance with percentage returns
- Persistent storage (AsyncStorage)

### Price Alerts
- Set above/below price thresholds
- Push notifications via expo-notifications
- One-shot or persistent alerts
- Distance-to-target indicator

### Lightning Network
- Total network capacity (BTC + USD)
- Node count, channel count, average capacity
- Fee rate statistics
- Top 10 nodes ranked by liquidity
- Network health indicator

### Address Watchlist
- Monitor any on-chain Bitcoin address
- Live balance + tx count from mempool.space
- Copy-to-clipboard for addresses
- Track whale wallets, exchange reserves, or your own

### Donate
- Static on-chain + Lightning donation addresses
- Voluntary tips, not regulated activity

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/IONOFIELD/THE-CITADEL.git
cd THE-CITADEL

# 2. Install
npm install

# 3. Start Expo
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

---

## Project Structure

```
THE-CITADEL/
  App.js                          # Root - navigation + BitcoinProvider
  app.json                        # Expo config
  package.json
  babel.config.js
  src/
    context/
      BitcoinContext.js            # Central state - all API fetching + alert logic
    screens/
      DashboardScreen.js           # Price chart + chain stats + blocks
      PortfolioScreen.js           # Holdings tracker with P&L
      AlertsScreen.js              # Price threshold notifications
      NetworkScreen.js             # Chain + Lightning network stats (toggle)
      WatchlistScreen.js           # On-chain address monitor + donate
    components/
      NewsTicker.js                # Scrolling market + headline ticker
      PriceChart.js                # SVG candlestick/line chart
      UI.js                        # Reusable components (StatCard, PillRow, etc.)
    utils/
      theme.js                     # Colors, fonts, API endpoints, constants
      format.js                    # Number/currency/time formatters
      storage.js                   # AsyncStorage persistence layer
```

---

## APIs Used (all free, no keys required)

| Source | Data |
|--------|------|
| CoinGecko | Price, OHLC, history, volume, market cap |
| Mempool.space | Blocks, fees, mempool, difficulty, hashrate, Lightning stats, address lookups |

---

## Configuration

Edit `src/utils/theme.js` to set your donation addresses:

```js
export const DONATE_ADDRESS = 'bc1qYOUR_ADDRESS_HERE';
export const DONATE_LIGHTNING = 'lnurl1YOUR_LNURL_HERE';
```

---

## Building for Production

```bash
# iOS
npx expo build:ios
# or with EAS
npx eas build --platform ios

# Android
npx expo build:android
# or with EAS
npx eas build --platform android
```

---

## Design

Military terminal aesthetic. Bitcoin amber (#f7931a) on deep forest black (#050804). Monospace typography throughout. No unnecessary ornamentation. Built for people who run their own nodes.

---

## License

MIT
