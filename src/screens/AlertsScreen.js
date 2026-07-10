import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Switch, Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useBitcoin } from '../context/BitcoinContext';
import { COLORS, SPACING, FONT_SIZES } from '../utils/theme';
import { fmtUSD } from '../utils/format';
import { loadAlerts, saveAlerts } from '../utils/storage';
import { SectionHeader, Divider, EmptyState } from '../components/UI';

export default function AlertsScreen() {
  const { price, priceAlerts, setPriceAlerts } = useBitcoin();
  const [showAdd, setShowAdd] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [oneShot, setOneShot] = useState(true);
  const [permGranted, setPermGranted] = useState(false);

  useEffect(() => {
    loadAlerts().then(setPriceAlerts);
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'web') { setPermGranted(true); return; }
    if (!Device.isDevice) { setPermGranted(true); return; }
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') { setPermGranted(true); return; }
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    setPermGranted(newStatus === 'granted');
  };

  const addAlert = useCallback(async () => {
    const p = parseFloat(targetPrice);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Invalid price', 'Enter a valid USD price');
      return;
    }
    const alert = {
      id: Date.now().toString(),
      price: p,
      type: alertType,
      oneShot,
      enabled: true,
      createdAt: Date.now(),
    };
    const updated = [...priceAlerts, alert];
    setPriceAlerts(updated);
    await saveAlerts(updated);
    setTargetPrice('');
    setShowAdd(false);
  }, [targetPrice, alertType, oneShot, priceAlerts]);

  const toggleAlert = useCallback(async (id) => {
    const updated = priceAlerts.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    setPriceAlerts(updated);
    await saveAlerts(updated);
  }, [priceAlerts]);

  const removeAlert = useCallback(async (id) => {
    const updated = priceAlerts.filter(a => a.id !== id);
    setPriceAlerts(updated);
    await saveAlerts(updated);
  }, [priceAlerts]);

  const currentPrice = price?.usd || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Current Price Reference */}
      <View style={styles.priceRef}>
        <Text style={styles.priceRefLabel}>CURRENT BTC PRICE</Text>
        <Text style={styles.priceRefValue}>{fmtUSD(currentPrice)}</Text>
      </View>

      {!permGranted && (
        <View style={styles.permWarning}>
          <Text style={styles.permText}>NOTIFICATION PERMISSION REQUIRED</Text>
          <TouchableOpacity onPress={checkPermissions}>
            <Text style={styles.permBtn}>GRANT ACCESS</Text>
          </TouchableOpacity>
        </View>
      )}

      <Divider />

      {/* Add Alert */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.addBtnText}>{showAdd ? '- CANCEL' : '+ NEW ALERT'}</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>TARGET PRICE (USD)</Text>
            <TextInput
              style={styles.input}
              value={targetPrice}
              onChangeText={setTargetPrice}
              placeholder="e.g. 100000"
              placeholderTextColor={COLORS.textGhost}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, alertType === 'above' && styles.typeBtnActive]}
              onPress={() => setAlertType('above')}
            >
              <Text style={[styles.typeText, alertType === 'above' && styles.typeTextActive]}>
                ▲ ABOVE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, alertType === 'below' && styles.typeBtnActive]}
              onPress={() => setAlertType('below')}
            >
              <Text style={[styles.typeText, alertType === 'below' && styles.typeTextActive]}>
                ▼ BELOW
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>ONE-TIME ALERT</Text>
            <Switch
              value={oneShot}
              onValueChange={setOneShot}
              trackColor={{ false: COLORS.border, true: COLORS.btc + '44' }}
              thumbColor={oneShot ? COLORS.btc : COLORS.textMuted}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={addAlert}>
            <Text style={styles.submitText}>CREATE ALERT</Text>
          </TouchableOpacity>
        </View>
      )}

      <Divider />

      {/* Active Alerts */}
      <SectionHeader title="ACTIVE ALERTS" right={`${priceAlerts.filter(a => a.enabled).length} ARMED`} />

      {priceAlerts.length === 0 ? (
        <EmptyState
          icon="!"
          title="No alerts set"
          subtitle="Get push notifications when BTC hits your target price"
        />
      ) : (
        priceAlerts.map((a) => {
          const distance = a.type === 'above'
            ? a.price - currentPrice
            : currentPrice - a.price;
          const distPct = (distance / currentPrice) * 100;
          return (
            <View key={a.id} style={[styles.alertRow, !a.enabled && styles.alertDisabled]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.alertType, { color: a.type === 'above' ? COLORS.btc : COLORS.red }]}>
                    {a.type === 'above' ? '▲' : '▼'}
                  </Text>
                  <Text style={styles.alertPrice}>{fmtUSD(a.price)}</Text>
                  {a.oneShot && <Text style={styles.alertOnce}>ONCE</Text>}
                </View>
                <Text style={styles.alertDist}>
                  {distance > 0 ? `${distPct.toFixed(1)}% away` : 'TRIGGERED ZONE'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Switch
                  value={a.enabled}
                  onValueChange={() => toggleAlert(a.id)}
                  trackColor={{ false: COLORS.border, true: COLORS.btc + '44' }}
                  thumbColor={a.enabled ? COLORS.btc : COLORS.textMuted}
                />
                <TouchableOpacity onPress={() => removeAlert(a.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  priceRef: { padding: SPACING.xl },
  priceRefLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted,
    letterSpacing: 2, fontFamily: 'monospace',
  },
  priceRefValue: {
    fontSize: 36, color: COLORS.btc, fontWeight: '700',
    fontFamily: 'monospace', marginTop: 4,
  },
  permWarning: {
    margin: SPACING.lg, padding: SPACING.md,
    backgroundColor: COLORS.redDim, borderWidth: 1, borderColor: COLORS.red + '44',
    borderRadius: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  permText: { fontSize: FONT_SIZES.xs, color: COLORS.red, fontFamily: 'monospace', letterSpacing: 1 },
  permBtn: { fontSize: FONT_SIZES.sm, color: COLORS.red, fontFamily: 'monospace', fontWeight: '700' },
  addBtn: { padding: SPACING.lg, alignItems: 'center' },
  addBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.btc, fontFamily: 'monospace', letterSpacing: 2 },
  addForm: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg },
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
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 2,
  },
  typeBtnActive: { borderColor: COLORS.btc, backgroundColor: COLORS.btcSubtle },
  typeText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontFamily: 'monospace', letterSpacing: 1 },
  typeTextActive: { color: COLORS.btc },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, fontFamily: 'monospace', letterSpacing: 1 },
  submitBtn: {
    backgroundColor: COLORS.btcSubtle, borderWidth: 1, borderColor: COLORS.btc,
    borderRadius: 2, paddingVertical: 12, alignItems: 'center',
  },
  submitText: { color: COLORS.btc, fontSize: FONT_SIZES.sm, fontFamily: 'monospace', letterSpacing: 2, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderDim,
  },
  alertDisabled: { opacity: 0.4 },
  alertType: { fontSize: 14, fontWeight: '700' },
  alertPrice: { fontSize: FONT_SIZES.lg, color: COLORS.textPrimary, fontFamily: 'monospace', fontWeight: '700' },
  alertOnce: {
    fontSize: 7, color: COLORS.textGhost, fontFamily: 'monospace',
    letterSpacing: 1, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 1,
  },
  alertDist: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontFamily: 'monospace', marginTop: 2 },
  deleteBtn: { fontSize: 14, color: COLORS.textGhost, padding: 4 },
});
