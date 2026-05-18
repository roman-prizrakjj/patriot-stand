import { useEffect, useRef } from 'react';
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

const swipeMinDistancePx = 90;
const swipeMaxOffAxisPx = 80;

function isSwipeIgnored(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'button, a, input, textarea, select, [role="button"], [data-swipe-ignore="true"]',
  ));
}

export function App() {
  const engine = useScenarioEngine(scenarioConfig);
  const { currentBlock, language } = engine;
  const swipeStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);

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

  function handleStagePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!event.isPrimary || isSwipeIgnored(event.target)) {
      swipeStartRef.current = null;
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      swipeStartRef.current = null;
      return;
    }

    swipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleStagePointerUp(event: React.PointerEvent<HTMLElement>) {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;

    if (Math.abs(deltaX) < swipeMinDistancePx || Math.abs(deltaY) > swipeMaxOffAxisPx) {
      return;
    }

    if (deltaX < 0) {
      engine.goNextBlock();
      return;
    }

    engine.goPreviousBlock();
  }

  function handleStagePointerCancel(event: React.PointerEvent<HTMLElement>) {
    if (swipeStartRef.current?.pointerId === event.pointerId) {
      swipeStartRef.current = null;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <main className="app-shell">
      <section
        className={stageClassName}
        aria-live="polite"
        onPointerCancel={handleStagePointerCancel}
        onPointerDown={handleStagePointerDown}
        onPointerUp={handleStagePointerUp}
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
