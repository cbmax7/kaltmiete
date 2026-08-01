import Slider from '@react-native-community/slider';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { Reveal } from '../components/Reveal';
import { TimerBar } from '../components/TimerBar';
import {
  PRECISION_ROUNDS,
  PRECISION_SECONDS,
  euro,
  guessRange,
  scoreGuess,
  startValue,
  type Listing,
  type Round,
} from '../lib/game';
import { colors, radius, space, type } from '../theme';

interface Props {
  deck: Listing[];
  dayKey: string;
  onFinish: (rounds: Round[]) => void;
  onQuit: () => void;
}

export const PrecisionScreen = ({ deck, dayKey, onFinish, onQuit }: Props) => {
  const [index, setIndex] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [locked, setLocked] = useState<Round | null>(null);

  const listing = deck[index];
  const range = useMemo(() => guessRange(listing), [listing]);
  const [guess, setGuess] = useState(() => startValue(listing, dayKey));

  const lockIn = useCallback(
    (timedOut = false) => {
      setLocked((current) => current ?? scoreGuess(listing, guess, timedOut));
    },
    [listing, guess],
  );

  const next = () => {
    if (!locked) return;
    const completed = [...rounds, locked];
    if (completed.length >= PRECISION_ROUNDS || index + 1 >= deck.length) {
      onFinish(completed);
      return;
    }
    setRounds(completed);
    setLocked(null);
    setIndex(index + 1);
    setGuess(startValue(deck[index + 1], dayKey));
  };

  const score = rounds.reduce((sum, r) => sum + r.points, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={onQuit} hitSlop={12}>
          <Text style={styles.quit}>Exit</Text>
        </Pressable>
        <Text style={styles.counter}>
          {String(index + 1).padStart(2, '0')}
          <Text style={styles.counterMuted}> / {String(PRECISION_ROUNDS).padStart(2, '0')}</Text>
        </Text>
        <Text style={styles.score}>{score} pts</Text>
      </View>

      {locked ? (
        <Reveal round={locked} isLast={rounds.length + 1 >= PRECISION_ROUNDS} onNext={next} />
      ) : (
        <>
          <View style={styles.timer}>
            <TimerBar
              seconds={PRECISION_SECONDS}
              runKey={listing.id}
              onExpire={() => lockIn(true)}
            />
          </View>

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

            <Pressable style={styles.button} onPress={() => lockIn(false)}>
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
    paddingBottom: space.sm,
  },
  quit: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
    width: 60,
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
    width: 60,
    textAlign: 'right',
  },
  timer: {
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  scroll: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
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
    fontSize: 48,
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
    marginTop: space.md,
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
