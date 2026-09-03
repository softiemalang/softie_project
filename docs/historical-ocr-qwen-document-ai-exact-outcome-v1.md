# Qwen 3.8 27B and Document AI optimized-candidate exact-outcome contract

상태: `CLOSED_RECORD` — `COMPLEMENTARY_EXACT_COVERAGE_WITH_CONFLICT`.

이 기록은 기존 frozen-gold evidence만 사용한 recognition-only 비교다. 새
Vision/Document AI/Qwen 요청, 재실행, prediction text 복원, semantic 보정,
winner 선택은 수행하지 않았다.

## Input identity

- frozen gold set SHA-256: `f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b`
- input manifest SHA-256: `33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315`
- Qwen exact-only source: [`exact-outcome-adjudication.json`](../artifacts/historical-ocr-ppocrv6-rec/exact-outcome-adjudication.json), content SHA-256 `24d11d1fcf083afea1acc398eb3316e5efef722a9e0d8744f19e2e1e014026c7`
- Qwen run record SHA-256: `3fc4d6959dfea7216ecf5bbf1e240ee380d12dcfa1470e3c9be871d9a94df4c4`
- optimized Document AI source: `/home/haantube421/google-vision-smoke-20260904/document-ai-minimal-mask-imageless-8run-20260904-v1.json`, SHA-256 `b3fec8714c957cb80d2a5a87fe298b9e0e33ebfd4bb3517bb26e1b8c851fd671`
- optimized request gate: [`historical-ocr-document-ai-float-aware-gate-v2.md`](historical-ocr-document-ai-float-aware-gate-v2.md), `OPTIMIZED_REQUEST_SHAPE_CANDIDATE`

비교 packet은 exact boolean만 소비한다. Qwen의 raw prediction text가 보존되지
않았으므로 Qwen CER·text equality·문자열 winner는 산출하지 않는다. Document AI
optimized 쪽도 이 packet에서는 기존 exact flags만 사용하고, confidence/geometry/
latency는 winner 판단에 넣지 않는다.

## Frozen-line exact outcome

표의 `T/T`와 `F/F`는 두 repeat의 exact flag이며, exact는 frozen gold와의
일치 여부다.

| Frozen line | Qwen 3.8 27B | Document AI optimized | 공식 관계 | 현재 action |
|---|---:|---:|---|---|
| `saju-main-title-line` | T/T | T/T | `AGREEMENT_BOTH_EXACT` | `NO_AUTO_ACTION` |
| `saju-folio-line` | F/F | T/T | `CONFLICT_DOCUMENT_AI_EXACT_QWEN_NONEXACT` | `ESCALATE_REQUIRED` |
| `ziwei-title-line` | T/T | T/T | `AGREEMENT_BOTH_EXACT` | `NO_AUTO_ACTION` |
| `astrology-title-line` | T/T | F/F | `CONFLICT_QWEN_EXACT_DOCUMENT_AI_NONEXACT` | `ESCALATE_REQUIRED` |

독립 집계는 agreement 4/8 record, conflict 4/8 record다. 각 worker는 6/8
exact (`0.75`)로 동률이다. 이 결과는 두 worker의 전체 우열을 말하지 않는다.

## Agreement, conflict, complementarity의 의미

- `agreement`는 동일한 frozen-gold exact boolean을 관측했다는 뜻뿐이다. `T/T`
  는 두 결과가 gold와 일치했다는 강한 outcome agreement지만, raw text가 같다는
  뜻은 아니다. `F/F`라면 두 worker가 모두 non-exact였다는 agreement일 뿐이다.
- `conflict`는 같은 line/repeat에서 한 worker는 exact, 다른 worker는 non-exact인
  outcome divergence다. raw prediction text가 없으므로 문자열 간 conflict라고
  부르지 않는다.
