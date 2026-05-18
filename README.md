# STANDOFF Live Ecosystem

## Экспериментальные флаги

Флаги находятся в `src/screens/PresentationDeckScreen.tsx`.

- `enableCoverIntroExperiment` включает новую вступительную анимацию первого слайда: карта проявляется с подсветкой, затем появляется крупный заголовок и метрики.
- `enableCommunityProductsHighlightExperiment` включает отдельную подсветку трех нижних блоков на втором слайде: `Standoff Hackbase`, `Кибербитва Standoff`, `Standoff Bug Bounty`.
- `enableEcosystemLinkPulseExperiment` усиливает четвертый слайд: центральный узел `STANDOFF 365` пульсирует ярче, без изменения линий и карточек.
- `enableMarketPillHighlightExperiment` усиливает pill-лейблы на третьем слайде: `CISO`, `SECURITY TOOL VENDORS`, `DEVELOPMENT`.

Для быстрого отката конкретного эксперимента нужно поменять значение нужного флага на `false` и пересобрать приложение.
