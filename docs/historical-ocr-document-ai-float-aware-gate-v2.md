# Document AI confidence float-aware gate v2

상태: `PASSED` — optimized request shape는 `PROMOTED_CANDIDATE_ONLY`이며 OCR route activation은 하지 않았다.

## 범위와 보존

이 판정은 새 Document AI 요청 없이 기존 frozen 4-line × 2회 결과 JSON 두 개를 읽어 독립 계산했다.

- base: `/home/haantube421/google-vision-smoke-20260904/document-ai-8run.json`, SHA-256 `7153095ad8cb2c75327154fe501f44e11eba05675603b3b44102f354b458f5a0`
- optimized: `/home/haantube421/google-vision-smoke-20260904/document-ai-minimal-mask-imageless-8run-20260904-v1.json`, SHA-256 `b3fec8714c957cb80d2a5a87fe298b9e0e33ebfd4bb3517bb26e1b8c851fd671`
- source manifest SHA-256: `33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315`
- frozen gold set SHA-256: `f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b`

기존 optimized artifact의 `FULL_8_REVALIDATION_NOT_PROVEN` 판정은 수정하지 않았다. 이 문서와 v2 판정기는 별도 판정 기록이다.

## 타입 근거와 사전 고정 정책

Document AI RPC의 `Document.Page.Layout.confidence`는 공식 스키마에서 native protobuf `float`이고 값 범위는 `[0, 1]`이다. protobuf의 `float`는 IEEE-754 single-precision 값이다. 따라서 REST JSON의 십진수 표기 자릿수에 맞춘 epsilon을 사용하지 않고, 파싱된 값을 binary32로 canonicalize한 뒤 ULP 거리로 비교한다.

- field provenance: `document.pages[].lines[].layout.confidence`
- scalar type: `float`
- encoding: IEEE-754 binary32
- allowed range: `[0, 1]`
- semantic tolerance: `maxUlpDistance = 1`
- tolerance는 이 결과를 보기 전에 고정했다. 1 ULP는 해당 scalar type에서 인접한 두 representable 값 사이의 최소 type-level neighborhood이므로, 현재 관측값에 맞춘 data-derived tolerance가 아니다.
- `confidence.mean/min/max`, `count`, `source`, `valuesSha256`만 digest-only packet에 남기며 raw API response, raw prediction text, raw confidence lexeme은 보존하지 않는다. 그러므로 `rawConfidenceProvenance`는 native field binding·범위·digest provenance를 검증하고, raw lexical byte equality를 주장하지 않는다.

공식 근거: [Document AI v1 RPC reference](https://docs.cloud.google.com/document-ai/docs/reference/rpc/google.cloud.documentai.v1), [Protocol Buffers proto3 scalar types](https://protobuf.dev/programming-guides/proto3/), [Document AI Process API](https://docs.cloud.google.com/document-ai/docs/reference/rest/v1/projects.locations.processors/process).

## Gate

다음 component gate를 모두 통과해야 optimized request shape만 candidate로 승격한다.

1. `rawConfidenceProvenance`: 8개 record 모두 line confidence source, count, finite `[0,1]` summary, SHA-256 digest가 있어야 한다. raw payload 보존은 privacy 경계상 요구하지 않는다.
2. `semanticConfidenceStability`: optimized 반복 pair와 base 대응 record를 각각 binary32 ULP로 비교하고 모두 `≤ 1`이어야 한다.
3. exact/CER/text hash/input hash/promoted geometry digest는 기존 base와 8/8 보존되어야 한다.
4. optimized request shape는 `fieldMask=text,pages.pageNumber,pages.dimension,pages.lines,pages.tokens`, `imagelessMode=true`, `processOptions` 미포함, image-quality/symbol/premium 기능 생략, retry 0이어야 한다.
5. 8/8 성공·4 line × 2 repeat·raw response/text 미보존·semantic correction/fallback/search 부재를 확인한다.
6. 기존 latency gate인 mean/max reduction `≥ 20%`를 통과해야 한다.
7. `BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, activation false, detection slot untouched, candidate-only/separate decision 경계를 유지해야 한다.

결정 함수는 [adjudicate_document_ai_float_aware_gate.mjs](../tools/ocr/adjudicate_document_ai_float_aware_gate.mjs)이며 기본 출력은 deterministic JSON packet이다. 입력 artifact가 손상되거나 어느 gate라도 실패하면 `FAIL_CLOSED_BASE_RETAINED`를 반환한다.

## 기존 optimized 8-run 독립 재판정

독립 read-only validator: `independent-read-only-document-ai-float-aware-gate-v2`

| Gate | Evidence | Result |
|---|---:|---|
| 성공 record | 8/8, 4 lines × 2 repeats | PASS |
| raw confidence provenance | 8/8 valid binding/digest; digest equality 7/8 | PASS |
| semantic confidence stability | max base parity ULP 1; max repeat ULP 1 | PASS |
| exact/CER/text/geometry/input | 8/8 preserved | PASS |
| exact/CER aggregate | 6/8 exact; CER `0.047619047619047616` | preserved |
| latency mean | `40926.549625 ms` → `1403.8315 ms` (`96.5698758%` reduction) | PASS |
| latency max | `226995.717 ms` → `2254.108 ms` (`99.0069821%` reduction) | PASS |
| route/promotion boundary | blocked, candidate-only, no activation | PASS |

유일한 raw digest 차이는 `saju-folio-line`, repeat 1이다.

```text
base      0.7431189  -> binary32 0x3f3e3d0a
optimized 0.74311894 -> binary32 0x3f3e3d0b
ULP distance: 1
```

이는 raw digest가 서로 다르다는 provenance observation을 보존하면서도, 사전 등록된 float-aware semantic stability 기준에는 부합한다. 나머지 7개 대응 record와 모든 repeat pair는 ULP 0이다.

## 판정과 다음 경계

최종 v2 판정은 `OPTIMIZED_REQUEST_SHAPE_CANDIDATE`이다. 이는 optimized request shape component가 candidate evidence로 승격되었다는 뜻만 가지며, OCR worker/router activation이나 semantic correction/fallback을 허용하지 않는다.

현재 경계는 계속 다음과 같다.

```text
BLOCK_OCR_ROUTE=true
OCRProvider.enabled=false
activation=false
detectionSlotTouched=false
semanticCorrection=false
silentFallback=false
```

다음 gate는 별도 activation 결정과 별도 component 검토가 필요하다.
