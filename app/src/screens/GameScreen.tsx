import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { Reveal } from '../components/Reveal';
import { euro, guessRange, scoreGuess, ROUNDS_PER_GAME, type Listing, type Round } from '../lib/game';
import { colors, radius, space, type } from '../theme';

interface Props {
  deck: Listing[];
  onFinish: (rounds: Round[]) => void;
}

export const GameScreen = ({ deck, onFinish }: Props) => {
  const [index, setIndex] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [locked, setLocked] = useState<Round | null>(null);

  const listing = deck[index];
  const range = useMemo(() => guessRange(listing), [listing]);
  const [guess, setGuess] = useState(range.start);

  const lockIn = () => setLocked(scoreGuess(listing, guess));

  const next = () => {
    if (!locked) return;
    const completed = [...rounds, locked];
    if (completed.length >= ROUNDS_PER_GAME || index + 1 >= deck.length) {
      onFinish(completed);
      return;
    }
    const nextRange = guessRange(deck[index + 1]);
    setRounds(completed);
    setLocked(null);
    setIndex(index + 1);
    setGuess(nextRange.start);
  };

  const score = rounds.reduce((sum, r) => sum + r.points, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.counter}>
          {String(index + 1).padStart(2, '0')}
          <Text style={styles.counterMuted}> / {String(ROUNDS_PER_GAME).padStart(2, '0')}</Text>
        </Text>
        <Text style={styles.score}>{score} pts</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(index / ROUNDS_PER_GAME) * 100}%` }]} />
      </View>

      {locked ? (
        <Reveal round={locked} isLast={rounds.length + 1 >= ROUNDS_PER_GAME} onNext={next} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ListingCard listing={listing} />
          </ScrollView>

          <View style={styles.guessPanel}>
            <Text style={styles.kicker}>Your guess · monthly Kaltmiete</Text>
            <Text style={styles.guessValue}>{euro(guess)}</Text>

            <Slider
              style={styles.slider}
              minimumValue={range.min}
              maximumValue={range.max}
              step={10}
              value={guess}
              onValueChange={setGuess}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />

            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>{euro(range.min)}</Text>
              <Text style={styles.rangeText}>{euro(range.max)}</Text>
            </View>

            <Pressable style={styles.button} onPress={lockIn}>
              <Text style={styles.buttonText}>Lock it in</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm + 2,
  },
  counter: {
    ...type.label,
    color: colors.text,
    textTransform: 'uppercase',
  },
  counterMuted: {
    color: colors.muted,
  },
  score: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: space.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  scroll: {
    padding: space.lg,
  },
  guessPanel: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  kicker: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  guessValue: {
    ...type.display,
    fontSize: 52,
    color: colors.text,
    marginTop: space.xs,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: space.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -space.xs,
  },
  rangeText: {
    ...type.label,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  button: {
    marginTop: space.lg,
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
