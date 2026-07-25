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

- source visual truth: user-provided mobile captures in `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/16D02C69-51BB-4CBE-8DD4-3A300ABF4697/`, with `1-사진-1.jpg` and `2-사진-2.jpg` documenting the overly tight starting density
- implementation: `http://127.0.0.1:5173/`
- implementation screenshot: `/tmp/softie-home-mobile-spacing-final-verified.png`
- full-view comparison evidence: `/tmp/softie-home-spacing-comparison.jpg`
- focused region comparison evidence: a separate crop was not needed because the combined 390px comparison keeps the header, outer gutter, card padding, and repeated inter-card spacing readable at inspection scale
- browser-rendered viewport: `390x844` mobile frame
- state: signed-out home and complete eight-card service index
- primary interactions tested: navigate from the `SCHEDULER` service card to `/scheduler`, then return to `/`
- console errors checked: no application errors found

### Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: existing uppercase hierarchy and Korean descriptions are preserved. The compact mobile hero labels were fractionally reduced to keep the one-line header relationship clear without truncation.
- Spacing and layout rhythm: the mobile outer gutter increased from 12px to 20px, repeated card gaps increased from about 11px to 17px, and hero/card/footer padding increased together. Browser measurement confirms 350px cards inside the 390px viewport, a 25px visual gap between `8 TOOLS` and the login control, and zero horizontal overflow.
- Colors and visual tokens: muted lavender, dusty rose, smoky charcoal, and pearl text map to the shared Atmospheric Glass tokens. Text remains readable over the photographic background because the hero and service cards use stable dark glass surfaces.
- Image quality and asset fidelity: `src/pages/assets/home-atmosphere.jpg` is a real generated photographic asset with a quiet coastal subject and low-contrast center. It is not replaced by CSS art, gradients, emoji, or placeholder illustration.
- Copy and content: the page retains all eight service labels and descriptions. The redundant `열기` copy and `PRIVATE WORKSPACE` suffix were removed to reduce mobile visual noise.
- Interaction and accessibility: all service entries remain semantic buttons with visible focus treatment and practical tap targets; clicking anywhere in a block navigates to its route or opens the memo flow.
- Responsive behavior: the browser-rendered 390×844 frame has no horizontal overflow, clipped copy, or off-screen controls. The longer page height is an intentional result of restoring breathing room between repeated cards.

### Comparison history

- Iteration 1: the home implementation was placed beside the source moodboard in full-view and focused hero comparison boards. No P0/P1/P2 mismatch was found, so no blocking visual correction loop was required.
- Iteration 2: user review identified a P2 mobile density issue: the hero consumed too much height, section spacing was loose, and each service card carried a redundant `열기` affordance. The hero was changed to content height, mobile spacing and typography were tightened, card height/padding/gaps were reduced, and `열기` was removed. The revised 390×844 browser capture was compared with the source moodboard in `/tmp/home-mobile-polish-qa/comparison.jpg`; no actionable P0/P1/P2 issue remains.
- Iteration 3: user review identified the opposite P2 at the refined density: the mobile gutter and repeated card spacing felt too compressed. The gutter, section rhythm, card gaps, internal padding, and footer entry spacing were expanded. A first browser pass exposed insufficient optical separation in the one-line header, so the mobile label tracking and login padding were tuned without changing its structure. The post-fix capture in `/tmp/softie-home-mobile-spacing-final-verified.png` measures 20px outer gutters, 17px card gaps, and no overflow; no actionable P0/P1/P2 issue remains.

### Open questions

- The source is a multi-image art-direction moodboard rather than a pixel-identical home mockup. Fidelity is therefore judged against shared atmosphere, surface treatment, typography scale, and restraint rather than exact coordinates.

### Implementation checklist

- [x] Context-specific photographic atmosphere asset added.
- [x] Shared `ag-*` shell, glass, action, and typography patterns reused.
- [x] Existing service, authentication, memo, and navigation behavior preserved.
- [x] 390×844 mobile browser layout visually compared with source references.
- [x] Mobile gutter, repeated card gap, header separation, and horizontal overflow measured in-browser.
- [x] Build, interaction flow, navigation, and console state verified.
- [x] Home reference implementation recorded in `DESIGN.md`.

### Follow-up polish

- P3: a physical phone check may still be useful for browser-chrome-specific background cropping, but it does not block the responsive layout.

## Scheduler Design QA

- source visual truth: `DESIGN.md`, the user-provided Atmospheric Glass moodboard in `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/3B824DAF-1A4B-4B9A-A8A4-603093187595/`, the warm nostalgic photography moodboards in `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/50182D30-2350-4FA0-9B31-8F803111422E/` and `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/20EC7B92-6722-4D50-9326-86360FBCF177/`, and the pre-change browser captures `/tmp/scheduler-redesign-audit/01-top-before.png`, `/tmp/scheduler-redesign-audit/02-events-before.png`, and `/tmp/scheduler-redesign-audit/03-create-before.png`
- implementation: `http://127.0.0.1:5173/scheduler?date=2026-07-22`
- implementation screenshots: `/tmp/scheduler-atmosphere-v2-qa/01-mobile-today.png`, `/tmp/scheduler-atmosphere-v2-qa/02-mobile-editor.png`, `/tmp/scheduler-atmosphere-v2-qa/03-mobile-modal.png`, `/tmp/scheduler-atmosphere-v2-qa/04-tablet.png`, and `/tmp/scheduler-atmosphere-v2-qa/05-desktop.png`
- full-view comparison evidence: `/tmp/scheduler-atmosphere-v2-qa/06-source-implementation-comparison.jpg`
- focused region comparison evidence: `/tmp/scheduler-redesign-audit/05-top-loaded-after.png` for primary/secondary surface hierarchy and `/tmp/scheduler-redesign-audit/07-create-after.png` for form controls and selected state
- responsive evidence: `/tmp/scheduler-redesign-audit/09-tablet-after.png` and `/tmp/scheduler-redesign-audit/10-desktop-after.png`
- viewports: `390x844`, `768x1024`, and `1280x900`
- states: signed-in today view with events, event-list scroll region, view-range modal, and reservation creation form
- primary interactions tested: open reservation creation, return to today, open the view-range modal, and close the modal
- console errors checked: no application errors found

### Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the existing Korean system stack and scheduler information hierarchy remain unchanged; stronger pearl text, restrained labels, and tabular time values improve scanning without changing copy or wrapping.
- Spacing and layout rhythm: primary glass cards, lighter operational sections, and compact event surfaces now use distinct radii and elevation. Mobile outer gutters remain practical, repeated cards retain clear separation, and all tested widths avoid horizontal overflow.
- Colors and visual tokens: the existing photograph is color-graded through scheduler-scoped tokens into deep olive-charcoal, aged cream, taupe, muted sage, and restrained wine red. Primary actions use warm parchment rather than lavender, while translucent green/stone/red event tints preserve semantic state meaning.
- Image quality and asset fidelity: the existing real photographic `src/pages/assets/home-atmosphere.jpg` is reused as a quiet scheduler backdrop with a soft-light olive/sepia treatment; no CSS art, placeholder, emoji, or improvised icon replaces a visible source asset.
- Copy and content: scheduler labels, dates, event metadata, connection status, and action wording are preserved.
- Interaction and accessibility: visible buttons are at least 44px high in the tested mobile states, focus treatment remains visible, modal controls remain reachable, and no horizontal clipping was found at 390px, 768px, or 1280px.

### Comparison history

