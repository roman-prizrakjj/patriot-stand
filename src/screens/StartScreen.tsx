import { Play } from 'lucide-react';

interface StartScreenProps {
  title: string;
  subtitle: string;
  onPlay: () => void;
}

export function StartScreen({ title, subtitle, onPlay }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="ambient-grid" />
      <div className="start-copy">
        <p>Cyberbattle Stand</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
      <button className="start-play" type="button" onClick={onPlay} aria-label="Start scenario">
        <Play size={54} />
      </button>
    </div>
  );
}
