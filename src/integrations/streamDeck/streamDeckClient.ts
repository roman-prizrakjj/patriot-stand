import type { Language } from '../../core/types';

const streamDeckBaseUrl = 'http://127.0.0.1:8000';

const languageLocation: Record<Language, number> = {
  ru: 0,
  en: 1,
};

export async function pressStreamDeckButton(language: Language, button: number) {
  const languageSlot = languageLocation[language];
  const url = `${streamDeckBaseUrl}/api/location/1/${languageSlot}/${button}/press`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      keepalive: true,
    });

    if (!response.ok) {
      console.warn(`Stream Deck trigger failed: ${response.status} ${url}`);
    }
  } catch (error) {
    console.warn(`Stream Deck trigger unavailable: ${url}`, error);
  }
}
