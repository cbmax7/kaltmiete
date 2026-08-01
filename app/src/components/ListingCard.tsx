import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LISTING_IMAGES } from '../data/images';
import type { Listing } from '../lib/game';
import { colors, radius, space, type } from '../theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Tier 4 — comfort features. Muted, small, lowest price impact. */
const COMFORT: { key: keyof Listing; label: string; icon: IconName }[] = [
  { key: 'balcony', label: 'Balkon', icon: 'balcony' },
  { key: 'lift', label: 'Aufzug', icon: 'elevator-passenger' },
  { key: 'kitchen', label: 'Einbauküche', icon: 'countertop' },
  { key: 'cellar', label: 'Keller', icon: 'package-variant-closed' },
  { key: 'garden', label: 'Garten', icon: 'tree' },
];

const roomLabel = (rooms: number) => (rooms % 1 === 0 ? `${rooms}` : rooms.toFixed(1));

export const floorLabel = (listing: Listing): string => {
  if (listing.floor === null) return '—';
  const base = listing.floor === 0 ? 'EG' : `${listing.floor}. OG`;
  return listing.floors_total ? `${base}/${listing.floors_total}` : base;
};

const Stat = ({ icon, value, label }: { icon: IconName; value: string; label: string }) => (
  <View style={styles.stat}>
    <MaterialCommunityIcons name={icon} size={13} color={colors.muted} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/** Tier 3 — the things that break your mental maths. The only colour on the card. */
const Distorters = ({ listing }: { listing: Listing }) => {
  const flags: { label: string; emoji?: string; icon?: IconName }[] = [];
  if (listing.furnished) flags.push({ label: 'Möbliert', emoji: '🛋' });
  if (listing.high_demand) flags.push({ label: 'Hohe Nachfrage', emoji: '🔥' });
  if (listing.new_build) flags.push({ label: 'Neubau', icon: 'shimmer' });
  if (!flags.length) return null;

  return (
    <View style={styles.distorters}>
      {flags.map((flag) => (
        <View key={flag.label} style={styles.distorter}>
          {flag.emoji ? (
            <Text style={styles.distorterEmoji}>{flag.emoji}</Text>
          ) : (
            <MaterialCommunityIcons name={flag.icon!} size={13} color={colors.accent} />
          )}
          <Text style={styles.distorterText}>{flag.label}</Text>
        </View>
      ))}
    </View>
  );
};

export const ListingCard = ({ listing, compact }: { listing: Listing; compact?: boolean }) => {
  const quality = [listing.quality, listing.condition].filter(Boolean).join(' · ');
  const comfort = COMFORT.filter((feature) => listing[feature.key]);

  return (
    <View style={styles.card}>
      <View style={[styles.photoWrap, compact && styles.photoWrapCompact]}>
        <Image source={LISTING_IMAGES[listing.id]} style={styles.photo} resizeMode="cover" />
        <View style={styles.placeTag}>
          <Text style={styles.district} numberOfLines={1}>
            {listing.district}
          </Text>
          <Text style={styles.borough} numberOfLines={1}>
            {listing.borough}
          </Text>
        </View>
      </View>

      {/* Tier 1 — the numbers you actually reason with */}
      <View style={styles.stats}>
        <Stat icon="ruler-square" value={`${listing.space}`} label="m²" />
        <View style={styles.divider} />
        <Stat icon="floor-plan" value={roomLabel(listing.rooms)} label="Zimmer" />
        <View style={styles.divider} />
        <Stat icon="stairs" value={floorLabel(listing)} label="Etage" />
        <View style={styles.divider} />
        <Stat
          icon="calendar-blank"
          value={listing.year ? `${listing.year}` : '—'}
          label="Baujahr"
        />
      </View>

      {/* Tier 2 — the strongest single price signal */}
      {quality ? (
        <View style={styles.qualityBar}>
          <MaterialCommunityIcons name="diamond-stone" size={14} color={colors.bg} />
          <Text style={styles.qualityText}>{quality}</Text>
        </View>
      ) : null}

      <Distorters listing={listing} />

      {/* Tier 4 — nice to have */}
      {comfort.length && !compact ? (
        <View style={styles.comfort}>
          {comfort.map((feature) => (
            <View key={feature.label} style={styles.chip}>
              <MaterialCommunityIcons name={feature.icon} size={12} color={colors.muted} />
              <Text style={styles.chipText}>{feature.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photoWrap: {
    position: 'relative',
    aspectRatio: 3 / 2,
    backgroundColor: colors.surfaceRaised,
  },
  photoWrapCompact: {
    aspectRatio: 16 / 9,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeTag: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.md,
    backgroundColor: 'rgba(11,11,12,0.82)',
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md,
  },
  district: {
    ...type.heading,
    color: colors.text,
  },
  borough: {
    ...type.label,
    color: colors.accent,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md - 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...type.heading,
    fontSize: 18,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...type.label,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  qualityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm - 2,
    backgroundColor: colors.accent,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  qualityText: {
    ...type.label,
    color: colors.bg,
    textTransform: 'uppercase',
  },
  distorters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm + 2,
  },
  distorter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
  },
  distorterEmoji: {
    fontSize: 12,
  },
  distorterText: {
    ...type.label,
    fontSize: 10,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  comfort: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm - 2,
    padding: space.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
  },
  chipText: {
    ...type.label,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
  },
});
