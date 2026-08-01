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

const roomLabel = (rooms: number) => (rooms % 1 === 0 ? `${rooms}` : rooms.toFixed(1));

const describe = (listing: Listing) =>
  `${listing.district} · ${listing.space}m² · ${roomLabel(listing.rooms)}Z`;

export const StreakScreen = ({ deck, onFinish, onQuit }: Props) => {
  // The first flat is orientation, not a question — you cannot compare against a
  // price you have never seen. The clock only starts once it has been read.
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(1);
  const [turns, setTurns] = useState<StreakTurn[]>([]);
  const [lives, setLives] = useState(STREAK_LIVES);
  const [streak, setStreak] = useState(0);
  const [revealed, setRevealed] = useState<StreakTurn | null>(null);

  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** State updates are async, so a ref guards against the timer and a tap both landing. */
  const answering = useRef(false);

  const previous = deck[index - 1];
  const current = deck[index];
  const points = turns.reduce((sum, t) => sum + t.points, 0);

  useEffect(() => () => { if (advance.current) clearTimeout(advance.current); }, []);

  const answer = useCallback(
    (call: Call | null) => {
      if (answering.current || !current) return;
      answering.current = true;

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
        answering.current = false;
        setRevealed(null);
        setIndex(index + 1);
      }, REVEAL_MS);
    },
    [current, previous, streak, turns, lives, index, deck.length, onFinish],
  );

  if (!current) return null;

  const multiplier = streakMultiplier(streak);

  if (!started) {
    const first = deck[0];
    return (
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Pressable onPress={onQuit} hitSlop={12}>
            <Text style={styles.quit}>Exit</Text>
          </Pressable>
          <Text style={styles.introKicker}>Your starting flat</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <ListingCard listing={first} compact />
        </View>

        <View style={styles.reference}>
          <Text style={styles.referenceLabel} numberOfLines={1}>
            {describe(first)}
          </Text>
          <Text style={styles.referencePrice}>{euro(first.cold_rent)}</Text>
        </View>

        <Text style={styles.introHint}>
          Every next flat is matched on size, so only the district and quality tell you
          anything. {STREAK_SECONDS} seconds per call.
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.start} onPress={() => setStarted(true)}>
            <Text style={styles.startText}>Start</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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

      <View style={styles.card}>
        <ListingCard listing={current} compact />
      </View>

      {revealed ? (
        <>
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
        </>
      ) : (
        <>
          {/* The number you are judging against sits directly above the buttons. */}
          <View style={styles.reference}>
            <Text style={styles.referenceLabel} numberOfLines={1}>
              Higher or lower than {previous.district}?
            </Text>
            <Text style={styles.referencePrice}>{euro(previous.cold_rent)}</Text>
          </View>

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
  },
  quit: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
    width: 60,
  },
  headerSpacer: {
    width: 60,
  },
  introKicker: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  introHint: {
    ...type.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: space.lg,
    marginTop: space.md,
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
  card: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  reference: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginHorizontal: space.lg,
    marginBottom: space.sm + 2,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referenceLabel: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
    flex: 1,
  },
  referencePrice: {
    ...type.title,
    fontSize: 30,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
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
  start: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md + 4,
    alignItems: 'center',
  },
  startText: {
    ...type.heading,
    color: colors.bg,
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
