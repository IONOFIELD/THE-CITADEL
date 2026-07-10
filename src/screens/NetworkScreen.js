import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useBitcoin } from '../context/BitcoinContext';
import { COLORS, SPACING, FONT_SIZES, API } from '../utils/theme';
import { fmtCompact, fmtUSD, fmtPct, satsToBTC, fmtTimeAgo } from '../utils/format';
import { StatCard, SectionHeader, Divider } from '../components/UI';

export default function NetworkScreen() {
  const {
    price, lightning, blockHeight, blocks, fees, mempool,
    difficulty, hashrate, halvingBlocks, fetchChain, fetchLightning,
  } = useBitcoin();

  const [mode, setMode] = useState('chain'); // 'chain' | 'lightning'
  const [topNodes, setTopNodes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopNodes();
  }, []);

  const fetchTopNodes = async () => {
    try {
      const res = await fetch(API.lightningTopCapacity);
      const data = await res.json();
      if (Array.isArray(data)) setTopNodes(data.slice(0, 10));
    } catch (e) {
      console.warn('Lightning top nodes fetch failed', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (mode === 'chain') {
      await fetchChain?.();
    } else {
      await Promise.all([fetchLightning?.(), fetchTopNodes()]);
    }
    setRefreshing(false);
  };

  const btcPrice = price?.usd || 0;
  const totalCapacityBTC = lightning ? satsToBTC(lightning.total_capacity) : 0;
  const totalCapacityUSD = totalCapacityBTC * btcPrice;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.btc} />}
    >
      {/* Mode Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'chain' && styles.toggleActive]}
          onPress={() => setMode('chain')}
        >
          <Text style={[styles.toggleText, mode === 'chain' && styles.toggleTextActive]}>⛓ CHAIN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'lightning' && styles.toggleActive]}
          onPress={() => setMode('lightning')}
        >
          <Text style={[styles.toggleText, mode === 'lightning' && styles.toggleTextActive]}>⚡ LIGHTNING</Text>
        </TouchableOpacity>
      </View>

      {mode === 'chain' ? (
        /* ━━━ CHAIN VIEW ━━━ */
        <>
          {/* Mining & Difficulty */}
          <View style={styles.statsGrid}>
            <StatCard
              label="HASHRATE"
              value={hashrate ? `${(hashrate / 1e18).toFixed(1)} EH/s` : '...'}
            />
            <StatCard
              label="EPOCH PROGRESS"
              value={difficulty ? `${difficulty.progressPercent.toFixed(1)}%` : '...'}
              sub={difficulty ? `Target #${difficulty.nextRetargetHeight?.toLocaleString()}` : null}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="BLOCK HEIGHT"
              value={blockHeight ? `#${blockHeight.toLocaleString()}` : '...'}
            />
            <StatCard
              label="DIFF ADJUST"
              value={difficulty ? fmtPct(difficulty.difficultyChange) : '...'}
              sub={difficulty ? `~${Math.round(difficulty.remainingBlocks)} blks left` : null}
            />
          </View>

          {/* Mempool */}
          <View style={styles.statsGrid}>
            <StatCard
              label="MEMPOOL"
              value={mempool ? `${fmtCompact(mempool.count)} tx` : '...'}
              sub={mempool ? `${(mempool.vsize / 1e6).toFixed(1)} MvB` : null}
            />
            <StatCard
              label="FEE (sat/vB)"
              value={fees ? `${fees.fastestFee}` : '...'}
              sub={fees ? `mid: ${fees.halfHourFee} / eco: ${fees.economyFee}` : null}
            />
          </View>

          {/* Halving */}
          <View style={styles.statsGrid}>
            <StatCard
              label="HALVING"
              value={halvingBlocks ? `${halvingBlocks.toLocaleString()} blks` : '...'}
              sub={halvingBlocks ? `~${Math.round(halvingBlocks * 10 / 60 / 24)} days` : null}
            />
            <StatCard
              label="SUBSIDY"
              value={blockHeight ? `${(50 / Math.pow(2, Math.floor(blockHeight / 210000))).toFixed(4)} BTC` : '...'}
              sub={blockHeight ? `Epoch ${Math.floor(blockHeight / 210000) + 1}` : null}
            />
          </View>

          {/* Halving Progress */}
          {halvingBlocks && blockHeight && (
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>HALVING PROGRESS</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((210000 - halvingBlocks) / 210000) * 100}%` }]} />
              </View>
              <Text style={styles.progressMeta}>
                {((210000 - halvingBlocks) / 210000 * 100).toFixed(1)}% of epoch complete
              </Text>
            </View>
          )}

          <Divider />

          {/* Recent Blocks */}
          <SectionHeader title="RECENT BLOCKS" right="MEMPOOL.SPACE" />
          {blocks?.map((b) => (
            <View key={b.id} style={styles.blockRow}>
              <Text style={styles.blockHeight}>#{b.height.toLocaleString()}</Text>
              <Text style={styles.blockTx}>{b.tx_count} tx</Text>
              <Text style={styles.blockSize}>{(b.size / 1e6).toFixed(2)} MB</Text>
              <Text style={styles.blockAge}>{fmtTimeAgo(b.timestamp)}</Text>
            </View>
          ))}
        </>
      ) : (
        /* ━━━ LIGHTNING VIEW ━━━ */
        <>
          {lightning ? (
            <>
              <View style={styles.statsGrid}>
                <StatCard
                  label="CAPACITY"
                  value={`${totalCapacityBTC.toFixed(0)} BTC`}
                  sub={fmtUSD(totalCapacityUSD)}
                />
                <StatCard
                  label="CHANNELS"
                  value={fmtCompact(lightning.channel_count)}
                />
              </View>
              <View style={styles.statsGrid}>
                <StatCard
                  label="NODES"
                  value={fmtCompact(lightning.node_count)}
                />
                <StatCard
                  label="AVG CAPACITY"
                  value={lightning.channel_count
                    ? `${(satsToBTC(lightning.total_capacity) / lightning.channel_count * 1e8).toFixed(0)} sats`
                    : '...'
                  }
                  sub={lightning.channel_count ? fmtUSD(totalCapacityUSD / lightning.channel_count) : null}
                />
              </View>
              <View style={styles.statsGrid}>
                <StatCard
                  label="AVG FEE RATE"
                  value={lightning.avg_fee_rate !== undefined ? `${lightning.avg_fee_rate} ppm` : '...'}
                />
                <StatCard
                  label="AVG BASE FEE"
                  value={lightning.avg_base_fee_mtokens !== undefined
                    ? `${(lightning.avg_base_fee_mtokens / 1000).toFixed(1)} sat`
                    : '...'
                  }
                />
              </View>
            </>
          ) : (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>LOADING LIGHTNING DATA...</Text>
            </View>
          )}

          <Divider />

          {/* Top Nodes by Capacity */}
          <SectionHeader title="TOP NODES BY CAPACITY" right="MEMPOOL.SPACE" />
          {topNodes.map((node, i) => {
            const capBTC = satsToBTC(node.capacity || 0);
            return (
              <View key={node.publicKey || i} style={styles.nodeRow}>
                <View style={styles.nodeRank}>
                  <Text style={styles.nodeRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nodeAlias} numberOfLines={1}>
                    {node.alias || node.publicKey?.slice(0, 16) + '...' || 'Unknown'}
                  </Text>
                  <Text style={styles.nodeMeta}>{fmtCompact(node.channels || 0)} ch</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.nodeCap}>{capBTC.toFixed(2)} BTC</Text>
                  <Text style={styles.nodeCapUSD}>{fmtUSD(capBTC * btcPrice)}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  toggleRow: {
    flexDirection: 'row',
    margin: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
  },
  toggleActive: {
    backgroundColor: COLORS.btcSubtle,
    borderColor: COLORS.btc,
  },
  toggleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  toggleTextActive: {
    color: COLORS.btc,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: SPACING.lg, paddingVertical: 3,
  },
  progressCard: {
    margin: SPACING.lg, padding: SPACING.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.btc, fontFamily: 'monospace',
    letterSpacing: 2, marginBottom: 8,
  },
  progressBar: {
    height: 3, backgroundColor: COLORS.border, borderRadius: 1, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.btc, borderRadius: 1,
  },
  progressMeta: {
    fontSize: FONT_SIZES.xs, color: COLORS.textGhost, fontFamily: 'monospace',
    marginTop: 4,
  },
  blockRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDim, gap: 10,
  },
  blockHeight: {
    fontSize: FONT_SIZES.md, color: COLORS.btc, fontWeight: '700',
    fontFamily: 'monospace', minWidth: 80,
  },
  blockTx: {
    fontSize: FONT_SIZES.sm, color: COLORS.textTertiary,
    fontFamily: 'monospace', minWidth: 50,
  },
  blockSize: {
    fontSize: FONT_SIZES.sm, color: COLORS.textMuted,
    fontFamily: 'monospace', minWidth: 55,
  },
  blockAge: {
    fontSize: FONT_SIZES.sm, color: COLORS.textGhost,
    fontFamily: 'monospace', flex: 1, textAlign: 'right',
  },
  loadingWrap: {
    padding: SPACING.xl, alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.sm, color: COLORS.textMuted,
    fontFamily: 'monospace', letterSpacing: 2,
  },
  nodeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDim,
  },
  nodeRank: {
    width: 22, height: 22, borderRadius: 2, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeRankText: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontFamily: 'monospace',
  },
  nodeAlias: {
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontFamily: 'monospace',
  },
  nodeMeta: {
    fontSize: FONT_SIZES.xs, color: COLORS.textGhost, fontFamily: 'monospace', marginTop: 2,
  },
  nodeCap: {
    fontSize: FONT_SIZES.md, color: COLORS.btc, fontFamily: 'monospace', fontWeight: '700',
  },
  nodeCapUSD: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontFamily: 'monospace', marginTop: 2,
  },
});
