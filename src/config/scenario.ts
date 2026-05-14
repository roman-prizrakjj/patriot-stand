import type { ScenarioConfig } from '../core/types';

const oilPosterRu = new URL('../../sorci/oilru.png', import.meta.url).href;
const oilPosterEn = new URL('../../sorci/oilen.png', import.meta.url).href;
const energyPosterRu = new URL('../../sorci/energyru.png', import.meta.url).href;
const energyPosterEn = new URL('../../sorci/energyen.png', import.meta.url).href;

export const scenarioConfig: ScenarioConfig = {
  defaultLanguage: 'ru',
  languages: ['ru', 'en'],
  transitionMs: 420,
  startScreen: {
    title: {
      ru: 'Standoff / Patriot',
      en: 'Standoff / Patriot',
    },
    subtitle: {
      ru: 'Автоматический сценарий для стенда',
      en: 'Autoplay scenario for the stand',
    },
  },
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
        ru: '/media/risk-oil-ru.mp4',
        en: '/media/risk-oil-en.mp4',
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
      steps: [
        {
          id: 'recon',
          title: { ru: 'Разведка', en: 'Reconnaissance' },
          description: {
            ru: 'Атакующий обнаруживает открытые сервисы и инфраструктурные связи.',
            en: 'The attacker identifies exposed services and infrastructure links.',
          },
          mitreTags: ['T1595', 'T1592'],
          activeNodes: ['edge', 'dmz'],
        },
        {
          id: 'initial-access',
          title: { ru: 'Первичный доступ', en: 'Initial Access' },
          description: {
            ru: 'Компрометация периметра и закрепление в сегменте.',
            en: 'Perimeter compromise and foothold establishment.',
          },
          mitreTags: ['T1190', 'T1078'],
          activeNodes: ['vpn', 'app'],
        },
        {
          id: 'impact',
          title: { ru: 'Воздействие', en: 'Impact' },
          description: {
            ru: 'Демонстрация бизнес-риска и технических следов атаки.',
            en: 'Business impact and technical attack traces are demonstrated.',
          },
          mitreTags: ['T1486', 'T1499'],
          activeNodes: ['scada', 'report'],
        },
      ],
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
      steps: [
        {
          id: 'pivot',
          title: { ru: 'Расширение доступа', en: 'Access Expansion' },
          description: {
            ru: 'Переход между связанными сегментами и системами.',
            en: 'Movement across connected segments and systems.',
          },
          mitreTags: ['T1021', 'T1090'],
          activeNodes: ['core', 'identity'],
        },
        {
          id: 'exfiltration',
          title: { ru: 'Вывод данных', en: 'Exfiltration' },
          description: {
            ru: 'Отчет фиксирует путь атаки, затронутые узлы и технические признаки.',
            en: 'The report captures attack path, affected nodes, and technical indicators.',
          },
          mitreTags: ['T1041', 'T1567'],
          activeNodes: ['data', 'report'],
        },
      ],
    },
  ],
};
