import { useEffect } from 'react';
import { BottomMenu } from '../components/BottomMenu';
import { LanguageStinger } from '../components/LanguageStinger';
import { scenarioConfig } from '../config/scenario';
import { useStreamDeckBlockSync } from '../integrations/streamDeck/useStreamDeckSync';
import { KillchainScreen } from '../screens/KillchainScreen';
import { PresentationDeckScreen } from '../screens/PresentationDeckScreen';
import { SlideScreen } from '../screens/SlideScreen';
import { VideoScreen } from '../screens/VideoScreen';
import { preloadItLayerMaps } from './preloadItLayerMaps';
import { useScenarioEngine } from './useScenarioEngine';

export function App() {
  const engine = useScenarioEngine(scenarioConfig);
  const { currentBlock, language } = engine;

  useStreamDeckBlockSync(currentBlock, language);

  useEffect(() => {
    preloadItLayerMaps(scenarioConfig, language);
  }, [language]);

  const stageClassName = [
    'stage',
    currentBlock?.type === 'presentation' ? 'stage--presentation' : '',
    currentBlock?.type === 'video' ? 'stage--video' : '',
    currentBlock?.type === 'killchain' ? 'stage--it-layer' : '',
  ].filter(Boolean).join(' ');

  return (
    <main className="app-shell">
      <section
        className={stageClassName}
        aria-live="polite"
      >
        {currentBlock?.type === 'slide' && (
          <SlideScreen block={currentBlock} language={language} />
        )}

        {currentBlock?.type === 'presentation' && (
          <PresentationDeckScreen block={currentBlock} language={language} />
        )}

        {currentBlock?.type === 'video' && (
          <VideoScreen
            block={currentBlock}
            language={language}
            onEnded={engine.goNext}
          />
        )}

        {currentBlock?.type === 'killchain' && (
          <KillchainScreen
            block={currentBlock}
            language={language}
            position={engine.position}
            onStepSelect={(killchainStepIndex) => {
              engine.goToPosition({
                blockIndex: engine.position.blockIndex,
                killchainStepIndex,
              });
            }}
          />
        )}
      </section>

      <BottomMenu config={scenarioConfig} engine={engine} />
      <LanguageStinger visible={engine.showLanguageStinger} language={language} />
    </main>
  );
}
