# 五行精紀 卷33 v4 parent adjudication

상태: `complete`, 단 `untrusted_candidate_only` 입력을 parent가 직접 검증한 bounded dossier이다. Gemini v4의 transcription, metadata, variant verdict, lineage conclusion은 canonical evidence로 import하지 않았다.

## Input boundary

검증 대상 candidate 파일은 다음 byte identity로 고정했다.

| role | bytes | SHA-256 |
| --- | ---: | --- |
| `luna-deep-collation-packet-v4.md` | 10,386 | `49f1408be79509ea5d1f598eafd3e63d9fe74ea290ddd156aa63e36170ecfc16` |
| `luna-deep-collation-matrix-v4.json` | 7,669 | `046e2e824fdc4011227e5b7b982802707591caecf903ef9c045906cc9f365f37` |

두 파일과 metadata sidecar는 byte identity만 인정했다. `candidateEvidenceAccepted=false`, `importedConclusionFields=[]`, `availableForInterpretation=false`를 유지했다.

## Unit A — direct leaf/page verification

K3-437은 장서각 공식 PDF `K3-437_006.pdf`의 PDF pp.71–72를 직접 렌더링해 읽었다. NLC는 공식 record/reader object `06857 / 411999013122 / 114503.0`를 확인하고, 그 object에 귀속된 공개 derivative의 PDF pp.105–106을 직접 읽었다. K3의 이번 target scan에서는 신뢰할 수 있는 printed-folio 번호를 확정하지 못했으므로 PDF page만 locator로 썼다. NLC p.105/p.106의 printed folio는 각각 `一`/`二`이다.

공식 record는 K3-437의 卷33 heading을 PDF p.71에서 확인하고, 두 target scan은 다음 crosswalk를 구성한다.

| locus | K3-437 direct reading | NLC 114503.0 direct reading | result |
| --- | --- | --- | --- |
| first 立春 clause | `是月二十九日申時立春` — PDF p.72 | `是月二十九日立春` — PDF p.106, folio `二` | **verified**: NLC가 첫 clause의 `申時`를 생략한다. 다만 뒤의 `至二十九日申時止`는 NLC에도 남아 있다. |
| worked-example opening | `譬如甲子陽男` — p.72 | `譬如甲子陽男` — p.106 | **corrected**: candidate의 `假令` alternative는 이 두 판면에서 보이지 않는다. |
| remainder expression | `乃是一歲奇九月之大運` — p.72 | `乃是一歲奇九月之大運` — p.106 | **corrected**: `一歲九個月` alternative는 직접 관찰되지 않는다. |
| conversion formula | `為四箇月之數` — p.72 주변 formula | `一日十二時得一百二十日為四箇月之數` — p.105, folio `一` | **corrected**: 두 판면 모두 `箇`; `四個月`은 이 crosswalk의 glyph variant가 아니다. |
| hour-to-day formula | `一時辰得十日之數` — p.72 주변 formula | `一時辰得十日之數` — p.105, folio `一` | **corrected**: NLC에서 `為十日`은 보이지 않는다. |
| full 約法 critique | `今人行運多用約法以一歲奇八月起運便以二歲九月過矣殊不明折除實歷之數也` — p.72 | 같은 expanded wording — p.106, folio `二` | **corrected**: NLC 축약형 `今人多用約法...不知折除實歷之細也`는 reject. `便以二歲九月過矣`와 `殊不明折除實歷之數也`가 남아 있다. |

따라서 variant summary는 `verified=1`, `corrected=5`, `rejected=0`, `unresolved=0`이다. `corrected`는 candidate-side alternative를 parent reading으로 교정하거나 reject한 상태이며, 두 판본이 해당 대목에서 실제로 서로 다르다는 뜻이 아니다. OCR, 현대 구두점, Unicode/정규화만의 차이는 variant로 세지 않았다.

## Unit B — identity, derivation, lineage

