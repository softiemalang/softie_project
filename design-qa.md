# Interpretation Prep Design QA

- source visual truth: user-provided moodboard images in `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/3B824DAF-1A4B-4B9A-A8A4-603093187595/` (`1-사진-1.jpg` through `10-사진-10.jpg`)
- implementation: `http://127.0.0.1:5173/interpretation-prep`
- implementation screenshot: `/tmp/interpretation-prep-design-qa/implementation-1280.png`
- mobile screenshot: `/tmp/interpretation-prep-design-qa/mobile-390.png`
- result screenshot: `/tmp/interpretation-prep-design-qa/result-features-1280.png`
- full-view comparison evidence: `/tmp/interpretation-prep-design-qa/comparison-board.jpg`
- focused comparison evidence: `/tmp/interpretation-prep-design-qa/focused-comparison.jpg`
- viewports: `1280x720` desktop and `390x844` mobile
- states: saved realistic birth input, pre-calculation, calculated Saju result, and `주요 특징` result tab

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the system sans face, compact uppercase kickers, one-line hero title, and restrained body hierarchy preserve the editorial tone while keeping Korean calculation copy readable.
- Spacing and layout rhythm: the desktop hero and two-column workspace use generous outer spacing; the mobile layout stacks without horizontal overflow or clipped primary actions.
- Colors and visual tokens: the generated dawn landscape provides the pastel haze, while translucent charcoal surfaces, pearl-lavender accents, and thin light borders reproduce the selected liquid-glass direction without losing contrast.
- Image quality and asset fidelity: `prep-atmosphere.jpg` is a real generated photographic asset, correctly cropped as an edge-to-edge background. No CSS illustration, placeholder, or synthetic UI artwork replaces the visible atmosphere.
- Copy and content: all existing Korean labels, calculation statuses, warnings, and result content are preserved.
- Interaction and accessibility: calculation, result generation, and `원자료`/`주요 특징` switching work. Visible focus treatment, text-backed status badges, minimum control height, reduced-motion handling, and mobile overflow were checked.
- Browser console: no errors during the calculation and result-tab flow.

## Comparison history

- Iteration 1: the approved pastel-haze and selective-glass refinement was compared against the moodboard as a combined board. No P0/P1/P2 mismatch was found, so no blocking visual correction loop was required.

## Open questions

- The moodboard is a style collection rather than a pixel-identical screen, so fidelity is evaluated against its shared art direction instead of exact component coordinates.
- Long-form result content deliberately uses more opaque nested surfaces than the atmospheric examples to preserve reading contrast.

## Implementation checklist

- [x] Real atmospheric image asset is present and scoped to the feature.
- [x] Primary glass, operational surfaces, selected states, and semantic states remain distinguishable.
- [x] Desktop and mobile layouts avoid horizontal overflow.
- [x] Core calculation and result tabs are functional.
- [x] Design guidance is recorded in `DESIGN.md`.

## Follow-up polish

- P3: consider a subtle background-position adjustment after reviewing on a physical phone with browser chrome visible.

## Home Page Design QA

- source visual truth: user-provided moodboard images in `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/3B824DAF-1A4B-4B9A-A8A4-603093187595/`, with `4-사진-4.jpg`, `5-사진-5.jpg`, `7-사진-7.jpg`, and `10-사진-10.jpg` used as the closest editorial/glass references
- implementation: `http://127.0.0.1:5173/`
- implementation screenshot: `/tmp/home-mobile-polish-qa/after-390x844.png`
- full-view comparison evidence: `/tmp/home-mobile-polish-qa/comparison.jpg`
- focused region comparison evidence: the full 390px comparison keeps the hero typography, section spacing, and the first three cards readable at inspection scale, so a separate crop was not needed
- browser-rendered viewport: `390x844` mobile frame
- state: signed-out home, service index, and Kakao memo dialog
- primary interactions tested: open/close `SOFTIE MEMO`; navigate from the home service card to `/interpretation-prep`
- console errors checked: no application errors found; only Vite/React development messages were present

### Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the Korean display heading now uses a smaller mobile scale and steadier line height, while compact uppercase utility labels and descriptions remain legible without truncation. System sans fallbacks remain appropriate for Korean legibility.
- Spacing and layout rhythm: the hero now follows its content height instead of filling most of the viewport. Reduced outer padding, section gaps, card gaps, card height, and internal padding create a consistent one-column rhythm at 390px.
- Colors and visual tokens: muted lavender, dusty rose, smoky charcoal, and pearl text map to the shared Atmospheric Glass tokens. Text remains readable over the photographic background because the hero and service cards use stable dark glass surfaces.
- Image quality and asset fidelity: `src/pages/assets/home-atmosphere.jpg` is a real generated photographic asset with a quiet coastal subject and low-contrast center. It is not replaced by CSS art, gradients, emoji, or placeholder illustration.
- Copy and content: the page retains all eight service labels and descriptions. The redundant `열기` copy and `PRIVATE WORKSPACE` suffix were removed to reduce mobile visual noise.
- Interaction and accessibility: all service entries remain semantic buttons with visible focus treatment and practical tap targets; clicking anywhere in a block navigates to its route or opens the memo flow.
- Responsive behavior: the browser-rendered 390×844 frame has no visible horizontal overflow, clipped copy, or off-screen controls. The first viewport now includes the complete hero, section heading, and multiple service cards.

### Comparison history

- Iteration 1: the home implementation was placed beside the source moodboard in full-view and focused hero comparison boards. No P0/P1/P2 mismatch was found, so no blocking visual correction loop was required.
- Iteration 2: user review identified a P2 mobile density issue: the hero consumed too much height, section spacing was loose, and each service card carried a redundant `열기` affordance. The hero was changed to content height, mobile spacing and typography were tightened, card height/padding/gaps were reduced, and `열기` was removed. The revised 390×844 browser capture was compared with the source moodboard in `/tmp/home-mobile-polish-qa/comparison.jpg`; no actionable P0/P1/P2 issue remains.

### Open questions

- The source is a multi-image art-direction moodboard rather than a pixel-identical home mockup. Fidelity is therefore judged against shared atmosphere, surface treatment, typography scale, and restraint rather than exact coordinates.

### Implementation checklist

- [x] Context-specific photographic atmosphere asset added.
- [x] Shared `ag-*` shell, glass, action, and typography patterns reused.
- [x] Existing service, authentication, memo, and navigation behavior preserved.
- [x] 390×844 mobile browser layout visually compared with source references.
- [x] Build, interaction flow, navigation, and console state verified.
- [x] Home reference implementation recorded in `DESIGN.md`.

### Follow-up polish

- P3: a physical phone check may still be useful for browser-chrome-specific background cropping, but it does not block the responsive layout.

final result: passed
