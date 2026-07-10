import React, { useMemo, useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import Svg, { Line, Rect, Path, Text as SvgText, G, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { COLORS } from '../utils/theme';
import { fmtUSD } from '../utils/format';

const { width: SCREEN_W } = Dimensions.get('window');

// Synthesize OHLC candles from line data for consistent density
function synthesizeCandles(lineData, targetCount = 80) {
  if (!lineData?.length || lineData.length < 2) return [];

  const count = Math.min(targetCount, Math.floor(lineData.length / 2));
  if (count < 3) return [];

  const bucketSize = lineData.length / count;
  const candles = [];

  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.min(Math.floor((i + 1) * bucketSize), lineData.length);
    if (start >= end) continue;

    const bucket = lineData.slice(start, end);
    const open = bucket[0][1];
    const close = bucket[bucket.length - 1][1];
    let high = -Infinity, low = Infinity;
    for (const [, p] of bucket) {
      if (p > high) high = p;
      if (p < low) low = p;
    }
    const t = bucket[Math.floor(bucket.length / 2)][0];
    candles.push([t, open, high, low, close]);
  }
  return candles;
}

// Generate a data fingerprint to detect actual data changes
function dataFingerprint(lineData, ohlcData) {
  const l = lineData?.length || 0;
  const o = ohlcData?.length || 0;
  if (l === 0 && o === 0) return 'empty';
  const first = lineData?.[0]?.[0] || ohlcData?.[0]?.[0] || 0;
  const last = lineData?.[l - 1]?.[0] || ohlcData?.[o - 1]?.[0] || 0;
  return `${l}-${o}-${first}-${last}`;
}

function ChartContent({ candles, lineData, showCandles, width, height, pad, chartW, chartH, priceRange, timeRange }) {
  const toX = (t) => pad.left + ((t - timeRange.min) / (timeRange.max - timeRange.min)) * chartW;
  const toY = (p) => pad.top + (1 - (p - priceRange.min) / (priceRange.max - priceRange.min)) * chartH;

  // Grid lines
  const gridLines = [];
  const step = (priceRange.max - priceRange.min) / 5;
  for (let i = 0; i <= 5; i++) {
    const price = priceRange.min + step * i;
    gridLines.push({ y: toY(price), label: fmtUSD(price) });
  }

  // Time labels
  const items = showCandles ? candles : (lineData || []);
  const rangeMs = timeRange.max - timeRange.min;
  const rangeDays = rangeMs / 86400000;
  const timeLabels = [];
  if (items.length >= 2) {
    const labelStep = Math.max(1, Math.floor(items.length / 6));
    for (let i = 0; i < items.length; i += labelStep) {
      const t = items[i][0];
      const d = new Date(t);
      let label;
      if (rangeDays < 2) {
        label = d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else if (rangeDays < 90) {
        label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      } else {
        label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      }
      timeLabels.push({ x: toX(t), label });
    }
  }

  // Line path
  let linePath = '';
  let areaPath = '';
  if (!showCandles && lineData?.length > 0) {
    linePath = lineData.map((d, i) => {
      return `${i === 0 ? 'M' : 'L'}${toX(d[0])},${toY(d[1])}`;
    }).join(' ');
    const lastX = toX(lineData[lineData.length - 1][0]);
    const firstX = toX(lineData[0][0]);
    const bottom = pad.top + chartH;
    areaPath = `${linePath} L${lastX},${bottom} L${firstX},${bottom} Z`;
  }

  const lastPoint = (!showCandles && lineData?.length > 0) ? {
    x: toX(lineData[lineData.length - 1][0]),
    y: toY(lineData[lineData.length - 1][1]),
  } : null;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f7931a" stopOpacity="0.15" />
          <Stop offset="1" stopColor="#f7931a" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Grid */}
      {gridLines.map((g, i) => (
        <G key={i}>
          <Line x1={pad.left} y1={g.y} x2={width - pad.right} y2={g.y}
            stroke={COLORS.borderDim} strokeWidth={0.5} />
          <SvgText x={width - pad.right + 4} y={g.y + 3}
            fill={COLORS.textMuted} fontSize={8} fontFamily="monospace">
            {g.label}
          </SvgText>
        </G>
      ))}

      {/* Time labels */}
      {timeLabels.map((t, i) => (
        <SvgText key={i} x={t.x} y={height - 6}
          fill={COLORS.textGhost} fontSize={7} fontFamily="monospace" textAnchor="middle">
          {t.label}
        </SvgText>
      ))}

      {/* Candles */}
      {showCandles && candles.map(([t, o, h, l, c], i) => {
        const x = toX(t);
        const isGreen = c >= o;
        const color = isGreen ? COLORS.btc : COLORS.btcDim;
        const candleW = Math.max(2, Math.min(8, (chartW / candles.length) * 0.6));
        return (
          <G key={i}>
            <Line x1={x} y1={toY(h)} x2={x} y2={toY(l)}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
            <Rect
              x={x - candleW / 2} y={toY(Math.max(o, c))}
              width={candleW} height={Math.max(1, toY(Math.min(o, c)) - toY(Math.max(o, c)))}
              fill={color}
            />
          </G>
        );
      })}

      {/* Line chart */}
      {!showCandles && lineData?.length > 0 && (
        <G>
          <Path d={areaPath} fill="url(#areaGrad)" />
          <Path d={linePath} fill="none" stroke={COLORS.btc} strokeWidth={1.5} />
          {lastPoint && (
            <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={COLORS.btc} />
          )}
        </G>
      )}
    </Svg>
  );
}

