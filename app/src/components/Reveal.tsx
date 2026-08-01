import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { euro, roundVerdict, MEDIAN_PER_SQM, type Round } from '../lib/game';
import { colors, radius, space, type } from '../theme';

interface Props {
  round: Round;
  isLast: boolean;
  onNext: () => void;
}

export const Reveal = ({ round, isLast, onNext }: Props) => {
  const { listing, guess, biasPct, errorPct, points } = round;
  const under = biasPct < 0;

  const counter = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = counter.addListener(({ value }) => setShown(value));
    Animated.parallel([
      Animated.timing(counter, {
        toValue: listing.cold_rent,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(enter, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    return () => counter.removeListener(id);
  }, [counter, enter, listing.cold_rent]);

  const slideIn = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  const vsMedian = Math.round(((listing.per_sqm - MEDIAN_PER_SQM) / MEDIAN_PER_SQM) * 100);

  return (
    <View style={styles.wrap}>
      <Text style={styles.context} numberOfLines={1}>
        {listing.district} · {listing.space}m² · {listing.rooms % 1 === 0 ? listing.rooms : listing.rooms.toFixed(1)} Zimmer
      </Text>
      <Text style={styles.kicker}>Actual Kaltmiete</Text>
      <Text style={styles.price}>{euro(shown)}</Text>

      <Animated.View style={[styles.deltaRow, slideIn]}>
        <View style={[styles.badge, { borderColor: under ? colors.under : colors.over }]}>
          <Text style={[styles.badgeText, { color: under ? colors.under : colors.over }]}>
            {Math.abs(Math.round(biasPct))}% {under ? 'under' : 'over'}
          </Text>
        </View>
        <Text style={styles.guessText}>you said {euro(guess)}</Text>
      </Animated.View>

      <Animated.View style={[styles.verdictBlock, slideIn]}>
        <Text style={styles.verdict}>{roundVerdict(errorPct)}</Text>
        <Text style={styles.points}>+{points}</Text>
      </Animated.View>

      <Animated.View style={[styles.facts, slideIn]}>
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>Price per m²</Text>
          <Text style={styles.factValue}>
            €{listing.per_sqm.toFixed(1)}
            <Text style={styles.factMuted}>
              {'  '}
              {vsMedian >= 0 ? '+' : ''}
              {vsMedian}% vs city median
            </Text>
          </Text>
        </View>
        {listing.warm_rent ? (
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Warm rent</Text>
            <Text style={styles.factValue}>{euro(listing.warm_rent)}</Text>
          </View>
        ) : null}
      </Animated.View>

      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>{isLast ? 'See your score' : 'Next flat'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  context: {
    ...type.heading,
    color: colors.text,
    marginBottom: space.lg,
  },
  kicker: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  price: {
    ...type.display,
    color: colors.accent,
    marginTop: space.xs,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    marginTop: space.md,
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.md - 4,
    paddingVertical: 5,
  },
  badgeText: {
    ...type.label,
    textTransform: 'uppercase',
  },
  guessText: {
    ...type.body,
    color: colors.muted,
  },
  verdictBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verdict: {
    ...type.title,
    color: colors.text,
  },
  points: {
    ...type.title,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  facts: {
    marginTop: space.lg,
    gap: space.sm + 2,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factLabel: {
    ...type.body,
    color: colors.muted,
  },
  factValue: {
    ...type.body,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  factMuted: {
    color: colors.muted,
  },
  button: {
    marginTop: space.xxl,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md + 2,
    alignItems: 'center',
  },
  buttonText: {
    ...type.heading,
    color: colors.bg,
  },
});
