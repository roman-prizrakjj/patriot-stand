import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Language, PresentationBlock } from '../core/types';
import { presentationDeckHtml } from './presentationDeckHtml';
import { presentationI18n } from './presentationI18n';
import './presentationDeck.css';

interface PresentationDeckScreenProps {
  block: PresentationBlock;
  language: Language;
}

const slideTransitionMs = 3800;
const counterHoldMs = 1300;
const counterDurationMs = 2200;

function easeOutQuad(progress: number) {
  return 1 - (1 - progress) * (1 - progress);
}

function formatEventsValue(value: number, language: Language) {
  return language === 'en'
    ? value.toLocaleString('en-US')
    : value.toLocaleString('ru-RU');
}

export function PresentationDeckScreen({ block, language }: PresentationDeckScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousSlideRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const counterFrameRef = useRef<number | null>(null);
  const counterTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || root.hasChildNodes()) return;

    root.innerHTML = presentationDeckHtml;
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const viewport = root.querySelector<HTMLElement>('.pdeck-viewport');
    const deck = root.querySelector<HTMLElement>('.pdeck-deck');
    if (!viewport || !deck) return;

    const resizeDeck = () => {
      const scale = Math.min(viewport.clientWidth / 3840, viewport.clientHeight / 2160);
      deck.style.transform = `scale(${scale})`;
    };

    resizeDeck();
    const observer = new ResizeObserver(resizeDeck);
    observer.observe(viewport);
    window.addEventListener('resize', resizeDeck);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeDeck);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pack = presentationI18n[language];
    root.dataset.lang = language;

    Object.entries(pack.slides).forEach(([slideNumber, title]) => {
      const slide = root.querySelector<HTMLElement>(`[data-slide="${slideNumber}"]`);
      if (slide) slide.dataset.title = title;
    });

    Object.entries(pack.text).forEach(([selector, html]) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((node) => {
        node.innerHTML = html;
      });
    });
  }, [language]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (counterFrameRef.current !== null) {
      window.cancelAnimationFrame(counterFrameRef.current);
      counterFrameRef.current = null;
    }

    if (counterTimerRef.current !== null) {
      window.clearTimeout(counterTimerRef.current);
      counterTimerRef.current = null;
    }

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const slides = [...root.querySelectorAll<HTMLElement>('.pdeck-slide')];
    const next = block.slideNumber;
    const previous = previousSlideRef.current;
    const to = slides.find((slide) => slide.dataset.slide === String(next));
    const from = previous === null
      ? null
      : slides.find((slide) => slide.dataset.slide === String(previous));

    if (!to) return;

    slides.forEach((slide) => {
      slide.classList.remove(
        'pdeck-is-active',
        'pdeck-is-entering',
        'pdeck-is-leaving',
        'pdeck-has-entered',
        'pdeck-has-left',
        'pdeck-risk-leaving',
      );
      slide.setAttribute('aria-hidden', 'true');
    });

    to.classList.add('pdeck-is-active', 'pdeck-is-entering');
    to.setAttribute('aria-hidden', 'false');

    if (from && from !== to) {
      from.classList.add('pdeck-is-leaving');
      from.setAttribute('aria-hidden', 'true');
    }

    frameRef.current = window.requestAnimationFrame(() => {
      to.classList.add('pdeck-has-entered');
      if (from && from !== to) from.classList.add('pdeck-has-left');
      frameRef.current = null;
    });

    if (next === 6) {
      const valueNode = to.querySelector<HTMLElement>('[data-layer="ai.metric.events"] .pdeck-value');

      if (valueNode) {
        valueNode.innerHTML = `${formatEventsValue(0, language)} <span>+</span>`;

        counterTimerRef.current = window.setTimeout(() => {
          const startedAt = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / counterDurationMs, 1);
            const value = Math.round(easeOutQuad(progress) * 2000);
            valueNode.innerHTML = `${formatEventsValue(value, language)} <span>+</span>`;

            if (progress < 1) {
              counterFrameRef.current = window.requestAnimationFrame(tick);
              return;
            }

            counterFrameRef.current = null;
          };

          counterTimerRef.current = null;
          counterFrameRef.current = window.requestAnimationFrame(tick);
        }, counterHoldMs);
      }
    }

    transitionTimerRef.current = window.setTimeout(() => {
      to.classList.remove('pdeck-is-entering', 'pdeck-has-entered');
      if (from && from !== to) {
        from.classList.remove('pdeck-is-leaving', 'pdeck-has-left');
      }
      transitionTimerRef.current = null;
    }, slideTransitionMs);

    previousSlideRef.current = next;

    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (counterFrameRef.current !== null) {
        window.cancelAnimationFrame(counterFrameRef.current);
        counterFrameRef.current = null;
      }

      if (counterTimerRef.current !== null) {
        window.clearTimeout(counterTimerRef.current);
        counterTimerRef.current = null;
      }
    };
  }, [block.slideNumber, language]);

  return (
    <div
      className="presentation-screen"
      ref={rootRef}
    />
  );
}
