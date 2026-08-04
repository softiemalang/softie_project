# Ziwei five-element bureau clean-rule seed acceptance v0

기준 HEAD는 `462164466edd559aaecc58a690d2845ba35f7f45`이다. 원본 PDF는 실제 byte에서 SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, 219 pages, 비암호화로 확인했다. 저장소 밖 `/private/tmp/ziwei-five-element-bureau-review-4621644`에 `pdftoppm` 300 DPI PNG p9–p12를 고정했고, page/printed-page/target-half/render SHA-256을 reviewer-B artifact에 기록했다. PDF와 render는 Git에 넣지 않는다.

Reviewer-B는 대상 PNG를 직접 판독해 p9 `二十七`의 30개 六十花甲納音 pair, p10 `二十八`의 命宮天干/地支 matrix 방향, p11 `三十一`과 p12 `三十三`의 보조 국수 순서를 기록했다. 이 agent 작업에서는 기존 pilot을 먼저 열었으므로 완전 blind human review는 입증하지 못하며, OCR은 canonical evidence가 아니다.

기존 pilot과의 공개 차이는 full glyph/source scope 보강, p10 열 방향과 visible row example의 명시, p11/p12 보조 범위, 그리고 문헌 직접 근거와 implementation normalization의 경계다. 모두 semantic discrepancy가 아닌 `layout only` 또는 `uncertain rule-neutral`로 분류되어 pilot·production engine·rule contract는 수정하지 않았다.

Acceptance는 독립 source evaluator와 production evaluator를 10×12×12 전 조합으로 재실행한다. 결과는 `1,440 match / 0 mismatch / first divergence null`, 각 enum 288건이며, row ID와 ordering은 입력에서 결정한다. 생년 천간·명궁 궁간 산출, 納音 lookup, 水二局/木三局/金四局/土五局/火六局 mapping, modulo·enum은 source trace에서 직접 문헌 근거와 normalization을 분리한다.

판정은 `ziwei_five_element_bureau_seed_accepted_with_declared_limits`이며 전통 문헌 규칙의 source-backed reconciliation에 한정한다. stable claim `0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental`을 유지한다.
