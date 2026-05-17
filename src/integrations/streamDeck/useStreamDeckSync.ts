import { useEffect, useRef } from 'react';
import type { Language, ScenarioBlock } from '../../core/types';
import { pressStreamDeckButton } from './streamDeckClient';
import { getStreamDeckTriggerForBlock, streamDeckTriggerButtons } from './streamDeckTriggers';

export function useStreamDeckBlockSync(currentBlock: ScenarioBlock | undefined, language: Language) {
  const previousBlockIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentBlock || previousBlockIdRef.current === currentBlock.id) {
      return;
    }

    previousBlockIdRef.current = currentBlock.id;

    const triggerId = getStreamDeckTriggerForBlock(currentBlock);
    if (!triggerId) {
      return;
    }

    void pressStreamDeckButton(language, streamDeckTriggerButtons[triggerId]);
  }, [currentBlock, language]);
}

export function triggerPtVisionStreamDeck(language: Language) {
  return pressStreamDeckButton(language, streamDeckTriggerButtons.ptVision);
}
