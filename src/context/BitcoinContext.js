import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { API, CHART_CONFIG } from '../utils/theme';
import { loadAlerts, saveAlerts } from '../utils/storage';
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BitcoinContext = createContext(null);

export function BitcoinProvider({ children }) {
  // Price state
  const [price, setPrice] = useState(null);
  const [ohlc, setOhlc] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [timeframe, setTimeframe] = useState(30);

  // Chart loading
  const [chartLoading, setChartLoading] = useState(false);
  const chartAbort = useRef(null);
  const chartCache = useRef({});

  // Blockchain state
  const [blockHeight, setBlockHeight] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [fees, setFees] = useState(null);
  const [mempool, setMempool] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [hashrate, setHashrate] = useState(null);
  const [halvingBlocks, setHalvingBlocks] = useState(null);

  // Lightning state
  const [lightning, setLightning] = useState(null);

  // News ticker
  const [newsHeadlines, setNewsHeadlines] = useState([]);

  // Alerts
  const [priceAlerts, setPriceAlerts] = useState([]);
  const prevPrice = useRef(null);

  // Loading states
  const [priceLoading, setPriceLoading] = useState(true);
  const [chainLoading, setChainLoading] = useState(true);

  // Safe fetch wrapper
  const safeFetch = useCallback(async (url, timeout = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      console.warn(`Fetch failed: ${url}`, e.message);
      return null;
    }
  }, []);

  // Fetch price data
  const fetchPrice = useCallback(async () => {
    const data = await safeFetch(API.price);
    if (data?.bitcoin) {
      const newPrice = data.bitcoin.usd;
      // Check alerts
      if (prevPrice.current && newPrice !== prevPrice.current) {
        checkAlerts(newPrice, prevPrice.current);
      }
      prevPrice.current = newPrice;
      setPrice(data.bitcoin);
      setPriceLoading(false);
    }
  }, [safeFetch]);

  // Fetch chart data from Binance (public, no auth, 1200 req/min)
  const fetchChart = useCallback(async (days) => {
    // Abort any in-flight chart request
    if (chartAbort.current) chartAbort.current.abort();

    const cacheKey = String(days);

    // Use cached data if available — instant switch, no API call
    if (chartCache.current[cacheKey]) {
      const cached = chartCache.current[cacheKey];
      setOhlc(cached.ohlc);
      setLineData(cached.line);
      return;
    }

    const controller = new AbortController();
    chartAbort.current = controller;
    const config = CHART_CONFIG[days] || CHART_CONFIG.max;

    setChartLoading(true);
    try {
      const res = await fetch(
        API.chart(config.endpoint, config.aggregate, config.limit),
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;
      const json = res.ok ? await res.json() : null;
      if (controller.signal.aborted) return;

      const candles = json?.Data?.Data;
      if (Array.isArray(candles) && candles.length > 0) {
        // CryptoCompare: { time (unix sec), open, high, low, close, volumefrom, volumeto }
        const ohlcParsed = candles.map(k => [
          k.time * 1000, k.open, k.high, k.low, k.close,
        ]);
        const lineParsed = candles.map(k => [k.time * 1000, k.close]);

        setOhlc(ohlcParsed);
        setLineData(lineParsed);
        chartCache.current[cacheKey] = { ohlc: ohlcParsed, line: lineParsed };
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.warn('Chart fetch failed:', e.message);
    } finally {
      if (!controller.signal.aborted) setChartLoading(false);
    }
  }, []);

  // Fetch blockchain data
  const fetchChain = useCallback(async () => {
    const [bData, fData, mData, dData, hData, hrData] = await Promise.all([
      safeFetch(API.blocks),
      safeFetch(API.fees),
      safeFetch(API.mempool),
      safeFetch(API.difficulty),
      safeFetch(API.blockHeight),
      safeFetch(API.hashrate),
    ]);
    if (Array.isArray(bData)) setBlocks(bData.slice(0, 10));
    if (fData) setFees(fData);
    if (mData) setMempool(mData);
    if (dData) setDifficulty(dData);
    if (hrData?.currentHashrate) setHashrate(hrData.currentHashrate);
    if (typeof hData === 'number') {
      setBlockHeight(hData);
      const nextHalving = Math.ceil(hData / 210000) * 210000;
      setHalvingBlocks(nextHalving - hData);
    }
    setChainLoading(false);
  }, [safeFetch]);

  // Fetch Lightning stats
  const fetchLightning = useCallback(async () => {
    const data = await safeFetch(API.lightningStats);
    if (data?.latest) setLightning(data.latest);
    else if (data) setLightning(data);
  }, [safeFetch]);

  // Fetch news headlines
  const fetchNews = useCallback(async () => {
    const data = await safeFetch(API.news);
    if (data?.items) {
      setNewsHeadlines(data.items.slice(0, 10).map(item => item.title));
    }
  }, [safeFetch]);

  // Build ticker items from market data + news
  const tickerItems = React.useMemo(() => {
    const items = [];
    if (price) {
      const change = price.usd_24h_change;
      const arrow = change >= 0 ? '▲' : '▼';
      items.push({ text: `BTC $${price.usd.toLocaleString()} ${arrow}${Math.abs(change).toFixed(1)}%`, type: 'market' });
    }
    if (fees) {
      items.push({ text: `Next block: ${fees.fastestFee} sat/vB`, type: 'market' });
    }
    if (mempool) {
      const count = mempool.count?.toLocaleString() || '...';
      items.push({ text: `Mempool: ${count} txs`, type: 'market' });
    }
    if (blockHeight) {
      items.push({ text: `Block #${blockHeight.toLocaleString()}`, type: 'market' });
    }
    for (const headline of newsHeadlines) {
      items.push({ text: headline, type: 'news' });
    }
    return items;
  }, [price, fees, mempool, blockHeight, newsHeadlines]);

  // Price alert checker
  const checkAlerts = useCallback(async (currentPrice, previousPrice) => {
    const alerts = await loadAlerts();
    for (const alert of alerts) {
      if (!alert.enabled) continue;
      const triggered =
        (alert.type === 'above' && previousPrice < alert.price && currentPrice >= alert.price) ||
        (alert.type === 'below' && previousPrice > alert.price && currentPrice <= alert.price);
      if (triggered) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `BTC ${alert.type === 'above' ? '▲' : '▼'} $${alert.price.toLocaleString()}`,
            body: `Bitcoin is now $${currentPrice.toLocaleString()}`,
            sound: true,
          },
          trigger: null,
        });
        // Disable one-shot alerts
        if (alert.oneShot) {
          alert.enabled = false;
        }
      }
    }
    await saveAlerts(alerts);
    setPriceAlerts(alerts);
  }, []);

  // Load saved alerts
  useEffect(() => {
    loadAlerts().then(setPriceAlerts);
  }, []);

  // Initial fetch + intervals
  useEffect(() => {
    fetchPrice();
    fetchChain();
    fetchLightning();
    fetchNews();
    const priceInterval = setInterval(fetchPrice, 30000);
    const chainInterval = setInterval(fetchChain, 60000);
    const lnInterval = setInterval(fetchLightning, 300000);
    const newsInterval = setInterval(fetchNews, 300000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(chainInterval);
      clearInterval(lnInterval);
      clearInterval(newsInterval);
    };
  }, [fetchPrice, fetchChain, fetchLightning, fetchNews]);

  // Fetch chart on timeframe change
  useEffect(() => {
    fetchChart(timeframe);
  }, [timeframe, fetchChart]);

  // Pause/resume on app state changes
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        fetchPrice();
        fetchChain();
      }
    });
    return () => sub.remove();
  }, [fetchPrice, fetchChain]);

  const value = {
    // Price
    price, priceLoading,
    // Chart
    ohlc, lineData, timeframe, setTimeframe, chartLoading,
    // Chain
    blockHeight, blocks, fees, mempool, difficulty, hashrate, halvingBlocks, chainLoading,
    // Lightning
    lightning,
    // Ticker
    tickerItems,
    // Alerts
    priceAlerts, setPriceAlerts,
    // Actions
    refreshPrice: fetchPrice,
    refreshChain: fetchChain,
    fetchChain,
    fetchLightning,
    refreshAll: () => Promise.all([fetchPrice(), fetchChain(), fetchLightning()]),
  };

  return (
    <BitcoinContext.Provider value={value}>
      {children}
    </BitcoinContext.Provider>
  );
}

export function useBitcoin() {
  const ctx = useContext(BitcoinContext);
  if (!ctx) throw new Error('useBitcoin must be inside BitcoinProvider');
  return ctx;
}
