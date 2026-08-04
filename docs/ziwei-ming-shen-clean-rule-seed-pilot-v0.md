# Ziwei ming-shen clean rule seed pilot v0

기준 HEAD는 `c949669201c2b4c11de4dfdec9eb739cdba6ce38`이다. 이 pilot은 `source_witness_admissible_with_limits` witness의 원본 PDF byte를 직접 확인하고, PDF page 8 / 인쇄면 `二十五` / 절 `九、定命、身二宮`의 최소 명궁·신궁 규칙만 구조화한다. PDF page 10 / 인쇄면 `二十九`의 12×12 표는 보조 시각 대조 범위이며 전사 corpus가 아니다.

원본 PDF는 `/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf`, 219 pages, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`이다. PDF는 Git에 추가하지 않았다. 전사 artifact는 원문 glyph와 normalized rule을 분리하고, OCR은 `exploration_only_not_canonical`로 고정한다. reviewer 상태는 단일 사람 검수 완료·2차 검수 대기이며, 불확실성을 자동 제거하지 않는다.

정규화 계약은 다음과 같다.

- branch order: `子=0, 丑=1, 寅=2, ... 亥=11`, modulo 12
- 寅에서 음력 1월을 시작하고 생월까지 전진한다.
- 생월 궁에서 `子`시를 시작한다.
- 명궁은 출생 시지까지 역수, 신궁은 출생 시지까지 순수한다.
- 전통 명칭 mapping은 `命宮 -> life`, `身宮 -> shen`이며, calendar conversion·윤달·해석·오행국·주성은 이 계약에 포함하지 않는다.

비교는 음력 월 1–12 × 시지 12개의 144행을 core placement 경계에서 수행한다. production adapter가 요구하는 `birthYearStem=甲`은 placement 결과에 영향을 주지 않는 입력 충족용이며, source evaluator는 production resolver를 import하거나 호출하지 않는다.

현재 결과는 `ziwei_ming_shen_clean_rule_seed_reconciled`: 144/144 match, 0 mismatch, first divergence `null`이다. 이는 source witness와 현재 엔진의 이 제한된 계산 결과가 일치한다는 뜻일 뿐, 문헌의 역사적 진위·천문학적/현실적 진실성·개인 의미·독립 검증·readiness를 뜻하지 않는다. stable claim은 0, readiness는 `not_safe_to_start`, grounding은 `blocked`, activation은 `experimental`을 유지한다.

산출물:

- evaluator: `src/ziwei/mingShenCleanRuleSeedPilot.js`
- materializer/checker: `scripts/materialize-ziwei-ming-shen-clean-rule-seed-pilot-v0.mjs`, `scripts/check-ziwei-ming-shen-clean-rule-seed-pilot-v0.mjs`
- negative: `test/fixtures/ziwei/ming-shen-clean-rule-seed-pilot-negative-v0.json`, `scripts/check-ziwei-ming-shen-clean-rule-seed-pilot-negative-v0.mjs`
- artifact: `artifacts/ziwei-ming-shen-clean-rule-seed-pilot-v0/complete.json` 및 integrity sidecar

가능한 원인은 mismatch가 발생할 경우에도 `transcription_uncertainty`, `direction_or_index_convention`, `edition_rule_variant`, `production_engine_implementation`, `comparison_configuration`으로 병렬 보존한다. 이 pilot은 그 중 하나를 증거 없이 선택하거나 엔진을 수정하지 않는다.
