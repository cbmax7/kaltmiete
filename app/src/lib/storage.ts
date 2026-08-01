import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey, type Mode } from './game';

const KEY = 'kaltmiete:v1';

export interface ModeRecord {
  /** Score from the first run of each day — replays are for fun, they don't count. */
  best: number;
  bestDay: string | null;
  history: { day: string; score: number; extra: number }[];
  currentStreak: number;
  longestStreak: number;
  lastPlayedDay: string | null;
}

export interface Profile {
  precision: ModeRecord;
  streak: ModeRecord;
}

const emptyRecord = (): ModeRecord => ({
  best: 0,
  bestDay: null,
  history: [],
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDay: null,
});

export const emptyProfile = (): Profile => ({
  precision: emptyRecord(),
  streak: emptyRecord(),
});

export const loadProfile = async (): Promise<Profile> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      precision: { ...emptyRecord(), ...parsed.precision },
      streak: { ...emptyRecord(), ...parsed.streak },
    };
  } catch {
    return emptyProfile();
  }
};

const yesterdayKey = (day: string): string => {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return dayKey(date);
};

export const alreadyPlayedToday = (profile: Profile, mode: Mode): boolean =>
  profile[mode].lastPlayedDay === dayKey();

/**
 * Records a finished run. Only the first run of a given day counts toward the
 * board and the streak; later replays return the profile untouched.
 */
export const recordRun = async (
  mode: Mode,
  score: number,
  extra: number,
): Promise<Profile> => {
  const profile = await loadProfile();
  const today = dayKey();
  const record = profile[mode];

  if (record.lastPlayedDay === today) return profile;

  const continued = record.lastPlayedDay === yesterdayKey(today);
  const currentStreak = continued ? record.currentStreak + 1 : 1;

  const updated: ModeRecord = {
    best: Math.max(record.best, score),
    bestDay: score > record.best ? today : record.bestDay,
    history: [...record.history, { day: today, score, extra }].slice(-30),
    currentStreak,
    longestStreak: Math.max(record.longestStreak, currentStreak),
    lastPlayedDay: today,
  };

  const next: Profile = { ...profile, [mode]: updated };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

export const resetProfile = async (): Promise<Profile> => {
  await AsyncStorage.removeItem(KEY);
  return emptyProfile();
};
