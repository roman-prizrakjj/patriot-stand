import type { Language, VideoBlock } from '../core/types';

interface VideoScreenProps {
  block: VideoBlock;
  language: Language;
  onEnded: () => void;
}

export function VideoScreen({ block, language, onEnded }: VideoScreenProps) {
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
        onEnded={onEnded}
      />
    </article>
  );
}
