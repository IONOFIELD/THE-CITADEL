import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useBitcoin } from '../context/BitcoinContext';
import { COLORS, SPACING, FONT_SIZES } from '../utils/theme';
import { fmtUSD, fmtUSDPrecise, fmtBTC, fmtPct, fmtCompact } from '../utils/format';
import { loadPortfolio, savePortfolio } from '../utils/storage';
import { SectionHeader, Divider, EmptyState } from '../components/UI';

export default function PortfolioScreen() {
  const { price, refreshPrice } = useBitcoin();
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [label, setLabel] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio().then(setEntries);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPrice();
    setRefreshing(false);
  };

  const addEntry = useCallback(async () => {
    const btc = parseFloat(amount);
    const cost = parseFloat(costBasis);
    if (isNaN(btc) || btc <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid BTC amount');
      return;
    }
    const entry = {
      id: Date.now().toString(),
      btc,
      costBasis: isNaN(cost) ? null : cost,
      label: label.trim() || `Position ${entries.length + 1}`,
      addedAt: Date.now(),
    };
    const updated = [...entries, entry];
    setEntries(updated);
    await savePortfolio(updated);
    setAmount('');
    setCostBasis('');
    setLabel('');
    setShowAdd(false);
  }, [amount, costBasis, label, entries]);

  const removeEntry = useCallback(async (id) => {
    Alert.alert('Remove position?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = entries.filter(e => e.id !== id);
          setEntries(updated);
          await savePortfolio(updated);
        },
      },
    ]);
  }, [entries]);

  const currentPrice = price?.usd || 0;

  const analytics = useMemo(() => {
    const totalBTC = entries.reduce((sum, e) => sum + e.btc, 0);
    const totalValue = totalBTC * currentPrice;
    const totalCost = entries.reduce((sum, e) => sum + (e.costBasis ? e.btc * e.costBasis : 0), 0);
    const entriesWithCost = entries.filter(e => e.costBasis);
    const hasAllCostBasis = entries.length > 0 && entries.every(e => e.costBasis);
    const totalPnL = hasAllCostBasis ? totalValue - totalCost : null;
    const totalPnLPct = hasAllCostBasis && totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : null;

    const weightedCostBasis = entriesWithCost.length > 0
      ? entriesWithCost.reduce((sum, e) => sum + e.btc * e.costBasis, 0) / entriesWithCost.reduce((sum, e) => sum + e.btc, 0)
      : null;

    const positions = entries.map(e => {
      const value = e.btc * currentPrice;
      const pnl = e.costBasis ? value - (e.btc * e.costBasis) : null;
      const pnlPct = e.costBasis ? ((currentPrice - e.costBasis) / e.costBasis) * 100 : null;
      const allocation = totalBTC > 0 ? (e.btc / totalBTC) * 100 : 0;
      return { ...e, value, pnl, pnlPct, allocation };
    });

    const withPnl = positions.filter(p => p.pnlPct !== null);
    const best = withPnl.length > 0 ? withPnl.reduce((a, b) => a.pnlPct > b.pnlPct ? a : b) : null;
    const worst = withPnl.length > 0 ? withPnl.reduce((a, b) => a.pnlPct < b.pnlPct ? a : b) : null;
    const totalSats = Math.round(totalBTC * 1e8);

    return {
      totalBTC, totalValue, totalCost, totalPnL, totalPnLPct,
      hasAllCostBasis, weightedCostBasis, positions, best, worst, totalSats,
    };
  }, [entries, currentPrice]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.btc} />}
    >
      {/* Portfolio Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>PORTFOLIO VALUE</Text>
        <Text style={styles.summaryValue}>{fmtUSD(analytics.totalValue)}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryBTC}>{analytics.totalBTC.toFixed(8)} BTC</Text>
          {analytics.totalPnL !== null && (
            <Text style={[styles.summaryPnL, { color: analytics.totalPnL >= 0 ? COLORS.btc : COLORS.red }]}>
              P&L: {fmtUSDPrecise(analytics.totalPnL)} ({fmtPct(analytics.totalPnLPct)})
            </Text>
          )}
        </View>
        <Text style={styles.summaryPrice}>BTC: {fmtUSD(currentPrice)}</Text>
      </View>

      {/* Detailed Stats */}
      {entries.length > 0 && (
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL SATS</Text>
              <Text style={styles.statValue}>{analytics.totalSats.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AVG COST BASIS</Text>
              <Text style={styles.statValue}>
                {analytics.weightedCostBasis ? fmtUSD(analytics.weightedCostBasis) : 'N/A'}
              </Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL INVESTED</Text>
              <Text style={styles.statValue}>
                {analytics.hasAllCostBasis ? fmtUSD(analytics.totalCost) : 'PARTIAL'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>UNREALIZED P&L</Text>
              <Text style={[styles.statValue, {
                color: analytics.totalPnL !== null
                  ? (analytics.totalPnL >= 0 ? COLORS.btc : COLORS.red)
                  : COLORS.textMuted,
              }]}>
                {analytics.totalPnL !== null ? fmtUSDPrecise(analytics.totalPnL) : 'N/A'}
              </Text>
            </View>
          </View>

          {analytics.best && entries.length > 1 && (
            <View style={styles.performerRow}>
              <View style={styles.performerBox}>
                <Text style={styles.performerLabel}>BEST POSITION</Text>
                <Text style={[styles.performerName, { color: COLORS.btc }]}>{analytics.best.label}</Text>
                <Text style={[styles.performerPct, { color: COLORS.btc }]}>{fmtPct(analytics.best.pnlPct)}</Text>
              </View>
              <View style={styles.performerBox}>
                <Text style={styles.performerLabel}>WORST POSITION</Text>
                <Text style={[styles.performerName, { color: COLORS.red }]}>{analytics.worst.label}</Text>
                <Text style={[styles.performerPct, { color: COLORS.red }]}>{fmtPct(analytics.worst.pnlPct)}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <Divider />

      {/* Add Position */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.addBtnText}>{showAdd ? '- CANCEL' : '+ ADD POSITION'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>BTC AMOUNT</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00000000"
              placeholderTextColor={COLORS.textGhost}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>COST BASIS ($/BTC)</Text>
            <TextInput
              style={styles.input}
              value={costBasis}
              onChangeText={setCostBasis}
              placeholder="optional"
              placeholderTextColor={COLORS.textGhost}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>LABEL</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Cold Storage"
              placeholderTextColor={COLORS.textGhost}
            />
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={addEntry}>
            <Text style={styles.submitText}>ADD TO PORTFOLIO</Text>
          </TouchableOpacity>
        </View>
      )}

      <Divider />

      {/* Positions */}
      <SectionHeader title="POSITIONS" right={`${entries.length} ENTRIES`} />

      {entries.length === 0 ? (
        <EmptyState
          icon="₿"
          title="No positions yet"
          subtitle="Add your BTC holdings to track value and P&L over time"
        />
      ) : (
        analytics.positions.map((e) => (
          <TouchableOpacity key={e.id} style={styles.positionRow} onLongPress={() => removeEntry(e.id)}>
            <View style={{ flex: 1 }}>
              <View style={styles.posLabelRow}>
                <Text style={styles.posLabel}>{e.label}</Text>
                <View style={styles.allocBadge}>
                  <Text style={styles.allocText}>{e.allocation.toFixed(1)}%</Text>
                </View>
              </View>
              <Text style={styles.posBTC}>{e.btc.toFixed(8)} BTC</Text>
              <View style={styles.allocBar}>
                <View style={[styles.allocFill, { width: `${Math.min(e.allocation, 100)}%` }]} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.posValue}>{fmtUSDPrecise(e.value)}</Text>
              {e.pnl !== null && (
                <Text style={[styles.posPnL, { color: e.pnl >= 0 ? COLORS.btc : COLORS.red }]}>
                  {fmtPct(e.pnlPct)} ({fmtUSDPrecise(e.pnl)})
                </Text>
              )}
              {e.costBasis && (
                <Text style={styles.posCost}>basis: {fmtUSD(e.costBasis)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  summary: { padding: SPACING.xl },
  summaryLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted,
    letterSpacing: 2, fontFamily: 'monospace',
  },
  summaryValue: {
    fontSize: 36, color: COLORS.btc, fontWeight: '700',
    fontFamily: 'monospace', marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row', gap: 12, alignItems: 'baseline', marginTop: 6,
  },
  summaryBTC: {
    fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontFamily: 'monospace',
  },
  summaryPnL: {
    fontSize: FONT_SIZES.sm, fontFamily: 'monospace', fontWeight: '700',
  },
  summaryPrice: {
    fontSize: FONT_SIZES.sm, color: COLORS.textGhost, fontFamily: 'monospace', marginTop: 8,
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  statBox: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.btc,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  performerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  performerBox: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
  },
  performerLabel: {
    fontSize: 7,
    color: COLORS.textGhost,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 4,
  },
  performerName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  performerPct: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  addBtn: {
    padding: SPACING.lg, alignItems: 'center',
  },
  addBtnText: {
    fontSize: FONT_SIZES.sm, color: COLORS.btc, fontFamily: 'monospace',
    letterSpacing: 2,
  },
  addForm: {
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
  },
  inputRow: { marginBottom: 12 },
  inputLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontFamily: 'monospace',
    letterSpacing: 2, marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2, paddingHorizontal: 12, paddingVertical: 10,
    color: COLORS.textPrimary, fontFamily: 'monospace', fontSize: FONT_SIZES.md,
  },
  submitBtn: {
    backgroundColor: COLORS.btcSubtle, borderWidth: 1, borderColor: COLORS.btc,
    borderRadius: 2, paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  submitText: {
    color: COLORS.btc, fontSize: FONT_SIZES.sm, fontFamily: 'monospace',
    letterSpacing: 2, fontWeight: '700',
  },
  positionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDim,
  },
  posLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  posLabel: {
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontFamily: 'monospace',
  },
  allocBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 1,
  },
  allocText: {
    fontSize: 7,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  posBTC: {
    fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, fontFamily: 'monospace',
  },
  allocBar: {
    height: 2,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  allocFill: {
    height: '100%',
    backgroundColor: COLORS.btc,
    borderRadius: 1,
    opacity: 0.5,
  },
  posValue: {
    fontSize: FONT_SIZES.lg, color: COLORS.btc, fontFamily: 'monospace', fontWeight: '700',
  },
  posPnL: {
    fontSize: FONT_SIZES.sm, fontFamily: 'monospace', fontWeight: '700', marginTop: 2,
  },
  posCost: {
    fontSize: FONT_SIZES.xs, color: COLORS.textGhost, fontFamily: 'monospace', marginTop: 2,
  },
});
