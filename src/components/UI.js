import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../utils/theme';

// ━━━ STAT CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function StatCard({ label, value, sub, accent, style }) {
  return (
    <View style={[styles.statCard, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent || COLORS.btc }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

// ━━━ SECTION HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function SectionHeader({ title, right }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right && <Text style={styles.sectionRight}>{right}</Text>}
    </View>
  );
}

// ━━━ PILL BUTTON ROW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function PillRow({ options, active, onSelect }) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value ?? opt.label}
          style={[styles.pill, active === (opt.value ?? opt.label) && styles.pillActive]}
          onPress={() => onSelect(opt.value ?? opt.label)}
        >
          <Text style={[styles.pillText, active === (opt.value ?? opt.label) && styles.pillTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ━━━ DIVIDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function Divider() {
  return <View style={styles.divider} />;
}

// ━━━ EMPTY STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
    </View>
  );
}

// ━━━ LOADING INDICATOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function LoadingDots({ color }) {
  return (
    <Text style={[styles.loadingDots, { color: color || COLORS.btc }]}>...</Text>
  );
}

const styles = StyleSheet.create({
  statCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    flex: 1,
    minWidth: 100,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDim,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.btc,
    letterSpacing: 3,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  sectionRight: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textGhost,
    fontFamily: 'monospace',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 1,
  },
  pillActive: {
    borderColor: COLORS.btc,
    backgroundColor: COLORS.btcSubtle,
  },
  pillText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  pillTextActive: {
    color: COLORS.btc,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderDim,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textGhost,
    fontFamily: 'monospace',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingDots: {
    fontSize: 18,
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
});
