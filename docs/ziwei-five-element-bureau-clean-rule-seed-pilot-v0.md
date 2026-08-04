# Ziwei five-element-bureau clean rule seed pilot v0

기준 HEAD는 `d79ce08be2df491d19216308e44a8feee3f22291`이다. 원본 witness는 `source_witness_admissible_with_limits`이며 PDF byte를 직접 읽어 SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, 219 pages, 비암호화를 확인한다. PDF 자체와 render는 Git에 넣지 않는다.

## Source 범위와 경계

핵심 범위는 PDF page 9 / 인쇄면 `二十七` / 절 `十、定五行局`의 국수 목록·六十花甲納音 규칙이다. PDF page 10 / 인쇄면 `二十八`의 `定五行局簡索表列左`는 `命宮天干地支` 축, 5개 천간쌍 열, 12개 지지 행과 방향만 보존하는 보조 표 구조다. PDF page 11 / 인쇄면 `三十一`의 `起紫微五訣` 국수별 순서와 page 12 / 인쇄면 `三十三`의 `起紫微簡索表`도 보조 대조로만 보존한다. 현대 주해·해석 prose는 ingestion하지 않는다.

원문 glyph 전사, 표 구조, normalized rule은 `transcription.json`, `normalized-rule.json`, `comparison.json`에서 분리한다. OCR은 `exploration_only_not_canonical`이고, 납음 glyph와 표 방향은 2차 검수 대기 uncertainty로 남긴다.

## 계산 계약

유효 입력은 생년 천간 10 × 음력월 1–12 × 시지 12 = 1,440개다. 월은 이미 음력월로 확정된 입력이며 윤달 변환·달력 전처리는 범위 밖이다. 순서는 (1) 寅에서 음력 1월을 순행 배치, (2) 해당 월궁에서 시지를 역수해 命宮 지지 산출, (3) 생년 천간으로 `甲己丙寅頭; 乙庚戊寅頭; 丙辛庚寅頭; 丁壬壬寅頭; 戊癸甲寅頭`를 적용해 궁간 산출, (4) 命宮 천간·지지를 六十花甲·納音에 조회, (5) 納音 오행을 `水二局·木三局·金四局·土五局·火六局` 및 enum으로 명시 매핑한다.

source evaluator는 `src/ziwei/fiveElementBureauCleanRuleSeedPilot.js`에서 독립적으로 계산한다. production evaluator/table을 import하거나 복사하지 않으며, production result는 materializer의 명시적 이름·오행 normalization 경계에서만 비교한다. engine·rule contract·기존 명궁·신궁 artifact는 수정하지 않는다.

## 판정과 한계

각 row에는 canonical input, 중간값, source result, production result, match/mismatch, deterministic ID를 남긴다. mismatch가 있으면 transcription/table direction, stem/branch boundary, Nayin/mapping interpretation, edition variant, production implementation, comparison configuration 가능성을 함께 보존하며 원인을 확정하거나 adapter로 숨기지 않는다. 판정은 문헌 규칙 provenance와 계산 대조일 뿐 역사적·현실적 진실성, 개인 의미 claim, 독립 검증이 아니다. stable claim `0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental`을 유지한다.

산출물은 `artifacts/ziwei-five-element-bureau-clean-rule-seed-pilot-v0/complete.json` 및 integrity sidecar다. materializer를 반복 실행해 모든 bytes가 동일한지 확인하고 checker와 negative fixture가 PDF/sourceRef, uncertainty/OCR, transcription-normalization 혼합, domain 누락·불가능 tuple, mapping 변경, evaluator 재사용, mismatch 은폐, 현대 주해, 기존 artifact/contract/promotion, ID/order/hash 변조를 거부한다.
