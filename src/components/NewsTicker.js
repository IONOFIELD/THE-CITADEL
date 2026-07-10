import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useBitcoin } from '../context/BitcoinContext';
import { COLORS, FONT_SIZES } from '../utils/theme';

export default function NewsTicker() {
  const { tickerItems } = useBitcoin();
  const scrollX = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);

  // Build the ticker string
  const tickerText = tickerItems.length > 0
    ? tickerItems.map(i => i.text).join('  ◆  ')
    : 'Loading...';

  // Estimate width: ~7px per character in monospace at size 10
  const estimatedWidth = tickerText.length * 7;

  useEffect(() => {
    if (estimatedWidth <= 0) return;

    // Reset position
    scrollX.setValue(400); // Start off-screen right

    // Animate continuously
    const animate = () => {
      scrollX.setValue(400);
      animRef.current = Animated.timing(scrollX, {
        toValue: -estimatedWidth,
        duration: Math.max(estimatedWidth * 30, 10000), // Speed: ~33px/sec
        useNativeDriver: true,
      });
      animRef.current.start(({ finished }) => {
        if (finished) animate(); // Loop
      });
    };

    animate();

    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [tickerText, estimatedWidth]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.scrollWrap, { transform: [{ translateX: scrollX }] }]}>
        <Text style={styles.text} numberOfLines={1}>
          {tickerItems.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text style={styles.divider}>  ◆  </Text>}
              <Text style={item.type === 'market' ? styles.market : styles.news}>
                {item.text}
              </Text>
            </React.Fragment>
          ))}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 26,
    backgroundColor: COLORS.bgDeep,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDim,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scrollWrap: {
    flexDirection: 'row',
    position: 'absolute',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
  },
  market: {
    color: COLORS.btc,
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
  },
  news: {
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
  },
  divider: {
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
  },
});
