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

## iOS 27 Home Phase 1 QA

- source visual truth: `/Users/softie/Documents/softie_design/Apple iOS 27 UI Kit.sketch`
- source identity preview: `/private/tmp/softie-ios27-source/previews/preview.png`
- implementation: `http://127.0.0.1:4173/`
- implementation screenshots: `/private/tmp/softie-ios27-migration/05-home-after-dark-390.png`, `/private/tmp/softie-ios27-migration/08-home-after-dark-402.png`, `/private/tmp/softie-ios27-migration/07-home-after-dark-768.png`, and `/private/tmp/softie-ios27-migration/06-home-after-dark-1280.png`
- full-view comparison evidence: `/private/tmp/softie-ios27-migration/09-source-implementation-comparison.png`
- source limitation: the official kit supplies system components, colors, text styles, and metrics rather than a Softie Home artboard; this phase is therefore a measured design-system adaptation, not a pixel-identical screen clone
- tested states: logged-out Home, memo sheet open, textarea focus, disabled/enabled send action, expected signed-out send error, error copy action, Escape dismissal
- primary navigation tested: the full `LEAD SHEET` service row navigates to `/lead-sheet` and browser Back returns to `/`
- console errors checked: zero warnings and zero errors in the final Home state

### Findings

- No actionable P0, P1, or P2 difference remains within the Phase 1 Home scope.
- Fonts and typography: the implementation uses Apple system-font fallbacks and the extracted iOS type roles: `34/41` desktop large title, `30/36` compact large title, `22/28` title, `17/22` headline/body, `15/20` subheadline, and `13/18` footnote.
- Spacing and layout rhythm: shared `4–40px` spacing tokens, `17/22/28px` radii, content-driven service rows, and `44px` minimum actions replace route-local decorative sizing. The first three mobile rows measure `99px`, expanding above the `68px` large-row minimum to preserve Korean wrapping.
- Colors and visual tokens: the official semantic Light/Dark colors are defined under `data-design-theme="ios27"`. The active browser rendered the system Dark state with `#000000` canvas, `#1C1C1E` elevated surfaces, `#0091FF` action tint, and semantic label/separator alpha values.
- Material hierarchy: Liquid Glass is limited to the floating hero/auth and memo sheet. The eight tools use one opaque grouped material with separators instead of eight independent glass cards.
- Responsive fit: `scrollWidth === viewport width` at `390`, `402`, `768`, and `1280px`. The content width is capped at `860px` on desktop and centered at a measured `210px` left inset in the `1280px` viewport.
- Interaction and accessibility: the page exposes one level-1 heading, one level-2 tools heading, a named tools region, full-row semantic buttons, visible focus styling, a labeled modal dialog, textarea autofocus, body scroll lock, and Escape dismissal. The login action measures exactly `44px` high at `402px`.
- Copy and behavior: service labels, descriptions, route destinations, Google login behavior, memo request behavior, and the existing signed-out error path are preserved. No authentication, scheduler, Supabase, or data logic changed.
- Image and asset fidelity: no new visible asset, placeholder, SVG, emoji, CSS illustration, or generated image was introduced. The official Sketch remains the source of system tokens and metrics.

### Comparison history

- Iteration 23: the former warm photographic Home was replaced with the first scoped iOS 27 implementation. The initial compact render inherited the legacy section-heading column direction; the mobile override now restores the required left title / right count row. The final combined source-and-implementation review found no blocking typography, spacing, radius, separator, wrapping, crop, or overflow issue.

### Implementation checklist

- [x] Add scoped iOS 27 semantic tokens without deleting legacy route tokens.
- [x] Add reusable shell, layout, material, glass, and action APIs.
- [x] Convert Home to one grouped content surface and selective glass hierarchy.
- [x] Preserve all Home routes and memo behavior.
- [x] Verify `390px`, `402px`, `768px`, and `1280px` without horizontal overflow.
- [x] Verify memo input, error recovery, Escape dismissal, and service navigation.
- [x] Verify final browser console state, unit tests, production build, and diff whitespace.

### Follow-up polish

- P3: visually confirm the Light appearance in a light-system browser; the official Light tokens are implemented, but this browser session exposed only the system Dark preference.
- P3: confirm safe-area padding and reduced-transparency behavior once in an installed iPhone PWA.
- P3: migrate `/interpretation-prep`, `/scheduler`, and `/lead-sheet` independently; their dense or performance-critical flows should not inherit the Home composition blindly.

final result: passed
