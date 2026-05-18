import energyItReportJson from '../assets/it-layer/data/energy-it-attack-steps.json';
import energyItTargetsJson from '../assets/it-layer/data/energy-it-targets.json';
import oilGasItReportJson from '../assets/it-layer/data/oil-gas-it-attack-steps.json';
import oilGasItTargetsJson from '../assets/it-layer/data/oil-gas-it-targets.json';
import type { ItLayerReport, ItLayerTargetsDataset, KillchainStep, ScenarioConfig } from '../core/types';

const oilPosterRu = new URL('../../sorci/oilru.png', import.meta.url).href;
const oilPosterEn = new URL('../../sorci/oilen.png', import.meta.url).href;
const energyPosterRu = new URL('../../sorci/energyru.png', import.meta.url).href;
const energyPosterEn = new URL('../../sorci/energyen.png', import.meta.url).href;
const oilGasItMapRu = new URL('../assets/it-layer/maps/oil-gas-it-map-ru.png', import.meta.url).href;
const oilGasItMapEn = new URL('../assets/it-layer/maps/oil-gas-it-map-en.png', import.meta.url).href;
const energyItMapRu = new URL('../assets/it-layer/maps/energy-it-map-ru.png', import.meta.url).href;
const energyItMapEn = new URL('../assets/it-layer/maps/energy-it-map-en.png', import.meta.url).href;

const energyItReport = energyItReportJson as ItLayerReport;
const energyItTargets = energyItTargetsJson as ItLayerTargetsDataset;
const oilGasItReport = oilGasItReportJson as ItLayerReport;
const oilGasItTargets = oilGasItTargetsJson as ItLayerTargetsDataset;

function getMitreCode(value: string) {
  return value.split('.')[0]?.trim() || value;
}

function createKillchainSteps(report: ItLayerReport): KillchainStep[] {
  return report.steps.map((step) => ({
    id: `step-${String(step.stepNumber).padStart(2, '0')}`,
    title: { ru: step.title, en: step.title },
    description: { ru: step.attackTarget, en: step.attackTarget },
    mitreTags: [
      getMitreCode(step.mitreTactics),
      getMitreCode(step.mitreTechniques),
    ],
    activeNodes: [step.targetSegment],
  }));
}

export const scenarioConfig: ScenarioConfig = {
  defaultLanguage: 'ru',
  languages: ['ru', 'en'],
  transitionMs: 420,
  externalTargets: {
    ptVision: 'pt-vision-standoff-15',
  },
  blocks: [
    {
      id: 'standoff-360-01',
      type: 'presentation',
      durationMs: 8000,
      slideNumber: 1,
      title: { ru: 'Платформа киберустойчивости', en: 'Cyber resilience platform' },
    },
    {
      id: 'standoff-360-02',
      type: 'presentation',
      durationMs: 8000,
      slideNumber: 2,
      title: { ru: 'Сообщество', en: 'Community' },
    },
    {
      id: 'standoff-360-03',
      type: 'presentation',
      durationMs: 8000,
      slideNumber: 3,
      title: { ru: 'Запросы рынка', en: 'Market demands' },
    },
    {
      id: 'standoff-360-04',
      type: 'presentation',
      durationMs: 8000,
      slideNumber: 4,
      title: { ru: 'Экосистема', en: 'Ecosystem' },
    },
    {
      id: 'standoff-360-05',
      type: 'presentation',
      durationMs: 8000,
      slideNumber: 5,
      title: { ru: 'Применение', en: 'Use cases' },
    },
    {
      id: 'standoff-360-06',
      type: 'presentation',
      durationMs: 8000,
      slideNumber: 6,
      title: { ru: 'База знаний', en: 'Knowledge base' },
    },
    {
      id: 'risk-oil',
      type: 'video',
      durationMs: 16000,
      title: { ru: 'Риск в нефтяной отрасли', en: 'Oil Industry Risk' },
      source: {
        ru: '/media/risk-oil-ru.webm',
        en: '/media/risk-oil-en.webm',
      },
      poster: {
        ru: oilPosterRu,
        en: oilPosterEn,
      },
    },
    {
      id: 'killchain-oil',
      type: 'killchain',
      durationMs: 18000,
      stepDurationMs: 6000,
      title: { ru: 'IT-слой: нефть', en: 'IT Layer: Oil' },
      map: {
        ru: oilGasItMapRu,
        en: oilGasItMapEn,
      },
      itLayer: {
        report: oilGasItReport,
        targets: oilGasItTargets,
      },
      steps: createKillchainSteps(oilGasItReport),
    },
    {
      id: 'risk-intersec',
      type: 'video',
      durationMs: 16000,
      title: { ru: 'Межотраслевой риск', en: 'Cross-industry Risk' },
      source: {
        ru: '/media/risk-intersec-ru.mp4',
        en: '/media/risk-intersec-en.mp4',
      },
      poster: {
        ru: energyPosterRu,
        en: energyPosterEn,
      },
    },
    {
      id: 'killchain-intersec',
      type: 'killchain',
      durationMs: 18000,
      stepDurationMs: 6000,
      title: { ru: 'Межотраслевой IT-слой', en: 'Cross-industry IT Layer' },
      map: {
        ru: energyItMapRu,
        en: energyItMapEn,
      },
      itLayer: {
        report: energyItReport,
        targets: energyItTargets,
      },
      steps: createKillchainSteps(energyItReport),
    },
  ],
};
