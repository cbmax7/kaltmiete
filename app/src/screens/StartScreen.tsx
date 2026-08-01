import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CITY, DECK_SIZE, MEDIAN_PER_SQM, ROUNDS_PER_GAME } from '../lib/game';
import { colors, radius, space, type } from '../theme';

export const StartScreen = ({ onStart }: { onStart: () => void }) => (
  <View style={styles.wrap}>
    <View style={styles.top}>
      <Text style={styles.eyebrow}>{CITY} · Wohnung mieten</Text>
      <Text style={styles.wordmark}>KALT</Text>
      <Text style={[styles.wordmark, styles.wordmarkAccent]}>MIETE</Text>
      <Text style={styles.tagline}>
        How out of touch are you with what {CITY} actually costs?
      </Text>
    </View>

    <View style={styles.bottom}>
      <View style={styles.factsBox}>
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>Real listings in the deck</Text>
          <Text style={styles.factValue}>{DECK_SIZE}</Text>
        </View>
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>Median asking price</Text>
          <Text style={styles.factValue}>€{MEDIAN_PER_SQM}/m²</Text>
        </View>
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>Flats per round</Text>
          <Text style={styles.factValue}>{ROUNDS_PER_GAME}</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Guess the rent</Text>
      </Pressable>

      <Text style={styles.source}>
        Live listings scraped from ImmobilienScout24. No accounts, no tracking, works offline.
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.xxl,
    paddingBottom: space.lg,
  },
  top: {
    flex: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: space.md,
  },
  wordmark: {
    fontSize: 68,
    lineHeight: 68,
    fontWeight: '900',
    letterSpacing: -3.5,
    color: colors.text,
  },
  wordmarkAccent: {
    color: colors.accent,
  },
  tagline: {
    ...type.body,
    fontSize: 17,
    color: colors.muted,
    marginTop: space.lg,
    maxWidth: 300,
    lineHeight: 24,
  },
  bottom: {
    gap: space.lg,
  },
  factsBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.md + 2,
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
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md + 2,
    alignItems: 'center',
  },
  buttonText: {
    ...type.heading,
    color: colors.bg,
  },
  source: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
});
