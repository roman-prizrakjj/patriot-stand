import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { useScenarioEngine } from '../app/useScenarioEngine';
import type { ScenarioBlock } from '../core/types';
import type { ScenarioConfig } from '../core/types';
import { triggerPtVisionStreamDeck } from '../integrations/streamDeck/useStreamDeckSync';

type ScenarioEngine = ReturnType<typeof useScenarioEngine>;

const bottomMenuText = {
  ru: {
    page: 'Страница',
  },
  en: {
    page: 'Page',
  },
};

interface BottomMenuProps {
  config: ScenarioConfig;
  engine: ScenarioEngine;
}

export function BottomMenu({ config, engine }: BottomMenuProps) {
  const {
    currentBlock,
    goNext,
    goPrevious,
    jumpToBlock,
    language,
    mode,
    switchLanguage,
  } = engine;
  const isHidden = currentBlock?.type === 'video';

  async function launchPtVision() {
    void triggerPtVisionStreamDeck(language);

    if (!window.patriotHost) {
      console.warn('PT Vision focus failed: patriotHost bridge is unavailable.');
      return;
    }

    const result = await window.patriotHost.launchExternal(config.externalTargets.ptVision);

    if (result.ok) {
      console.info('PT Vision focus succeeded:', result);
      return;
    }

    console.warn('PT Vision focus failed:', result);
  }

  function getBlockLabel(block: ScenarioBlock, index: number) {
    if (block.type === 'presentation') {
      return String(block.slideNumber);
    }

    const map: Record<string, string> = {
      'risk-oil': 'R1',
      'killchain-oil': 'C1',
      'risk-intersec': 'R2',
      'killchain-intersec': 'C2',
    };

    return map[block.id] ?? String(index + 1);
  }

  return (
    <nav
      className={[
        'bottom-menu',
        'bottom-menu--full',
        `bottom-menu--${mode}`,
        isHidden ? 'bottom-menu--hidden' : '',
      ].filter(Boolean).join(' ')}
      aria-label="Scenario controls"
      aria-hidden={isHidden}
    >
      <div className="figma-menu-group figma-menu-group--pages">
        <span className="figma-menu-label">{bottomMenuText[language].page}</span>
        <button className="figma-menu-button" type="button" onClick={goPrevious} aria-label="Previous">
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>

        <div className="figma-page-list" aria-label="Scenario navigation">
          {config.blocks.map((block, index) => {
            const label = getBlockLabel(block, index);
            const isActive = currentBlock?.id === block.id;

            return (
              <button
                className={isActive ? 'active' : ''}
                key={block.id}
                type="button"
                onClick={() => jumpToBlock(index)}
                aria-label={block.title[language]}
                aria-current={isActive ? 'page' : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button className="figma-menu-button" type="button" onClick={goNext} aria-label="Next">
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div className="figma-menu-group figma-menu-group--pt">
        <button className="figma-menu-text-button" type="button" onClick={launchPtVision}>
          PT Vision Standoff 15
        </button>
      </div>

      <div className="figma-menu-group figma-menu-group--language" aria-label="Language">
        {config.languages.map((item) => (
          <button
            className={item === language ? 'active' : ''}
            key={item}
            type="button"
            onClick={() => switchLanguage(item)}
          >
            {item === 'en' ? 'ENG' : item.toUpperCase()}
          </button>
        ))}
      </div>
    </nav>
  );
}
