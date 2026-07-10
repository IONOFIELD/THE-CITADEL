import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useBitcoin } from '../context/BitcoinContext';
import { COLORS, SPACING, FONT_SIZES, TIMEFRAMES } from '../utils/theme';
import { fmtUSD, fmtCompact, fmtPct, fmtTimeAgo } from '../utils/format';
import { StatCard, SectionHeader, PillRow, Divider } from '../components/UI';
import PriceChart from '../components/PriceChart';

export default function DashboardScreen() {
  const {
    price, priceLoading, ohlc, lineData, timeframe, setTimeframe, chartLoading,
    blockHeight, blocks, fees, mempool, difficulty, hashrate, halvingBlocks,
    chainLoading, refreshAll,
  } = useBitcoin();

  const [chartMode, setChartMode] = useState('candle');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const pctChange = price?.usd_24h_change;
  const pctColor = pctChange >= 0 ? COLORS.btc : COLORS.btcDim;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.btc} />}
    >
      {/* Price Hero */}
      <View style={styles.priceHero}>
        <Text style={styles.priceMain}>{price ? fmtUSD(price.usd) : '...'}</Text>
        <View style={styles.priceRow}>
          {pctChange !== undefined && (
            <Text style={[styles.pctChange, { color: pctColor }]}>{fmtPct(pctChange)}</Text>
          )}
          <Text style={styles.pctLabel}>24H</Text>
        </View>
        <View style={styles.priceMetaRow}>
          <Text style={styles.metaItem}>VOL <Text style={styles.metaValue}>${fmtCompact(price?.usd_24h_vol)}</Text></Text>
          <Text style={styles.metaItem}>MCAP <Text style={styles.metaValue}>${fmtCompact(price?.usd_market_cap)}</Text></Text>
          <Text style={styles.metaItem}>SATS/$ <Text style={styles.metaValue}>{price ? Math.round(1e8 / price.usd).toLocaleString() : '...'}</Text></Text>
        </View>
      </View>

      <Divider />

      {/* Chart Controls */}
      <View style={styles.chartControls}>
        <PillRow
          options={TIMEFRAMES.map(tf => ({ label: tf.label, value: tf.days }))}
          active={timeframe}
          onSelect={setTimeframe}
        />
        <View style={styles.modeRow}>
          <TouchableOpacity onPress={() => setChartMode('candle')}>
            <Text style={[styles.modeBtn, chartMode === 'candle' && styles.modeBtnActive]}>CANDLE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setChartMode('line')}>
            <Text style={[styles.modeBtn, chartMode === 'line' && styles.modeBtnActive]}>LINE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chart */}
      {chartLoading && (
        <View style={styles.chartLoading}>
          <Text style={styles.chartLoadingText}>LOADING...</Text>
        </View>
      )}
      <PriceChart
        ohlcData={ohlc}
        lineData={lineData}
        showCandles={chartMode === 'candle'}
      />

      <Divider />

      {/* Network Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="BLOCK HEIGHT" value={blockHeight ? `#${blockHeight.toLocaleString()}` : '...'} />
        <StatCard
          label="FEE (sat/vB)"
          value={fees ? `${fees.fastestFee}` : '...'}
          sub={fees ? `mid: ${fees.halfHourFee} / eco: ${fees.economyFee}` : null}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="MEMPOOL"
          value={mempool ? `${fmtCompact(mempool.count)} tx` : '...'}
          sub={mempool ? `${(mempool.vsize / 1e6).toFixed(1)} MvB` : null}
        />
        <StatCard
          label="DIFF ADJUST"
          value={difficulty ? fmtPct(difficulty.difficultyChange) : '...'}
          sub={difficulty ? `~${Math.round(difficulty.remainingBlocks)} blks left` : null}
          accent={difficulty?.difficultyChange >= 0 ? COLORS.btc : COLORS.btcDim}
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="HASHRATE"
          value={hashrate ? `${(hashrate / 1e18).toFixed(1)} EH/s` : '...'}
        />
        <StatCard
          label="HALVING"
          value={halvingBlocks ? `${halvingBlocks.toLocaleString()} blks` : '...'}
          sub={halvingBlocks ? `~${Math.round(halvingBlocks * 10 / 60 / 24)} days` : null}
        />
      </View>

      {/* Halving Progress */}
      {halvingBlocks && blockHeight && (
        <View style={styles.halvingBar}>
          <View style={styles.halvingTrack}>
            <View style={[styles.halvingFill, { width: `${((210000 - halvingBlocks) / 210000) * 100}%` }]} />
          </View>
          <Text style={styles.halvingMeta}>
            EPOCH {Math.floor(blockHeight / 210000) + 1} // SUBSIDY: {(50 / Math.pow(2, Math.floor(blockHeight / 210000))).toFixed(4)} BTC
          </Text>
        </View>
      )}

      <Divider />

      {/* Recent Blocks */}
      <SectionHeader title="RECENT BLOCKS" right="MEMPOOL.SPACE" />
      {blocks.map((b) => (
        <View key={b.id} style={styles.blockRow}>
          <Text style={styles.blockHeight}>#{b.height.toLocaleString()}</Text>
          <Text style={styles.blockTx}>{b.tx_count} tx</Text>
          <Text style={styles.blockSize}>{(b.size / 1e6).toFixed(2)} MB</Text>
          <Text style={styles.blockAge}>{fmtTimeAgo(b.timestamp)}</Text>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  priceHero: {
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  priceMain: {
    fontSize: 36,
    color: COLORS.btc,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  pctChange: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  pctLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  priceMetaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  metaItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  metaValue: {
    color: COLORS.textTertiary,
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SPACING.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  modeBtn: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeBtnActive: {
    color: COLORS.btc,
  },
  chartLoading: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  chartLoadingText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.btc,
    fontFamily: 'monospace',
    letterSpacing: 3,
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 3,
  },
  halvingBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  halvingTrack: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  halvingFill: {
    height: '100%',
    backgroundColor: COLORS.btc,
    borderRadius: 1,
  },
  halvingMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textGhost,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
    gap: 10,
  },
  blockHeight: {
    fontSize: FONT_SIZES.md,
    color: COLORS.btc,
    fontWeight: '700',
    fontFamily: 'monospace',
    minWidth: 80,
  },
  blockTx: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    minWidth: 50,
  },
  blockSize: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    minWidth: 55,
  },
  blockAge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textGhost,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
});
