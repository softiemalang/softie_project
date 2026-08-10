# Softie Design Reference Audit v1

- Verdict: `complete_softie_design_reference_audit_v1_uncommitted`
- Audit date: 2026-08-11
- Scope: deterministic research artifact only. No UI/CSS/component/business/data-flow change was made.

## Authority tiers

| Tier | Meaning | Boundary |
| --- | --- | --- |
| T1 | Apple official artifact | Direct local observation; originality and reuse rights remain separate |
| T2 | Apple-derived guidance | Installed apple-design translation, not Apple primary authority |
| T3 | Independent design-engineering guidance | Installed Emil-style animate/review-animations guidance |
| T4 | Softie house rule | DESIGN.md and observed code, with code exceptions called out |
| T5 | Proposed candidate | Pilot hypothesis, never current rule |

## Source ledger

| ID | Source | Tier | Role | Status |
| --- | --- | --- | --- | --- |
| SRC-APPLE-KIT-IOS27 | Apple iOS 27 UI Kit.sketch | apple_official_artifact | Directly observed component geometry, styles, typography samples, and loading indicator structure | direct_observation_accessible |
| SRC-APPLE-HIG-MOTION | [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | apple_official_primary_guidance | Official guidance on purposeful, brief, realistic, optional, and interruptible motion | available |
| SRC-APPLE-HIG-ACCESSIBILITY | [Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | apple_official_primary_guidance | Official control sizing, spacing, and accessibility baseline | available |
| SRC-APPLE-REDUCED-MOTION | [Apple reduced-motion evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria) | apple_official_primary_guidance | Official reduced-motion substitutions for scaling, spinning, depth, parallax, and animated blur | available |
| SRC-APPLE-WWDC18-FLUID | [WWDC18: Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) | apple_official_primary_guidance | Official presentation on touch-down feedback, continuous tracking, response, springs, and momentum | available |
| SRC-APPLE-DESIGN-RESOURCES-LICENSE | [Apple Design Resources License Agreement](https://developer.apple.com/support/downloads/terms/apple-design-resources/Apple-Design-Resources-License-20230621-English.pdf) | apple_official_license_context | Rights boundary for Apple Design Resources, Template Content, and font reuse | available |
| SRC-SKILL-APPLE-DESIGN | Installed apple-design skill | apple_derived_guidance | A local translation of Apple interaction and motion concepts; not an Apple primary source | available |
| SRC-SKILL-ANIMATE | Installed animate skill | independent_design_engineering_guidance | Emil Kowalski-style web animation construction guidance, including role-based duration and easing ranges | available |
| SRC-SKILL-REVIEW-ANIMATIONS | Installed review-animations skill | independent_design_engineering_guidance | Emil Kowalski-style animation review rubric; review guidance, not product authority | available |
| SRC-SOFTIE-DESIGN | Softie DESIGN.md | softie_house_rule | Repository source of truth for new or explicitly redesigned Softie surfaces | available |
| SRC-SOFTIE-CODE | Softie UI/CSS and scheduler implementation | softie_house_rule_observed_code | Observed implementation behavior and local code values; not automatically normative | available |

The local Sketch archive is directly byte-accessible:

- Path: `/Users/softie/Documents/softie_design/Apple iOS 27 UI Kit.sketch`
- Bytes: `153010206`
- SHA-256: `5941547509b49a3756667905f18492dfdf4e59a977de1deacccfcf7ff94ac295`
- Archive: `206` entries, `34` page JSON files
- The package was inspected structurally; no Apple asset, font, image, or Template Content was copied.

## Direct Apple artifact observations

- Progress spinner frames: `{"large":["35x35"],"regular":["20x20"],"small":["14x14"]}`; segment geometry/radii are in the observation ledger, with static opacity ladder `[0.15,0.27,0.39,0.51,0.63,0.75,0.87,1]`.
- Loading row: `{"frame":{"x":500,"y":200,"width":402,"height":44},"textFrame":{"x":0,"y":20,"width":75,"height":22},"font":{"path":"$.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute","fontName":"SFPro-Regular","fontSize":17,"lineHeight":22}}`.
- Component sizing samples: `{"toggle":"64x28","segmentedSmall":"370x32","segmentedLarge":"370x48","sliderTrack":"370x22","toolbar":"402x56","sheetArtboard":"402x874"}`.
- Motion metadata: **none_observed_in_archive_json**. No duration/easing/spring metadata was observed in archive JSON; runtime behavior is not inferred.
- Typography samples (embedded font references: 70) remain artifact observations only: `[{"name":"Large Title","fontName":"SFPro-Regular","fontSize":44,"lineHeight":52},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":48,"lineHeight":57},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":52,"lineHeight":61},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":56,"lineHeight":66},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":60,"lineHeight":70},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":31,"lineHeight":38},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":32,"lineHeight":39},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":33,"lineHeight":40},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":34,"lineHeight":41},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":36,"lineHeight":43},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":38,"lineHeight":46},{"name":"Large Title","fontName":"SFPro-Regular","fontSize":40,"lineHeight":48},{"name":"Large Title","fontName":"SFPro-Bold","fontSize":34,"lineHeight":41},{"name":"Title 1","fontName":"SFPro-Regular","fontSize":38,"lineHeight":46},{"name":"Title 1","fontName":"SFPro-Regular","fontSize":43,"lineHeight":51},{"name":"Title 1","fontName":"SFPro-Regular","fontSize":48,"lineHeight":57}]`.
- Material examples remain artifact observations only: `{"appleMaterial":[{"key":"depth","value":0.5,"ownerName":"􁄻 Materials > Materials > Dark > Ultrathin > Material"},{"key":"distortion","value":0.6,"ownerName":"􁄻 Materials > Materials > Dark > Ultrathin > Material"},{"key":"radius","value":75,"ownerName":"􁄻 Materials > Materials > Dark > Ultrathin > Material"},{"key":"saturation","value":1,"ownerName":"􁄻 Materials > Materials > Dark > Ultrathin > Material"}],"liquidGlassSmall":[{"isCustomGlass":1,"radius":6,"saturation":1,"distortion":0.4,"depth":0.8,"type":4,"skipLightingEffects":true},{"isCustomGlass":1,"radius":6,"saturation":2,"distortion":0.4,"depth":0.8,"type":4,"skipLightingEffects":true}],"liquidGlassLarge":[{"isCustomGlass":1,"radius":30,"saturation":1.2,"distortion":0.3,"depth":0.9,"type":4,"skipLightingEffects":true},{"isCustomGlass":1,"radius":30,"saturation":1.4,"distortion":0.3,"depth":0.9,"type":4,"skipLightingEffects":true}]}`.

## Confirmed Softie house rules

- duration-fast: 180ms and easing-standard: ease are Softie values from DESIGN.md/code, not Apple UI Kit or Emil values.
- A 44px touch target with a 30–36px compact visual control and 6–8px gap is a Softie rule. Apple HIG 44×44pt is compatible evidence, not its lineage.
- Softie radius and selective glass tokens remain Softie-owned. Apple material fields are reference observations, not replacements.
- Reduced motion, safe-area/focus behavior, and explicit opt-in view transitions are existing constraints; implementation coverage is not yet uniform.

## Conflict and compatibility matrix

| Area | Current Softie state | Conflict | Value | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| tap_press_feedback | Scheduler action family has small press scale and 160ms custom ease-out in scoped code; generic primary/secondary actions use 180ms ease; legacy rules remain mixed | Partial: Softie 180ms house baseline is slightly slower than the independent 100-160ms press reference; Apple sources support immediate feedback but give no matching local numeric token | high_frequency_high_value | low_to_medium_visual_weight_and_inconsistent_families | **candidate_for_pilot** — Pilot one high-frequency Scheduler action family only; preserve hit area and data behavior; compare immediate touch-down clarity and accidental activation |
| route_page_transition | View Transitions are explicit opt-in and skipped for reduced motion; route fallback is a generic light loading shell | Partial: platform/browser support and fallback visual continuity are unverified; Softie route curve is not proven Apple or Emil lineage | medium | medium_platform_support_and_context_loss | **reference_only** — Keep selective opt-in; verify on supported browser and physical device before any wider adoption |
| async_loading_loaded_reveal | TodaySchedulerPage uses message-based loading; first two empty sections hide the loading text, refetch retains old events, and no content-entry reveal exists | Partial: direct loading-row geometry is useful reference, but stale-content semantics and layout stability are product-specific | high_frequency_high_value | medium_stale_content_confusion_or_layout_shift | **candidate_for_pilot** — Yes, as a minimal inline loading cue/reveal pilot scoped to the first empty Today event fetch; do not animate stale refetches until semantics are explicit |
| modal_sheet_popover | Memo sheet and scheduler modal/sheet flows include focus/escape/scrim/material behavior; DESIGN.md names Memo sheet as first iOS-style pilot | Compatible in intent; timing, detent, and material reuse rights remain unverified | medium | medium_accessibility_and_focus_regression | **candidate_for_pilot** — Use existing Home Memo sheet as a later focused pilot after loading cue; validate focus restoration, keyboard, backdrop, and reduced motion |
| drag_gesture_spring | No active production Scheduler drag/spring surface was admitted in this audit | Not applicable to current admitted scope; no Apple Kit runtime motion fields observed | low_current_value | high_complexity_and_interruption_risk | **not_applicable** — Do not introduce a spring experiment without a real direct-manipulation surface and device test plan |
| reduced_motion | Reduced-motion rules exist for atmospheric/view-transition paths and some component animations; legacy transitions and at least one animation path remain outside a complete contract | Conflict/partial: Softie often suppresses to near-zero duration, while guidance favors preserving status/hierarchy with dissolve/highlight/static alternatives | high_accessibility_value | medium_inconsistent_semantics | **reference_only** — Treat as an audit gate for every pilot; do not claim repository-wide adoption until all relevant paths are verified |
| opacity_transform | Motion commonly uses transform/opacity, but legacy transition-all/property-specific transitions and width progress transitions remain | Partial: principle is compatible; implementation is not normalized and some transitions can animate layout/property changes | medium | medium_performance_and_layout_motion | **reference_only** — Use transform/opacity as a pilot constraint, not a retrofit mandate |
| progress_loading_indicators | Scheduler mostly exposes text loading/empty states; no admitted spinner token or progress component contract | No direct conflict; Apple artifact supplies reference geometry but no runtime duration/easing authority | medium_only_when_wait_is_long | medium_ambiguity_if_added_without_state_contract | **reference_only** — Prefer a clear textual or structural state cue in the loading pilot; do not copy spinner assets or infer rotation timing |
| material_glass_depth | Selective glass hierarchy is documented; implementation also has undocumented liquid variants, nested glass, and service-card material divergence | Partial/conflict: shared visual vocabulary exists, but Apple material metadata, Softie blur/saturation tokens, and asset rights are separate | medium | high_contrast_readability_and_license_misuse | **reference_only** — Use Apple material observations for vocabulary only; preserve Softie tokens and do not copy Template Content |
| touch_target_spacing_component_sizing | 44px outer targets with 30-36px compact visuals are explicit in Scheduler; some interpretation-prep controls are 40px/36px exceptions | Compatible for Scheduler; partial conflict in interpretation-prep exceptions and because Apple pt geometry is not a Softie px token | high_accessibility_and_operational_value | low_to_medium_density_or_touch_regression | **adopted** — Keep the existing 44px Softie rule as the authority; treat Apple sizes as reference and audit exceptions separately |
| duration_easing_roles | DESIGN.md adopts 180ms ease for basic transitions; code contains raw 100-450ms values, custom curves, and undefined transition aliases in interpretation prep | Conflict/uncertainty: Apple Kit archive has no observed timing metadata; independent role ranges differ by purpose; code is mixed | high_cross_surface_value | medium_inconsistent_tempo_and_invalid_css_aliases | **candidate_for_pilot** — Pilot role-specific values in one surface only; do not rewrite global tokens or fix unrelated aliases during this audit |

Similar numbers are not counted as independent evidence. Lineage is recorded in provenance-lineage.json and the embedded provenanceLineage section.

## Pilot shortlist

### 1. PILOT-01 — Scheduler Today event list

- Area: `async_loading_loaded_reveal`
- Status: **candidate_for_pilot**
- Scope: First empty-state Today fetch only: retain the existing loading state, add at most one stable inline cue or a single content reveal after successful data arrival; no stagger, no refetch animation, no API/data-flow change
- Constraints: transform/opacity only if motion is used; no layout property animation; under 200ms candidate envelope; preserve reduced-motion static/dissolve alternative; do not hide a stale date/filter result
- Success: waiting is distinguishable from genuinely empty; first event is readable immediately after arrival; no observable layout jump or delayed action; reduced-motion users receive equivalent state information; no stale refetch content is falsely presented as newly loaded
- Failure: empty state appears loaded before data arrives; motion delays scanning or action; content jumps; reduced motion loses state meaning; refetch makes old cards look fresh
- Implementation in this work unit: Not implemented in this work unit

### 2. PILOT-02 — One high-frequency Scheduler action family

- Area: `tap_press_feedback`
- Status: **candidate_for_pilot**
- Scope: One existing 44px action family with no business/data change; compare current 160-180ms feedback against a role-specific short press candidate
- Constraints: touch-down feedback must be immediate; keep activation on release; avoid scale reducing hit target perception; respect hover/pointer-fine gating; reduced motion keeps clear pressed state without continuous motion
- Success: press is perceived before release; no accidental activation increase; visual weight remains coherent with existing tokens; keyboard/focus behavior unchanged
- Failure: press feels delayed or bouncy; button appears to move under the finger; hover style leaks to touch; focus or reduced-motion state is obscured
- Implementation in this work unit: Not implemented in this work unit

### 3. PILOT-03 — Home Memo sheet

- Area: `modal_sheet_popover`
- Status: **candidate_for_pilot**
- Scope: Existing sheet interaction named by DESIGN.md as the first iOS-style pilot; test focus, backdrop, entry/exit origin, keyboard, and reduced motion without changing memo data semantics
- Constraints: focus restoration is a hard gate; scrim must communicate modality; no Apple asset/font reuse; do not stack extra translucent layers
- Success: open/close origin is spatially legible; keyboard focus is reliable; backdrop and escape behavior remain clear; reduced motion preserves modal hierarchy
- Failure: focus is lost; sheet feels detached from trigger; backdrop harms contrast; reduced motion removes modality cue
- Implementation in this work unit: Not implemented in this work unit

### Scheduler loading → loaded recommendation

Recommended as the highest-value pilot candidate, but not implemented here. The current code has a real, frequent Today event-fetch state, a message-based loading contract, hidden loading text in the first two empty sections, and no content-entry reveal. The safest experiment is limited to the first empty-state successful fetch: one stable cue or one reveal, no stagger, no refetch animation, no layout-property animation, and no data-flow change. Success means waiting is distinguishable from empty, the first event is immediately readable, there is no layout jump, and reduced motion preserves the same state information. Failure means stale cards look freshly loaded, motion delays scanning, or empty/loading semantics become ambiguous.

## Blockers and open risks

- **BLK-01 — open — official_originality_and_rights:** The local package is byte-accessible and metadata-identifiable, but local filename/cloud metadata do not independently prove official originality or permit reuse in Softie. Mitigation: Keep observations reference-only; copy no Apple assets/fonts/Template Content; obtain a separate rights decision before reuse.
- **BLK-02 — open — motion_metadata:** No duration, easing, spring, damping, stiffness, timingFunction, or animation keys were observed in the scanned Sketch archive JSON. Mitigation: Record absence; do not infer runtime timing. Use official guidance or independent guidance only as separate reference tiers.
- **BLK-03 — open — physical_device_validation:** No physical iPhone/iPad validation was performed in this research unit. Mitigation: Require device checks for any pilot before adoption.
- **BLK-04 — open — mixed_implementation_contract:** Existing UI code has legacy motion/material exceptions, undefined interpretation-prep transition aliases, and incomplete reduced-motion coverage. Mitigation: Report as follow-up risks; do not repair unrelated UI/CSS during this audit.
- **BLK-05 — conditional — full_suite_external_pdf_environment:** The repository-wide npm test may retain its known external PDF-source environment failure; it must be reported separately from this artifact work. Mitigation: Run the full suite and distinguish this condition from focused audit checks.

## Validation contract

- Materializer output is canonical JSON with stable key ordering and final LF.
- complete.json.integrity.json independently hashes complete.json and each companion ledger.
- The checker validates artifact identity, companion equality, external Sketch byte identity, schema tiers, and candidate status boundaries.
- Staging, commit, push, deploy, and remote DB changes are outside scope.
