import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

interface ExternalTargetConfig {
  windowTitleIncludes?: string[];
  processNameIncludes?: string[];
  processPathIncludes?: string[];
}

type ExternalTargetsConfig = Record<string, ExternalTargetConfig>;

interface TargetsConfigReadResult {
  config: ExternalTargetsConfig;
  configPath?: string;
  checkedConfigPaths: string[];
}

interface VisibleWindowSummary {
  title: string;
  processName: string;
  processPath: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FocusExternalTargetOptions {
  displayAreas?: Rect[];
}

interface ManagedWindow {
  processId: number;
  path: string;
  getTitle(): string;
  getBounds(): Rect;
  isWindow(): boolean;
  isVisible(): boolean;
  show(): void;
  restore(): void;
  maximize(): void;
  bringToTop(): void;
}

interface WindowManagerApi {
  getWindows(): ManagedWindow[];
}

const require = createRequire(import.meta.url);

const defaultTargetsConfig: ExternalTargetsConfig = {
  'pt-vision-standoff-15': {
    windowTitleIncludes: ['PT Vision Standoff 15'],
    processNameIncludes: ['PTVision', 'Standoff'],
    processPathIncludes: [],
  },
};

function normalize(value: string) {
  return value.toLocaleLowerCase();
}

function hasMatch(value: string, patterns: string[] = []) {
  const normalizedValue = normalize(value);
  return patterns.some((pattern) => normalizedValue.includes(normalize(pattern)));
}

function getConfigPaths(appRoot: string) {
  return [
    path.join(process.cwd(), 'external-targets.config.json'),
    path.join(appRoot, 'external-targets.config.json'),
    path.join(path.dirname(process.execPath), 'external-targets.config.json'),
  ].filter((item, index, list) => list.indexOf(item) === index);
}

function readTargetsConfig(appRoot: string): TargetsConfigReadResult {
  const checkedConfigPaths = getConfigPaths(appRoot);

  for (const configPath of checkedConfigPaths) {
    if (!fs.existsSync(configPath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return {
        config: {
          ...defaultTargetsConfig,
          ...JSON.parse(content) as ExternalTargetsConfig,
        },
        configPath,
        checkedConfigPaths,
      };
    } catch (error) {
      console.warn(`Failed to read external target config: ${configPath}`, error);
    }
  }

  return {
    config: defaultTargetsConfig,
    checkedConfigPaths,
  };
}

function getConfiguredPatterns(config: ExternalTargetConfig) {
  return {
    windowTitleIncludes: config.windowTitleIncludes ?? [],
    processNameIncludes: config.processNameIncludes ?? [],
    processPathIncludes: config.processPathIncludes ?? [],
  };
}

function getWindowManager(): WindowManagerApi | null {
  try {
    return require('node-window-manager').windowManager as WindowManagerApi;
  } catch (error) {
    console.warn('node-window-manager is unavailable', error);
    return null;
  }
}

function matchesTarget(window: ManagedWindow, config: ExternalTargetConfig) {
  const title = window.getTitle();
  const processPath = window.path || '';
  const processName = path.basename(processPath, path.extname(processPath));

  return hasMatch(title, config.windowTitleIncludes)
    || hasMatch(processName, config.processNameIncludes)
    || hasMatch(processPath, config.processPathIncludes);
}

function summarizeWindow(window: ManagedWindow): VisibleWindowSummary {
  const processPath = window.path || '';

  return {
    title: window.getTitle(),
    processName: path.basename(processPath, path.extname(processPath)),
    processPath,
  };
}

function coversArea(bounds: Rect, area: Rect) {
  const tolerance = 16;
  const left = bounds.x <= area.x + tolerance;
  const top = bounds.y <= area.y + tolerance;
  const right = bounds.x + bounds.width >= area.x + area.width - tolerance;
  const bottom = bounds.y + bounds.height >= area.y + area.height - tolerance;

  return left && top && right && bottom;
}

function isAlreadyExpanded(window: ManagedWindow, displayAreas: Rect[] = []) {
  if (displayAreas.length === 0) {
    return false;
  }

  const bounds = window.getBounds();
  return displayAreas.some((area) => coversArea(bounds, area));
}

export async function focusExternalTarget(
  target: string,
  appRoot: string,
  options: FocusExternalTargetOptions = {},
) {
  if (process.platform !== 'win32') {
    return {
      ok: false,
      target,
      reason: 'External window focusing is currently implemented only for Windows.',
    };
  }

  const windowManager = getWindowManager();
  if (!windowManager) {
    return {
      ok: false,
      target,
      reason: 'Native window manager module is unavailable.',
    };
  }

  const {
    config: targetsConfig,
    configPath,
    checkedConfigPaths,
  } = readTargetsConfig(appRoot);
  const targetConfig = targetsConfig[target];
  if (!targetConfig) {
    return {
      ok: false,
      target,
      reason: `External target is not configured: ${target}`,
      configPath,
      checkedConfigPaths,
    };
  }

  const matches = windowManager
    .getWindows()
    .filter((window) => window.isWindow())
    .filter((window) => matchesTarget(window, targetConfig))
    .sort((left, right) => Number(right.isVisible()) - Number(left.isVisible()));

  const targetWindow = matches[0];
  if (!targetWindow) {
    const visibleWindows = windowManager
      .getWindows()
      .filter((window) => window.isWindow() && window.isVisible())
      .map(summarizeWindow)
      .slice(0, 20);

    return {
      ok: false,
      target,
      reason: 'Matching external window was not found.',
      config: getConfiguredPatterns(targetConfig),
      configPath,
      checkedConfigPaths,
      visibleWindows,
    };
  }

  if (!targetWindow.isVisible()) {
    targetWindow.restore();
  }

  targetWindow.show();

  if (!isAlreadyExpanded(targetWindow, options.displayAreas)) {
    targetWindow.maximize();
  }

  targetWindow.bringToTop();

  return {
    ok: true,
    target,
    windowTitle: targetWindow.getTitle(),
    processId: targetWindow.processId,
    processPath: targetWindow.path,
    configPath,
    checkedConfigPaths,
  };
}
