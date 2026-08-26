# 起運 `足·多·欠/借` endpoint bounded successor v1

상태: `bounded direct corroboration`, `一時 residual repeated`, `一時→十天 single-surface only`, `historical bridge not yet established`, `semantic authority/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 [endpoint equality-boundary successor v1](./saju-dayun-endpoint-equality-boundary-successor-v1.md)의 후속 기록이다. 기존 `亥正一刻八分 → 亥時` fine-to-coarse 사례를 수정하지 않고, 두 page surface에서 반복된 `足·多·欠/借` 처리를 additive하게 기록한다. 문헌의 직접 문면과 현대 계산 규격을 분리하며, 이 문서 자체는 특정 판본 계보·공통 저본·정본성·semantic authority·production readiness를 주장하지 않는다.

## 1. Bounded conclusion

두 직접 page surface에서 다음 패턴이 반복된다.

```text
same recorded birth/term time  -> 乃足一歲
one source-reported 時 later    -> 多一時 / 多十天
one source-reported 時 earlier   -> 少一時 / 借 / 欠十天
```

따라서 다음의 source-local claim만 승격한다.

> 출생시각과 선택된 節 시각이 같은 `丑時正一刻`로 기록된 경우, 두 문헌의 worked example은 `足一歲`라고 보고한다. 한 `時`의 잔여는 `多`, 한 `時`의 부족은 `少`로 표지되며, 부족을 `借` 또는 `欠`으로 부른다.

`一時→十天`은 《新命理探原》 p.82에서 직접 명시되지만, 현재 확보한 《命理集成》 page에서는 `多一時/少一時`와 `不足當借。借即欠也`까지가 안전한 직접 문면이다. 따라서 `一時→十天`은 아직 두 witness에 걸친 반복 규칙이나 historical bridge로 승격하지 않는다.

## 2. Direct source surfaces

| surface | locator / route | literal observation | safe role |
| --- | --- | --- | --- |
| NLC-attributed public derivative 《命理集成》 | public PDF p.68, printed `四七`; metadata `NLC data_416,13jh001663,59235` | `丑時正一刻` equality → `乃足一歲`; `寅時` → `多一時`; `子時` → `少一時`; preceding rule `不足當借。借即欠也` | page-level visual wording; public derivative, not NLC raw-byte or machine-binding proof |
| NCL official record + public derivative 《新命理探原》 | official accession `000002203`; public PDF p.82, printed `四〇` | `必足三十六時方算一日`; `必足三日方算一歲`; `若餘一時則為多十天`; `若少一時則為欠十天`; equality → `乃足一歲` | official record identity plus page-level public derivative; record/page-count discrepancy preserved |

NLC source route: [Commons record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf) · [public PDF](https://upload.wikimedia.org/wikipedia/commons/c/c3/NLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf).

NCL source route: [official record](https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203) · [official reader](https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203/reader) · [public PDF](https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf).

두 기관·두 digital route라는 사실은 물리적 item independence나 textual lineage를 닫지 않는다. NLC scan의 기관 raw bytes와 NCL 공개 PDF의 exact machine derivation도 별도 미확정으로 둔다.

## 3. Literal page-bounded comparison

### 3.1 《命理集成》 p.68 / printed `四七`

```text
以三日為一歲。
...
不足當借。借即欠也。
...
假如陽命正月初一日丑時正一刻生。
至初四日丑時正一刻立春節。乃足一歲。
若春在寅時則多一時。
若春在子時則少一時。
```

`零`·`借` 뒤의 page-local 글자와 단위는 불확실한 부분을 현대 단위로 보정하지 않는다. 안전하게 읽히는 비교는 `足 / 多一時 / 少一時 / 借即欠`이다.

### 3.2 《新命理探原》 p.82 / printed `四〇`

```text
必足三十六時方算一日。
必足三日方算一歲。
若餘一時則為多十天。
若少一時則為欠十天。
...
假如陽年生男正月初一日丑時正一刻生
至初四日丑時正一刻立春節乃足一歲
若春在寅時則餘一時為多十天
若春在亥時則少一時為欠十天。
```

여기서 `一時→十天`은 직접 문구로 닫힌다. 다만 “조금 전” worked example의 branch는 원면 그대로 `亥時`이며, 이를 `子時`로 교정하거나 한 branch-hour의 물리적 차이로 해석하지 않는다. 직접 확인된 것은 source가 그 경우를 `少一時 / 欠十天`으로 표지했다는 사실이다.

## 4. Claim adjudication

| claim | status | direct basis | not promoted |
| --- | --- | --- | --- |
| same `丑時正一刻` boundary → `足一歲` | `direct repeated bounded` | both p.68 and p.82 examples | modern inclusive operator, universal rule |
| one source-reported `時` after → `多` | `direct repeated bounded` | NLC `多一時`; NCL `多十天` | exact `刻·分` arithmetic |
| one source-reported `時` before → `少` and deficit label | `direct repeated bounded` | NLC `少一時`, `借即欠`; NCL `少一時`, `欠十天` | branch-distance normalization |
| `一時→十天` | `direct, NCL-local` | 《新命理探原》 explicit wording | cross-witness rule; historical bridge |
| `一時` as observed residual unit | `direct in these surfaces` | both pages use `一時` | universal minimum historical time unit |
| `正一刻` is discarded or rounded | `unresolved` | equality anchor includes `正一刻`, but residual is reported as `一時` | floor/ceil/nearest or truncation |
| NLC and NCL share a textual ancestor | `unresolved` | wording correspondence only | common copy, direct lineage, textual independence |
| semantic authority / implementation readiness | `blocked` | page wording does not define a modern procedure | production activation, modern calculator |

## 5. H/E/L/S/I/P boundary

| layer | state | reason |
| --- | --- | --- |
| H: institutional/catalog identity | `partial/direct` | NCL official record; NLC public derivative metadata |
| E: physical item / exact digital derivation | `unresolved` | public derivatives and record route do not close raw-byte binding |
| L: edition/textual lineage | `unresolved` | same wording is not a lineage proof |
| S: source wording | `direct` | target pages visibly contain the quoted endpoint language |
| I: semantic interpretation | `unresolved` | `少`/`借`/`欠` relation is source-local, not a modern operator |
| P: production/readiness | `blocked` | no complete authority, timing, endpoint, or machine contract |

## 6. Historical-bridge boundary

이 successor가 닫는 것은 `足·多·欠/借`의 page-level endpoint correspondence뿐이다. 《五行精紀》·《淵海子平》·《三命通會》 등 더 이른 문헌에서 같은 `一時→十天` 문구가 직접 원면으로 확인되기 전에는 다음을 주장하지 않는다.

```text
一時→十天 = 五行精紀의 직접 규칙
一時→十天 = 淵海子平·三命通會까지 이어지는 historical bridge
현대 1時=10日 계산 규격
```

후속 원면 조사에서는 각 문헌별로 `institutional record → actual page → literal wording → surrounding rule`을 따로 기록하고, title/검색 snippet/OCR/후대 요약만으로 bridge를 만들지 않는다.

## 7. Reproducibility and validation boundary

이 문서에는 대용량 PDF나 원면 derivative를 복사하지 않았다. 직접 확인에 사용한 page/hash baseline은 parent 문서의 기록을 재사용하되, 원본 bytes·machine binding은 별도 blocker로 유지한다.

문서 변경 검증 범위는 다음으로 제한한다.

```text
git diff --check -- docs/saju-dayun-endpoint-foot-surplus-deficit-successor-v1.md
staged path check: this document only
tests/build: skipped (documentation-only change)
```

기존 tracked 3개, 기존 Saju untracked 4개, 대용량 원본 및 판단 불가 파일은 stage·수정·삭제하지 않는다.