- Iteration 1: the first styled mobile pass matched the shared atmosphere and surface hierarchy, but browser measurement found 28–30px utility controls and the repeated event `완료` action visually competing with the floating add action. These were recorded as P2 density and hierarchy issues.
- Iteration 2: summary, worklog, push, modal, and event utility controls were raised to a 44px touch target; repeated event actions were softened to selected-glass/outline treatments while the floating add and form-submit actions retained the lavender primary role. The post-fix evidence in `/tmp/scheduler-design-audit/05-today-top-stable.png`, `/tmp/scheduler-design-audit/08-today-events-final.png`, and `/tmp/scheduler-design-audit/07-filter-modal-after.png` has no remaining actionable P0/P1/P2 finding.
- Iteration 3: the final shell was checked at 768px and 1280px. Both measurements reported `scrollWidth === clientWidth`, and the centered operational column retained its hierarchy without stretched controls or clipped content.
- Iteration 4: user review found the 44px event actions visually heavy. Each action now keeps a 44px outer touch target while rendering a 36px inner capsule. Browser measurement at 390px confirmed 44px outer heights, 36px visible heights, a 6px non-overlapping gap, and no horizontal overflow; post-fix evidence is `/tmp/scheduler-design-audit/11-compact-actions.png`.
- Iteration 5: user review requested denser event rows. Mobile event-card height was reduced from 113px to 99px and the list gap from 12.8px to 9.6px by tightening only card padding and internal rhythm. The 44px action targets, 6px action separation, readable metadata, and zero horizontal overflow were preserved; post-fix evidence is `/tmp/scheduler-design-audit/12-compact-cards.png`.
- Iteration 6: user review found the 36px visible action capsules oversized beside 24px status badges. The action visuals were reduced to 30px while retaining 44px outer targets, a 6px non-overlapping gap, 99px cards, and zero horizontal overflow. Post-fix evidence is `/tmp/scheduler-design-audit/13-balanced-actions.png`.
- Iteration 7: user review found excess visual separation between customer names and the compact actions. The 30px capsules were optically lifted 3px inside their unchanged 44px touch targets. Browser measurement confirmed 99px cards, 44px targets, 30px visuals, and zero horizontal overflow; post-fix evidence is `/tmp/scheduler-design-audit/14-lifted-actions.png`.
- Iteration 8: lifting the compact actions exposed a vertical mismatch with status and tag badges. The event metadata group — including `대기`, `인원+`, `인이어`, `MTR`, and `기타` — was lifted by the same 3px. Browser measurement confirmed a 0px center delta between the status badge and action capsule while preserving 44px targets, 99px cards, and zero horizontal overflow; post-fix evidence is `/tmp/scheduler-design-audit/15-aligned-meta-actions.png`.
- Iteration 9: user review found the lower optical whitespace heavier despite near-equal geometric spacing. Mobile card bottom padding was reduced by about 2px without moving the content rows. Browser measurement confirmed 96.88px cards, 15.8px visible lower spacing, the 44px target fully inside the card with 5.8px remaining inset, and zero horizontal overflow; post-fix evidence is `/tmp/scheduler-design-audit/16-optical-bottom-padding.png`.
- Iteration 10: the optical adjustment was normalized to the same 3px offset used for the lifted action and metadata visuals. Browser measurement confirmed 95.8px cards, 14.72px visible lower spacing, the 44px target fully inside the card with 4.72px remaining inset, and zero horizontal overflow; post-fix evidence is `/tmp/scheduler-design-audit/17-three-pixel-bottom-balance.png`.
- Iteration 11: user review found the topbar and summary utility controls visually heavy. `로그아웃`, `연동됨`, `동기화`, `변경`, and `보기` now use 30px inner capsules inside transparent 44px targets. Browser measurement confirmed 44px outer heights, 30px visuals, transparent outer surfaces, and zero horizontal overflow; post-fix evidence is `/tmp/scheduler-design-audit/18-compact-utility-controls.png`.
- Iteration 12: user review found the first scheduler restyle too close to the original because every panel used the same strong charcoal glass. The overlay opacity was reduced, full blur/shadow was limited to the account, operation summary, and editor hierarchy, secondary cards were moved to lighter glass, event sections became low-elevation operational surfaces, and event state fills became more translucent. The moodboard and both revised mobile states were inspected together in `/tmp/scheduler-redesign-audit/08-reference-comparison.png`; the tablet and desktop captures preserve the centered utility column with `scrollWidth === clientWidth`. No actionable P0/P1/P2 mismatch remains.
- Iteration 13: the user supplied a warmer photographic direction built from deep olive shadows, aged cream, taupe, muted sage, and restrained wine red. The scheduler-only tokens and literal event-state surfaces were retuned without changing layout or business logic. The source moodboard and browser-rendered today, editor, modal, and desktop states were inspected together in `/tmp/scheduler-warm-nostalgic-qa/06-source-implementation-comparison.jpg`. Mobile evidence is `/tmp/scheduler-warm-nostalgic-qa/01-today-mobile.png` (390×844), `/tmp/scheduler-warm-nostalgic-qa/02-editor-mobile.png` (390×1273 full page), and `/tmp/scheduler-warm-nostalgic-qa/03-filter-mobile.png` (390×844); responsive evidence is `/tmp/scheduler-warm-nostalgic-qa/04-today-tablet.png` (768×1024) and `/tmp/scheduler-warm-nostalgic-qa/05-today-desktop.png` (1280×900). Captures used 1× CSS-pixel density. At all three viewport widths `scrollWidth === clientWidth`; branch-to-room selection, modal open/close, and route navigation worked; browser logs contained no application errors. No actionable P0/P1/P2 mismatch remains.
- Iteration 14: after user approval, the warm nostalgic scheduler palette was promoted from route-local overrides to the shared Atmospheric Glass defaults in `src/styles.css` and documented as `DESIGN.md` version `2.1.0`. The scheduler capture `/tmp/scheduler-warm-nostalgic-qa/07-default-token-scheduler.png` and home capture `/tmp/scheduler-warm-nostalgic-qa/08-default-token-home.png` confirm both routes resolve `--ag-brand: #d5c5aa` and `--ag-surface-glass: rgba(45, 41, 34, 0.66)` at 390×844 with `scrollWidth === clientWidth`. Browser logs contained no application errors, and the scheduler retained the approved appearance after removing duplicated local color tokens. No actionable P0/P1/P2 mismatch remains.
- Iteration 15: the supplied Liquid Glass reference `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/06244D25-0840-4211-99FC-530F9167C142/1-사진-1.jpg` was translated into an optional Warm Liquid Glass variant rather than copied as a literal login screen. The first modal pass was recorded as P2 because its dark backdrop hid too much of the atmospheric photograph; the backdrop and strong-surface opacity were reduced, then the source and post-fix scheduler states were inspected together in `/tmp/scheduler-liquid-glass-qa/08-source-implementation-comparison.jpg`. Final mobile evidence is `/tmp/scheduler-liquid-glass-qa/02-today-loaded.png`, `/tmp/scheduler-liquid-glass-qa/03-editor.png`, and `/tmp/scheduler-liquid-glass-qa/05-filter-modal-refined.png`; responsive evidence is `/tmp/scheduler-liquid-glass-qa/06-tablet.png` and `/tmp/scheduler-liquid-glass-qa/07-desktop.png`. At 390px, 768px, and 1280px, `scrollWidth === clientWidth`; branch-to-room selection exposed V/S/Q/C/D correctly, and browser logs contained no application errors. The stronger treatment is limited to the account card, operation summary, reservation editor, and modal surfaces, while dense event rows keep their more opaque operational surface. No actionable P0/P1/P2 mismatch remains.
- Iteration 16: six new user references established a quieter analog background direction built from olive-charcoal shadow, taupe upholstery, aged cream light, personal objects, and visible film grain. A new original scheduler-only asset, `src/scheduler/assets/scheduler-atmosphere-v2.jpg`, was generated from those style cues. The first implementation pass was recorded as P2 because applying the portrait image to the full 2353px page stretched its cover crop and left the initial mobile viewport as a nearly featureless dark wall. The image layer was moved to a fixed full-viewport pseudo-element, the mobile crop was shifted toward the right-side sofa, and the overlay/liquid opacity were tuned so the photograph participates without reducing text contrast. The post-fix source, generated asset, 390×844 implementation, and 1280×900 implementation were inspected together in `/tmp/scheduler-atmosphere-v2-qa/06-source-implementation-comparison.jpg`. Editor and modal evidence confirm the same contrast hierarchy; branch-to-room selection exposed V/S/Q/C/D, modal open/close worked, browser logs contained no application errors, and 390px, 768px, and 1280px all reported `scrollWidth === clientWidth`. No actionable P0/P1/P2 mismatch remains.
- Iteration 17: user review identified a P3 character-proportion issue in the generated background: the teddy bear's small, low-set face and high headphone band made its forehead appear unusually tall. The asset was edited non-destructively as `src/scheduler/assets/scheduler-atmosphere-v3.jpg`, with a rounder, slightly shorter head, upward-adjusted facial features, and a lower headphone fit; the previous v2 asset remains available as the before state. The side-by-side asset and browser implementation were inspected in `/tmp/scheduler-teddy-proportion-qa/03-before-after-comparison.jpg`, with mobile and desktop captures in `/tmp/scheduler-teddy-proportion-qa/01-mobile.png` and `/tmp/scheduler-teddy-proportion-qa/02-desktop.png`. The room composition, palette, UI crop, card contrast, and 390px horizontal fit remain intact. No actionable P0/P1/P2 mismatch remains.

