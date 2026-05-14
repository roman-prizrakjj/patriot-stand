export {};

declare global {
  interface Window {
    patriotHost?: {
      launchExternal: (target: string) => Promise<{
        ok: boolean;
        target: string;
        reason?: string;
      }>;
    };
  }
}
