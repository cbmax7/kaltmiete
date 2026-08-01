import { Image, StyleSheet, Text, View } from 'react-native';
import { LISTING_IMAGES } from '../data/images';
import type { Listing } from '../lib/game';
import { colors, radius, space, type } from '../theme';

const featureLabels = (listing: Listing): string[] => {
  const features: string[] = [];
  if (listing.balcony) features.push('Balkon');
  if (listing.kitchen) features.push('Einbauküche');
  if (listing.garden) features.push('Garten');
  if (listing.year && listing.year >= 2020) features.push('Neubau');
  return features;
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const ListingCard = ({ listing }: { listing: Listing }) => (
  <View style={styles.card}>
    <View style={styles.photoWrap}>
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

    <View style={styles.stats}>
      <Stat value={`${listing.space}`} label="m²" />
      <View style={styles.divider} />
      <Stat value={`${listing.rooms % 1 === 0 ? listing.rooms : listing.rooms.toFixed(1)}`} label="Zimmer" />
      <View style={styles.divider} />
      <Stat value={listing.year ? `${listing.year}` : '—'} label="Baujahr" />
    </View>

    <View style={styles.features}>
      {featureLabels(listing).map((feature) => (
        <View key={feature} style={styles.chip}>
          <Text style={styles.chipText}>{feature}</Text>
        </View>
      ))}
    </View>
  </View>
);

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
    paddingVertical: space.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...type.heading,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.md - 4,
    paddingVertical: 5,
  },
  chipText: {
    ...type.label,
    color: colors.muted,
    textTransform: 'uppercase',
  },
});
