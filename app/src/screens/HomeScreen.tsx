import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CITY,
  DECK_SIZE,
  MEDIAN_PER_SQM,
  PRECISION_ROUNDS,
  PRECISION_SECONDS,
  STREAK_LENGTH,
  STREAK_LIVES,
  STREAK_SECONDS,
  dayKey,
  type Mode,
} from '../lib/game';
import type { Profile } from '../lib/storage';
import { colors, radius, space, type } from '../theme';

interface Props {
  profile: Profile;
  onPick: (mode: Mode) => void;
}

interface CardProps {
  mode: Mode;
  title: string;
  blurb: string;
  meta: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  best: number;
  bestLabel: string;
  streak: number;
  playedToday: boolean;
  onPick: (mode: Mode) => void;
}

const ModeCard = ({
  mode,
  title,
  blurb,
  meta,
  icon,
  best,
  bestLabel,
  streak,
  playedToday,
  onPick,
}: CardProps) => (
  <Pressable style={styles.mode} onPress={() => onPick(mode)}>
    <View style={styles.modeHead}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.accent} />
      <Text style={styles.modeTitle}>{title}</Text>
      {playedToday ? (
        <View style={styles.done}>
          <MaterialCommunityIcons name="check" size={11} color={colors.bg} />
          <Text style={styles.doneText}>Today</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.modeBlurb}>{blurb}</Text>
    <Text style={styles.modeMeta}>{meta}</Text>
    <View style={styles.modeFoot}>
      <Text style={styles.modeStat}>
        {best > 0 ? `${best} ${bestLabel}` : 'No score yet'}
      </Text>
      {streak > 0 ? (
        <Text style={styles.modeStreak}>
          <MaterialCommunityIcons name="fire" size={12} color={colors.accent} /> {streak}d
        </Text>
      ) : null}
    </View>
  </Pressable>
);

export const HomeScreen = ({ profile, onPick }: Props) => (
  <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>{CITY} · {dayKey()}</Text>
    <Text style={styles.wordmark}>KALT</Text>
    <Text style={[styles.wordmark, styles.wordmarkAccent]}>MIETE</Text>
    <Text style={styles.tagline}>
      How out of touch are you with what {CITY} actually costs?
    </Text>

    <ModeCard
      mode="precision"
      title="Precision"
      blurb="Guess the exact monthly Kaltmiete. Measures how far your instincts have drifted from the real market."
      meta={`${PRECISION_ROUNDS} flats · ${PRECISION_SECONDS}s each`}
      icon="ruler-square"
      best={profile.precision.best}
      bestLabel="pts"
      streak={profile.precision.currentStreak}
      playedToday={profile.precision.lastPlayedDay === dayKey()}
      onPick={onPick}
    />

    <ModeCard
      mode="streak"
      title="Streak"
      blurb="Higher or lower than the last flat? Every pair is size-matched, so floor area tells you nothing."
      meta={`${STREAK_LENGTH} flats · ${STREAK_SECONDS}s each · ${STREAK_LIVES} lives`}
      icon="fire"
      best={profile.streak.best}
      bestLabel="deep"
      streak={profile.streak.currentStreak}
      playedToday={profile.streak.lastPlayedDay === dayKey()}
      onPick={onPick}
    />

    <Text style={styles.source}>
      {DECK_SIZE} real listings scraped from ImmobilienScout24 · median €{MEDIAN_PER_SQM}/m².
      Same flats for everyone each day. Works offline.
    </Text>
  </ScrollView>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  eyebrow: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: space.sm + 2,
  },
  wordmark: {
    fontSize: 54,
    lineHeight: 54,
    fontWeight: '900',
    letterSpacing: -3,
    color: colors.text,
  },
  wordmarkAccent: {
    color: colors.accent,
  },
  tagline: {
    ...type.body,
    fontSize: 15,
    color: colors.muted,
    marginTop: space.md,
    marginBottom: space.xl,
    maxWidth: 300,
    lineHeight: 21,
  },
  mode: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.md + 2,
    marginBottom: space.md,
  },
  modeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  modeTitle: {
    ...type.heading,
    color: colors.text,
    flex: 1,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  doneText: {
    ...type.label,
    fontSize: 9,
    color: colors.bg,
    textTransform: 'uppercase',
  },
  modeBlurb: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginTop: space.sm,
  },
  modeMeta: {
    ...type.label,
    fontSize: 10,
    color: colors.text,
    textTransform: 'uppercase',
    marginTop: space.sm + 2,
  },
  modeFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.md,
    paddingTop: space.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modeStat: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  modeStreak: {
    ...type.label,
    color: colors.accent,
  },
  source: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: space.md,
  },
});
