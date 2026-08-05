# Ziwei major-star source-corpus provenance v0

판정: `complete_ziwei_major_star_source_corpus_219page_provenance_evidence_uncommitted`.

이 packet은 기존 `ziwei-major-star-coordinate-provenance-v0`를 수정하지 않고, 별도 namespace에서 source PDF screening과 14주성 evidence를 분리 보존한다. 보호 v0과 Tianfu 선행 evidence는 내용 재생성이 아니라 SHA-256/reference로만 연결한다.

## 페이지 coverage

source PDF의 실제 byte SHA-256은 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, PDF metadata page count는 219이다. 요청된 150-page scope와 실제 source가 불일치하므로 150을 임의로 잘라내지 않고 219페이지를 모두 기록했다. 따라서 이 packet의 page inventory와 150-row 비교 domain(五行局 5 × 農曆日 30)은 별개다. 219/219 페이지에 deterministic render hash와 screening status를 기록했으며, p3 및 p7–p17을 candidate/targeted reading locator로 연결했다.

p3, p7–p17 외 페이지도 page-level inventory의 각 row에 page number, render hash, status, `directReview`, classification, relevance, confidence, locator, reading level, exclusion reason을 남겼다. 219개 렌더를 직접 시각 검토했고, 직접 배치 규칙 또는 좌표 identity로 admission할 수 있는 범위만 candidate로 남겼다. 나머지는 `no_relevant_evidence`로 보존했으며 OCR은 admission 근거로 사용하지 않았다. `artifacts/.../inventory.json`은 summary가 아니라 219개 page row 자체를 담는다.

## 후보 및 주성 상태

- 직접 규칙: 紫微(p11–p12), 天府(p13).
- source-unresolved: 전체 219페이지 시각 검토 후에도 직접 배치 규칙이 admission되지 않은 나머지 12주성. 의존성은 紫微/天府 root와 repository implementation offsets로 보존한다.
- 紫微: 150/150 exact raw branch.
- 天府: raw 0/150, rotation-06 150/150, residual 0, first divergence `bureau-2-day-01`.
- branch ordinal/traversal과 palace semantic identity는 분리하며, palace identity는 unresolved다.

readiness는 `not_safe_to_start / blocked / experimental`; production rule/API/schema/enum/baseline/readiness/grounding/activation은 변경하지 않았고 production 선택도 수행하지 않았다.

Materializer: `scripts/materialize-ziwei-major-star-source-corpus-provenance-v0.mjs`.
Checker: `scripts/check-ziwei-major-star-source-corpus-provenance-v0.mjs`.
Negative checker/test: `scripts/check-ziwei-major-star-source-corpus-provenance-negative-v0.mjs`, `test/ziweiMajorStarSourceCorpusProvenance.test.js`.