- `complementarity`는 conflict line에서 exclusive exact coverage가 양쪽에
  모두 관측된 경우다. 현재 Qwen-only exact line은 `astrology-title-line`,
  Document AI-only exact line은 `saju-folio-line`, 양쪽 exact overlap은
  `saju-main-title-line`과 `ziwei-title-line`이다. 즉 union coverage는 4개
  line이지만, 이 사실은 per-line text stitching이나 자동 승자를 허용하지 않는다.

따라서 현재 공식 상태는 `COMPLEMENTARY_EXACT_COVERAGE_WITH_CONFLICT`이며,
`winner = NONE`이다. agreement와 complementarity는 evidence relation이지
router authority가 아니다.

## Bounded escalation rule

다음 규칙은 line-scoped이며 자동 재시도나 자동 route 변경을 하지 않는다.

1. `AGREEMENT_BOTH_EXACT`: 해당 line은 exact agreement evidence로 봉합한다.
   worker를 선택하거나 activation하지 않는다.
2. `AGREEMENT_BOTH_NONEXACT`: exact worker가 없으므로 `ESCALATE_REQUIRED`로
   봉합한다. semantic correction/fallback은 금지한다.
3. `CONFLICT_*`: 양쪽 packet을 모두 보존하고 해당 line만
   `ESCALATE_REQUIRED`로 표시한다. 어느 worker도 자동 선택하지 않는다.
4. `UNKNOWN_REPEAT_INSTABILITY` 또는 필수 source/hash 누락: `FAIL_CLOSED_UNKNOWN`로
   종료한다. 누락을 보간하거나 현재 결과에 맞춰 tolerance를 바꾸지 않는다.
5. escalation은 최대 1 round, round당 명시적으로 지정한 제3 recognition worker
   최대 1개, 동일 frozen gold의 최대 8 additional requests로 제한한다. 또는
   raw text가 합법적으로 보존된 경우에만 별도 text review를 한 번 수행할 수
   있다. 둘을 자동 병렬 실행하지 않는다.
6. 한 번의 bounded escalation 뒤에도 conflict/unknown이면
   `UNRESOLVED_NO_AUTOMATIC_SELECTION`으로 종료하고 사용자/별도 activation
   결정 없이는 더 진행하지 않는다.

현재 evidence는 두 conflict line 때문에 `ESCALATE_REQUIRED`이지만, 이 단계에서는
그 escalation을 실행하지 않았다.

## Deterministic packet contract

구현은 [`adjudicate_qwen_document_ai_exact_outcomes.mjs`](../tools/ocr/adjudicate_qwen_document_ai_exact_outcomes.mjs)와
[`historical-ocr-qwen-document-ai-exact-outcome-v1.json`](../artifacts/historical-ocr-qwen-document-ai-exact-outcome-v1.json)이다.

packet은 다음을 요구한다.

- schema/version, frozen gold 및 input manifest hash, 고정된 4 line 순서,
  worker ID 두 개, 각 line당 정확히 2개의 boolean repeat;
- line별 `qwen`, `documentAi`, `relation`, `escalation`과 aggregate counts;
- agreement/conflict/complementarity를 line flags에서 결정적으로 재계산할 수 있는
  source mapping;
- `winner: NONE`, `selectedWorkerId: null`, `automaticWinnerSelection: false`;
- `BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, activation false,
  detection untouched, semantic correction/fallback/search false;
- raw text/API payload/secret key를 포함하지 않는 retention boundary;
- recursive key sort + fixed array order + trailing LF canonical JSON의
  `contentSha256`.

validator는 schema/hash/line cardinality/repeat stability/source relation/derived
relations/selection boundary를 다시 계산하며, 실패 시 fail-closed한다. confidence,
latency, geometry, cost는 별도 evidence로 남길 수 있지만 이 exact-only packet의
승자·escalation 판정을 바꾸지 못한다.

## Boundary

```text
BLOCK_OCR_ROUTE=true
OCRProvider.enabled=false
activation=false
automaticWinnerSelection=false
semanticCorrection=false
silentFallback=false
```
