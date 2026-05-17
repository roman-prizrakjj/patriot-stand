import { useEffect, useRef } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ItLayerReportStep, KillchainBlock, Language, ScenarioPosition } from '../core/types';

interface ItLayerScreenProps {
  block: KillchainBlock;
  language: Language;
  position: ScenarioPosition;
  onStepSelect: (stepIndex: number) => void;
}

const labels = {
  ru: {
    reportMode: 'Режим отчета',
    report: 'Отчет',
    step: 'Шаг',
    of: 'из',
    industry: 'Отрасль',
    teamReports: 'Отчеты команды',
    stepDescription: 'Описание шага',
    attackTarget: 'Цель атаки',
    targetSegment: 'Целевой сегмент',
    mitreTactics: 'MITRE Тактика',
    mitreTechniques: 'MITRE Техника',
    stepPicker: 'Выбор шага',
  },
  en: {
    reportMode: 'Report mode',
    report: 'Report',
    step: 'Step',
    of: 'of',
    industry: 'Industry',
    teamReports: 'Team reports',
    stepDescription: 'Step description',
    attackTarget: 'Attack target',
    targetSegment: 'Target segment',
    mitreTactics: 'MITRE Tactic',
    mitreTechniques: 'MITRE Technique',
    stepPicker: 'Step selection',
  },
};

function clampStepIndex(index: number, steps: ItLayerReportStep[]) {
  return Math.max(0, Math.min(index, steps.length - 1));
}

function splitMitre(value: string) {
  const match = value.match(/^(T[A0-9.]+)\.?\s*(.*)$/);

  if (!match) {
    return {
      code: '',
      label: value,
    };
  }

  return {
    code: match[1],
    label: match[2],
  };
}

function MitreValue({ value }: { value: string }) {
  const mitre = splitMitre(value);

  if (!mitre.code) {
    return <span>{mitre.label}</span>;
  }

  return (
    <>
      <span className="it-layer-mitre-code">{mitre.code}</span>
      {mitre.label && <span> {mitre.label}</span>}
    </>
  );
}

function getTranslatedStep(blockStep: ItLayerReportStep, block: KillchainBlock, language: Language) {
  const translatedStep = block.itLayer?.report.i18n?.[language]?.steps?.find(
    (step) => step.stepNumber === blockStep.stepNumber,
  );

  return {
    ...blockStep,
    ...translatedStep,
  };
}

export function ItLayerScreen({ block, language, position, onStepSelect }: ItLayerScreenProps) {
  const activeStepRef = useRef<HTMLButtonElement | null>(null);
  const data = block.itLayer!;
  const map = block.map!;
  const copy = labels[language];
  const { report } = data;
  const reportTranslation = report.i18n?.[language];
  const risk = {
    ...report.risk,
    ...reportTranslation?.risk,
  };
  const activeStepIndex = clampStepIndex(position.killchainStepIndex, report.steps);
  const activeStep = getTranslatedStep(report.steps[activeStepIndex], block, language);
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === report.steps.length - 1;

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeStepIndex]);

  function selectStep(index: number) {
    onStepSelect(clampStepIndex(index, report.steps));
  }

  return (
    <article className="it-layer-screen" aria-label={block.title[language]}>
      <img
        key={`${block.id}-${language}`}
        className="it-layer-map"
        src={map[language]}
        alt=""
        draggable={false}
      />
      <div className="it-layer-vignette" aria-hidden="true" />

      <div className="it-layer-report-mode">{copy.reportMode}</div>

      <div className="it-layer-top-report">
        <span>{copy.report}</span>
        <strong>{copy.step} {activeStep.stepNumber} {copy.of} {report.steps.length}</strong>
      </div>

      <div className="it-layer-industry">
        <span>{copy.industry}:</span>
        <strong>{reportTranslation?.industry ?? report.industry}</strong>
      </div>

      <section className="it-layer-left-stack" aria-label={copy.teamReports}>
        <div className="it-layer-risk-card">
          <div className="it-layer-risk-icon">
            <AlertTriangle size={32} strokeWidth={1.8} />
          </div>
          <div>
            <span>{risk.label}</span>
            <strong>{risk.title}</strong>
          </div>
        </div>

        <div className="it-layer-panel it-layer-steps-panel">
          <h2>{copy.teamReports}:</h2>
          <div className="it-layer-steps-list">
            {report.steps.map((step, index) => {
              const translatedStep = getTranslatedStep(step, block, language);

              return (
                <button
                  className={`it-layer-step-button ${index === activeStepIndex ? 'active' : ''}`}
                  key={`${step.stepNumber}-${step.targetId}`}
                  ref={(node) => {
                    if (index === activeStepIndex) {
                      activeStepRef.current = node;
                    }
                  }}
                  type="button"
                  onClick={() => selectStep(index)}
                  aria-current={index === activeStepIndex ? 'step' : undefined}
                >
                  <span className="it-layer-step-number">{step.stepNumber}.</span>
                  <span>{translatedStep.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="it-layer-panel it-layer-details-panel" aria-label={copy.stepDescription}>
        <h2>{copy.stepDescription}</h2>
        <dl>
          <div>
            <dt>{copy.attackTarget}</dt>
            <dd>{activeStep.attackTarget}</dd>
          </div>
          <div>
            <dt>{copy.targetSegment}</dt>
            <dd>{activeStep.targetSegment}</dd>
          </div>
          <div>
            <dt>{copy.mitreTactics}</dt>
            <dd><MitreValue value={activeStep.mitreTactics} /></dd>
          </div>
          <div>
            <dt>{copy.mitreTechniques}</dt>
            <dd><MitreValue value={activeStep.mitreTechniques} /></dd>
          </div>
        </dl>
      </aside>

      <nav className="it-layer-step-nav" aria-label={copy.stepPicker}>
        <button
          type="button"
          onClick={() => selectStep(activeStepIndex - 1)}
          disabled={isFirstStep}
          aria-label="Previous step"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div>
          <span>{copy.stepPicker}</span>
          <strong>{activeStep.stepNumber} / {report.steps.length}</strong>
        </div>
        <button
          type="button"
          onClick={() => selectStep(activeStepIndex + 1)}
          disabled={isLastStep}
          aria-label="Next step"
        >
          <ChevronRight size={24} strokeWidth={2.5} />
        </button>
      </nav>
    </article>
  );
}
