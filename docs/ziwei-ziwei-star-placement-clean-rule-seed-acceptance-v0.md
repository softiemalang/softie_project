# 紫微星 placement p11–p12 acceptance v0

기준 HEAD는 `1718885bf785cf57388b62b51783230ab303691c`이다. 대상 PDF는 실제 파일 byte에서 SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, `219` pages, `Encrypted: no`를 확인했다. p11/p12는 `pdftoppm`, PNG, `300 dpi`, `-f N -l N -png -r 300 -singlefile`로 저장소 밖에서 렌더링했으며 p11 hash는 `e10b1b30c7928b2cc8e3afcbf3efec3c8d0cbdc9434233a939677869b8402201`, p12 hash는 `0cc8f8a56ce4b839f300a141f8fe9aa6f035801fda0e7464a3acab0e8af363b`이다. PDF/render는 Git에 넣지 않는다.

reviewer-B는 p11 `三十一 / 起紫微五訣`의 세로 문단과 五行局별 시작 위치, p12 `三十三 / 起紫微簡索表`의 五行局 열×生日 1–30 행을 직접 렌더링에서 읽었다. 열 방향은 그림대로 우→좌, 행은 1..30으로 보존했다. OCR은 canonical이 아니다. 기존 pilot을 같은 agent context에서 reviewer-B 고정 전에 열었으므로 완전 blind는 입증하지 않으며 이 한계를 artifact에 명시했다.

## 판정

`ziwei_ziwei_star_placement_seed_accepted_with_declared_limits`

직접 source trace와 독립 source evaluator를 production `starResolver.js`와 비교한 150개에서 `150 match / 0 mismatch / first divergence null`이다. 누락 0, 중복 row ID 0이며 bureau별 30개다. source trace는 quotient, 보정 remainder, 나누어떨어짐, 홀수 역행/짝수 순행, 寅 기준 modulo 12, 五訣·簡索表 locator, 지지 enum mapping을 각각 보존한다. semantic discrepancy가 없으므로 pilot/engine/rule contract는 고치지 않았다.

기존 pilot의 transcription `b6f6a43a0f11761e0e88f52cc36c73a28ba3977c68327861cbf7176d50932c05`, normalized rule `a7c7033566f46e3c32f5ee31f52c538ead2ab0a154b362b6f742ffbd45584370`, comparison `71aa749d3d8bf0a02103c371f3a752d857df6c70b9ed1c2a330f32f847545f4a`를 실제 byte로 재검증했고 불변으로 기록했다. 이 acceptance artifact는 `baseHead`를 기준 HEAD로 고정하고 현재 HEAD 관찰값을 별도 기록하며, post-commit identity 때문에 기존 pilot을 다시 쓰지 않는다.

stable claim `0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental`은 유지한다. 이는 문헌 규칙 provenance와 계산 대조이며 개인 의미, 역사적 진실, production readiness, grounding 또는 activation claim이 아니다. 천부성·기타 주성·현대 주해·UI/API/DB/LLM/prompt/deploy는 범위 밖이다.

재현/검사 명령은 다음과 같다.

```text
node scripts/materialize-ziwei-ziwei-star-placement-clean-rule-seed-acceptance-v0.mjs
node scripts/check-ziwei-ziwei-star-placement-clean-rule-seed-acceptance-v0.mjs
node scripts/check-ziwei-ziwei-star-placement-clean-rule-seed-acceptance-negative-v0.mjs
```

산출물의 sidecar는 actual UTF-8 bytes와 final LF를 hash한다. materializer 반복 실행은 byte-identical이며, negative checker는 source-first 위장, PDF/render hash 변조, OCR/불명확 glyph 승격, 표 방향 은폐, semantic mismatch 은폐, pilot overwrite, production evaluator 재사용, 150 forcing, scope/readiness 승격, Git 포함, 비결정적 ID/order/hash, HEAD 차이를 이용한 기존 artifact 재작성 mutation을 fail-closed로 검출한다.
