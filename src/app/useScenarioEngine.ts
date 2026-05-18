import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNextPosition, getPreviousPosition } from '../core/navigation';
import type { Language, PlaybackMode, ScenarioConfig, ScenarioPosition } from '../core/types';

const firstPosition: ScenarioPosition = {
  blockIndex: 0,
  killchainStepIndex: 0,
};

export function useScenarioEngine(config: ScenarioConfig) {
  const [mode] = useState<PlaybackMode>('manual');
  const [language, setLanguage] = useState<Language>(config.defaultLanguage);
  const [position, setPosition] = useState<ScenarioPosition>(firstPosition);
  const [showLanguageStinger, setShowLanguageStinger] = useState(false);
  const stingerTimerRef = useRef<number | null>(null);
  const stingerFrameRef = useRef<number | null>(null);

  const currentBlock = config.blocks[position.blockIndex];

  const goToStart = useCallback(() => {
    setPosition(firstPosition);
  }, []);

  const goToPosition = useCallback((nextPosition: ScenarioPosition) => {
    setPosition(nextPosition);
  }, []);

  const goNext = useCallback(() => {
    const nextPosition = getNextPosition(config.blocks, position);

    if (!nextPosition) {
      return;
    }

    goToPosition(nextPosition);
  }, [config.blocks, goToPosition, position]);

  const goPrevious = useCallback(() => {
    const previousPosition = getPreviousPosition(config.blocks, position);

    if (!previousPosition) {
      return;
    }

    goToPosition(previousPosition);
  }, [config.blocks, goToPosition, position]);

  const jumpToBlock = useCallback((blockIndex: number) => {
    goToPosition({ blockIndex, killchainStepIndex: 0 });
  }, [goToPosition]);

  const switchLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);

    if (stingerTimerRef.current !== null) {
      window.clearTimeout(stingerTimerRef.current);
    }

    if (stingerFrameRef.current !== null) {
      window.cancelAnimationFrame(stingerFrameRef.current);
    }

    setShowLanguageStinger(false);

    stingerFrameRef.current = window.requestAnimationFrame(() => {
      setShowLanguageStinger(true);
      stingerFrameRef.current = null;

      stingerTimerRef.current = window.setTimeout(() => {
        setShowLanguageStinger(false);
        stingerTimerRef.current = null;
      }, 1500);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (stingerFrameRef.current !== null) {
        window.cancelAnimationFrame(stingerFrameRef.current);
      }

      if (stingerTimerRef.current !== null) {
        window.clearTimeout(stingerTimerRef.current);
      }

      stingerFrameRef.current = null;
      stingerTimerRef.current = null;
    };
  }, []);

  return useMemo(() => ({
    currentBlock,
    goNext,
    goPrevious,
    goToPosition,
    goToStart,
    jumpToBlock,
    language,
    mode,
    position,
    showLanguageStinger,
    switchLanguage,
  }), [
    currentBlock,
    goNext,
    goPrevious,
    goToPosition,
    goToStart,
    jumpToBlock,
    language,
    mode,
    position,
    showLanguageStinger,
    switchLanguage,
  ]);
}