| witness | parent-verified first-party identity | metadata actually supported | not promoted |
| --- | --- | --- | --- |
| K3-437 | [장서각 공식 record](https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437), `K3-437`, `MF35-143~4`; [official PDF](https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf) | `木版`, `[刊年未詳]`, `線裝34卷6冊`; `四周雙邊`, 半郭 21.5×14.8cm, 有界, 半葉10行20字, 註雙行, 內向三葉花紋魚尾. 解題의 周必大序 1196, 岳珂序 1228, 廖中自序/總目錄 및 인장은 current-copy date/colophon이 아니다. | `四周單邊`, 관판/서원 계통, exact Joseon date, Song print, canonical edition, complete ownership chain. |
| NLC 06857 | [NLC official record](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_892&fid=411999013122), [reader object 114503.0](http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=892&bid=114503.0); public [derivative page](https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf) | rare no. `06857`, identifier `411999013122`, `抄本`, `清[1644-1911]`라는 broad catalog window, `10行24字，黑口，左右雙邊`, `存33卷：1～33`, reader fields `aid=892`, `bid=114503.0`, `海虞瞿氏恬裕齋`. | exact copy date, Song/ancient manuscript lineage, relation to K3-437, original NLC bitstream equality. 이번 pass에서는 공식 reader route와 NLC-attributed derivative를 분리 기록했으며 original NLC PDF byte는 independently downloaded하지 않았다. |

K3의 `[刊年未詳]`와 NLC의 `清[1644-1911]`는 각각 catalog field이다. 어느 쪽도 현재 physical copy의 정확한 간행/전사 시기, 서로의 edition relation, colophon/transmission edge를 닫지 않는다. `동일 passage + 실제 variant`는 relation을 좁히는 관찰이지 independent textual lineage의 증명이 아니다.

## Unit C — independence sub-axes

| axis | v3 baseline | v4 after | parent basis |
| --- | --- | --- | --- |
| physical-item | `satisfied` | `satisfied` | 두 기관의 실제 holding/item identity가 기록됨. |
| digital-derivation | `satisfied` | `satisfied` | K3 official PDF와 NLC object-attributed derivative가 별도 digital object임. NLC original bitstream equality는 미확인. |
| edition/textual-lineage | `unresolved` | `unresolved` | copy/edition relation, dated colophon/transmission edge, recension comparison 없음. |
| semantic-corroboration | `unresolved` | `unresolved` | 두 판면의 agreement는 직접 확인했지만 independent textual lineage/semantic authority가 닫히지 않음. |
| overall I | `unresolved` | `unresolved` | 실제 두 witness가 있어도 lineage 축이 unresolved이면 I를 승격하지 않음. |

별도로 `scopeLimitedCorrespondence=satisfied`를 기록했다. 범위는 `卷33 論大運 / 甲子陽男 worked-example ordered calculation + expanded 約法 critique`뿐이다. 이것은 bounded textual/semantic correspondence이지 independence의 `semantic-corroboration` satisfied가 아니며, implementation authority가 아니다.

## Unit D — third-witness reality check

