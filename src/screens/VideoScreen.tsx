import type { Language, VideoBlock } from '../core/types';

interface VideoScreenProps {
  block: VideoBlock;
  language: Language;
}

export function VideoScreen({ block, language }: VideoScreenProps) {
  return (
    <article className="video-screen">
      <video
        key={`${block.id}-${language}`}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={block.poster?.[language]}
        src={block.source[language]}
      />
    </article>
  );
}
