import { getKillchainStep } from '../core/navigation';
import type { KillchainBlock, Language, ScenarioPosition } from '../core/types';
import { ItLayerScreen } from './ItLayerScreen';

interface KillchainScreenProps {
  block: KillchainBlock;
  language: Language;
  position: ScenarioPosition;
  onStepSelect: (stepIndex: number) => void;
}

export function KillchainScreen({ block, language, position, onStepSelect }: KillchainScreenProps) {
  if (block.map && block.itLayer) {
    return (
      <ItLayerScreen
        block={block}
        language={language}
        position={position}
        onStepSelect={onStepSelect}
      />
    );
  }

  if (block.map) {
    return (
      <article className="it-layer-screen" aria-label={block.title[language]}>
        <img
          key={`${block.id}-${language}`}
          className="it-layer-map"
          src={block.map[language]}
          alt=""
          draggable={false}
        />
      </article>
    );
  }

  const step = getKillchainStep(block, position);

  return (
    <article className="content-screen killchain-screen">
      <div className="content-copy">
        <p className="eyebrow">{block.title[language]}</p>
        <h1>{step.title[language]}</h1>
        <p>{step.description[language]}</p>
        <div className="tag-row">
          {step.mitreTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="network-map">
        {['edge', 'dmz', 'vpn', 'app', 'scada', 'core', 'identity', 'data', 'report'].map((node) => (
          <div className={`network-node ${step.activeNodes.includes(node) ? 'active' : ''}`} key={node}>
            {node}
          </div>
        ))}
      </div>
    </article>
  );
}