### Open questions

- Home, interpretation preparation, and scheduler now share the approved generated atmosphere asset; their overlay and surface opacity remain route-specific to preserve each screen's information density.
- The supplied photography is used as palette and art-direction evidence only; it is not embedded in the product because reuse rights were not established.
- Data-mutating actions such as creating, completing, or editing a real reservation were intentionally not submitted during visual QA.

### Implementation checklist

- [x] Original scheduler-specific photographic asset generated and stored in the project; supplied references are not embedded.
- [x] Fixed viewport image layer preserves the intended crop across the long mobile scheduler page.
- [x] Existing scheduler data and action logic preserved.
- [x] Shared `ag-*` shell and Atmospheric Glass tokens reused.
- [x] Signed-in, loading, and signed-out shells receive the same scoped theme.
- [x] Event states, form selections, modal controls, and primary actions remain distinguishable.
- [x] Mobile touch targets and 390px horizontal overflow measured in-browser.
- [x] Tablet and desktop overflow checked at 768px and 1280px.
- [x] Selective Glass hierarchy visually compared with the user moodboard in one combined board.
- [x] Scheduler reference implementation recorded in `DESIGN.md`.
- [x] Warm Liquid Glass recorded as an optional shared variant and applied selectively to low-density scheduler surfaces.

### Follow-up polish

- P3: confirm safe-area spacing and backdrop crop once on the installed iPhone PWA, where Safari chrome and standalone mode can alter the visible viewport height.

## Shared Atmosphere Rollout QA

- source visual truth: `src/scheduler/assets/scheduler-atmosphere-v4.jpg`, informed by the user-provided warm nostalgic photography in `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/20EC7B92-6722-4D50-9326-86360FBCF177/`
- implementations: `http://127.0.0.1:5173/` and `http://127.0.0.1:5173/interpretation-prep`
- implementation screenshots: `/private/tmp/softie-scheduler-v4-mobile.png`, `/private/tmp/softie-home-v4-mobile-390.png`, and `/private/tmp/softie-prep-v4-mobile-390.png`
- full-view comparison evidence: `/private/tmp/softie-teddy-gaze-v4-comparison.jpg`
- focused comparison evidence: a separate crop was not needed because the combined 1190×884 board preserves the source crop and both 390×844 implementations at readable 1× scale
- source pixels: `941×1672`; normalized source crop: `390×844` at 1× density
- implementation CSS viewports and pixels: `390×844` mobile and `1280×720` desktop at 1× density
- states: signed-in home service index and saved-input interpretation preparation form
- primary interaction tested: selecting the full `INTERPRETATION PREP` home card navigates to `/interpretation-prep`
- console errors checked: no application errors; only Vite connection and React development informational messages were present

### Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the existing system-sans hierarchy, Korean copy, uppercase kickers, line height, and wrapping remain unchanged against the new atmosphere.
- Spacing and layout rhythm: the shared fixed viewport layer does not change page geometry. Both 390px routes report `scrollWidth === clientWidth`, and desktop layouts remain centered at 1280px.
- Colors and visual tokens: olive-charcoal shadow, cocoa/taupe midtones, aged-cream text, and smoked-glass surfaces now read consistently across all three redesigned reference routes. Home and interpretation use a slightly stronger `0.28` overlay than the denser scheduler.
- Image quality and asset fidelity: the approved real photographic asset remains sharp at both test widths, uses a consistent right-biased mobile crop, and is not stretched to long document height. No CSS artwork, placeholder, or user-supplied photograph is substituted.
- Copy and content: all route copy, account state, input labels, values, status badges, and tool descriptions are preserved.
- Interaction and accessibility: existing card navigation, visible controls, focus styling, and form contrast remain intact. The fixed image layer is non-interactive and does not intercept pointer events.

### Comparison history

- Iteration 18: user approved the scheduler's corrected warm nostalgic atmosphere for additional pages. The home and interpretation-prep shells were moved to the same `scheduler-atmosphere-v3.jpg` asset and the fixed viewport image layer was shared across the three reference routes. The source crop and both mobile implementations were inspected together in `/private/tmp/softie-atmosphere-mobile-comparison.jpg`; desktop captures confirmed the same crop and contrast hierarchy. No blocking visual correction was required after the first rendered comparison.
- Iteration 19: user review found the teddy's direct frontal gaze more visually dominant than intended. The asset was edited non-destructively as `src/scheduler/assets/scheduler-atmosphere-v4.jpg`: the corrected compact head and low headphone fit remain intact, while the face now turns subtly toward image-left with a slightly lowered gaze. The previous v3 asset remains available for recovery and comparison. `/private/tmp/softie-teddy-gaze-v4-comparison.jpg` confirms that the teddy reads as a quieter secondary prop, and all three reference routes resolve the v4 asset at 390×844 with `scrollWidth === clientWidth`.

### Implementation checklist

- [x] Home and interpretation-prep use the approved shared atmosphere asset.
- [x] Fixed viewport image layer prevents distortion on long pages.
- [x] Route-specific overlays preserve text and form contrast.
- [x] Mobile and desktop captures were inspected for both updated routes.
- [x] Home-to-interpretation navigation works and no application console errors were found.
- [x] Shared default and phased legacy adoption are documented in `DESIGN.md`.

### Follow-up polish

- P3: verify the background crop once in installed iPhone standalone mode; safe-area height may expose a few additional pixels compared with the 390×844 browser viewport.

## Real-device iPhone Card Spacing QA

- source visual truth: `/private/tmp/scheduler-iphone-spacing-audit/01-top.jpg` and `/private/tmp/scheduler-iphone-spacing-audit/02-events.jpg`, copied without modification from the user's iPhone captures
- implementation screenshots: `/private/tmp/scheduler-iphone-spacing-audit/08-local-top-final.png` and `/private/tmp/scheduler-iphone-spacing-audit/09-local-events-final.png`
- full-view comparison evidence: `/private/tmp/scheduler-iphone-spacing-audit/10-full-comparison.jpg`
- focused comparison evidence: `/private/tmp/scheduler-iphone-spacing-audit/11-event-detail-comparison.jpg`
- source pixels: `588×1280` including iPhone browser chrome; normalized to a `390×844` comparison panel for visual review
- implementation viewport and pixels: `390×844` at 1× CSS-pixel density; desktop regression check at `1280×900`
- state: signed-in scheduler today view with loaded event cards
- primary interaction tested: the compact mobile add control retains the accessible name `새 일정 추가` and navigates to `/scheduler/new?date=2026-07-22`

### Findings

