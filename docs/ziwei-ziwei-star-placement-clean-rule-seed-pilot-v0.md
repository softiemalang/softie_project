# Ziwei 紫微 star-placement clean-rule seed pilot v0

기준 HEAD는 `b7544e0d66e3d6a5cee57167a96b208669f4c865`이다. PDF는 직접 읽어 SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, 219 pages, 비암호화를 확인했다. PDF/render는 Git에 넣지 않는다.

핵심 source는 page 11 / 인쇄면 `三十一` / `起紫微五訣`의 오행국별 초일·진행 문구와 page 12 / 인쇄면 `三十三` / `起紫微簡索表`의 1–30일 × 5국 표다. page 9–10 / `二十七`–`二十八`은 upstream 오행국 provenance와 보조 구조만 참조한다. 원문 전사, normalized rule, comparison은 별도 artifact다. OCR은 `exploration_only_not_canonical`이며 불확실한 glyph는 자동 확정하지 않는다.

유효 입력은 source가 요구하는 이미 확정된 오행국 5개와 음력일 `1..30`의 150개 조합이다. source evaluator는 `ceil(day/bureau)` 몫, 보정 나머지 `q*bureau-day`, 0 나머지 경계, 홀수 역행/짝수 순행, 寅 기준 12지지 index를 독립 구현한다. 양음력 변환, 윤달, 명궁·신궁·오행국 재산출은 upstream 경계다. 전통명↔engine enum과 紫微↔`ziwei` mapping은 비교 경계에서 명시한다.

production engine/table/fixture와 기존 witness·acceptance artifact는 수정하지 않는다. 각 row는 canonical input, 중간값, source 결과, production 결과, match/mismatch, deterministic ID를 보존한다. mismatch 원인은 전사·표 방향, 몫/나머지·경계, 진행/index, adapter, 판본, production, comparison configuration 가능성을 병렬 보존하며 확정하지 않는다.

판정은 문헌 provenance와 계산 대조일 뿐 현실적 진실성·개인 의미 claim이 아니다. stable claim `0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental`을 유지한다. 천부성·기타 주성은 범위 밖이다.
