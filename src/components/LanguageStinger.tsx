import type { Language } from '../core/types';

interface LanguageStingerProps {
  visible: boolean;
  language: Language;
}

export function LanguageStinger({ visible, language }: LanguageStingerProps) {
  const label = language === 'en' ? 'ENG' : 'RU';

  return (
    <div className={`language-stinger ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
      <div className="language-stinger__beam" />
      <div className="language-stinger__grid" />
      <div className="language-stinger__content">
        <span>Language mode</span>
        <strong>{label}</strong>
      </div>
    </div>
  );
}
