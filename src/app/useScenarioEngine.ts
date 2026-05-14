import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBlockDuration, getNextPosition, getPreviousPosition } from '../core/autoplay';
import type { Language, PlaybackMode, ScenarioConfig, ScenarioPosition } from '../core/types';

const firstPosition: ScenarioPosition = {
  blockIndex: 0,
  killchainStepIndex: 0,
};

export function useScenarioEngine(config: ScenarioConfig) {
  const [mode, setMode] = useState<PlaybackMode>('start');
  const [language, setLanguage] = useState<Language>(config.defaultLanguage);
  const [position, setPosition] = useState<ScenarioPosition>(firstPosition);
  const [showLanguageStinger, setShowLanguageStinger] = useState(false);
  const timerRef = useRef<number | null>(null);
  const stingerTimerRef = useRef<number | null>(null);

  const currentBlock = config.blocks[position.blockIndex];

  const clearAutoplayTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goToStart = useCallback(() => {
    clearAutoplayTimer();
    setMode('start');
    setPosition(firstPosition);
  }, [clearAutoplayTimer]);

  const goToPosition = useCallback((nextPosition: ScenarioPosition, nextMode: PlaybackMode = mode) => {
    setPosition(nextPosition);
    setMode(nextMode);
  }, [mode]);

  const goNext = useCallback(() => {
    const nextPosition = getNextPosition(config.blocks, position);

    if (nextPosition === 'start') {
      goToStart();
      return;
    }

    goToPosition(nextPosition, mode === 'start' ? 'autoplay' : mode);
  }, [config.blocks, goToPosition, goToStart, mode, position]);

  const goPrevious = useCallback(() => {
    const previousPosition = getPreviousPosition(config.blocks, position);

    if (previousPosition === 'start') {
      goToStart();
      return;
    }

    goToPosition(previousPosition, mode === 'start' ? 'autoplay' : mode);
  }, [config.blocks, goToPosition, goToStart, mode, position]);

  const play = useCallback(() => {
    setMode('autoplay');
  }, []);

  const stop = useCallback(() => {
    clearAutoplayTimer();
    setMode('stopped');
  }, [clearAutoplayTimer]);

  const jumpToBlock = useCallback((blockIndex: number) => {
    goToPosition({ blockIndex, killchainStepIndex: 0 }, 'stopped');
  }, [goToPosition]);

  const switchLanguage = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setShowLanguageStinger(true);

    if (stingerTimerRef.current !== null) {
      window.clearTimeout(stingerTimerRef.current);
    }

    stingerTimerRef.current = window.setTimeout(() => {
      setShowLanguageStinger(false);
      stingerTimerRef.current = null;
    }, 1400);
  }, []);

  useEffect(() => {
    clearAutoplayTimer();

    if (mode !== 'autoplay' || !currentBlock) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      goNext();
    }, getBlockDuration(currentBlock));

    return clearAutoplayTimer;
  }, [clearAutoplayTimer, currentBlock, goNext, mode, position]);

  useEffect(() => {
    return () => {
      clearAutoplayTimer();

      if (stingerTimerRef.current !== null) {
        window.clearTimeout(stingerTimerRef.current);
      }
    };
  }, [clearAutoplayTimer]);

  return useMemo(() => ({
    currentBlock,
    goNext,
    goPrevious,
    goToStart,
    jumpToBlock,
    language,
    mode,
    play,
    position,
    showLanguageStinger,
    stop,
    switchLanguage,
  }), [
    currentBlock,
    goNext,
    goPrevious,
    goToStart,
    jumpToBlock,
    language,
    mode,
    play,
    position,
    showLanguageStinger,
    stop,
    switchLanguage,
  ]);
}
