export type Language = 'ru' | 'en';

export type ScenarioBlockType = 'start' | 'slide' | 'presentation' | 'video' | 'killchain' | 'external';

export type PlaybackMode = 'start' | 'autoplay' | 'stopped';

export interface LocalizedText {
  ru: string;
  en: string;
}

export interface BaseScenarioBlock {
  id: string;
  type: ScenarioBlockType;
  title: LocalizedText;
  durationMs: number;
}

export interface SlideBlock extends BaseScenarioBlock {
  type: 'slide';
  eyebrow: LocalizedText;
  body: LocalizedText;
  visual?: string;
}

export interface PresentationBlock extends BaseScenarioBlock {
  type: 'presentation';
  slideNumber: number;
}

export interface VideoBlock extends BaseScenarioBlock {
  type: 'video';
  source: {
    ru: string;
    en: string;
  };
  poster?: {
    ru: string;
    en: string;
  };
}

export interface KillchainStep {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  mitreTags: string[];
  activeNodes: string[];
}

export interface KillchainBlock extends BaseScenarioBlock {
  type: 'killchain';
  stepDurationMs: number;
  steps: KillchainStep[];
}

export type ScenarioBlock = SlideBlock | PresentationBlock | VideoBlock | KillchainBlock;

export interface ScenarioConfig {
  startScreen: {
    title: LocalizedText;
    subtitle: LocalizedText;
  };
  languages: Language[];
  defaultLanguage: Language;
  transitionMs: number;
  blocks: ScenarioBlock[];
  externalTargets: {
    ptVision: string;
  };
}

export interface ScenarioPosition {
  blockIndex: number;
  killchainStepIndex: number;
}
