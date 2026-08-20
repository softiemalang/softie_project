# Gemini witness dossier parent adjudication v3

This is an additive parent-direct re-audit of the actual Gemini 3.7 Flash High v3 packet and matrix. The v2 dossier is preserved. The packet remains `untrusted_candidate_only`; its historical verdicts, transcriptions, independence claims, semantic authority, readiness, and activation are not imported.

## Actual candidate-file boundary

The parent verified these local files by their current bytes:

| File role | Bytes | SHA-256 |
| --- | ---: | --- |
| packet v3 | 17,710 | `89b1dd9e26cedce02c9167ea259bb67e4911963afc2aab865ca99c4d384488f5` |
| matrix v3 | 9,775 | `5901fb1c2227967a6f791d53777f62544438428c4b6b810fe088c6552d847f69` |
| packet metadata | 169 | `6eb5ba8e1cb90834721b03589f83acb32e7f872d22203276b835733943ca47f3` |
| matrix metadata | 160 | `31734aaa6aa5fd059836fd10fd961187b025e53226edce8a57968a5b396aad82` |

This proves file identity and self-declared fields only. It does not prove that the claimed model/runtime produced the files.

## Parent decisions

| Unit | Admitted bounded result | Decision boundary |
| --- | --- | --- |
| A | Jangseogak K3-437 and the NLC 114503.0 derivative show the same bounded 卷33 / 大運 passage family. The comparison preserves `二十九日申時立春` versus `二十九日立春`; the NLC spread layout and printed folio locators are not normalized to Jangseogak PDF pages. | The reported Sonkeikaku 34-volume witness remains unresolved: no item-level official record, shelfmark, target scan URL, or page bytes were independently observed. Physical-item difference is not textual-lineage independence. |
| B | Existing v2 boundary is retained: NCL 06599 metadata records `石研齋/秦氏印`, and the derivative shows a seal block; the Sinica authority record supports Qin Enfu’s room-name/lifespan attribution. | Seal application chronology and item ownership chain remain unresolved; TAQ 1843 is not promoted. |
| C | The official Shanghai Library API was searched in a bounded pass: `子平真詮` returned five broad records, `報暉草堂` returned zero, and `育新書局` returned one unrelated result. | The packet’s Shanghai catalog entry 1052 and the 1895/1923 item-level witnesses remain unresolved without exact first-party record, physical description, scan, and page collation. |
| D | The official Waseda scan was inspected through rendered pages 1–5; the existing seasonal-heading observation on pages 9–11 remains supported. | The exact `光緒十二年歲次丙戌孟秋之月楚南余春台序` phrase remains unresolved in this bounded opening inspection. A preface date would not by itself date the current copy. |
| E | Packet structure and source/gate typing remain machine-readable. | Princeton identifiers and open scan remain candidate-only; actual Gemini runtime provenance is unverified. “All units resolved” remains unsupported. |

## Readiness boundary

The generated artifact records `promotionReadyClaimIds=[]`, `stableClaimPromotionCount=0`, `availableForInterpretation=false`, `semanticAuthority=not_established`, `implementationSafeGrounding=not_established`, and `productionActivation=blocked`.

Materialize with `scripts/materialize-saju-gemini-witness-dossier-adjudication-v3.mjs` and check with `scripts/check-saju-gemini-witness-dossier-adjudication-v3.mjs`. The artifact stores identities, locators, and bounded observations; it does not copy scan payloads or treat OCR/transmitted text as canonical.