- P2 resolved: the original pill-shaped fixed add control visibly covered the `예약 수정` control during normal iPhone scrolling. On mobile it now renders as a `44×44px` circular `+` target at the outer-right gutter; the descriptive `일정 추가` label remains visible on wider screens.
- Spacing and layout rhythm: no event-card padding correction was necessary. Browser measurement confirmed the `대기` metadata and `완료` visual centers are identical, the section title and count pill share the same center line, and the existing 95.8px card rhythm remains internally balanced.
- Responsive fit: the final mobile add control starts 2.19px beyond the event action content edge, so it no longer covers `예약 수정`; `scrollWidth === clientWidth` at both 390px and 1280px.
- Fonts and typography: text family, sizes, weights, wrapping, and event metadata hierarchy remain unchanged.
- Colors and visual tokens: card surfaces, semantic event colors, borders, and atmospheric background remain unchanged.
- Image quality and asset fidelity: the approved v4 background asset and crop remain unchanged.
- Copy and content: the desktop label remains `일정 추가`; mobile uses the visible `+` with the full accessible label preserved on the button.

### Comparison history

- Iteration 20: the supplied iPhone screenshots exposed a real overlap between the persistent add control and event-card actions. The first compact-circle pass still inherited the scheduler theme's 20px right offset and overlapped the action content by about 9px. The final mobile override moves the 44px control to an 8px right inset, producing 2.19px clearance from the action content while retaining the desktop pill. Post-fix evidence is `/private/tmp/scheduler-iphone-spacing-audit/10-full-comparison.jpg` and `/private/tmp/scheduler-iphone-spacing-audit/11-event-detail-comparison.jpg`. No actionable P0/P1/P2 finding remains.
- Iteration 21: user review found the signed-in account card taller than its single-line content required. Vertical padding was reduced from 15.2px to 6.4px, lowering the card from 76.38px to 58.78px while preserving both 44px button targets, the email ellipsis behavior, the 11.19px gap to the notification card, and zero horizontal overflow at 390px. Focused evidence is `/private/tmp/scheduler-iphone-spacing-audit/14-auth-height-comparison.jpg`. No actionable P0/P1/P2 finding remains.

### Follow-up polish

- P3: confirm the 8px outer-right inset once in the installed iPhone PWA; the control already accounts for `safe-area-inset-right`, but standalone-mode browser chrome cannot be reproduced exactly in the local viewport.

## Compact Account And Notification Status QA

- source visual truth: `/tmp/codex-remote-attachments/019f8062-9b38-7640-ba78-3d604c8a3892/72CC5F0E-0194-4C2F-8188-FA80FCC12834/1-사진-1.jpg`
- implementation screenshots: `/private/tmp/scheduler-status-dock-mobile.png`, `/private/tmp/scheduler-account-modal-mobile.png`, and `/private/tmp/scheduler-alert-modal-mobile.png`
- full-view comparison evidence: `/private/tmp/scheduler-status-full-comparison.jpg`
- focused comparison evidence: `/private/tmp/scheduler-status-focused-comparison.jpg`
- source pixels: `1206×802`; source header is a real-use capture of the prior account, notification, and operating-time cards
- implementation viewport and pixels: `390×844` CSS px at 1× density
- state: signed-in scheduler today view; Google linked; this local browser reports notification permission blocked, so the implementation correctly renders the real `권한 차단` state instead of the source capture's `연결됨` state
- primary interactions tested: account status opens its detail modal; notification status opens the existing notification modal; the logout action raises a confirmation dialog before changing session state
- console errors checked: zero application errors in the final browser-rendered page

### Findings

- P2 resolved: persistent account email, logout, and notification cards consumed the entire top region even though they are normally status-only information. They are now two `48px` status controls in one row, and the operating-time card begins at `80px` in the `390px` viewport.
- Fonts and typography: the compact controls preserve the scheduler system font and use a restrained `0.78rem` label / `0.74rem` state hierarchy. Detail copy, email truncation, and modal actions remain readable without wrapping or clipping.
- Spacing and layout rhythm: both controls measure about `173×48px`, share the same top and baseline, and retain a `44px+` touch target. The page reports `scrollWidth === clientWidth` with no horizontal overflow.
- Colors and visual tokens: the status dock reuses the approved charcoal glass, aged-cream text, green ready state, and amber attention state. It introduces no unrelated palette or elevation token.
- Image quality and asset fidelity: the approved v4 atmospheric photograph and crop remain unchanged. No new raster, icon, SVG, or placeholder asset was introduced.
- Copy and content: the persistent surface now contains only `계정` plus its live state and `알림` plus its live state. Email, Google connection detail, Drive backup, reconnection, logout, test notification, and browser reconnection remain available inside the appropriate modal.
- Interaction and accessibility: both status controls have explicit accessible names that include their live state and the detail-opening action. The account modal is a labeled modal dialog, and logout retains a confirmation step.

### Comparison history

- Iteration 22: user review identified the signed-in account and notification cards as low-frequency controls that displaced daily operating information. The first implementation consolidates them into a single two-column status dock. The combined full and focused comparisons show the intended density reduction while preserving the existing glass language. Browser measurement and interaction checks found no actionable P0/P1/P2 issue after implementation.

### Implementation checklist

- [x] Replace the two persistent setup cards with a one-row status dock.
- [x] Keep live ready, checking, error, denied, and setup-required states visible.
- [x] Move email, Google connection, Drive backup, reconnect, and logout into the account modal.
- [x] Preserve the existing notification diagnostic and reconnection modal.
- [x] Preserve logout confirmation before session mutation.
- [x] Verify both modal entry points, responsive fit, and browser console state.

### Follow-up polish

- P3: confirm the compact row once in the installed iPhone standalone PWA; the local `390×844` viewport covers the target width, but native safe-area chrome can slightly change its top offset.

final result: passed

## Interpretation Prep Scheduler Surface Alignment QA

- source visual truth: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/10-scheduler-reference-1280.png`
- implementation: `http://127.0.0.1:5173/interpretation-prep`
- implementation screenshots: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/13-prep-after-scheduler-alignment-final-1280.png` and `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/14-prep-scheduler-alignment-mobile-390.png`
- full-view comparison evidence: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/15-scheduler-reference-vs-prep-final.png`
- focused region comparison evidence: a separate crop was not needed because the combined `2560×900` board keeps both `1280×900` top regions, navigation surfaces, form controls, status rows, typography, and borders readable at original density
- source and implementation dimensions: `1280×900` pixels at a `1280×900` CSS viewport and 1× density; mobile implementation `390×844` pixels at a `390×844` CSS viewport and 1× density
- states: authenticated scheduler today view with loaded event rows; interpretation preparation saved-input view with calculation details collapsed
- primary checks: both routes rendered with live data/state, the interpretation form remained interactive, desktop and mobile horizontal fit were measured, and browser error logs were checked

### Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the interpretation page keeps its editorial hero and evidence-specific copy, while the narrower line lengths, compact section rhythm, and restrained supporting text now match the scheduler's operational reading density.
- Spacing and layout rhythm: the interpretation content column now uses the scheduler's `860px` shell width. Section gaps, card padding, hero spacing, and handoff spacing were tightened without collapsing the two-column desktop form or the stacked mobile flow.
- Colors and visual tokens: primary cards now use `surface-scheduler-default`, selected controls use `surface-scheduler-selected`, and borders use `line-soft`. Strong blur and highlight treatments were replaced with the scheduler's lower-elevation `10px / 106%` material treatment.
- Image quality and asset fidelity: both routes continue to use the approved `scheduler-atmosphere-v4.jpg` asset with no generated replacement, CSS illustration, placeholder, or altered crop.
- Copy and content: interpretation labels, support-state wording, uncertainty boundaries, input values, and calculation controls are unchanged.
- Responsive and accessibility checks: desktop measures `860px` for the shell and stage navigation with no horizontal overflow. Mobile reports `scrollWidth 375px` inside the `390px` viewport, a `44px` select control, and no clipped primary content. Browser error logs contain zero errors.

### Comparison history

