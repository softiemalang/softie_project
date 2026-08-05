# Ziwei palace-source acquisition field kit v0

이 문서는 `ziwei-palace-coordinate-semantic-identity-v0`의 봉인된 acquisition brief를 사람용 수색 임무서로 변환한 additive field kit다. 새 책·판본·저자·페이지를 추천하거나 채택하지 않는다.

## P0 blocker

현재 blocker는 12궁명이 `子丑寅…` 지지와 도식의 실제 칸에 어떻게 대응하고, 어느 ordinal·기산점에서 순행·역행하는지를 한 readable 원문 witness가 직접 이어주지 못한다는 것이다. 기존 p7은 지지와 도식 위치만, p8은 命宮·身宮의 방향 어휘만 보여 주므로 palace-name semantic identity는 막혀 있다. 따라서 수학적 `rotation-06` exact fit은 좌표 변환일 뿐 semantic identity가 아니며, 자료가 intake되기 전 blocker·readiness·production 선택은 바뀌지 않는다.

## 사용법

- 휴대폰에서는 artifact의 `quickMissionCard.json`만 본다.
- 현장에서는 `sourceAcquisitionGuide.json`의 원본 촬영 순서와 rejection 기준을 따른다.
- 자료 하나마다 `evidenceIntakeForm.json`의 고정 필드를 채운다.
- `potentially_sufficient`도 채택 판정이 아니라 human review 제출 가능 상태다.
- 후속 분석에는 `analystHandoffSchema.json`을 사용하고, 원본 파일·원문 glyph·layout·불확실성을 보존한다.

검색어는 sealed packet의 기존 terms에서만 나왔다. traditional/simplified/Korean-hanja 표기는 검색 보조어로만 분리되어 있으며 evidence가 아니다. 기존 packet에 없는 한국어 번역 검색어는 `requires_human_definition`이다.

## 필수 촬영

표지/서명, 서명·저자, 판권/간기·판본, 목차/권책, 대상 면 전체, 앞뒤 문맥, 페이지/엽 번호를 확보한다. 디지털 자료는 원본 URL/소장처·파일명·페이지 수·다운로드 시각·가능한 경우 실제 bytes의 SHA-256을 기록한다.

## 후속 경계

이 kit은 수색·provenance intake·bounded review handoff만 다룬다. 원문 수용, production rule 변경, readiness/grounding/activation 변경, 성격·운명 해석, ranking, LLM 호출은 금지된다. 기존 packet의 sourceRefs·verdict·hash는 입력으로만 읽고 수정하지 않는다.

## 기계 감사

- namespace: `ziwei-palace-source-acquisition-field-kit-v0`
- materializer: `scripts/materialize-ziwei-palace-source-acquisition-field-kit-v0.mjs`
- checker: `scripts/check-ziwei-palace-source-acquisition-field-kit-v0.mjs`
- negative checker: `scripts/check-ziwei-palace-source-acquisition-field-kit-negative-v0.mjs`
- targeted test: `test/ziweiPalaceSourceAcquisitionFieldKit.test.js`

checker는 다섯 target 누락, sourceRef closure 단절, acceptance 완화, OCR-only 허용, source identity 필드 누락, semantic promotion, quick card/guide drift를 fail-closed로 거부한다. materialization은 generatedAt를 쓰지 않고 UTF-8 final LF와 stable key order를 사용한다.
