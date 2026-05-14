import type { Language, SlideBlock } from '../core/types';

interface SlideScreenProps {
  block: SlideBlock;
  language: Language;
}

export function SlideScreen({ block, language }: SlideScreenProps) {
  return (
    <article className="content-screen slide-screen">
      <div className="content-copy">
        <p className="eyebrow">{block.eyebrow[language]}</p>
        <h1>{block.title[language]}</h1>
        <p>{block.body[language]}</p>
      </div>
      <div className="visual-panel">
        <span>{block.id}</span>
      </div>
    </article>
  );
}
