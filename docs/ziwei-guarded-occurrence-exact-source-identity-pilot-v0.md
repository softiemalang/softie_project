# Ziwei guarded occurrence exact source identity pilot v0

`verdictToken=source_lineage_partial`
기준 HEAD=`70a1ed69bc1d46ac70b283af7d722f01b47846b5`

## 범위와 선택

기존 `ziwei-guarded-occurrence-source-evidence-hardening-v0`의 네 occurrence만 입력으로 사용했다. 각 항목에 대해 기존 evidence ledger를 기준으로 문구·위치 대응, 전재 계보, 판본/scan 후보, repository 비교의 네 축을 0–2로 점수화하고, 합계 내림차순 후 stable occurrence ID 오름차순으로 정렬했다. `ziwei-occ-2260aba6ed2163e3`(career)가 8점으로 선택되었고, siblings/friends/mind는 각각 6점으로 탈락했다. career는 `官祿`가 궁명·조건부 문구·주성 문답에 반복되어 가장 구체적인 위치 대응을 가진다.

## 문헌 identity와 lineage

Wikisource의 《紫微斗數全書/卷一》에서 선택 text와 가장 가까운 위치는 `斗數準繩` 및 `諸星問答論`이다. `官祿遇紫府`와 `紫微原屬土，官祿宮主星`은 조건부/별 구성 문구이며, local Korean text의 완전한 번역이나 무조건적 정의가 아니다. NCL catalog는 Shanghai, 正統道藏, 影印本, 1923–1926, 3 volumes/1114-page record를 제공하고 CiNii는 Taipei의 1975 南北山人編註·童彭年校梓, 448-page reprint record를 제공한다. 어느 catalogued edition이 Wikisource 전재의 저본인지 연결하는 scan/file identity는 확인하지 못했다.

Wikisource와 CText는 같은 고전 텍스트의 병렬/전재 계보로 중복 독립 근거로 계산하지 않았다. MCU 2020 PDF는 궁명 taxonomy만 보조하며 selected rule의 독립 corroboration이 아니다. scan/PDF 파일은 저장하지 않았고, 파일 크기와 immutable hash는 `null`이다. URL과 catalog metadata만으로 immutable identity를 주장하지 않는다.

## 비교와 경계

repository raw text와 source의 exact/normalized match는 없고, `官祿` palace/alias 및 조건부 phrase는 부분 대응한다. source는 별·궁 조합과 조건을 요구하고, local text는 career/social position/capability라는 현대적 범위를 덧붙인다. omitted qualifier, wording drift, configuration mismatch, insufficient evidence와 반대 방향의 조건부 문구를 artifact에 보존했다.

최종 verdict는 `source_lineage_partial`이다. `boundary_evidence_candidate` 하나만 기록하며 stable claim, 현실적 truth validation, 사용자 적용, readiness, grounding으로 승격하지 않는다. stable claim은 0, readiness/grounding은 `not_safe_to_start`, grounding subset은 `blocked`, activation은 `experimental`을 유지한다.

재현 파일은 artifact `artifacts/ziwei-guarded-occurrence-exact-source-identity-pilot-v0/complete.json`, materializer/checker 및 negative fixture/checker, targeted test다. 반복 materialization은 complete.json byte identity와 artifact payload identity를 각각 검사한다.
