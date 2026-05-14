import { BottomMenu } from '../components/BottomMenu';
import { LanguageStinger } from '../components/LanguageStinger';
import { scenarioConfig } from '../config/scenario';
import { KillchainScreen } from '../screens/KillchainScreen';
import { PresentationDeckScreen } from '../screens/PresentationDeckScreen';
import { SlideScreen } from '../screens/SlideScreen';
import { VideoScreen } from '../screens/VideoScreen';
import { useScenarioEngine } from './useScenarioEngine';

export function App() {
  const engine = useScenarioEngine(scenarioConfig);
  const { currentBlock, language } = engine;

  return (
    <main className="app-shell">
      <section
        className={`stage ${currentBlock?.type === 'presentation' ? 'stage--presentation' : ''}`}
        aria-live="polite"
      >
        {currentBlock?.type === 'slide' && (
          <SlideScreen block={currentBlock} language={language} />
        )}

        {currentBlock?.type === 'presentation' && (
          <PresentationDeckScreen block={currentBlock} language={language} />
        )}

        {currentBlock?.type === 'video' && (
          <VideoScreen block={currentBlock} language={language} />
        )}

        {currentBlock?.type === 'killchain' && (
          <KillchainScreen block={currentBlock} language={language} position={engine.position} />
        )}
      </section>

      <BottomMenu config={scenarioConfig} engine={engine} />
      <LanguageStinger visible={engine.showLanguageStinger} language={language} />
    </main>
  );
}
