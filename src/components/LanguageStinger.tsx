import type { Language } from '../core/types';

interface LanguageStingerProps {
  visible: boolean;
  language: Language;
}

export function LanguageStinger({ visible, language }: LanguageStingerProps) {
  return (
    <div className={`language-stinger ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
      <span>{language.toUpperCase()}</span>
    </div>
  );
}
