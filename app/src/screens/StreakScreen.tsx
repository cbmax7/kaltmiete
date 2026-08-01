import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { TimerBar } from '../components/TimerBar';
import {
  STREAK_LIVES,
  STREAK_SECONDS,
  euro,
  resolveCall,
  streakMultiplier,
  type Call,
  type Listing,
  type StreakTurn,
} from '../lib/game';
import { colors, radius, space, type } from '../theme';

interface Props {
  deck: Listing[];
  onFinish: (turns: StreakTurn[], cleared: boolean) => void;
  onQuit: () => void;
}

const REVEAL_MS = 1600;

export const StreakScreen = ({ deck, onFinish, onQuit }: Props) => {
  const [index, setIndex] = useState(1);
  const [turns, setTurns] = useState<StreakTurn[]>([]);
  const [lives, setLives] = useState(STREAK_LIVES);
  const [streak, setStreak] = useState(0);
  const [revealed, setRevealed] = useState<StreakTurn | null>(null);
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previous = deck[index - 1];
  const current = deck[index];
  const points = turns.reduce((sum, t) => sum + t.points, 0);

  useEffect(() => () => { if (advance.current) clearTimeout(advance.current); }, []);

  const answer = useCallback(
    (call: Call | null) => {
      if (revealed || !current) return;

      const turn = resolveCall(previous, current, call, streak);
      const nextTurns = [...turns, turn];
      const nextLives = turn.correct ? lives : lives - 1;

      setRevealed(turn);
      setTurns(nextTurns);
      setLives(nextLives);
      setStreak(turn.correct ? streak + 1 : 0);

      advance.current = setTimeout(() => {
        const isLastFlat = index + 1 >= deck.length;
        if (nextLives <= 0 || isLastFlat) {
          onFinish(nextTurns, nextLives > 0 && isLastFlat);
          return;
        }
        setRevealed(null);
        setIndex(index + 1);
      }, REVEAL_MS);
    },
    [revealed, current, previous, streak, turns, lives, index, deck.length, onFinish],
  );

  if (!current) return null;

  const multiplier = streakMultiplier(streak);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable onPress={onQuit} hitSlop={12}>
          <Text style={styles.quit}>Exit</Text>
        </Pressable>
        <View style={styles.lives}>
          {Array.from({ length: STREAK_LIVES }).map((_, i) => (
            <MaterialCommunityIcons
              key={i}
              name="heart"
              size={14}
              color={i < lives ? colors.over : colors.border}
            />
          ))}
        </View>
        <Text style={styles.score}>{points} pts</Text>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.depth}>
          {index}
          <Text style={styles.depthMuted}> / {deck.length - 1}</Text>
        </Text>
        {multiplier > 1 ? <Text style={styles.multiplier}>{multiplier}× streak</Text> : null}
      </View>

      <View style={styles.timerSlot}>
        {revealed ? (
          <View style={styles.timerPlaceholder} />
        ) : (
          <TimerBar seconds={STREAK_SECONDS} runKey={index} onExpire={() => answer(null)} />
        )}
      </View>

      {/* The flat you already know the price of */}
      <View style={styles.anchor}>
        <View style={styles.anchorMain}>
          <Text style={styles.anchorLabel}>Previous</Text>
          <Text style={styles.anchorPlace} numberOfLines={1}>
            {previous.district} · {previous.space}m² · {previous.rooms}Z
          </Text>
        </View>
        <Text style={styles.anchorRent}>{euro(previous.cold_rent)}</Text>
      </View>

      <View style={styles.card}>
        <ListingCard listing={current} compact />
      </View>

      {revealed ? (
        <View
          style={[
            styles.result,
            { borderColor: revealed.correct ? colors.accent : colors.over },
          ]}
        >
          <View>
            <Text
              style={[
                styles.resultVerdict,
                { color: revealed.correct ? colors.accent : colors.over },
              ]}
            >
              {revealed.call === null
                ? 'Out of time'
                : revealed.correct
                  ? 'Correct'
                  : 'Wrong'}
            </Text>
            <Text style={styles.resultGap}>{Math.round(revealed.gapPct)}% apart</Text>
          </View>
          <View style={styles.resultRight}>
            <Text style={styles.resultRent}>{euro(current.cold_rent)}</Text>
            {revealed.points > 0 ? (
              <Text style={styles.resultPoints}>+{revealed.points}</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={[styles.action, styles.lower]} onPress={() => answer('lower')}>
            <MaterialCommunityIcons name="arrow-down-bold" size={20} color={colors.under} />
            <Text style={[styles.actionText, { color: colors.under }]}>Lower</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.higher]} onPress={() => answer('higher')}>
            <MaterialCommunityIcons name="arrow-up-bold" size={20} color={colors.bg} />
            <Text style={[styles.actionText, { color: colors.bg }]}>Higher</Text>
          </Pressable>
        </View>
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
  },
  quit: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
    width: 60,
  },
  lives: {
    flexDirection: 'row',
    gap: 4,
  },
  score: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
    width: 60,
    textAlign: 'right',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  depth: {
    ...type.label,
    color: colors.text,
    textTransform: 'uppercase',
  },
  depthMuted: {
    color: colors.muted,
  },
  multiplier: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  timerSlot: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    height: 24,
  },
  timerPlaceholder: {
    height: 4,
  },
  anchor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: space.lg,
    marginTop: space.sm,
    padding: space.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  anchorMain: {
    flex: 1,
  },
  anchorLabel: {
    ...type.label,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  anchorPlace: {
    ...type.body,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  anchorRent: {
    ...type.heading,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm + 4,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md + 4,
    borderRadius: radius.pill,
  },
  lower: {
    borderWidth: 1.5,
    borderColor: colors.under,
  },
  higher: {
    backgroundColor: colors.accent,
  },
  actionText: {
    ...type.heading,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  resultVerdict: {
    ...type.title,
    fontSize: 24,
  },
  resultGap: {
    ...type.label,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultRent: {
    ...type.title,
    fontSize: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  resultPoints: {
    ...type.label,
    color: colors.accent,
    marginTop: 2,
  },
});
