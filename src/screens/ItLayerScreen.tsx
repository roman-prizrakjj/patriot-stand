import { type CSSProperties, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  ItLayerAttackEdge,
  ItLayerReportStep,
  ItLayerStepTarget,
  ItLayerTarget,
  KillchainBlock,
  Language,
  ScenarioPosition,
} from '../core/types';

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

const debugStorageKey = 'patriot-it-layer-target-debug-v1';
const initialDebugTargetKey = 'initial-target';
const initialDebugTargetId = 'target-0';
const enableDoubleAttackLine = true;
const attackIntroDelayMs = 920;

interface DebugStepTarget {
  stepNumber: number;
  targetId: string;
  label: string;
  segment: string;
  x: number;
  y: number;
}

interface StoredDebugBlockTargets {
  targets: Record<string, ItLayerTarget>;
  stepTargets: Record<string, DebugStepTarget>;
  initialTarget?: DebugStepTarget;
}

type StoredDebugTargets = Record<string, StoredDebugBlockTargets>;

interface DebugMarker extends DebugStepTarget {
  key: string;
  duplicateIndex: number;
  duplicateCount: number;
}

interface AttackPoint extends DebugStepTarget {
  id: string;
  steps: number[];
  isInitial?: boolean;
}

interface AttackPathSegment {
  id: string;
  from: AttackPoint;
  to: AttackPoint;
  toStep: number;
}

interface LayerSize {
  width: number;
  height: number;
}

interface AttackCurve {
  d: string;
  isRenderable: boolean;
}

interface DragState {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

function clampStepIndex(index: number, steps: ItLayerReportStep[]) {
  return Math.max(0, Math.min(index, steps.length - 1));
}

function clampCoordinate(value: number) {
  return Math.max(0, Math.min(value, 1));
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(6));
}

function getTargetIdForStep(step: ItLayerReportStep) {
  return step.targetId.startsWith('target-') ? step.targetId : `target-${step.targetId}`;
}

function getStepTargetKey(step: ItLayerReportStep) {
  return `step-${String(step.stepNumber).padStart(2, '0')}`;
}

function isStoredDebugBlockTargets(value: unknown): value is StoredDebugBlockTargets {
  return Boolean(
    value
    && typeof value === 'object'
    && ('targets' in value || 'stepTargets' in value),
  );
}

function normalizeStoredDebugTargets(parsed: unknown): StoredDebugTargets {
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  return Object.entries(parsed as Record<string, unknown>).reduce<StoredDebugTargets>((result, [blockId, value]) => {
    if (isStoredDebugBlockTargets(value)) {
      result[blockId] = {
        targets: value.targets ?? {},
        stepTargets: value.stepTargets ?? {},
        initialTarget: value.initialTarget,
      };

      return result;
    }

    if (value && typeof value === 'object') {
      result[blockId] = {
        targets: value as Record<string, ItLayerTarget>,
        stepTargets: {},
      };
    }

    return result;
  }, {});
}

function readStoredDebugTargets(): StoredDebugTargets {
  try {
    const rawValue = window.localStorage.getItem(debugStorageKey);

    if (!rawValue) {
      return {};
    }

    return normalizeStoredDebugTargets(JSON.parse(rawValue));
  } catch {
    return {};
  }
}

function writeStoredDebugTargets(value: StoredDebugTargets) {
  window.localStorage.setItem(debugStorageKey, JSON.stringify(value));
}

function getStepTargetRecord(stepTargets: ItLayerStepTarget[] = []) {
  return stepTargets.reduce<Record<string, DebugStepTarget>>((result, target) => {
    result[`step-${String(target.stepNumber).padStart(2, '0')}`] = target;
    return result;
  }, {});
}

