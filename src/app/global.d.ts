export {};

declare global {
  interface Window {
    patriotHost?: {
      launchExternal: (target: string) => Promise<{
        ok: boolean;
        target: string;
        reason?: string;
        windowTitle?: string;
        processId?: number;
        processPath?: string;
        configPath?: string;
        checkedConfigPaths?: string[];
        config?: {
          windowTitleIncludes: string[];
          processNameIncludes: string[];
          processPathIncludes: string[];
        };
        visibleWindows?: Array<{
          title: string;
          processName: string;
          processPath: string;
        }>;
      }>;
    };
  }
}
