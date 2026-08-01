import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '../theme';

interface Props {
  seconds: number;
  /** Change this to restart the countdown — typically the round index. */
  runKey: string | number;
  paused?: boolean;
  onExpire: () => void;
}

const TICK_MS = 50;

/**
 * Drives the countdown off an interval rather than Animated, so the numeric
 * readout and the bar can never drift apart.
 */
export const TimerBar = ({ seconds, runKey, paused, onExpire }: Props) => {
  const total = seconds * 1000;
  const [remaining, setRemaining] = useState(total);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (paused) return;
    setRemaining(total);
    const startedAt = Date.now();
    const id = setInterval(() => {
      const left = total - (Date.now() - startedAt);
      if (left <= 0) {
        clearInterval(id);
        setRemaining(0);
        expire.current();
      } else {
        setRemaining(left);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [runKey, total, paused]);

  const ratio = Math.max(0, remaining / total);
  const urgent = ratio <= 0.3;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${ratio * 100}%`, backgroundColor: urgent ? colors.over : colors.accent },
          ]}
        />
      </View>
      <Text style={[styles.readout, urgent && styles.readoutUrgent]}>
        {(remaining / 1000).toFixed(1)}s
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  readout: {
    ...type.label,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
    width: 34,
    textAlign: 'right',
  },
  readoutUrgent: {
    color: colors.over,
  },
});