function getInitialDebugTarget(target?: ItLayerTarget): DebugStepTarget | undefined {
  if (!target) {
    return undefined;
  }

  return {
    stepNumber: 0,
    targetId: target.id,
    label: target.label,
    segment: target.segment,
    x: target.x,
    y: target.y,
  };
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

function mergeTargets(baseTargets: ItLayerTarget[], storedTargets: Record<string, ItLayerTarget>) {
  const targetMap = new Map(baseTargets.map((target) => [target.id, target]));

  Object.values(storedTargets).forEach((target) => {
    targetMap.set(target.id, target);
  });

  return Array.from(targetMap.values()).sort((left, right) => left.id.localeCompare(right.id, 'en', {
    numeric: true,
  }));
}

function getResolvedStepTarget(
  step: ItLayerReportStep,
  translatedStep: ItLayerReportStep,
  target: ItLayerTarget | undefined,
  stepTarget: DebugStepTarget | undefined,
) {
  if (stepTarget) {
    return stepTarget;
  }

  if (!target) {
    return undefined;
  }

  return {
    stepNumber: step.stepNumber,
    targetId: getTargetIdForStep(step),
    label: translatedStep.attackTarget,
    segment: translatedStep.targetSegment,
    x: target.x,
    y: target.y,
  };
}

function getMarkerCoordinateKey(marker: DebugStepTarget) {
  return `${marker.targetId}:${marker.x.toFixed(4)}:${marker.y.toFixed(4)}`;
}

function createStepMarkers(
  steps: ItLayerReportStep[],
  block: KillchainBlock,
  language: Language,
  targets: ItLayerTarget[],
  stepTargets: Record<string, DebugStepTarget>,
  initialTarget?: DebugStepTarget,
) {
  const markers = steps.reduce<DebugMarker[]>((result, step) => {
    const translatedStep = getTranslatedStep(step, block, language);
    const targetId = getTargetIdForStep(step);
    const target = targets.find((item) => item.id === targetId);
    const stepTarget = stepTargets[getStepTargetKey(step)];
    const resolvedTarget = getResolvedStepTarget(step, translatedStep, target, stepTarget);

    if (!resolvedTarget) {
      return result;
    }

    result.push({
      ...resolvedTarget,
      key: `${getStepTargetKey(step)}-${targetId}`,
      duplicateIndex: 0,
      duplicateCount: 1,
    });

    return result;
  }, initialTarget ? [{
    ...initialTarget,
    key: initialDebugTargetKey,
    duplicateIndex: 0,
    duplicateCount: 1,
  }] : []);

  const countsByCoordinate = markers.reduce<Record<string, number>>((result, marker) => {
    const key = getMarkerCoordinateKey(marker);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  const indexesByCoordinate: Record<string, number> = {};

  return markers.map((marker) => {
    const key = getMarkerCoordinateKey(marker);
    const duplicateIndex = indexesByCoordinate[key] ?? 0;
    indexesByCoordinate[key] = duplicateIndex + 1;

    return {
      ...marker,
      duplicateIndex,
      duplicateCount: countsByCoordinate[key] ?? 1,
    };
  });
}

function getMarkerStyle(marker: DebugMarker): CSSProperties {
  if (marker.duplicateCount <= 1) {
    return {
      left: `${marker.x * 100}%`,
      top: `${marker.y * 100}%`,
    };
  }

  const angle = (Math.PI * 2 * marker.duplicateIndex) / marker.duplicateCount;
  const radius = 16 + Math.min(marker.duplicateCount, 6) * 2;

  return {
    left: `${marker.x * 100}%`,
    top: `${marker.y * 100}%`,
    '--marker-offset-x': `${Math.round(Math.cos(angle) * radius)}px`,
    '--marker-offset-y': `${Math.round(Math.sin(angle) * radius)}px`,
  } as CSSProperties;
}

function getAttackCurve(
  fromPoint: AttackPoint,
  toPoint: AttackPoint,
  layerSize: LayerSize,
  index: number,
): AttackCurve {
  if (!layerSize.width || !layerSize.height) {
    return { d: '', isRenderable: false };
  }

  const fromX = fromPoint.x * layerSize.width;
  const fromY = fromPoint.y * layerSize.height;
  const toX = toPoint.x * layerSize.width;
  const toY = toPoint.y * layerSize.height;
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance < 2) {
    return { d: '', isRenderable: false };
  }

  const bend = Math.min(Math.max(distance * 0.24, 72), 210);
  const side = index % 2 === 0 ? -1 : 1;
  const controlX = (fromX + toX) / 2 + (-deltaY / distance) * bend * side;
  const controlY = (fromY + toY) / 2 + (deltaX / distance) * bend * side;

  return {
    d: `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${toX.toFixed(2)} ${toY.toFixed(2)}`,
    isRenderable: true,
  };
}

function createAttackPoints(
  steps: ItLayerReportStep[],
  block: KillchainBlock,
  language: Language,
  targets: ItLayerTarget[],
  stepTargets: Record<string, DebugStepTarget>,
  initialTarget?: DebugStepTarget,
) {
  const pointsByTargetId = new Map<string, AttackPoint>();
  const pointsByStepNumber = new Map<number, AttackPoint>();
  let initialPoint: AttackPoint | undefined;

  if (initialTarget) {
    initialPoint = {
      ...initialTarget,
      id: initialTarget.targetId,
      steps: [0],
      isInitial: true,
    };
    pointsByTargetId.set(initialPoint.id, initialPoint);
  }

  steps.forEach((step) => {
    const translatedStep = getTranslatedStep(step, block, language);
    const targetId = getTargetIdForStep(step);
    const target = targets.find((item) => item.id === targetId);
    const stepTarget = stepTargets[getStepTargetKey(step)];
    const resolvedTarget = getResolvedStepTarget(step, translatedStep, target, stepTarget);

    if (!resolvedTarget) {
      return;
    }

    let point = pointsByTargetId.get(targetId);

    if (!point) {
      point = {
        ...resolvedTarget,
        id: targetId,
        steps: [],
      };
      pointsByTargetId.set(targetId, point);
    }

    if (!point.steps.includes(step.stepNumber)) {
      point.steps.push(step.stepNumber);
    }

    pointsByStepNumber.set(step.stepNumber, point);
  });

  return {
    points: Array.from(pointsByTargetId.values()),
    pointsByStepNumber,
    initialPoint,
  };
}

function resolveAttackEdgePoint(
  edge: ItLayerAttackEdge,
  side: 'from' | 'to',
  initialPoint: AttackPoint | undefined,
  pointsByStepNumber: Map<number, AttackPoint>,
) {
  if (side === 'from') {
    if (edge.from === initialDebugTargetId) {
      return initialPoint;
    }

    if (typeof edge.fromStep === 'number') {
      return pointsByStepNumber.get(edge.fromStep);
    }
  }

  return pointsByStepNumber.get(edge.toStep);
}

function createAttackSegments(
  steps: ItLayerReportStep[],
  activeStepNumber: number,
  pointsByStepNumber: Map<number, AttackPoint>,
  initialPoint?: AttackPoint,
  attackEdges: ItLayerAttackEdge[] = [],
) {
  if (attackEdges.length > 0) {
    return attackEdges
      .filter((edge) => edge.toStep <= activeStepNumber)
      .reduce<AttackPathSegment[]>((result, edge, index) => {
        const from = resolveAttackEdgePoint(edge, 'from', initialPoint, pointsByStepNumber);
        const to = resolveAttackEdgePoint(edge, 'to', initialPoint, pointsByStepNumber);

        if (!from || !to || from.id === to.id) {
          return result;
        }

        result.push({
          id: edge.id ?? `attack-line-${String(index + 1).padStart(2, '0')}`,
          from,
          to,
          toStep: edge.toStep,
        });

        return result;
      }, []);
  }

  const visibleSteps = steps.filter((step) => step.stepNumber <= activeStepNumber);
  let previousPoint: AttackPoint | undefined;

  return visibleSteps.reduce<AttackPathSegment[]>((result, step, index) => {
    const currentPoint = pointsByStepNumber.get(step.stepNumber);

    if (!currentPoint) {
      return result;
    }

    if (previousPoint && previousPoint.id !== currentPoint.id) {
      result.push({
        id: `attack-line-${String(index).padStart(2, '0')}`,
        from: previousPoint,
        to: currentPoint,
        toStep: step.stepNumber,
      });
    }

    previousPoint = currentPoint;
    return result;
  }, []);
}

function getAttackPointStepLabel(point: AttackPoint, activeStepNumber: number) {
  if (point.isInitial) {
    return '0';
  }

  if (point.steps.includes(activeStepNumber)) {
    return String(activeStepNumber);
  }

  const completedSteps = point.steps.filter((stepNumber) => stepNumber <= activeStepNumber);
  return completedSteps.length > 0 ? String(Math.max(...completedSteps)) : '';
}

function getAttackPointState(point: AttackPoint, activeStepNumber: number) {
  if (point.steps.includes(activeStepNumber)) {
    return 'active';
  }

  if (point.isInitial || point.steps.some((stepNumber) => stepNumber < activeStepNumber)) {
    return 'past';
  }

  return '';
}

export function ItLayerScreen({ block, language, position, onStepSelect }: ItLayerScreenProps) {
  const screenRef = useRef<HTMLElement | null>(null);
  const activeStepRef = useRef<HTMLButtonElement | null>(null);
  const debugModalRef = useRef<HTMLDivElement | null>(null);
  const debugModalDragRef = useRef<DragState | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isDebugModalDragging, setIsDebugModalDragging] = useState(false);
  const [debugModalPosition, setDebugModalPosition] = useState<{ x: number; y: number } | null>(null);
  const [layerSize, setLayerSize] = useState<LayerSize>({ width: 0, height: 0 });
  const [isAttackIntroReady, setIsAttackIntroReady] = useState(false);
  const [lineReplayNonce, setLineReplayNonce] = useState(0);
  const [isPlacingTarget, setIsPlacingTarget] = useState(false);
  const [debugStepIndex, setDebugStepIndex] = useState(position.killchainStepIndex);
  const [storedDebugTargets, setStoredDebugTargets] = useState<StoredDebugTargets>(() => readStoredDebugTargets());
  const [debugMessage, setDebugMessage] = useState('');
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
  const blockStoredTargets = storedDebugTargets[block.id] ?? { targets: {}, stepTargets: {} };
  const datasetStepTargets = useMemo(
    () => getStepTargetRecord(data.targets.stepTargets),
    [data.targets.stepTargets],
  );
  const effectiveStepTargets = useMemo(
    () => ({
      ...datasetStepTargets,
      ...blockStoredTargets.stepTargets,
    }),
    [blockStoredTargets.stepTargets, datasetStepTargets],
  );
  const effectiveInitialTarget = blockStoredTargets.initialTarget
    ?? getInitialDebugTarget(data.targets.initialTarget);
  const mergedTargets = useMemo(
    () => mergeTargets(data.targets.targets, blockStoredTargets.targets),
    [blockStoredTargets.targets, data.targets.targets],
  );
  const isInitialDebugTarget = debugStepIndex === -1;
  const debugReportStep = report.steps[debugStepIndex] ?? report.steps[activeStepIndex];
  const translatedDebugStep = getTranslatedStep(debugReportStep, block, language);
  const debugStep: ItLayerReportStep = isInitialDebugTarget ? {
    stepNumber: 0,
    title: 'Начальный target: Internet',
    targetId: initialDebugTargetId,
    attackTarget: 'Internet',
    targetSegment: 'internet',
    mitreTactics: '',
    mitreTechniques: '',
  } : translatedDebugStep;
  const debugTargetId = isInitialDebugTarget ? initialDebugTargetId : getTargetIdForStep(debugStep);
  const debugStepTargetKey = isInitialDebugTarget ? initialDebugTargetKey : getStepTargetKey(debugStep);
  const debugTarget = mergedTargets.find((target) => target.id === debugTargetId);
  const debugStepTarget = getResolvedStepTarget(
    debugReportStep,
    debugStep,
    debugTarget,
    isInitialDebugTarget ? undefined : effectiveStepTargets[debugStepTargetKey],
  );
  const selectedDebugTarget = isInitialDebugTarget ? effectiveInitialTarget : debugStepTarget;
  const debugMarkers = useMemo(
    () => createStepMarkers(
      report.steps,
      block,
      language,
      mergedTargets,
      effectiveStepTargets,
      effectiveInitialTarget,
    ),
    [block, effectiveInitialTarget, effectiveStepTargets, language, mergedTargets, report.steps],
  );
  const attackModel = useMemo(
    () => createAttackPoints(
      report.steps,
      block,
      language,
      mergedTargets,
      effectiveStepTargets,
      effectiveInitialTarget,
    ),
    [block, effectiveInitialTarget, effectiveStepTargets, language, mergedTargets, report.steps],
  );
  const attackSegments = useMemo(
    () => createAttackSegments(
      report.steps,
      activeStep.stepNumber,
      attackModel.pointsByStepNumber,
      attackModel.initialPoint,
      data.targets.attackEdges,
    ),
    [
      activeStep.stepNumber,
      attackModel.initialPoint,
      attackModel.pointsByStepNumber,
      data.targets.attackEdges,
      report.steps,
    ],
  );
  const visibleAttackPoints = useMemo(
    () => attackModel.points.filter((point) => (
      point.isInitial
      || point.steps.some((stepNumber) => stepNumber <= activeStep.stepNumber)
    )),
    [activeStep.stepNumber, attackModel.points],
  );
  const debugJson = useMemo(
    () => JSON.stringify({
      ...data.targets,
      targets: mergedTargets,
      initialTarget: effectiveInitialTarget ? {
        id: initialDebugTargetId,
        label: effectiveInitialTarget.label,
        segment: effectiveInitialTarget.segment,
        x: effectiveInitialTarget.x,
        y: effectiveInitialTarget.y,
      } : null,
      stepTargets: debugMarkers.map((marker) => ({
        stepNumber: marker.stepNumber,
        targetId: marker.targetId,
        label: marker.label,
        segment: marker.segment,
        x: marker.x,
        y: marker.y,
      })).filter((marker) => marker.stepNumber !== 0),
    }, null, 2),
    [data.targets, debugMarkers, effectiveInitialTarget, mergedTargets],
  );

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeStepIndex]);

  useEffect(() => {
    const node = screenRef.current;

    if (!node) {
      return undefined;
    }

    const layerNode = node;

    function updateLayerSize() {
      const rect = layerNode.getBoundingClientRect();
      const nextSize = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      setLayerSize((current) => (
        current.width === nextSize.width && current.height === nextSize.height ? current : nextSize
      ));
    }

    updateLayerSize();

    const resizeObserver = new ResizeObserver(updateLayerSize);
    resizeObserver.observe(layerNode);
    window.addEventListener('resize', updateLayerSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateLayerSize);
    };
  }, []);

  useEffect(() => {
    if (!isDebugOpen) {
      setDebugStepIndex(activeStepIndex);
    }
  }, [activeStepIndex, isDebugOpen]);

  useEffect(() => {
    setLineReplayNonce((value) => value + 1);
  }, [activeStepIndex, block.id, language]);

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (shouldReduceMotion) {
      setIsAttackIntroReady(true);
      return undefined;
    }

    setIsAttackIntroReady(false);

    const timerId = window.setTimeout(() => {
      setIsAttackIntroReady(true);
    }, attackIntroDelayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [block.id, language]);

  useEffect(() => {
    setDebugStepIndex((index) => (index === -1 ? -1 : clampStepIndex(index, report.steps)));
  }, [block.id, report.steps]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isDebugOpen) {
        setIsDebugOpen(false);
        setIsPlacingTarget(false);
        setIsDebugModalDragging(false);
      }

      if (event.key.toLowerCase() === 'd' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        setIsDebugOpen((value) => !value);
        setIsPlacingTarget(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDebugOpen]);

  useEffect(() => {
    if (!isDebugModalDragging) {
      return undefined;
    }

    function handlePointerMove(event: globalThis.PointerEvent) {
      const dragState = debugModalDragRef.current;

      if (!dragState) {
        return;
      }

      const padding = 12;
      const maxX = Math.max(padding, window.innerWidth - dragState.width - padding);
      const maxY = Math.max(padding, window.innerHeight - dragState.height - padding);

      setDebugModalPosition({
        x: Math.max(padding, Math.min(event.clientX - dragState.offsetX, maxX)),
        y: Math.max(padding, Math.min(event.clientY - dragState.offsetY, maxY)),
      });
    }

    function handlePointerUp() {
      debugModalDragRef.current = null;
      setIsDebugModalDragging(false);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDebugModalDragging]);

  function selectStep(index: number) {
    setLineReplayNonce((value) => value + 1);
    onStepSelect(clampStepIndex(index, report.steps));
  }

  function updateStoredStepTarget(stepKey: string, target: DebugStepTarget) {
    setStoredDebugTargets((current) => {
      const currentBlockTargets = current[block.id] ?? { targets: {}, stepTargets: {} };
      const nextValue = {
        ...current,
        [block.id]: {
          targets: currentBlockTargets.targets,
          initialTarget: currentBlockTargets.initialTarget,
          stepTargets: {
            ...currentBlockTargets.stepTargets,
            [stepKey]: target,
          },
        },
      };

      writeStoredDebugTargets(nextValue);
      return nextValue;
    });
  }

  function removeStoredStepTarget(stepKey: string) {
    setStoredDebugTargets((current) => {
      const currentBlockTargets = current[block.id] ?? { targets: {}, stepTargets: {} };
      const nextStepTargets = { ...currentBlockTargets.stepTargets };
      delete nextStepTargets[stepKey];

      const nextValue = {
        ...current,
        [block.id]: {
          targets: currentBlockTargets.targets,
          initialTarget: currentBlockTargets.initialTarget,
          stepTargets: nextStepTargets,
        },
      };

      writeStoredDebugTargets(nextValue);
      return nextValue;
    });
  }

  function updateStoredInitialTarget(target: DebugStepTarget) {
    setStoredDebugTargets((current) => {
      const currentBlockTargets = current[block.id] ?? { targets: {}, stepTargets: {} };
      const nextValue = {
        ...current,
        [block.id]: {
          targets: currentBlockTargets.targets,
          stepTargets: currentBlockTargets.stepTargets,
          initialTarget: target,
        },
      };

      writeStoredDebugTargets(nextValue);
      return nextValue;
    });
  }

  function removeStoredInitialTarget() {
    setStoredDebugTargets((current) => {
      const currentBlockTargets = current[block.id] ?? { targets: {}, stepTargets: {} };
      const nextValue = {
        ...current,
        [block.id]: {
          targets: currentBlockTargets.targets,
          stepTargets: currentBlockTargets.stepTargets,
        },
      };

      writeStoredDebugTargets(nextValue);
      return nextValue;
    });
  }

  function resetBlockStoredTargets() {
    setStoredDebugTargets((current) => {
      const nextValue = { ...current };
      delete nextValue[block.id];
      writeStoredDebugTargets(nextValue);
      return nextValue;
    });
    setDebugMessage('Локальная разметка текущего IT-слоя сброшена.');
  }

  function handleDebugMapPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!isPlacingTarget) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = roundCoordinate(clampCoordinate((event.clientX - rect.left) / rect.width));
    const y = roundCoordinate(clampCoordinate((event.clientY - rect.top) / rect.height));
    const nextTarget = {
      stepNumber: debugStep.stepNumber,
      targetId: debugTargetId,
      label: debugStep.attackTarget,
      segment: debugStep.targetSegment,
      x,
      y,
    };

    if (isInitialDebugTarget) {
      updateStoredInitialTarget(nextTarget);
    } else {
      updateStoredStepTarget(debugStepTargetKey, nextTarget);
    }

    setDebugMessage(`Шаг ${debugStep.stepNumber}: ${debugTargetId} -> x ${x}, y ${y}`);
  }

  function startDebugModalDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest('button, select, input, textarea')) {
      return;
    }

    const modal = debugModalRef.current;

    if (!modal) {
      return;
    }

    const rect = modal.getBoundingClientRect();
    debugModalDragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };

    setDebugModalPosition({
      x: rect.left,
      y: rect.top,
    });
    setIsDebugModalDragging(true);
    event.preventDefault();
  }

  async function copyDebugJson() {
    try {
      await navigator.clipboard.writeText(debugJson);
      setDebugMessage('JSON разметки скопирован в буфер.');
    } catch {
      setDebugMessage('Не удалось скопировать автоматически. JSON можно выделить в поле ниже.');
    }
  }

  return (
    <article className="it-layer-screen" ref={screenRef} aria-label={block.title[language]}>
      <img
        key={`${block.id}-${language}`}
        className="it-layer-map"
        src={map[language]}
        alt=""
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
      />
      <div className="it-layer-vignette" aria-hidden="true" />

      {layerSize.width > 0 && layerSize.height > 0 && (
        <svg
          className="it-layer-attack-lines"
          viewBox={`0 0 ${layerSize.width} ${layerSize.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {isAttackIntroReady && attackSegments.map((segment, index) => {
            const curve = getAttackCurve(segment.from, segment.to, layerSize, index);
            const isActiveLine = segment.toStep === activeStep.stepNumber;
            const lineKey = isActiveLine
              ? `${segment.id}-${segment.toStep}-hot-${lineReplayNonce}`
              : `${segment.id}-${segment.toStep}-past`;

            if (!curve.isRenderable) {
              return null;
            }

            return (
              <g key={`${segment.id}-${segment.toStep}`}>
                <path
                  className={`it-layer-attack-curve ${isActiveLine ? 'hot' : 'past'}`}
                  d={curve.d}
                  key={`${lineKey}-outer`}
                  pathLength={1}
                />
                {enableDoubleAttackLine && (
                  <path
                    className={`it-layer-attack-curve-inner ${isActiveLine ? 'hot' : 'past'}`}
                    d={curve.d}
                    key={`${lineKey}-inner`}
                    pathLength={1}
                  />
                )}
                {isActiveLine && (
                  <circle className="it-layer-attack-projectile" r="7">
                    <animateMotion
                      dur="1.16s"
                      path={curve.d}
                      repeatCount="indefinite"
                      rotate="auto"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      )}

      <div className="it-layer-attack-points" aria-hidden="true">
        {visibleAttackPoints.map((point) => {
          const state = getAttackPointState(point, activeStep.stepNumber);

          return (
            <span
              className={`it-layer-attack-point ${point.isInitial ? 'initial' : ''} ${state}`}
              key={point.id}
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
              }}
            >
              {getAttackPointStepLabel(point, activeStep.stepNumber)}
            </span>
          );
        })}
      </div>

      {isDebugOpen && (
        <div className="it-layer-debug-markers" aria-hidden="true">
          {debugMarkers.map((target) => (
            <span
              className={`it-layer-debug-marker ${target.stepNumber === debugStep.stepNumber ? 'active' : ''}`}
              key={target.key}
              style={getMarkerStyle(target)}
            >
              {target.stepNumber}
            </span>
          ))}
        </div>
      )}

      {isPlacingTarget && (
        <div
          className="it-layer-debug-click-layer"
          onPointerDown={handleDebugMapPointerDown}
          role="presentation"
        />
      )}

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

      {isDebugOpen && (
        <div
          className={`it-layer-debug-modal ${isDebugModalDragging ? 'dragging' : ''}`}
          ref={debugModalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Разметка таргетов IT-слоя"
          style={debugModalPosition ? {
            left: debugModalPosition.x,
            top: debugModalPosition.y,
            transform: 'none',
          } : undefined}
        >
          <div className="it-layer-debug-modal__header" onPointerDown={startDebugModalDrag}>
            <div>
              <span>Debug target mapper</span>
              <strong>{block.title[language]}</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsDebugOpen(false);
                setIsPlacingTarget(false);
              }}
            >
              Закрыть
            </button>
          </div>

          <label className="it-layer-debug-field">
            <span>Точка / шаг атаки</span>
            <select
              value={debugStepIndex}
              onChange={(event) => {
                const nextIndex = Number(event.target.value);
                setDebugStepIndex(nextIndex);

                if (nextIndex >= 0) {
                  selectStep(nextIndex);
                }
              }}
            >
              <option value={-1}>
                0. Начальный target / Internet / {initialDebugTargetId}
              </option>
              {report.steps.map((step, index) => {
                const translatedStep = getTranslatedStep(step, block, language);

                return (
                  <option key={`${step.stepNumber}-${step.targetId}`} value={index}>
                    {step.stepNumber}. {translatedStep.title} / target {getTargetIdForStep(step)}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="it-layer-debug-target-card">
            <div>
              <span>Step / Target ID</span>
              <strong>{debugStep.stepNumber} / {debugTargetId}</strong>
            </div>
            <div>
              <span>Координаты</span>
              <strong>
                {selectedDebugTarget ? `x ${selectedDebugTarget.x}, y ${selectedDebugTarget.y}` : 'не расставлен'}
              </strong>
            </div>
            <div>
              <span>Объект</span>
              <strong>{debugStep.attackTarget}</strong>
            </div>
          </div>

          <div className="it-layer-debug-actions">
            <button
              className={isPlacingTarget ? 'active' : ''}
              type="button"
              onClick={() => setIsPlacingTarget((value) => !value)}
            >
              {isPlacingTarget ? 'Клик по карте включен' : 'Расставить на карте'}
            </button>
            <button type="button" onClick={copyDebugJson}>
              Скопировать JSON
            </button>
            <button
              type="button"
              onClick={() => {
                if (isInitialDebugTarget) {
                  removeStoredInitialTarget();
                } else {
                  removeStoredStepTarget(debugStepTargetKey);
                }
              }}
            >
              {isInitialDebugTarget ? 'Сбросить target 0' : 'Сбросить шаг'}
            </button>
            <button type="button" onClick={resetBlockStoredTargets}>
              Сбросить слой
            </button>
          </div>

          <p className="it-layer-debug-hint">
            Открыть/закрыть: Ctrl+Shift+D. В режиме расстановки клик по карте записывает координаты выбранного шага.
          </p>

          {debugMessage && <p className="it-layer-debug-message">{debugMessage}</p>}

          <textarea
            className="it-layer-debug-json"
            readOnly
            value={debugJson}
          />
        </div>
      )}
    </article>
  );
}