- Iteration 1: the source comparison identified a P2 material and density mismatch. Interpretation Prep used a `1180px` shell, strong `24–28px` blur, brighter borders, a larger hero, and deeper shadows, while the scheduler used a centered `860px` operational column and quieter low-elevation surfaces. The shell, surface tokens, blur, shadow, spacing, and selected states were aligned.
- Iteration 2: the first post-fix capture exposed a P2 width mismatch because the sticky stage navigation still expanded to the full page width. It was constrained to the same `860px` column, then recaptured at the identical viewport.
- Post-fix evidence: the final combined board shows matching column scale, low-opacity olive-charcoal surfaces, thin warm borders, compact vertical rhythm, and background participation. The interpretation page intentionally retains its hero and two-column form because those support a different task without changing the shared material language.

### Implementation checklist

- [x] Reuse scheduler surface and selected-state tokens.
- [x] Match the scheduler's centered `860px` operational column.
- [x] Reduce glass blur, border brightness, elevation, and repeated gaps.
- [x] Preserve interpretation-specific content hierarchy and business logic.
- [x] Verify desktop and mobile renderings with no horizontal overflow.
- [x] Check browser error logs and production build.

### Follow-up polish

- P3: confirm surface opacity once in the installed iPhone PWA, where Safari backdrop compositing can render slightly lighter than the local in-app browser.

final result: passed

## Interpretation Prep Scheduler Form Rhythm QA

- reference: scheduler new-reservation form (`/private/tmp/scheduler-warm-nostalgic-qa/02-editor-mobile.png`)
- implementation: `src/interpretationPrep/interpretationPrep.css` and `public/interpretation-prep-mobile.css`
- rendered route: `/interpretation-prep` at `http://127.0.0.1:4173/interpretation-prep`
- viewport: `390×844` CSS px
- state: primary input form with advanced details collapsed, then expanded

### Findings

- P2 resolved: primary text/select controls now use the scheduler rhythm (`42px` height, `0.82rem` horizontal padding, full available width).
- Gender choices and the `모름` control use the scheduler chip rhythm (`44px` height, equal two-up widths for gender choices).
- The advanced target-date field and reference-city/environment fields use the same `42px` control height when expanded.
- Measured mobile widths remain bounded (`scrollWidth === clientWidth === 390`); no horizontal overflow or clipped control was observed.

final result: passed

## Interpretation Prep Real-Time Target Date QA

- implementation: `http://127.0.0.1:4173/interpretation-prep`
- implementation screenshot: `/Users/softie/.codex/visualizations/2026/07/24/019f9618-8084-7c03-a518-af09fcce8455/interpretation-prep-text-mask-390.png`
- viewport and pixels: `390×844` CSS px at 1× density
- state: untouched default target date, then focus-and-type, followed by manual target-date edit
- primary interactions tested: target-date focus selects the untouched default, numeric typing replaces it with a formatted date, and a manually edited date remains unchanged on subsequent focus

### Findings

- P2 resolved: an untouched target-date field now refreshes from the current `Asia/Seoul` date when it receives focus, preventing an open page from carrying yesterday's default across midnight.
- User edits are preserved: once the target date is typed or changed manually, later focus does not overwrite it.
- Existing typed-mask formatting and calculation contracts remain unchanged (`YYYY.MM.DD` in the UI, `YYYY-MM-DD` internally).

### Follow-up polish

- P3: validate the midnight rollover behavior on a physical iPhone or a controlled clock test; the local browser verified the focus selection and manual-value preservation paths.

final result: passed

## Interpretation Prep Typed Input Mask QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/959D7D5A-7E51-4CE6-9A89-7F5951DF2492/1-붙여넣은-이미지-1.jpg` and the prior native-input overflow capture
- implementation: `http://127.0.0.1:4173/interpretation-prep`
- implementation screenshot: `/Users/softie/.codex/visualizations/2026/07/24/019f9618-8084-7c03-a518-af09fcce8455/interpretation-prep-text-mask-390.png`
- viewport and pixels: `390×844` CSS px at 1× density
- state: mobile birth input form with typed date, typed time, and typed target date
- focused comparison evidence: three equal-width text fields, centered field edges, and the time-row boundary were inspected in the rendered screen
- primary interactions tested: sequential numeric typing, date/time auto-formatting, calculation with formatted values, invalid-date rejection, and `모름` toggle
- console errors checked: none observed

### Findings

- P1 resolved: native date/time controls were replaced with text inputs using numeric mobile keyboards and visible masks. `19970421` becomes `1997.04.21`, and `1440` becomes `14:40` while the calculation layer continues receiving ISO values (`YYYY-MM-DD`, `HH:mm`).
- Spacing and layout rhythm: birth date, birth time, and target date now share the same text-field geometry. At `390px`, the date fields measure `325.625px`, the time field and `모름` control remain inside the same `325.625px` row, and document overflow remains `0px`.
- Defaults and validation: the target-date draft displays the Korea-timezone current date by default. Incomplete or invalid dates remain visible as drafts but are rejected by the existing calculation validation before computation.
- Interaction and accessibility: labels remain associated through the existing `LabeledField` wrapper, numeric input mode is requested on mobile, the `모름` state still clears and disables the time field, and a valid typed form reaches the existing calculation result.
- Fonts, colors, image treatment, and copy remain unchanged from the approved Softie atmosphere.

### Comparison history

- Iteration 1: native controls were kept after the iOS overflow fix, but the asymmetric time-row silhouette remained visually harder to center. The typed-mask alternative was implemented locally and compared at the same mobile width; all three fields now follow one centered text-field pattern without changing calculation contracts.

### Follow-up polish

- P3: preserve the typed draft through a full page reload if users frequently edit incomplete dates before saving a local draft. The current implementation intentionally keeps only valid ISO values in the calculation state.

final result: passed

## Interpretation Prep iOS Native Input Width QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/1D768D63-A2B6-4BE8-A683-EF5CAC5D4920/1-붙여넣은-이미지-1.jpg`
- implementation: `http://127.0.0.1:4173/interpretation-prep`
- implementation screenshot: `/Users/softie/.codex/visualizations/2026/07/24/019f9618-8084-7c03-a518-af09fcce8455/interpretation-prep-ios-width-fix.png`
- source pixels: `588×1280`; reviewed proportionally against the `390px` CSS-width implementation (`1.508×` source scale), with the source iPhone system chrome treated as out of scope
- implementation viewport and pixels: `390×844` CSS px at 1× density
- state: mobile birth input form, scrolled to the native date/time control group
- full-view comparison evidence: the source and implementation screenshots were opened together in one visual comparison input
- focused comparison evidence: date-input right edges, the time-input/unknown-button boundary, and the form-card right edge were measured directly in the rendered implementation
- primary interaction tested: the `모름` toggle sets `aria-pressed`, disables the time input, and restores the enabled state
- console errors checked: none

### Findings

- P1 resolved: the supplied iPhone capture shows both native date controls extending past the form card and the native time control intruding beneath the fixed-width `모름` button. Native date/time controls now use auto inline sizing and grid stretch instead of the iOS WebKit-sensitive `100%` width plus padding combination.
- Spacing and layout rhythm: at `390px`, both date controls remain within their `325.625px` field width. The time field ends at `281.016px`, the `모름` button begins at `289.813px`, and the intended gap remains visible with `0px` overlap.
- Responsive behavior: `375px`, `390px`, and `430px` checks all report zero document overflow, contained date controls, a contained time-control row, and zero time/button overlap.
- Fonts and typography: labels, values, font sizes, weights, line heights, and native value alignment are unchanged.
- Colors and visual tokens: glass surfaces, borders, radii, opacity, selected states, and focus treatment are unchanged.
- Image quality and asset fidelity: the approved atmospheric background asset and crop are unchanged; no new asset was required.
- Copy and content: all field labels, hints, values, and button copy are unchanged.

### Comparison history

- Iteration 1: the iPhone source exposed a platform-specific P1 overflow that Chromium did not reproduce with the previous `100%` width rule. The date/time rule was changed to auto inline sizing with grid stretch. Post-fix browser measurements at three mobile widths show no overflow or overlap, and the clean `390×844` capture preserves the existing form appearance.

### Follow-up polish

- P3: confirm once on the physical iPhone/PWA runtime because the original defect is specific to iOS WebKit native form controls and cannot be fully emulated by the Chromium-based local browser.

