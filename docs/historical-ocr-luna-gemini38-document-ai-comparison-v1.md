# Luna / Gemini 3.8 Flash frozen-gold candidate comparison v1

상태: `CANDIDATE_EVIDENCE_ONLY` — 자동 채택·activation 없음.

## 결론

동일 `historical-ocr-gold-v1`의 4 line × 2 repeat에서 네이티브
`gpt-5.6-luna`를 새로 8회 실행하고, `gemini-3.8-flash`는 동일 조건의 기존
closed record를 재사용해 대조했다. Luna는 strict response는 8/8이었지만
exact 3/8, macro CER 0.497023810, 평균 27,220.192 ms로 관측되어 기존
Document AI 후보와 Gemini 3.8보다 열위인 recognition candidate다. Gemini의
기존 record도 exact 6/8과 strict 7/8이므로 새 worker 승격 근거가 아니다.

따라서 이번 비교는 세 worker 어느 것도 선택하지 않으며,
`BLOCK_OCR_ROUTE`와 `OCRProvider.enabled=false`를 유지한다.

## 입력과 격리

- frozen gold: `historical-ocr-gold-v1`, SHA-256
  `f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b`
- 동일 suite SHA-256: `fa60d4f74a07c76c8488cb2906a56b902f8ba57489e00cda84ceae4972c4a2f9`
- 4 line 순서: `saju-main-title-line`, `saju-folio-line`,
  `ziwei-title-line`, `astrology-title-line`
- Luna는 crop 하나와 transcription-only instruction만 받았다. gold text,
  Qwen 출력, Document AI 출력은 provider input에 넣지 않았다.
- Luna는 `codex exec --ephemeral`, temporary `CODEX_HOME` 및 read-only
  workspace를 사용했다. credential은 복사·출력하지 않았고 temporary crop/home은
  종료 후 삭제됐다.
- 모든 raw response, raw prompt, raw pixel, prediction text, credential 값은
  기록하지 않고 hash와 metric만 보존했다.

## 결과

`T/T`와 `F/F`는 두 repeat의 frozen-gold exact flag다. `T/F`는 Luna의
repeat instability이며, 문자열 자체가 저장됐다는 뜻이 아니다.

| line | Luna | Gemini 3.8 Flash | Document AI optimized |
| --- | ---: | ---: | ---: |
| `saju-main-title-line` | T/T | T/T | T/T |
| `saju-folio-line` | T/F | T/T | T/T |
| `ziwei-title-line` | F/F | T/T | T/T |
| `astrology-title-line` | F/F | F/F | F/F |

| worker | exact | CER | strict | text repeat stable | exact repeat stable | mean / max latency |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Luna `gpt-5.6-luna` | 3/8 (0.375) | 0.497023810, macro mean | 8/8 | 1/4 | 3/4 | 27,220.192 / 87,607.858 ms |
| Gemini `gemini-3.8-flash` | 6/8 (0.75) | UNKNOWN; raw text not retained | 7/8 | 3/4 | 4/4 | 2,043.957 / 2,777.423 ms |
| Document AI optimized | 6/8 (0.75) | 0.047619048 | source strict record | 4/4 | 4/4 exact flags | 1,405.7095 / 2,048.08 ms |

Luna의 실행 usage는 input 229,491 token, output 8,577 token으로 기록됐다.
이 수치는 비용 proxy일 뿐 금액이 아니다. Luna는 OpenAI Codex 구독 route,
Gemini는 Google Gemini Paid Tier 1 existing route, Document AI는 8 page unit
route였으며 세 source 모두 실제 invoice를 확인하지 않았으므로 monetary winner는
없다.

Geometry/confidence는 Document AI source에서만 numeric/structural evidence가
있다(geometry repeat stable 4/4, confidence present 8/8, mean 0.749808565).
Luna는 geometry/confidence를 요청하지 않은 transcription-only schema이고,
Gemini record는 confidence 7/8만 보존하므로 이를 보간하지 않는다.

## Document AI 대비 관계

### Luna

- exact flag agreement: `saju-main-title-line`, `astrology-title-line`;
  5/8 paired repeat records agree.
- conflict: `saju-folio-line`에서 Luna `T/F` 대 Document AI `T/T`;
  Luna repeat variance로 닫고 winner를 고르지 않는다.
- complementarity: `ziwei-title-line`은 Document AI `T/T`, Luna `F/F`인
  Document AI-only stable exact coverage다. Luna-only stable exact line은 없다.
- raw-text equality 또는 raw-text complementarity는 raw prediction text를
  보존하지 않았으므로 `UNKNOWN`이다.

### Gemini 3.8 Flash

- 네 line의 exact flag가 Document AI와 모두 동일하다:
  `T/T`, `T/T`, `T/T`, `F/F`.
- paired exact record agreement는 8/8이며 exact-outcome conflict와
  exclusive exact coverage는 관측되지 않았다.
- 이는 raw 문자열 동일성을 주장하지 않는다. Gemini CER는 source record가
  hash만 보존해 산출하지 않는다.

## Gate

독립 packet validator는 source hash, 4×2 cardinality, line order, exact relation,
aggregate 재계산, raw-retention boundary, route boundary를 모두 `PASS`했다.
하지만 이는 관측 packet의 무결성 판정일 뿐 promotion 판정이 아니다.

```text
winner = NONE
recognition_candidate_promotion = DO_NOT_PROMOTE
activation_gate = DO_NOT_OPEN
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
semantic_correction = false
silent_fallback = false
automatic_winner_selection = false
```

재현 가능한 runner와 machine-readable packet은 각각
[`run_luna_gpt56_frozen_gold.py`](../tools/ocr/run_luna_gpt56_frozen_gold.py),
[`historical-ocr-luna-gpt56-frozen-gold-v1.json`](../artifacts/historical-ocr-luna-gpt56-frozen-gold-v1.json),
[`historical-ocr-luna-gemini38-document-ai-comparison-v1.json`](../artifacts/historical-ocr-luna-gemini38-document-ai-comparison-v1.json)이며,
독립 validator는
[`validate_historical_ocr_luna_gemini38_packet.py`](../tools/ocr/validate_historical_ocr_luna_gemini38_packet.py)다.