- 원광대: bounded official-site search에서 item/catalog ID, 판종·연대의 first-party record, 卷33 inclusion, actual scan/reproduction을 확인하지 못했다. [AKS Sillokwiki의 secondary lead](https://dh.aks.ac.kr/sillokwiki/index.php/%EC%98%A4%ED%96%89%EC%A0%95%EA%B8%B0%28五行精紀%29)는 원광대 소장 34권6책 계열을 가리키는 metadata lead일 뿐이다. `乙亥字本(1455)`는 기관 원자료가 직접 지지하지 않으므로 승인하지 않았다. 상태: `INSTITUTIONAL_METADATA` / `PHYSICAL_ITEM_CANDIDATE`, corroboration 제외.
- 존경각: [공식 서비스](https://east.skku.edu/)가 `2026-08-15 00:00 ~ 2026-08-18 10:00` outage 상태여서 item ID, 판종·연대, 卷33, reproduction을 확인하지 못했다. [공식 collection overview](https://www.skku.edu/skku/campus/skk_comm/news.do?article.offset=0&articleLimit=10&articleNo=127029&mode=view)는 기관 경로 확인용으로만 기록했다. Gemini의 `34권 완본`, `宋版`, `古鈔本`은 candidate-only이다. 상태: `UNRESOLVED`, corroboration 제외.
- Kyujanggak은 [공식 record](https://kyudb.snu.ac.kr/book/view.do?book_cd=GC01822_00)의 `奎中1822-v.1-5`, `28卷5冊(零本)`, `卷29-34缺` 때문에 卷33 third witness가 될 수 없는 negative control이다.

다음 acquisition P0는 (1) 존경각 서비스 재개 후 공식 catalog ID와 卷33 reproduction을 확보하는 것, (2) 원광대 도서관 first-party catalog/복제 경로에서 동일 필드를 확보하는 것이다. actual third-witness page 또는 기관이 제공하는 정상 reproduction이 없으면 semantic corroboration에 포함하지 않는다.

## Unit E — additive reconciliation

typed-readiness baseline `artifacts/saju-five-classics-typed-readiness-contract-v0/complete.json`의 13-claim population을 그대로 보존했다. H/E/L/S/I/P gate counts는 다음과 같이 변하지 않았다. 표기 순서는 `conflicted / satisfied / unresolved`이다.

| gate | before | after | transition |
| --- | --- | --- | --- |
| H | `0 / 13 / 0` | `0 / 13 / 0` | unchanged |
| E | `0 / 12 / 1` | `0 / 12 / 1` | unchanged |
| L | `0 / 1 / 12` | `0 / 1 / 12` | unchanged |
| S | `1 / 11 / 1` | `1 / 11 / 1` | unchanged |
| I | `0 / 0 / 13` | `0 / 0 / 13` | unchanged |
| P | `1 / 0 / 12` | `1 / 0 / 12` | unchanged |

Additive admission은 다음 세 scope만 남겼다.

1. `historical_observation_stability`: K3/NLC target-page identity, PDF-page/render hash, heading/formula/worked-example direct observation, six-locus crosswalk.
2. `bounded semantic/textual correspondence`: 위 Unit C의 제한된 worked-example와 expanded critique.
3. `lineage-specific stability`: `unresolved`; K3↔NLC edition/textual-lineage edge가 없으므로 승격하지 않음.

결과는 `promotion_0_normal`, `stableClaimPromotionCount=0`, `promotionReadyClaimIds=[]`, `availableForInterpretation=false`, `semanticAuthority=not_established`, `implementationSafeGrounding=not_established`, `productionActivation=blocked`이다. 특정 판본을 정본으로 선언하지 않았고 자동 implementation/production activation도 하지 않았다.

## Artifacts and validation

- Source: `src/interpretationPrep/sajuLunaDeepCollationAdjudicationV4.js`
- Materializer: `scripts/materialize-saju-luna-deep-collation-adjudication-v4.mjs`
- Checker: `scripts/check-saju-luna-deep-collation-adjudication-v4.mjs`
- Test: `test/sajuLunaDeepCollationAdjudicationV4.test.js`
- Artifact: `artifacts/saju-luna-deep-collation-adjudication-v4/complete.json`
- Integrity sidecar: `artifacts/saju-luna-deep-collation-adjudication-v4/complete.json.integrity.json`

현재 materialized artifact의 payload SHA-256은 `245588a0e4daf6466cf72123fc150e596734060afaca2f404796669ae84930dd`, complete.json byte SHA-256은 `d2034c677681de2a484a1fae767df749f2795fd7923cec8112adb03edb4351bc`이다.

검증 결과:

- `node --check` source/materializer/checker: pass
- v4 focused `node --test test/sajuLunaDeepCollationAdjudicationV4.test.js`: 3 pass, 0 fail
- materializer: pass; 8 claims, 1 verified + 5 corrected variants, promotion 0
- checker replay + integrity sidecar: pass
- `npm run build`: pass (`vite build`)
- `git diff --check`: pass; new v4 files were additionally checked for trailing blank characters
- `npm test`: 792 tests / 752 pass / 38 fail / 2 skipped. The failures are pre-existing environment/input-boundary failures for missing external PDF/image fixtures (`PDF_SOURCE_NANBEI_PATH`, `PDF_SOURCE_NANYANGTANG_PATH`, `TOYO_IMAGE_MISSING`, and related `MISSING_SOURCE_FILE` cases); the v4 focused tests remain pass.
- OCR: skipped/blocked as locator-only; direct visual review와 byte/render identity가 textual basis이다. OCR/현대 punctuation을 variant로 사용하지 않았다.
- staging, commit, push, deploy, remote DB 변경: 수행하지 않았다.

남은 real blocker는 K3↔NLC edition/textual-lineage/colophon relation과 third-witness의 actual 卷33 page이다. 이 경계가 닫히기 전에는 I, semantic authority, interpretation readiness, implementation safety, activation을 열 수 없다.
