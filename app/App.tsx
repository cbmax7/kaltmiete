import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GameScreen } from './src/screens/GameScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { StartScreen } from './src/screens/StartScreen';
import { shuffledDeck, type Listing, type Round } from './src/lib/game';
import { colors } from './src/theme';

type Phase =
  | { name: 'start' }
  | { name: 'playing'; deck: Listing[] }
  | { name: 'results'; rounds: Round[] };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ name: 'start' });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        {phase.name === 'start' && (
          <StartScreen onStart={() => setPhase({ name: 'playing', deck: shuffledDeck() })} />
        )}
        {phase.name === 'playing' && (
          <GameScreen
            deck={phase.deck}
            onFinish={(rounds) => setPhase({ name: 'results', rounds })}
          />
        )}
        {phase.name === 'results' && (
          <ResultsScreen
            rounds={phase.rounds}
            onRestart={() => setPhase({ name: 'playing', deck: shuffledDeck() })}
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
