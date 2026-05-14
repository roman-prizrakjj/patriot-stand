import { ChevronLeft, ChevronRight, ExternalLink, Languages, Play, Square } from 'lucide-react';
import type { useScenarioEngine } from '../app/useScenarioEngine';
import type { ScenarioConfig } from '../core/types';

type ScenarioEngine = ReturnType<typeof useScenarioEngine>;

interface BottomMenuProps {
  config: ScenarioConfig;
  engine: ScenarioEngine;
}

export function BottomMenu({ config, engine }: BottomMenuProps) {
  const {
    goNext,
    goPrevious,
    jumpToBlock,
    language,
    mode,
    play,
    stop,
    switchLanguage,
  } = engine;

  const canUseExtendedMenu = false;

  async function launchPtVision() {
    await window.patriotHost?.launchExternal(config.externalTargets.ptVision);
  }

  return (
    <nav className={`bottom-menu bottom-menu--${mode}`}>
      <div className="menu-cluster">
        {mode === 'start' && (
          <button className="control-button control-button--primary" type="button" onClick={play} aria-label="Play">
            <Play size={34} />
          </button>
        )}

        {mode !== 'start' && (
          <>
            <button className="control-button" type="button" onClick={goPrevious} aria-label="Previous">
              <ChevronLeft size={34} />
            </button>

            {mode === 'autoplay' ? (
              <button className="control-button control-button--danger" type="button" onClick={stop} aria-label="Stop">
                <Square size={30} />
              </button>
            ) : (
              <button className="control-button control-button--primary" type="button" onClick={play} aria-label="Play">
                <Play size={34} />
              </button>
            )}

            <button className="control-button" type="button" onClick={goNext} aria-label="Next">
              <ChevronRight size={34} />
            </button>
          </>
        )}
      </div>

      {canUseExtendedMenu && (
        <div className="menu-strip" aria-label="Scenario navigation">
          {config.blocks.map((block, index) => (
            <button key={block.id} type="button" onClick={() => jumpToBlock(index)}>
              {block.title[language]}
            </button>
          ))}

          <button type="button" onClick={launchPtVision}>
            <ExternalLink size={20} />
            PT Vision
          </button>
        </div>
      )}

      <div className="language-switch" aria-label="Language">
        <Languages size={24} />
        {config.languages.map((item) => (
          <button
            className={item === language ? 'active' : ''}
            key={item}
            type="button"
            onClick={() => switchLanguage(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </nav>
  );
}
