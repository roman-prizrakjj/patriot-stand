import type { Language, ScenarioConfig } from '../core/types';

const imageCache = new Map<string, HTMLImageElement>();
let preloadQueue = Promise.resolve();

function preloadImage(url: string) {
  if (imageCache.has(url)) {
    return;
  }

  const image = new Image();
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = url;
  imageCache.set(url, image);

  preloadQueue = preloadQueue
    .then(() => image.decode())
    .catch(() => undefined);
}

export function preloadItLayerMaps(config: ScenarioConfig, preferredLanguage: Language) {
  const languages = [
    preferredLanguage,
    ...config.languages.filter((language) => language !== preferredLanguage),
  ];

  languages.forEach((language) => {
    config.blocks.forEach((block) => {
      if (block.type === 'killchain' && block.map) {
        preloadImage(block.map[language]);
      }
    });
  });
}
