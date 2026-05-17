import type { ScenarioBlock } from '../../core/types';

export const streamDeckTriggerButtons = {
  presentationSlide1: 0,
  presentationSlide2: 1,
  riskOilVideo: 2,
  oilGasItReport: 3,
  crossIndustryVideo: 4,
  crossIndustryItReport: 5,
  ptVision: 6,
} as const;

export type StreamDeckTriggerId = keyof typeof streamDeckTriggerButtons;

export function getStreamDeckTriggerForBlock(block?: ScenarioBlock): StreamDeckTriggerId | null {
  if (!block) {
    return null;
  }

  if (block.type === 'presentation' && block.slideNumber === 1) {
    return 'presentationSlide1';
  }

  if (block.type === 'presentation' && block.slideNumber === 2) {
    return 'presentationSlide2';
  }

  const blockTriggers: Partial<Record<string, StreamDeckTriggerId>> = {
    'risk-oil': 'riskOilVideo',
    'killchain-oil': 'oilGasItReport',
    'risk-intersec': 'crossIndustryVideo',
    'killchain-intersec': 'crossIndustryItReport',
  };

  return blockTriggers[block.id] ?? null;
}
