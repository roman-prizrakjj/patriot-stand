export type Language = 'ru' | 'en';

export type ScenarioBlockType = 'start' | 'slide' | 'presentation' | 'video' | 'killchain' | 'external';

export type PlaybackMode = 'manual';

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

export interface ItLayerReportStep {
  stepNumber: number;
  title: string;
  targetId: string;
  attackTarget: string;
  targetSegment: string;
  mitreTactics: string;
  mitreTechniques: string;
}

export interface ItLayerReportStepTranslation {
  stepNumber: number;
  title?: string;
  attackTarget?: string;
  targetSegment?: string;
  mitreTactics?: string;
  mitreTechniques?: string;
}

export interface ItLayerReportTranslation {
  title?: string;
  industry?: string;
  risk?: {
    label?: string;
    title?: string;
  };
  steps?: ItLayerReportStepTranslation[];
}

export interface ItLayerReport {
  id: string;
  title: string;
  industry: string;
  image: string;
  targetsFile: string;
  risk: {
    label: string;
    title: string;
  };
  i18n?: Partial<Record<Language, ItLayerReportTranslation>>;
  steps: ItLayerReportStep[];
}

export interface ItLayerTarget {
  id: string;
  label: string;
  segment: string;
  x: number;
  y: number;
}

export interface ItLayerStepTarget {
  stepNumber: number;
  targetId: string;
  label: string;
  segment: string;
  x: number;
  y: number;
}

export interface ItLayerAttackEdge {
  id?: string;
  from?: string;
  fromStep?: number;
  toStep: number;
}

export interface ItLayerTargetsDataset {
  image: string;
  coordinateSpace: {
    type: string;
    aspectRatio: string;
    designWidth: number;
    designHeight: number;
  };
  targets: ItLayerTarget[];
  initialTarget?: ItLayerTarget;
  stepTargets?: ItLayerStepTarget[];
  attackEdges?: ItLayerAttackEdge[];
}

export interface ItLayerData {
  report: ItLayerReport;
  targets: ItLayerTargetsDataset;
}

export interface KillchainBlock extends BaseScenarioBlock {
  type: 'killchain';
  stepDurationMs: number;
  map?: {
    ru: string;
    en: string;
  };
  itLayer?: ItLayerData;
  steps: KillchainStep[];
}

export type ScenarioBlock = SlideBlock | PresentationBlock | VideoBlock | KillchainBlock;

export interface ScenarioConfig {
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
