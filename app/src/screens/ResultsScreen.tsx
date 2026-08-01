import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { euro, summarise, type Round } from '../lib/game';
import { colors, radius, space, type } from '../theme';

interface Props {
  rounds: Round[];
  onRestart: () => void;
}

export const ResultsScreen = ({ rounds, onRestart }: Props) => {
  const summary = summarise(rounds);
  const under = summary.bias < 0;
  // Centre of the meter is a perfect read; ±50% bias pins it to either edge.
  const markerPct = Math.min(100, Math.max(0, 50 + summary.bias));

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Your reality check</Text>
        <Text style={styles.headline}>{summary.headline}</Text>
        <Text style={styles.detail}>{summary.detail}</Text>

        <View style={styles.meterBlock}>
          <View style={styles.meterTrack}>
            <View style={styles.meterCentre} />
            <View style={[styles.meterMarker, { left: `${markerPct}%` }]} />
          </View>
          <View style={styles.meterLabels}>
            <Text style={styles.meterLabel}>Too cheap</Text>
            <Text style={[styles.meterLabel, styles.meterLabelCentre]}>Spot on</Text>
            <Text style={styles.meterLabel}>Too bleak</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{summary.points}</Text>
            <Text style={styles.scoreLabel}>Points</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreValue}>{Math.round(summary.accuracy)}%</Text>
            <Text style={styles.scoreLabel}>Accuracy</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreValue, { color: under ? colors.under : colors.over }]}>
              {summary.bias > 0 ? '+' : ''}
              {Math.round(summary.bias)}%
            </Text>
            <Text style={styles.scoreLabel}>Bias</Text>
          </View>
        </View>

        <Text style={styles.breakdownTitle}>Round by round</Text>
        {rounds.map((round, i) => (
          <View key={round.listing.id} style={styles.breakdownRow}>
            <Text style={styles.breakdownIndex}>{String(i + 1).padStart(2, '0')}</Text>
            <View style={styles.breakdownMain}>
              <Text style={styles.breakdownPlace} numberOfLines={1}>
                {round.listing.district}
              </Text>
              <Text style={styles.breakdownMeta}>
                {round.listing.space}m² · you said {euro(round.guess)}
              </Text>
            </View>
            <View style={styles.breakdownRight}>
              <Text style={styles.breakdownActual}>{euro(round.listing.cold_rent)}</Text>
              <Text
                style={[
                  styles.breakdownDelta,
                  { color: round.biasPct < 0 ? colors.under : colors.over },
                ]}
              >
                {Math.abs(Math.round(round.biasPct))}% {round.biasPct < 0 ? 'under' : 'over'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>Play again</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
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
    fontSize: 36,
    lineHeight: 40,
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
  scoreRow: {
    flexDirection: 'row',
    gap: space.sm + 2,
    marginTop: space.xl,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  scoreValue: {
    ...type.heading,
    fontSize: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    ...type.label,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  breakdownTitle: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md - 4,
    paddingVertical: space.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownIndex: {
    ...type.label,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
  breakdownMain: {
    flex: 1,
  },
  breakdownPlace: {
    ...type.body,
    color: colors.text,
  },
  breakdownMeta: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.muted,
    marginTop: 2,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownActual: {
    ...type.body,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  breakdownDelta: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});
