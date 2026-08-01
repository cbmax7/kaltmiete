import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { PrecisionScreen } from './src/screens/PrecisionScreen';
import { ResultsScreen, type Outcome } from './src/screens/ResultsScreen';
import { StreakScreen } from './src/screens/StreakScreen';
import {
  dailyDecks,
  summarise,
  summariseStreak,
  type Mode,
  type Round,
  type StreakTurn,
} from './src/lib/game';
import { alreadyPlayedToday, emptyProfile, loadProfile, recordRun, type Profile } from './src/lib/storage';
import { colors } from './src/theme';

type Phase =
  | { name: 'home' }
  | { name: 'playing'; mode: Mode }
  | { name: 'results'; outcome: Outcome; counted: boolean };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ name: 'home' });
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const decks = useMemo(() => dailyDecks(), []);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  const finish = async (outcome: Outcome) => {
    const mode = outcome.mode;
    const counted = !alreadyPlayedToday(profile, mode);

    if (counted) {
      const [score, extra] =
        outcome.mode === 'precision'
          ? (() => {
              const s = summarise(outcome.rounds);
              return [s.points, Math.round(s.accuracy)];
            })()
          : (() => {
              const s = summariseStreak(outcome.turns, outcome.cleared);
              return [s.depth, s.points];
            })();
      setProfile(await recordRun(mode, score, extra));
    }

    setPhase({ name: 'results', outcome, counted });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="light" />

        {phase.name === 'home' && (
          <HomeScreen profile={profile} onPick={(mode) => setPhase({ name: 'playing', mode })} />
        )}

        {phase.name === 'playing' && phase.mode === 'precision' && (
          <PrecisionScreen
            deck={decks.precision}
            dayKey={decks.key}
            onQuit={() => setPhase({ name: 'home' })}
            onFinish={(rounds: Round[]) => finish({ mode: 'precision', rounds })}
          />
        )}

        {phase.name === 'playing' && phase.mode === 'streak' && (
          <StreakScreen
            deck={decks.streak}
            onQuit={() => setPhase({ name: 'home' })}
            onFinish={(turns: StreakTurn[], cleared: boolean) =>
              finish({ mode: 'streak', turns, cleared })
            }
          />
        )}

        {phase.name === 'results' && (
          <ResultsScreen
            outcome={phase.outcome}
            profile={profile}
            day={decks.key}
            counted={phase.counted}
            onHome={() => setPhase({ name: 'home' })}
            onReplay={() => setPhase({ name: 'playing', mode: phase.outcome.mode })}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
