import { Share } from 'react-native';
import { STREAK_LENGTH, type Round, type StreakTurn } from './game';

const precisionSquare = (errorPct: number): string => {
  if (errorPct <= 7) return '🟩';
  if (errorPct <= 20) return '🟨';
  return '🟥';
};

const streakSquare = (turn: StreakTurn): string => {
  if (turn.call === null) return '⬛';
  return turn.correct ? '🟩' : '🟥';
};

export const precisionShareText = (
  day: string,
  rounds: Round[],
  points: number,
  accuracy: number,
  bias: number,
): string =>
  [
    `Kaltmiete ${day} · Precision`,
    `${points} pts · ${Math.round(accuracy)}% accuracy · ${bias > 0 ? '+' : ''}${Math.round(bias)}% bias`,
    rounds.map((r) => precisionSquare(r.errorPct)).join(''),
  ].join('\n');

export const streakShareText = (
  day: string,
  turns: StreakTurn[],
  depth: number,
  points: number,
  cleared: boolean,
): string =>
  [
    `Kaltmiete ${day} · Streak`,
    `${depth}/${STREAK_LENGTH - 1} deep · ${points} pts${cleared ? ' · cleared' : ''}`,
    turns.map(streakSquare).join(''),
  ].join('\n');

export const shareResult = async (message: string): Promise<void> => {
  try {
    await Share.share({ message });
  } catch {
    // The user dismissed the sheet — nothing to recover from.
  }
};
