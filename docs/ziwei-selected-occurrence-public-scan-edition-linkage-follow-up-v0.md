# Ziwei selected occurrence public scan-edition linkage follow-up v0

기준 HEAD는 `42632ff6eb8331b588f4b857c976036d0771a388`이고, 조사 범위는 `ziwei-occ-2260aba6ed2163e3` (`career`) 하나와 NCL 1923–1926 상하이 영인본 및 CiNii 1975 타이베이 재전본 계열 두 개로 고정했다. 접근일은 2026-08-04이다.

## 판정

최종 verdict는 `public_scan_linkage_unresolved`이다. NCL은 `rarecatx0428879`와 중국국가도서관 소장을 확인할 수 있고, CiNii는 `BA73215996`와 도쿄도립중앙도서관 소장기호 `C1488||5002||75 400005729`를 확인할 수 있다. 그러나 공개 고정 PDF, page image, image manifest, file/view ID가 두 기록에서 확인되지 않았다. 따라서 두 holding은 기록되었지만 scan/page linkage는 미확인이다.

Wikisource `卷一`의 `官祿` 관련 조건부·구성 의존 문구와 기존 occurrence의 `직업, 사회적 위치, 역량 발휘` 사이에는 palace-name 및 부분 문구 대응만 남긴다. 판본 page가 없으므로 exact/normalized match는 모두 `false`, page는 `page_not_located`, 특정 판본 계보는 주장하지 않는다. viewer 화면·동적 HTML·catalog URL만으로 file size, ETag, checksum, immutable hash를 만들지 않았으며 scan bytes도 저장하지 않았다.

기존 raw text, provenance, guard는 source artifact에서 복사해 checker로 보존을 확인한다. stable claim과 verified fact는 0, readiness는 `not_safe_to_start`, grounding subset은 `blocked`, activation은 `experimental`로 유지한다. legacy source-recovery 트랙은 동결하고 clean Ziwei rule corpus로 전환한다. 추가 scan 추적은 이 bounded attempt의 결과로 자동 권고하지 않는다.

검증 artifact는 `artifacts/ziwei-selected-occurrence-public-scan-edition-linkage-follow-up-v0/complete.json`이며 materializer/checker/negative fixture는 각각 `scripts/`와 `test/fixtures/ziwei/`에 있다.
