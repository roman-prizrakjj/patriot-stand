import { getKillchainStep } from '../core/autoplay';
import type { KillchainBlock, Language, ScenarioPosition } from '../core/types';

interface KillchainScreenProps {
  block: KillchainBlock;
  language: Language;
  position: ScenarioPosition;
}

export function KillchainScreen({ block, language, position }: KillchainScreenProps) {
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
