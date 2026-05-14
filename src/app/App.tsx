import { BottomMenu } from '../components/BottomMenu';
import { LanguageStinger } from '../components/LanguageStinger';
import { scenarioConfig } from '../config/scenario';
import { KillchainScreen } from '../screens/KillchainScreen';
import { PresentationDeckScreen } from '../screens/PresentationDeckScreen';
import { SlideScreen } from '../screens/SlideScreen';
import { StartScreen } from '../screens/StartScreen';
import { VideoScreen } from '../screens/VideoScreen';
import { useScenarioEngine } from './useScenarioEngine';

export function App() {
  const engine = useScenarioEngine(scenarioConfig);
  const { currentBlock, language, mode, play } = engine;

  return (
    <main className="app-shell">
      <section
        className={`stage ${currentBlock?.type === 'presentation' ? 'stage--presentation' : ''}`}
        aria-live="polite"
      >
        {mode === 'start' && (
          <StartScreen
            title={scenarioConfig.startScreen.title[language]}
            subtitle={scenarioConfig.startScreen.subtitle[language]}
            onPlay={play}
          />
        )}

        {mode !== 'start' && currentBlock?.type === 'slide' && (
          <SlideScreen block={currentBlock} language={language} />
        )}

        {mode !== 'start' && currentBlock?.type === 'presentation' && (
          <PresentationDeckScreen block={currentBlock} language={language} />
        )}

        {mode !== 'start' && currentBlock?.type === 'video' && (
          <VideoScreen block={currentBlock} language={language} />
        )}

        {mode !== 'start' && currentBlock?.type === 'killchain' && (
          <KillchainScreen block={currentBlock} language={language} position={engine.position} />
        )}
      </section>

      <BottomMenu config={scenarioConfig} engine={engine} />
      <LanguageStinger visible={engine.showLanguageStinger} language={language} />
    </main>
  );
}