final result: passed

## Scheduler Work-Time Range Hierarchy QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/B36D787E-66DB-4DEA-B776-55A8D4FEF6B3/1-붙여넣은-이미지-1.jpg` and `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/B36D787E-66DB-4DEA-B776-55A8D4FEF6B3/2-붙여넣은-이미지-2.jpg`
- implementation selector: `.scheduler-theme-shell .scheduler-today-page .scheduler-controls .scheduler-filter-summary-copy > strong:not(.scheduler-work-status-title)`
- change: the non-work-time range now uses the same `1rem/600` title hierarchy as `근무 중`; event row times are unchanged
- state: signed-in today view in the source; no authenticated local browser session available for direct capture

### Findings

- P3 resolved: `8:00 - 24:00` no longer dominates the controls card. It now sits at the same quiet title level as `근무 중`, while its date/range supporting copy remains subordinate.
- No event row time, spacing, state color, action label, or data behavior changed.

final result: passed

## Home Scheduler-Default Surface QA

- source visual truth: the approved scheduler reference captures, including `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/F309FE6D-B5F1-49D9-9254-F25DAC29DBE9/1-붙여넣은-이미지-1.jpg`
- implementation screenshots: `/private/tmp/softie-home-default-qa/home-390.png` and `/private/tmp/softie-home-default-qa/home-1280.png`
- viewport and pixels: `390×844` and `1280×900` at 1× CSS density
- state: home service index, signed-out

### Findings

- P3 resolved: the home hero and service cards now use the scheduler's default surface, quiet outer line, short blur, and low inner highlight.
- Hover state uses the scheduler selected surface without changing the default resting cards.
- Softie Memo's focused sheet remains a stronger input surface, so the shared default does not reduce writing contrast.
- Fonts, copy, information order, photo asset, mobile stacking, and desktop two-column layout remain unchanged.
- No home or scheduler behavior/data flow changed.

### Follow-up polish

- P3: validate the home card hover/active optical lift once in a physical pointer device and installed PWA; mobile resting state was captured at `390×844`.

final result: passed

## Scheduler Selected-State Contrast QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/D4D4FED9-061C-49E1-A3AE-526A40A73D7D/1-붙여넣은-이미지-1.jpg`
- implementation evidence: scheduler stylesheet selectors in `src/styles.css`; signed-out browser capture remains `/private/tmp/softie-scheduler-default-qa/scheduler-login-390.png`
- source pixels: `588×1280`; implementation capture: `390×844` CSS px at 1× density
- state: signed-in scheduler editor in the source; signed-out route in the browser, with no local authenticated session available for direct field interaction

### Findings

- P3 resolved: selected scheduler chips, room options, navigation states, and compact filter chips now use a slightly brighter warm selected fill (`rgba(219, 204, 175, 0.28)`) and selected line (`rgba(255, 246, 228, 0.42)`).
- A restrained inner highlight and 1px optical ring improve identification without changing the surrounding atmospheric surface or unselected controls.
- The change is scoped to scheduler selected states; home and other pages remain unchanged.
- Typography, spacing, copy, event-row opacity, and semantic status colors remain unchanged.

### Follow-up polish

- P3: confirm the selected branch, room, duration, and tag states on a signed-in iPhone/PWA capture; direct field interaction was unavailable in this browser session.

final result: passed

## Scheduler Default Surface QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/F309FE6D-B5F1-49D9-9254-F25DAC29DBE9/1-붙여넣은-이미지-1.jpg`
- implementation evidence: existing signed-out scheduler render at `/private/tmp/softie-scheduler-tidy-qa/scheduler-login-390.png`, plus the scoped scheduler selectors in `src/styles.css`
- source pixels: `588×1280`; implementation capture: `390×844` CSS px at 1× density
- state: signed-in today view in the source; signed-out route in the browser, because no authenticated local session was available

### Findings

- P3 resolved: `지금 처리할 일` and `곧 다가오는 일정` are now the scheduler's default surface reference through `--scheduler-surface-default: rgba(18, 18, 14, 0.34)`.
- Applied to the 근무 중 controls, 근무 일지/work-log surface, and scheduler editor card with the same short blur, quiet inner highlight, and shared soft outer border. Event rows, semantic status colors, and control affordances remain differentiated.
- No home or non-scheduler surface changed.
- Fonts, spacing, copy, and image assets remain unchanged from the previously passed scheduler QA.

### Follow-up polish

- P3: verify the signed-in today view and editor route on a physical iPhone/PWA capture to confirm the common surface reads consistently across real event data.

final result: passed

## Scheduler Shared Outer Border QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/C4C7B5AB-0B97-4590-9DD9-A8BBE63CCECE/1-붙여넣은-이미지-1.jpg` and `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/C4C7B5AB-0B97-4590-9DD9-A8BBE63CCECE/2-붙여넣은-이미지-2.jpg`
- implementation screenshot: `/private/tmp/softie-scheduler-border-qa/scheduler-login-390.png`
- focused comparison evidence: the supplied signed-in event and editor captures were compared against the rendered scheduler surface; signed-in browser state was unavailable, so the shared selectors were verified in code and the signed-out login surface was captured
- source pixels: `588×1280` and `588×1280`; implementation pixels: `390×844` CSS px at 1× density
- state: signed-out scheduler login capture plus code-informed signed-in today/editor surfaces

### Findings

- P3 resolved: major scheduler surfaces now share `--scheduler-line-soft: rgba(238, 229, 210, 0.11)`, matching the quiet outer border seen on `지금 처리할 일`.
- Applied to status capsules, login/control glass surfaces, work-log card, event sections, primary info, and editor card. Internal inputs, buttons, and semantic state borders remain distinct for affordance and contrast.
- The 1px physical border remains unchanged; only its optical presence is normalized, preventing the 근무 중 surface from appearing heavier than the event section.
- Typography, spacing, image asset, copy, and behavior were not changed.

### Follow-up polish

- P3: confirm the shared border token on a signed-in iPhone/PWA capture across the today view and editor route.

final result: passed

## Scheduler Hierarchy And Rhythm Tidy QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/71EC4BDE-2BC4-4C1F-A1C6-F8E7F3A8845C/1-붙여넣은-이미지-1.jpg`
- implementation screenshots: `/private/tmp/softie-scheduler-tidy-qa/scheduler-login-390.png` and `/private/tmp/softie-scheduler-tidy-qa/scheduler-login-1280.png`
- full-view comparison evidence: `/private/tmp/softie-scheduler-tidy-qa/comparison.png`
- source pixels: `629×1280`; source is a signed-in scheduler capture embedded in a Messages view, so only the scheduler material and hierarchy were compared
- implementation pixels: `390×844` at 1× CSS density and `1280×900` desktop regression capture
- state: signed-out scheduler login for the rendered route; signed-in event hierarchy was checked against the supplied source and existing selectors
- primary interactions tested: route load, Google login action visibility, and home navigation action visibility; OAuth was not activated
- console errors checked: no application errors were observed in the captured scheduler states

### Findings

- P3 resolved: scheduler status controls now use a 52px rhythm, 17px capsule radius, and a slightly more even dock gap, matching the supplied reference's calm top-row grouping without copying its system chrome.
- P3 resolved: event lists use a consistent `0.65rem` inter-row gap so the upcoming schedule reads as a deliberate stack rather than a compressed list. Event opacity and information contrast were unchanged.
- Fonts and typography: existing Softie scheduler hierarchy remains intact; no new font or copied Apple typography was introduced.
- Colors and visual tokens: warm photo atmosphere, charcoal surfaces, aged-cream text, and semantic status colors are preserved. The supplied black Messages canvas is intentionally not adopted.
- Image quality and asset fidelity: the existing `scheduler-atmosphere-v4.jpg` remains the only product imagery; no replacement or CSS-drawn asset was added.
- Copy and content: scheduler copy and actions are unchanged.
- Responsive behavior: mobile and desktop login captures remain aligned, with no visible overflow or clipped controls. Signed-in event rendering was not available in this browser session and remains a follow-up verification item.

