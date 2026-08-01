import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  STREAK_LENGTH,
  euro,
  summarise,
  summariseStreak,
  type Round,
  type StreakTurn,
} from '../lib/game';
import { precisionShareText, shareResult, streakShareText } from '../lib/share';
import type { Profile } from '../lib/storage';
import { colors, radius, space, type } from '../theme';

export type Outcome =
  | { mode: 'precision'; rounds: Round[] }
  | { mode: 'streak'; turns: StreakTurn[]; cleared: boolean };

interface Props {
  outcome: Outcome;
  profile: Profile;
  day: string;
  counted: boolean;
  onReplay: () => void;
  onHome: () => void;
}

const Stat = ({ value, label, tint }: { value: string; label: string; tint?: string }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, tint ? { color: tint } : null]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const ResultsScreen = ({
  outcome,
  profile,
  day,
  counted,
  onReplay,
  onHome,
}: Props) => {
  const record = profile[outcome.mode];

  const view =
    outcome.mode === 'precision'
      ? (() => {
          const s = summarise(outcome.rounds);
          const under = s.bias < 0;
          return {
            headline: s.headline,
            detail: s.detail,
            share: () =>
              shareResult(
                precisionShareText(day, outcome.rounds, s.points, s.accuracy, s.bias),
              ),
            meter: Math.min(100, Math.max(0, 50 + s.bias)),
            stats: (
              <>
                <Stat value={`${s.points}`} label="Points" />
                <Stat value={`${Math.round(s.accuracy)}%`} label="Accuracy" />
                <Stat
                  value={`${s.bias > 0 ? '+' : ''}${Math.round(s.bias)}%`}
                  label="Bias"
                  tint={under ? colors.under : colors.over}
                />
              </>
            ),
            score: s.points,
          };
        })()
      : (() => {
          const s = summariseStreak(outcome.turns, outcome.cleared);
          return {
            headline: s.headline,
            detail: s.detail,
            share: () =>
              shareResult(streakShareText(day, outcome.turns, s.depth, s.points, s.cleared)),
            meter: null,
            stats: (
              <>
                <Stat value={`${s.depth}`} label="Correct" />
                <Stat value={`${s.bestStreak}`} label="Best run" />
                <Stat value={`${s.points}`} label="Points" />
              </>
            ),
            score: s.depth,
          };
        })();

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>
          {outcome.mode === 'precision' ? 'Your reality check' : 'Streak over'}
          {counted ? '' : ' · practice run'}
        </Text>
        <Text style={styles.headline}>{view.headline}</Text>
        <Text style={styles.detail}>{view.detail}</Text>

        {view.meter !== null ? (
          <View style={styles.meterBlock}>
            <View style={styles.meterTrack}>
              <View style={styles.meterCentre} />
              <View style={[styles.meterMarker, { left: `${view.meter}%` }]} />
            </View>
            <View style={styles.meterLabels}>
              <Text style={styles.meterLabel}>Too cheap</Text>
              <Text style={[styles.meterLabel, styles.meterLabelCentre]}>Spot on</Text>
              <Text style={styles.meterLabel}>Too bleak</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.statRow}>{view.stats}</View>

        <View style={styles.recordRow}>
          <Text style={styles.recordItem}>
            Best {record.best}
            {outcome.mode === 'streak' ? ' deep' : ' pts'}
          </Text>
          <Text style={styles.recordItem}>
            <MaterialCommunityIcons name="fire" size={12} color={colors.accent} />{' '}
            {record.currentStreak}d streak
          </Text>
        </View>

        <Pressable style={styles.shareButton} onPress={view.share}>
          <MaterialCommunityIcons name="share-variant" size={16} color={colors.text} />
          <Text style={styles.shareText}>Share result</Text>
        </Pressable>

        <Text style={styles.breakdownTitle}>Round by round</Text>
        {outcome.mode === 'precision'
          ? outcome.rounds.map((round, i) => (
              <View key={round.listing.id} style={styles.row}>
                <Text style={styles.rowIndex}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={styles.rowMain}>
                  <Text style={styles.rowPlace} numberOfLines={1}>
                    {round.listing.district}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {round.listing.space}m² · you said {euro(round.guess)}
                    {round.timedOut ? ' · timed out' : ''}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowActual}>{euro(round.listing.cold_rent)}</Text>
                  <Text
                    style={[
                      styles.rowDelta,
                      { color: round.biasPct < 0 ? colors.under : colors.over },
                    ]}
                  >
                    {Math.abs(Math.round(round.biasPct))}% {round.biasPct < 0 ? 'under' : 'over'}
                  </Text>
                </View>
              </View>
            ))
          : outcome.turns.map((turn, i) => (
              <View key={turn.current.id} style={styles.row}>
                <MaterialCommunityIcons
                  name={turn.correct ? 'check' : 'close'}
                  size={14}
                  color={turn.correct ? colors.accent : colors.over}
                />
                <View style={styles.rowMain}>
                  <Text style={styles.rowPlace} numberOfLines={1}>
                    {turn.current.district}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {turn.current.space}m² · {Math.round(turn.gapPct)}% apart
                    {turn.call === null ? ' · timed out' : ''}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowActual}>{euro(turn.current.cold_rent)}</Text>
                  <Text style={styles.rowDelta}>
                    {turn.points > 0 ? `+${turn.points}` : '—'}
                  </Text>
                </View>
              </View>
            ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondary} onPress={onHome}>
          <Text style={styles.secondaryText}>Home</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={onReplay}>
          <Text style={styles.primaryText}>Play again</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  kicker: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  headline: {
    ...type.title,
    fontSize: 34,
    lineHeight: 38,
    color: colors.text,
    marginTop: space.sm,
  },
  detail: {
    ...type.body,
    color: colors.muted,
    lineHeight: 22,
    marginTop: space.md,
  },
  meterBlock: {
    marginTop: space.xl,
  },
  meterTrack: {
    height: 6,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    position: 'relative',
    justifyContent: 'center',
  },
  meterCentre: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },
  meterMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: colors.accent,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.sm + 2,
  },
  meterLabel: {
    ...type.label,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  meterLabelCentre: {
    color: colors.text,
  },
  statRow: {
    flexDirection: 'row',
    gap: space.sm + 2,
    marginTop: space.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  statValue: {
    ...type.heading,
    fontSize: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...type.label,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  recordItem: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareText: {
    ...type.body,
    color: colors.text,
  },
  breakdownTitle: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md - 4,
    paddingVertical: space.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIndex: {
    ...type.label,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  rowMain: {
    flex: 1,
  },
  rowPlace: {
    ...type.body,
    color: colors.text,
  },
  rowMeta: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.muted,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowActual: {
    ...type.body,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  rowDelta: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.muted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: space.sm + 2,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondary: {
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    ...type.body,
    color: colors.muted,
  },
  primary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md + 2,
    alignItems: 'center',
  },
  primaryText: {
    ...type.heading,
    color: colors.bg,
  },
});
