import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useBitcoin } from '../context/BitcoinContext';
import { COLORS, SPACING, FONT_SIZES, API, DONATE_ADDRESS, DONATE_LIGHTNING, HEADER_FONT, HEADER_GLOW } from '../utils/theme';
import { fmtUSD, fmtCompact, truncateAddr, satsToBTC } from '../utils/format';
import { loadWatchlist, saveWatchlist } from '../utils/storage';
import { SectionHeader, Divider, EmptyState } from '../components/UI';

// Get confirmed balance from address data
function getBalance(data) {
  if (!data) return { sats: 0, txCount: 0 };
  const funded = (data.chain_stats?.funded_txo_sum || 0) + (data.mempool_stats?.funded_txo_sum || 0);
  const spent = (data.chain_stats?.spent_txo_sum || 0) + (data.mempool_stats?.spent_txo_sum || 0);
  const txCount = (data.chain_stats?.tx_count || 0) + (data.mempool_stats?.tx_count || 0);
  return { sats: funded - spent, txCount };
}

export default function WatchlistScreen() {
  const { price } = useBitcoin();
  const [watchlist, setWatchlist] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addressData, setAddressData] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    loadWatchlist().then((list) => {
      setWatchlist(list);
      // Deduplicate addresses before fetching
      const uniqueAddrs = [...new Set(list.map(w => w.address))];
      uniqueAddrs.forEach(addr => fetchAddressData(addr));
    });
  }, []);

  const fetchAddressData = async (addr) => {
    try {
      const res = await fetch(API.addressInfo(addr));
      if (!res.ok) return;
      const data = await res.json();
      setAddressData(prev => ({ ...prev, [addr]: data }));
    } catch (e) {
      console.warn('Address fetch failed:', addr, e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const uniqueAddrs = [...new Set(watchlist.map(w => w.address))];
    await Promise.all(uniqueAddrs.map(addr => fetchAddressData(addr)));
    setRefreshing(false);
  };

  const addAddress = useCallback(async () => {
    const addr = address.trim();
    if (!addr || addr.length < 20) {
      Alert.alert('Invalid address', 'Enter a valid Bitcoin address');
      return;
    }
    // Check for exact duplicate address
    if (watchlist.find(w => w.address === addr)) {
      Alert.alert('Duplicate', 'This address is already on your watchlist');
      return;
    }
    const entry = {
      id: Date.now().toString(),
      address: addr,
      label: label.trim() || truncateAddr(addr),
      group: group.trim() || '',
      addedAt: Date.now(),
    };
    const updated = [...watchlist, entry];
    setWatchlist(updated);
    await saveWatchlist(updated);
    fetchAddressData(addr);
    setAddress('');
    setLabel('');
    setGroup('');
    setShowAdd(false);
  }, [address, label, group, watchlist]);

  const removeAddress = useCallback(async (id) => {
    Alert.alert('Remove address?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = watchlist.filter(w => w.id !== id);
          setWatchlist(updated);
          await saveWatchlist(updated);
        },
      },
    ]);
  }, [watchlist]);

  const removeGroup = useCallback(async (groupName) => {
    const count = watchlist.filter(w => w.group === groupName).length;
    Alert.alert(`Remove "${groupName}"?`, `This will remove ${count} addresses.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove All', style: 'destructive', onPress: async () => {
          const updated = watchlist.filter(w => w.group !== groupName);
          setWatchlist(updated);
          await saveWatchlist(updated);
        },
      },
    ]);
  }, [watchlist]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
  };

  const btcPrice = price?.usd || 0;

  // Build grouped structure: { groupName: [entries], ungrouped: [entries] }
  const { grouped, ungrouped } = useMemo(() => {
    const groups = {};
    const solo = [];
    for (const w of watchlist) {
      if (w.group) {
        if (!groups[w.group]) groups[w.group] = [];
        groups[w.group].push(w);
      } else {
        solo.push(w);
      }
    }
    return { grouped: groups, ungrouped: solo };
  }, [watchlist]);

  const getGroupTotals = (entries) => {
    let totalSats = 0;
    let totalTx = 0;
    let allLoaded = true;
    for (const w of entries) {
      const data = addressData[w.address];
      if (!data) { allLoaded = false; continue; }
      const { sats, txCount } = getBalance(data);
      totalSats += sats;
      totalTx += txCount;
    }
    return { totalSats, totalTx, allLoaded };
  };

  const renderAddressRow = (w, isSubItem = false) => {
    const data = addressData[w.address];
    const { sats, txCount } = getBalance(data);
    const balanceBTC = satsToBTC(sats);
    const balanceUSD = balanceBTC * btcPrice;

    return (
      <TouchableOpacity
        key={w.id}
        style={[styles.watchRow, isSubItem && styles.subRow]}
        onLongPress={() => removeAddress(w.id)}
      >
        <View style={{ flex: 1 }}>
          {isSubItem && <Text style={styles.subLabel}>{w.label}</Text>}
          {!isSubItem && <Text style={styles.watchLabel}>{w.label}</Text>}
          <TouchableOpacity onPress={() => copyToClipboard(w.address)}>
            <Text style={styles.watchAddr}>{truncateAddr(w.address)} ⧉</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {data ? (
            <>
              <Text style={styles.watchBalance}>{balanceBTC.toFixed(4)} BTC</Text>
              <Text style={styles.watchUSD}>{fmtUSD(balanceUSD)}</Text>
              <Text style={styles.watchTx}>{fmtCompact(txCount)} tx</Text>
            </>
          ) : (
            <Text style={styles.watchLoading}>loading...</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalAddresses = watchlist.length;
  const totalGroups = Object.keys(grouped).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.btc} />}
    >
      <View style={styles.headerArea}>
        <Text style={styles.headerTitle}>ADDRESS WATCHLIST</Text>
        <Text style={styles.headerSub}>MONITOR ON-CHAIN BALANCES + TX ACTIVITY</Text>
      </View>

      <Divider />

      {/* Add Address */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.addBtnText}>{showAdd ? '- CANCEL' : '+ WATCH ADDRESS'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>BITCOIN ADDRESS</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="bc1q... or 1... or 3..."
              placeholderTextColor={COLORS.textGhost}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>LABEL</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Cold Storage #1"
              placeholderTextColor={COLORS.textGhost}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>ENTITY / GROUP (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={group}
              onChangeText={setGroup}
              placeholder="e.g. Saylor, Binance, My Wallets"
              placeholderTextColor={COLORS.textGhost}
            />
            <Text style={styles.inputHint}>
              Group multiple addresses under one entity to see combined balance
            </Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={addAddress}>
            <Text style={styles.submitText}>ADD TO WATCHLIST</Text>
          </TouchableOpacity>
        </View>
      )}

      <Divider />

      {/* Watched Addresses */}
      <SectionHeader
        title="WATCHED"
        right={`${totalAddresses} ADDR${totalGroups > 0 ? ` / ${totalGroups} GROUPS` : ''}`}
      />

      {watchlist.length === 0 ? (
        <EmptyState
          icon="◎"
          title="No addresses watched"
          subtitle="Track whale wallets, exchange cold storage, or your own addresses"
        />
      ) : (
        <>
          {/* Grouped entities */}
          {Object.entries(grouped).map(([groupName, entries]) => {
            const { totalSats, totalTx, allLoaded } = getGroupTotals(entries);
            const totalBTC = satsToBTC(totalSats);
            const totalUSD = totalBTC * btcPrice;
            const isExpanded = expandedGroups[groupName];

            return (
              <View key={groupName}>
                {/* Group header */}
                <TouchableOpacity
                  style={styles.groupRow}
                  onPress={() => toggleGroup(groupName)}
                  onLongPress={() => removeGroup(groupName)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.groupLabelRow}>
                      <Text style={styles.groupChevron}>{isExpanded ? '▾' : '▸'}</Text>
                      <Text style={styles.groupName}>{groupName.toUpperCase()}</Text>
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>{entries.length} ADDR</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {allLoaded ? (
                      <>
                        <Text style={styles.watchBalance}>{totalBTC.toFixed(4)} BTC</Text>
                        <Text style={styles.watchUSD}>{fmtUSD(totalUSD)}</Text>
                        <Text style={styles.watchTx}>{fmtCompact(totalTx)} tx total</Text>
                      </>
                    ) : (
                      <Text style={styles.watchLoading}>loading...</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded sub-addresses */}
                {isExpanded && entries.map(w => renderAddressRow(w, true))}
              </View>
            );
          })}

          {/* Ungrouped addresses */}
          {ungrouped.map(w => renderAddressRow(w, false))}
        </>
      )}

      <Divider />

      {/* Donate Section */}
      <View style={styles.donateSection}>
        <Text style={styles.donateTitle}>SUPPORT THIS PROJECT</Text>
        <Text style={styles.donateSub}>The Citadel is free and open source. Tips appreciated.</Text>

        <View style={styles.donateRow}>
          <Text style={styles.donateLabel}>ON-CHAIN</Text>
          <TouchableOpacity onPress={() => copyToClipboard(DONATE_ADDRESS)} style={{ marginTop: 4 }}>
            <Text style={styles.donateAddr} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{DONATE_ADDRESS} ⧉</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.donateRow}>
          <Text style={styles.donateLabel}>LIGHTNING</Text>
          <TouchableOpacity onPress={() => copyToClipboard(DONATE_LIGHTNING)} style={{ marginTop: 4 }}>
            <Text style={styles.donateAddr} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{DONATE_LIGHTNING} ⧉</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.donateDisclaimer}>
          Donations are voluntary gifts. Not a purchase, subscription, or investment.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  headerArea: { padding: SPACING.xl },
  headerTitle: {
    fontSize: FONT_SIZES.lg, color: COLORS.btc, fontFamily: HEADER_FONT,
    letterSpacing: 3, fontWeight: '700', ...HEADER_GLOW,
  },
  headerSub: {
    fontSize: FONT_SIZES.xs, color: COLORS.textGhost, fontFamily: 'monospace',
    letterSpacing: 2, marginTop: 4,
  },
  addBtn: { padding: SPACING.lg, alignItems: 'center' },
  addBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.btc, fontFamily: 'monospace', letterSpacing: 2 },
  addForm: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg },
  inputRow: { marginBottom: 12 },
  inputLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontFamily: 'monospace',
    letterSpacing: 2, marginBottom: 4,
  },
  inputHint: {
    fontSize: 7, color: COLORS.textGhost, fontFamily: 'monospace',
    marginTop: 4, letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 2, paddingHorizontal: 12, paddingVertical: 10,
    color: COLORS.textPrimary, fontFamily: 'monospace', fontSize: FONT_SIZES.md,
  },
  submitBtn: {
    backgroundColor: COLORS.btcSubtle, borderWidth: 1, borderColor: COLORS.btc,
    borderRadius: 2, paddingVertical: 12, alignItems: 'center',
  },
  submitText: { color: COLORS.btc, fontSize: FONT_SIZES.sm, fontFamily: 'monospace', letterSpacing: 2, fontWeight: '700' },
  // Group styles
  groupRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDim,
    backgroundColor: COLORS.bgCard,
  },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupChevron: {
    fontSize: FONT_SIZES.md, color: COLORS.btc, fontFamily: 'monospace',
  },
  groupName: {
    fontSize: FONT_SIZES.md, color: COLORS.btc, fontFamily: 'monospace',
    fontWeight: '700', letterSpacing: 2,
  },
  groupBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 1,
  },
  groupBadgeText: {
    fontSize: 7,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  // Address rows
  watchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDim,
  },
  subRow: {
    paddingLeft: SPACING.xl + 20,
    backgroundColor: COLORS.bgElevated,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.btcDim,
  },
  subLabel: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontFamily: 'monospace', marginBottom: 2,
  },
  watchLabel: {
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontFamily: 'monospace', marginBottom: 2,
  },
  watchAddr: {
    fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontFamily: 'monospace',
  },
  watchBalance: {
    fontSize: FONT_SIZES.lg, color: COLORS.btc, fontFamily: 'monospace', fontWeight: '700',
  },
  watchUSD: {
    fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, fontFamily: 'monospace', marginTop: 2,
  },
  watchTx: {
    fontSize: FONT_SIZES.xs, color: COLORS.textGhost, fontFamily: 'monospace', marginTop: 2,
  },
  watchLoading: {
    fontSize: FONT_SIZES.sm, color: COLORS.textGhost, fontFamily: 'monospace',
  },
  donateSection: {
    margin: SPACING.lg, padding: SPACING.lg,
    backgroundColor: '#1a0e04', borderWidth: 1, borderColor: '#f7931a33',
    borderRadius: 2,
  },
  donateTitle: {
    fontSize: FONT_SIZES.sm, color: COLORS.btc, fontFamily: HEADER_FONT,
    letterSpacing: 3, fontWeight: '700', ...HEADER_GLOW,
  },
  donateSub: {
    fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontFamily: 'monospace',
    marginTop: 6, lineHeight: 18,
  },
  donateRow: {
    marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.borderDim,
  },
  donateLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontFamily: 'monospace', letterSpacing: 2,
  },
  donateAddr: {
    fontSize: FONT_SIZES.sm, color: COLORS.btc, fontFamily: 'monospace',
  },
  donateDisclaimer: {
    fontSize: 7, color: COLORS.textGhost, fontFamily: 'monospace',
    letterSpacing: 1, marginTop: 12, textAlign: 'center',
  },
});