### Follow-up polish

- P3: confirm the 52px status rhythm and event-list gap on a signed-in iPhone/PWA capture once an authenticated session is available.

final result: passed

## Scheduler-Only Liquid Glass Transparency Tuning QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/7E696A20-D0D2-4D8A-AAFD-81CFACAE3FFF/1-붙여넣은-이미지-1.jpg` plus the earlier iOS material reference
- implementation screenshot: `/private/tmp/softie-liquid-glass-qa-v2/scheduler-login-390-scoped.png`
- viewport and pixels: `390×844` CSS px at 1× density
- state: signed-out scheduler login; home and memo remain on the previously shipped opacity

### Findings

- P3 resolved: scheduler liquid surfaces now use a lower-opacity warm fill (`0.18`), allowing more of the atmospheric photograph to show through. Home and memo retain the previously shipped `0.24` surface for this scoped pass.
- Spacing, typography, copy, and layout remain unchanged from the previously passed implementation.
- The screenshot shows the intended distinction: scheduler status/command surfaces are more transparent, while content controls retain contrast and the background remains supportive rather than decorative.
- Reduced-transparency and unsupported-backdrop fallbacks now use `!important`, so accessibility fallbacks correctly override the transparent base rule.

### Follow-up polish

- P3: validate the new opacity values on a physical iPhone in Safari/PWA mode, where native backdrop compositing can appear slightly brighter or darker than Chromium.

final result: passed

## Selective Liquid Glass Material QA

- source visual truth: `/tmp/codex-remote-attachments/019f9618-8084-7c03-a518-af09fcce8455/7D29A77E-ABCC-4613-9A61-6A54103166EE/1-사진-1.jpg`
- implementation screenshots: `/private/tmp/softie-liquid-glass-qa/home-390.png`, `/private/tmp/softie-liquid-glass-qa/scheduler-login-390.png`, and `/private/tmp/softie-liquid-glass-qa/memo-sheet-390-revised.png`
- full-view and focused material comparison evidence: `/private/tmp/softie-liquid-glass-qa/material-comparison.png`
- source pixels: `1206×676`; this is a system-screen material reference, not a Softie layout target
- implementation viewport and pixels: `390×844` CSS px at 1× density
- state: signed-out home, open Softie Memo sheet, and signed-out scheduler login
- primary interactions tested: Softie Memo opens from its service card, receives textarea focus, and exposes a labeled dialog; scheduler primary authentication action was visually inspected but not activated
- console errors checked: no application errors were observed in the inspected home and scheduler states

### Findings

- P2 resolved: the mobile memo sheet initially collapsed to its intrinsic grid-column width (`239.5px`) instead of filling the viewport. The mobile backdrop now defines a `minmax(0, 1fr)` track and stretches its content, producing a full-width bottom sheet.
- Fonts and typography: Softie's existing system typography and warm uppercase hierarchy are preserved. The material reference contributes no copied type styling; the memo title and scheduler primary action remain legible over the more transparent surface.
- Spacing and layout rhythm: the existing home and scheduler composition is unchanged. Liquid treatment is restricted to hierarchy-defining surfaces; standard service and informational cards retain the quieter material.
- Colors and visual tokens: the implementation uses a neutral warm transparent fill, bright optical border, shallow inner highlights, and reduced outer shadow. It intentionally omits the source screenshot's chromatic fringe because CSS cannot reproduce iOS renderer refraction reliably without decorative imitation.
- Image quality and asset fidelity: the existing Softie atmospheric photograph remains the only product background asset. No replacement image, SVG, gradient, or simulated system icon was introduced.
- Copy and content: application copy is unchanged except for the previously added visible `Softie Memo` dialog title. The reference screen's flashlight, camera, carrier label, and home indicator were correctly treated as irrelevant system UI.
- Accessibility and fallbacks: 44px memo targets, textarea autofocus, Escape closing, trigger focus return, safe-area padding, reduced-transparency fallback, and no-backdrop-filter fallback are present.

### Comparison history

- Iteration 23: the first browser capture showed the new material direction working on the home header and scheduler login surface but exposed the collapsed mobile sheet width. After adding an explicit full-width mobile grid track, the revised screenshot shows a stable edge-to-edge sheet with no remaining actionable P0/P1/P2 issue.

### Follow-up polish

- P3: verify the blur, brightness, and border response on a physical iPhone in Safari/PWA mode. Web `backdrop-filter` can match the transparency and edge hierarchy, but not iOS's native optical distortion or chromatic refraction.
- P3: the signed-in scheduler command surface is code-covered by the same modifier but was not browser-captured because this session has no authenticated scheduler state.

final result: passed

## Scheduler Sync Completion Feedback QA

- implementation: `src/scheduler/TodaySchedulerPage.jsx` and `src/styles.css`
- rendered route: `/scheduler` at `http://127.0.0.1:5173/scheduler`
- state: authenticated local preview with work-time mode enabled and an existing overlapping work log
- primary interaction tested: `동기화` → `진행` displayed `동기화가 완료되었습니다` through an accessible status toast; the toast disappeared automatically after the transient interval

### Findings

- P3 resolved: successful sync now gives a non-blocking, warm liquid-glass confirmation at the top of the scheduler so the result is visible without interrupting the next action.
- Existing overlap confirmation and error status flows remain unchanged; the completion feedback is only shown after the save or replacement request resolves successfully.
- The toast is `role="status"` with `aria-live="polite"`, ignores pointer input, and respects `prefers-reduced-motion`.

final result: passed

## Interpretation Prep Target Date Placement QA

- implementation: `src/interpretationPrep/InterpretationPrepPage.jsx`
- rendered route: `/interpretation-prep` at `http://127.0.0.1:4173/interpretation-prep`
- viewport: `390×844` CSS px
- states: primary form with advanced details collapsed, then expanded
- primary interaction tested: `세부 입력과 계산 환경` summary toggle

### Findings

- P2 resolved: `운 흐름 기준일` now lives inside the advanced details section, reducing accidental edits while keeping the field available for users who need it.
- With the section collapsed, the primary form ends after birth time and the target-date control is not exposed. When expanded, the target date appears first in the advanced grid, followed by city, timezone, latitude, and longitude.
- Summary copy now names the hidden content (`기준일 · 도시 · 시간대 · 좌표`) so the control remains discoverable without adding visual density to the default form.
- Mobile layout remains bounded at `390px` (`scrollWidth === clientWidth`); no horizontal overflow or clipped target-date field was observed.

final result: passed

## Interpretation Prep Runtime And Stylesheet Optimization QA

- source visual truth: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/13-prep-after-scheduler-alignment-final-1280.png`
- implementation: `http://127.0.0.1:5173/interpretation-prep`
- implementation screenshots: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/16-prep-optimized-desktop-1280.png` and `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/18-prep-optimized-mobile-handoff-final-390.png`
- full-view comparison evidence: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/19-prep-before-after-optimization.png`
- focused region comparison evidence: the final `390×844` handoff capture verifies the sticky stage navigation, synthesis boundary, handoff controls, wrapping, and bottom-of-page anchor behavior
- source and implementation dimensions: `1280×900` pixels at a `1280×900` CSS viewport and 1× density; mobile implementation `390×844` pixels at a `390×844` CSS viewport and 1× density
- states: saved-input preparation view with details collapsed; calculated result with synthesis and Chat handoff visible
- primary interactions tested: open calculation details, use the `01 입력` and `04 Chat 전달` stage links, and render the mobile handoff controls
- console errors checked: zero browser errors

### Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: font family, Korean wrapping, weights, kickers, hierarchy, and control labels are unchanged from the approved scheduler-aligned source.
- Spacing and layout rhythm: the `860px` desktop shell, card geometry, stage navigation, result structure, and `390px` mobile stack remain visually stable. Desktop and mobile report no horizontal overflow.
- Colors and visual tokens: scheduler surfaces, selected states, borders, shadows, and atmospheric image treatment are unchanged.
- Image quality and asset fidelity: the approved `scheduler-atmosphere-v4.jpg` remains unchanged and no replacement or synthetic asset was introduced.
- Copy and content: all user-facing input, calculation, uncertainty, synthesis, and handoff copy is preserved.
- Runtime and bundle: unused developer validation-center imports, state, handlers, and CSS were removed. The interpretation CSS asset decreased from `49.21kB` (`9.34kB` gzip) to `43.69kB` (`8.22kB` gzip); the JavaScript asset decreased from `146.61kB` (`53.46kB` gzip) to `146.49kB` (`53.40kB` gzip).
- Rendering behavior: the synthesis and handoff sections use `content-visibility: auto` so the browser can skip off-screen layout and paint. The large result card deliberately remains fully laid out to preserve stable fragment navigation.

### Comparison history

- Iteration 1: removed production-unreachable validation-center code and styles, combined two birth-time state updates into one, and added deferred rendering to the result, synthesis, and handoff sections.
- Iteration 2: mobile browser verification found a P2 fragment-navigation shift because the result section's intrinsic placeholder was much shorter than its real long-form content. Deferred rendering was removed from the result card while retained for the smaller synthesis and handoff sections.
- Post-fix evidence: `04 Chat 전달` reaches the final section at the maximum legal document scroll position, all controls remain visible, `scrollWidth === 390px`, browser errors remain zero, and the approved desktop appearance is preserved.

### Implementation checklist

- [x] Remove unreachable validation-center JavaScript and CSS.
- [x] Consolidate duplicate birth-time state updates.
- [x] Defer only safe off-screen sections.
- [x] Preserve stage-link behavior and long-result layout stability.
- [x] Verify production build, targeted tests, desktop/mobile rendering, overflow, and browser errors.

### Follow-up polish

- P3: validate the same off-screen rendering behavior once in Mobile Safari/PWA mode because WebKit's `content-visibility` heuristics can differ slightly from the in-app browser.

final result: passed

## Interpretation Prep Standalone Chat Handoff QA

- source visual truth and established style comparison: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/19-prep-before-after-optimization.png`
- implementation: `http://127.0.0.1:5173/interpretation-prep`
- implementation screenshots: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/20-prep-chat-standalone-desktop-1280.png` and `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-audit/21-prep-chat-standalone-mobile-390.png`
- source and implementation dimensions: established desktop comparison at `1280×900` CSS px and 1× density; implementation captures at `1280×900` and `390×844` CSS px and 1× density
- states: calculated result with details collapsed, details opened, and details collapsed again
- primary interactions tested: calculate-state restoration, `계산 결과 상세 보기`, `계산 결과 닫기`, and `03 Chat 전달` fragment navigation
- console errors checked: zero browser errors

### Findings

- No actionable P0, P1, or P2 differences remain.
- Information architecture: `Chat에서 해석할 자료 만들기` is now a standalone third step directly after the input and calculation-profile form. It remains visible while the details are closed.
- Interaction scope: the details control now governs only `체계별 근거` and `통합 구조`. Opening it adds `04 결과` to the stage navigation; closing it removes only those two result sections.
- Fonts and typography: the scheduler-aligned Korean hierarchy, uppercase kickers, weights, line heights, and mobile wrapping remain unchanged. Step kickers now read `03 · CHAT HANDOFF`, `04 · SYSTEM RESULTS`, and `04B · SYNTHESIS LAYER`.
- Spacing and layout rhythm: the standalone handoff keeps the existing card width, padding, gaps, radius, and scroll margin. Both desktop and mobile remain horizontally bounded.
- Colors and visual tokens: atmospheric background, warm glass fill, borders, selected states, and primary/secondary actions are unchanged from the established design target.
- Image quality and asset fidelity: the existing scheduler atmosphere image is unchanged; no new or substitute asset was introduced.
- Copy and content: handoff copy and controls are unchanged. Navigation copy now mirrors the actual order: input, calculation profile, Chat handoff, then optional detailed results.
- Accessibility: the detail button now declares both controlled regions through `aria-controls="prep-results prep-synthesis"` and retains accurate `aria-expanded` state.

### Comparison history

- Iteration 1: moved the handoff section above the detail-only regions and renumbered navigation and section kickers.
- Post-fix evidence: in the collapsed state the DOM contains `#prep-handoff` but not `#prep-results` or `#prep-synthesis`; after opening, all three are present; after closing, only the handoff remains. Desktop and mobile report no horizontal overflow.

### Focused region comparison

- The desktop capture verifies that the handoff card begins immediately after the two-column input/profile workspace without an intervening result section.
- The mobile capture verifies the stacked relationship between the calculation actions and standalone handoff card, plus two-column handoff topic controls and full-width generation action.

### Implementation checklist

- [x] Keep Chat handoff visible after calculation.
- [x] Limit the details toggle to evidence and synthesis.
- [x] Renumber stage navigation and section kickers.
- [x] Update the details control relationship for both collapsible regions.
- [x] Verify build, targeted tests, desktop/mobile rendering, interaction state, overflow, and browser errors.

### Follow-up polish

- P3: confirm the same scroll position and backdrop compositing once in physical Mobile Safari/PWA mode.

final result: passed

## Interpretation Prep Input Control Consistency Audit

- rendered route: `http://127.0.0.1:5173/interpretation-prep#prep-input`
- before screenshot: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-controls-audit/01-before-controls-desktop-1280.png`
- after screenshots: `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-controls-audit/02-after-controls-desktop-1280.png`, `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-controls-audit/03-active-controls-desktop-1280.png`, and `/Users/softie/.codex/visualizations/2026/07/25/019f9983-84de-72a2-b3ab-e6f6f653b053/interpretation-prep-controls-audit/09-after-controls-mobile-final-390.png`
- viewport and density: `1280×900` and `390×844` CSS px at 1× density
- states: exact birth time, unknown birth time selected, and local-save preference selected
- primary interactions tested: toggle unknown time on and off; verify persisted birth-time value restoration; inspect selected local-save preference without changing stored preference
- console errors checked: zero browser errors

### Findings

- P2 resolved: the inactive `모름` control previously used a pale background and low-contrast brown label that read as disabled inside the dark scheduler-aligned surface. It now uses the same dark operational fill, line, 44px height, and text hierarchy as adjacent secondary controls.
- P2 resolved: the native local-save checkbox previously rendered as a visually tiny 14px mark despite a 44px computed input height. It now renders at `18×18px`, while the enclosing label preserves a large click target.
- P2 resolved: the save row previously had no visible selected-state relationship to the checked control. The checked row now uses a restrained selected border and warm transparent fill derived from the scheduler surface tokens.
- Accessibility: `모름` now exposes its toggle state through `aria-pressed`. Keyboard focus continues to use the shared 2px focus ring, the button remains `64×44px`, and the entire save row remains the checkbox label.
- Fonts and typography: labels, weights, Korean wrapping, supporting-copy size, and line height remain aligned with the surrounding input card.
- Spacing and layout rhythm: control height, radius, inset, and row spacing now match nearby gender and advanced-setting controls. The mobile layout remains at `scrollWidth === clientWidth`.
- Colors and visual tokens: the controls use existing `--prep-*` and scheduler-selected variables; no new palette or material family was introduced.
- Image quality and asset fidelity: the scheduler atmosphere asset and its crop are unchanged; no new icon or substitute asset was introduced.
- Copy and content: visible copy and save behavior are unchanged.

### Flow steps

1. Exact birth time — healthy: `모름` reads as an available secondary toggle beside the time field.
2. Unknown birth time — healthy: selected material, focus ring, explanatory warning, and `aria-pressed="true"` make the state clear.
3. Local-save preference — healthy: the native checked control and softly selected row communicate persistence without competing with the primary calculation action.

### Remaining limits

- Physical Safari/PWA rendering was not captured; native checkbox glyph and backdrop compositing can vary slightly from the in-app browser.

final result: passed