export default function PriceChart({ ohlcData, lineData, showCandles, height = 280 }) {
  const width = SCREEN_W - 32;
  const pad = { top: 16, right: 56, bottom: 24, left: 8 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  // Animation values
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prevFingerprint = useRef('');

  // Use real OHLC data from Binance directly — no synthesis needed
  const candles = useMemo(() => {
    if (!showCandles) return [];
    return ohlcData || [];
  }, [ohlcData, showCandles]);

  const priceRange = useMemo(() => {
    let prices = [];
    if (showCandles && candles.length) {
      candles.forEach(d => { prices.push(d[2], d[3]); });
    } else if (lineData?.length) {
      lineData.forEach(d => prices.push(d[1]));
    }
    if (!prices.length) return { min: 0, max: 100000 };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const margin = (max - min) * 0.06;
    return { min: min - margin, max: max + margin };
  }, [candles, lineData, showCandles]);

  const timeRange = useMemo(() => {
    const items = showCandles ? candles : (lineData || []);
    if (!items.length) return { min: Date.now() - 86400000, max: Date.now() };
    return { min: items[0][0], max: items[items.length - 1][0] };
  }, [candles, lineData, showCandles]);

  // Detect data changes and animate zoom transition
  const fp = dataFingerprint(lineData, ohlcData);
  useEffect(() => {
    if (prevFingerprint.current && prevFingerprint.current !== fp && fp !== 'empty') {
      // Determine zoom direction: wider time range = zoom out, narrower = zoom in
      const prevRange = timeRange.max - timeRange.min;
      // Animate: fade out with slight scale, then fade in
      opacity.setValue(0);
      scale.setValue(0.96);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 12,
          tension: 80,
          useNativeDriver: false,
        }),
      ]).start();
    }
    prevFingerprint.current = fp;
  }, [fp]);

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity,
        transform: [{ scaleX: scale }, { scaleY: scale }],
      },
    ]}>
      <ChartContent
        candles={candles}
        lineData={lineData}
        showCandles={showCandles}
        width={width}
        height={height}
        pad={pad}
        chartW={chartW}
        chartH={chartH}
        priceRange={priceRange}
        timeRange={timeRange}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});
