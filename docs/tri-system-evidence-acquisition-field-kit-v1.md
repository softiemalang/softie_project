# Tri-System Evidence Acquisition Field Kit v1

<!-- schema=tri-system-evidence-acquisition-field-kit-v1 verdict=complete_tri_system_evidence_acquisition_field_kit_exhausted_uncommitted head=c327167ad490e808815cda3fe52e06304ca09c52 -->

기준 checkout은 `main`이며 `HEAD == origin/main == c327167ad490e808815cda3fe52e06304ca09c52`이다. 이 문서는 현재 코드와 실제 local bytes를 읽어 외부 acquisition action으로 변환한 운영용 kit이다. 기존 artifact·readiness·production rule은 변경하지 않았다. 전체 기계 판정과 원문 카드의 단일 source는 [complete.json](../artifacts/tri-system-evidence-acquisition-field-kit-v1/complete.json)이다.

## 판정 요약

| 체계 | 현재 진짜 blocker | readiness/activation | target | 우선순위 |
|---|---|---|---:|---|
| 사주 | 43 claims/126 occurrences 중 classical verification 0; 판본·전승 identity, calendar oracle, missing-time 정책, timing, 신살, 질적 규칙↔numeric heuristic semantic bridge | `availableForInterpretation:false`, production `blocked` | 6 | P0 2 / P1 4 |
| 자미두수 | 10 tracked blocker 중 8 still blocked: calendar/time, claim identity, independent oracle, 四化, Tianfu contradiction/semantic authority, 24 ambiguous 身主 surfaces, timing domain, palace semantic identity | `stableClaimCount:0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental` | 9 | P0 4 / P1 3 / P2 2 |
| Western True Node | production semantic contract, same-quantity independent oracle, frame/time/correction bridge, license/policy | `independentTrueNodeReference:pending`, production provider 없음, activation `blocked` | 4 | P0 2 / P1 1 / P2 1 |

총 target은 19개이며 그중 action-required 17개, 현재 범위의 명시적 no-action 2개이다. “exhausted”는 저장소 안에서 더 이상 안전하게 닫을 수 없는 frontier를 모두 구체적 acquisition target 또는 no-action으로 변환했다는 뜻이지, blocker가 해결되었다는 뜻이 아니다.

최우선 자료는 다음 세 가지다.

1. **Saju:** local five-PDF를 다시 구하는 것이 아니라, NDL/catalog-linked edition identity + 직접 page-image witness + 독립 non-clone witness를 확보한다. 시작 locator는 NDL `原本子平真詮考玄評註` (`BibID 000001683371`, `PID 12282002`)와 `三命通会 : 明朝版` (`BibID 027985956`, `HR511-L127`)이다.
2. **Ziwei:** 이미 보유한 Nanyangtang scan을 [일본 국립공문서관 Digital Archive F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html)의 공개 catalog/image identity와 연결하고, `十二宮冠蓋`/`定命身二宮`/`安紫微·安天府`의 full-page witness를 확보한다.
3. **Western:** Swiss/JPL/DE405 숫자 비교를 더 늘리지 말고, 같은 완전한 geocentric tropical instantaneous True Node를 직접 내며 license-usable한 독립 oracle을 찾는다. 동시에 semantic contract를 먼저 adjudicate한다.

## 불변식

- source presence, OCR, fixture match, numeric agreement, rotation transform은 claim authority가 아니다.
- authority, direct observation, deterministic relation, interpretation, licensing은 별도 edge로 기록한다.
- acquisition 성공은 claim/readiness/grounding/activation/production을 자동 승격하지 않는다.
- 모든 target의 production 예상 변화는 `unchanged`로 남는다.
- `-.jpg`는 unrelated untracked file로 보존한다.
- staging, commit, push, deploy, remote DB, production activation은 이 work order에서 수행하지 않는다.

## 이미 보유한 자료 inventory

### 실제 bytes를 보유하지만 authority가 부족한 자료

해시와 경로는 materializer가 이 checkout에서 실제 bytes로 다시 계산했다. 이 자료들은 재획득 대상이 아니라 비교·locator·identity-linkage의 입력이다.

| ID | 경로 | 페이지 | SHA-256 | 허용 재사용 | 부족한 점 |
|---|---|---:|---|---|---|
| `saju-local-ziping-zhenquan` | `/Users/softie/Documents/malang_lab/documents/子平真诠-沈孝瞻原著.pdf` | 27 | `449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692` | p2/p5/p26 locator candidate | edition/transmission/independent witness 미해결 |
| `saju-local-ditian-sui` | `/Users/softie/Documents/malang_lab/documents/滴天髓.pdf` | 158 | `6285805c91b79f1b5bccdfce1cdab1d7ec684731160b4191a25e8f1d23c229dd` | strength/yongshin locator candidate | derived export와 attribution만 있음 |
| `saju-local-yuanhai-ziping` | `/Users/softie/Documents/malang_lab/documents/淵海子平.pdf` | 202 | `c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12` | 十神/藏干 locator candidate | web-text export/source warning |
| `saju-local-qiongtong-baojian` | `/Users/softie/Documents/malang_lab/documents/穷通宝鉴.pdf` | 92 | `36d54cdc995d203fdceafcb52b2a0d4f57093ab1765c532db5418b46a96c4b19` | seasonal-strength locator candidate | edition/attribution unresolved |
| `saju-local-sanming-tonghui` | `/Users/softie/Documents/malang_lab/documents/三命通會.pdf` | 370 | `f09bce7c6dbe1e222746ad8c97f49d132ed4e8da6d3c1d0399b0824b3794593f` | five-elements/神煞 locator candidate | export attribution is not catalog/scan identity |
| `ziwei-local-nanbei-219p` | `/Users/softie/Documents/命-南北山人_紫微斗数全书.pdf` | 219 | `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023` | p4/p7/p8/p10 observations | branch/diagram ≠ palace semantic identity |
| `ziwei-local-nanyangtang-528p` | `/Users/softie/Documents/malang_lab/documents/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf` | 528 | `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc` | official identity-linked candidate | page admission/semantic review incomplete |

### 보유하지만 독립 authority가 아닌 artifact/oracle

- Saju `saju-local-source-corpus-observation-v1`와 `saju-five-classics-grounding-v0`: 직접 관찰과 locator candidate는 있으나 `edition_unresolved`, `independentAuthority:not_established`, classical verification 0.
- Ziwei palace semantic/frontier, inherited frontier, four-transform artifact: page observation, transform, discrepancy, scoped source evidence는 있으나 palace identity, Tianfu authority, independent oracle, stable claim boundary는 닫히지 않았다.
- Western DE405/JPL reader, CSPICE overlap, Horizons DE441 vectors, Swiss `SE_TRUE_NODE`, ERFA, Astrolog: diagnostic 역할은 분명하지만 같은 semantic authority가 아니다. Swiss는 비교 target이고, DE405/CSPICE/Horizons는 JPL-family/state evidence이며, ERFA/Astronomy Engine은 direct True Node API가 아니다. Astrolog는 local GPL approximation이다.

### 현재 보유로 분류하지 않은 자료

- KASI의 공식 서비스는 공개 locator이지만 관찰한 월별 서비스는 `2050-12`까지이며 1901–2100 bulk corpus/reuse license는 확보하지 않았다.
- Ziwei에서 catalog-linked second non-clone palace witness는 없다.
- Western에서 같은 완전한 semantic을 직접 출력하는 license-usable independent oracle은 확인되지 않았다.
- Swiss의 AGPL/Professional 선택, browser WASM/ephemeris data redistribution, preview/staging/production scope에 대한 서면 결정은 없다.

## Acquisition protocol

자료를 찾으면 먼저 내용보다 identity를 닫는다.

1. 기관·catalog ID·청구기호·소장처·서명·저자/편자·시대·판본·권책을 기록한다.
2. 표지, 서명/저자, 판권/간기/colophon, 목차/권책, 대상 면 전체, 앞뒤 문맥, 페이지/엽 marker를 원본 그대로 확보한다.
3. 다운로드/촬영 원본 bytes의 SHA-256을 계산한다. OCR은 locator 보조로만 보관하고 원문을 대체하지 않는다.
4. 표·도식은 전체 경계·방향·화살표·주어·단위를 한 frame에 넣는다.
5. mirror/reprint/modern transcription은 lineage를 확인하기 전 independent witness로 세지 않는다.
6. authority(기관/판본), observation(실제 보이는 glyph/layout), licensing(복제·배포 권리), semantic review(해석)는 각각 별도 intake field로 제출한다.

## Target cards

아래 카드는 사람이 바로 수색할 수 있는 요약이다. 각 카드의 전체 배열·문구·claim ID·sourceRef는 JSON artifact의 같은 `id`에 고정되어 있다.

### Saju

#### `SAJU-P0-IDENTITY-WITNESS` — P0 · high leverage

- **대응 blocker/claim:** `saju-b-source-identity`, `saju-b-core-rule-scope`; 4주·오행·십신·지지관계·格局·strength·用神 packets의 전체 claim set.
- **최소 세트:** exact local title의 catalog/holding identity, cover/title/author/editor/colophon, local observed section full-page images, `子平真詮` 또는 `三命通會` 독립 non-clone witness.
- **최강 세트:** rule family별 catalog-linked historical/critical edition 1개 이상, 두 non-clone witness의 page/folio alignment, 허용된 page-image bytes.
- **우선 locator:** `子平真詮` p2 `論十干十二支`, p5 `論刑沖會合解法`, p26 格局/雜格; `淵海子平` p2/p4/p6/p7/p8; `滴天髓` p2–6; `三命通會` 오행/神煞 sections. 해당 page는 반드시 실제 판본에서 재확인한다.
- **accept:** inputs/outputs/scope를 직접 읽을 수 있고 catalog identity·hash·page가 일치하며 lineage가 독립적이다. **reject:** catalog-only, OCR-only, local export mirror, 용어 나열만 있는 표, 숫자 일치.
- **왜 필요한가/기존 부족:** 5개 local PDF는 bytes는 확정됐지만 edition/transmission/independent authority가 없다. 기존 자료를 다시 구하는 target이 아니라 authority link + 독립 witness target이다.
- **확보 후 검증:** Saju source-claim observation/five-classics checker, exact page-image hash, disagreement matrix. source observation만 전진시키고 readiness/production은 unchanged.
- **접근/권리:** NDL `000001683371/PID 12282002`는 catalog 확인·digital access 제한, NDL `027985956/HR511-L127`는 2017 physical/paid edition이다. 복제·재배포 권리는 별도 확인한다.

#### `SAJU-P0-CALENDAR-ORACLE` — P0 · high leverage

- **대응 blocker/claim:** `saju-b-calendar-boundaries`; 절기·음력·윤달·역사 표준시·자시 경계.
- **최소/최강:** KASI date-specific rows + official 24절기/역서 output + KST/UTC standard-time record; 최강은 1901–2100 page-image/machine-readable corpus, method note, independent oracle, version/hash.
- **locator:** 입춘/24절기 전후, leap-month transitions, midnight/子時, historical timezone/DST. input date/time/location, calendar system, time scale, raw result를 같이 확보한다.
- **accept/reject:** official identity·coverage·metadata·raw output이 있고 adversarial boundary를 포함해야 한다. KASI 2050-limited service를 2100으로 외삽하거나 consumer calendar screenshot·timezone 없는 result는 reject.
- **기존 부족:** local converter/fixtures는 내부 regression이고 external authority가 아니다.
- **검증/예상 변화:** calendar fixture reconciliation, lunar converter/Saju external checker, before/after failure counts. covered input row만 scoped evidence가 될 수 있고 classical claim/readiness는 별도.
- **기관/권리:** [KASI 월별 음양력](https://astro.kasi.re.kr/life/pageView/5), [KASI 공식 증명서 신청](https://www.kasi.re.kr/kor/publication/pageView/131), [KRISS UTC(KRIS)](https://www.kriss.re.kr/board.es?bid=0031&mid=a10603000000). bulk extraction/commercial reuse는 서면 확인.

#### `SAJU-P1-MISSING-TIME-POLICY` — P1

- **대응 blocker/claim:** `saju-b-missing-time-rule`; unknown birth time candidate boundary.
- **자료:** 고전 책을 억지로 찾는 target이 아니다. “시각 미상에서 무엇이 결정되지 않는가, candidate를 어떻게 표시하는가, 子時/day rollover를 어떻게 다루는가”를 명시한 식별 가능한 기관·연구·전문가의 published policy/adjudication을 찾는다. 최강은 독립 정책 2개와 worked examples.
- **locator:** unknown/uncertain birth time, 子時/day boundary, candidate count/merge policy, author/date/version.
- **accept/reject:** false precision 금지와 candidate/user meaning 분리가 명시되어야 한다. 한 hour를 고르는 chart, 子時 언급만 있는 text, anecdote는 reject.
- **기존 부족:** code의 00:00/12:00/23:59 sampling과 `candidate_required`는 implementation policy이지 authority가 아니다.
- **검증/예상 변화:** source-claim observation + forced-hour negative fixture. documented policy claim은 가능하지만 missing-time interpretation/readiness는 blocked.
- **권리/결정:** 적합한 공식 candidate는 아직 확인되지 않았고 user policy approval이 필요하다.

#### `SAJU-P1-TIMING-RULES` — P1 · high leverage

- **대응 blocker/claim:** `saju-b-timing-rule`; `大運`, `起運`, `順/逆行`, `十二運`.
- **자료/locator:** 직접 rule witness와 independent table/example; `行運`, `大運`, `順行/逆行`, `起運`, `三日一歲`, `十二運/長生`, sex/year polarity.
- **accept/reject:** direction, adjacent term, conversion units, period stepping과 boundary가 모두 명시되고 recompute 가능해야 한다. current-cycle match·modern app·one-direction example은 reject.
- **기존 부족:** local solver coefficients와 target-date sampling만 있고 observed locator가 없다.
- **검증/예상 변화:** timing source observation + independent fixture reconciliation + negative promotion tests. covered timing claims만 scoped support; solver/readiness/production unchanged.
- **권리/후보:** NDL catalog-linked `子平真詮`/`三命通會` page-image를 우선 찾고, KASI는 astronomical term date에만 사용한다.

#### `SAJU-P1-EXPERIMENTAL-SEMANTIC-BRIDGE` — P1 · high leverage

- **대응 blocker/claim:** `saju-b-heuristic-semantic-equivalence`; strength·格局·用神.
- **자료:** `得令/得地/通根/旺衰`, `月令/透干/本氣/格局`, `用神/喜神/調候/扶抑`의 qualitative passages와, 이를 repository 0–100/threshold heuristic과 어떻게 구분하는지 밝힌 별도 domain review.
- **accept/reject:** field-by-field equivalence/partial/non-equivalence, counterexample, reviewer dissent가 있어야 한다. classical label을 붙인 현대 score table, correlation, 성공담은 reject.
- **기존 부족:** local experimental output과 locator candidate는 있으나 text가 numeric coefficient를 authorize하지 않는다.
- **검증/예상 변화:** qualitative source observation + semantic bridge review + numeric-promotion negative fixtures. qualitative claim만 scoped advance; numeric heuristic은 policy-only, activation unchanged.
- **이유:** 유명한 책 하나가 이 semantic bridge를 대신할 수 없으므로 가장 정직한 target은 source + adjudication의 두 층이다.

#### `SAJU-P1-SHINSAL-WITNESS` — P1

- **대응 blocker/claim:** `saju-b-shinsal-rule`; 천을귀인·화개·공망·양인 등 implemented mapping.
- **자료/locator:** `三命通會`의 `星曜神煞/神煞` direct table, reference axis와 all relevant stem/branch rows, page/folio identity, independent comparison.
- **accept/reject:** exact mapping/axis가 보이고 presence와 outcome/intensity가 분리되어야 한다. blog/modern table/axis 없는 mention/presence→prediction은 reject.
- **기존 부족:** local source milestone에서 shinsal locator가 0이다.
- **검증/예상 변화:** shinsal source observation/checker; mapping claim만 scoped support, interpretation/readiness blocked.

### Zi Wei Dou Shu

#### `ZIWEI-P0-PALACE-SEMANTIC-WITNESS` — P0 · high leverage

- **대응 blocker/claim:** `blocker-palace-semantic-identity`, `blocker-source-identity-unresolved`, `blocker-tianfu-rotation06-semantic-authority`; 궁명↔지지↔slot↔ordinal.
- **최소/최강:** NARA `F1000000000000101426` linked scan의 full page + 12궁명·branch·physical slot·ordinal/base/direction 직접 연결; 최강은 두 independent catalogued editions와 CC0/open bytes.
- **locator:** `十二宮冠蓋`, `定命身二宮`, `寅起月`, `命宮逆數·身宮順數`, `紫微五訣/安紫微/安天府`.
- **accept/reject:** five connections가 같은 readable context에 있어야 한다. rotation-06 fit, OCR, cropped diagram, catalog-only, modern convention assignment는 reject.
- **기존 부족:** Nanbei p4/p7/p8은 branch/diagram/traversal만 보여주며 palace-name semantic을 직접 잇지 않는다. Nanyangtang scan은 local 보유하지만 authority-linked page admission이 미완료다.
- **검증/예상 변화:** palace semantic frontier successor, acquisition/checker, production-coordinate comparison. human-review-ready 또는 scoped support까지 가능하지만 `stableClaimCount:0`과 readiness는 자동 변경하지 않는다.
- **후보/권리:** [NARA catalog](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html), [image file](https://www.digital.archives.go.jp/file/1078787). catalog metadata는 CC0이지만 image-level terms를 재확인한다.

#### `ZIWEI-P0-CALENDAR-TIME-ORACLE` — P0 · high leverage

- **대응 blocker/claim:** `blocker-calendar-time-source-identity`, `blocker-external-oracle-identity`; leap-month·calendar·子時 input.
- **자료/locator:** KASI/national observatory exact fixture rows, independent versioned calendar implementation, timezone/UTC/子時 metadata. leap-month, solar-term crossing, day rollover를 포함한다.
- **accept/reject:** same declared semantics·reproducible raw output·independence·license가 있어야 한다. local converter wrapper, timezone 없는 screenshot, one normal-date match는 reject.
- **기존 부족:** Ziwei input contract는 status만 기록하고 independent source/oracle를 갖지 않는다.
- **검증/예상 변화:** fixture reconciliation/checker; input claims만 scoped evidence, Ziwei rule/readiness blocked.

#### `ZIWEI-P0-CLAIM-SOURCE-IDENTITY` — P0 · high leverage

- **대응 blocker/claim:** `blocker-source-identity-unresolved`; occurrence identity/stable claim boundary.
- **자료:** source-specific catalog/edition/volume/folio/page/bytes hash, raw glyph/layout, unresolved/excluded rows, independent reviewer.
- **accept/reject:** mirror/reprint double-count를 막고 occurrence→claim merge를 검토 가능하게 해야 한다. title-page-only/OCR-only/confidence score는 reject.
- **기존 부족:** occurrence provenance는 있으나 stable claim boundary가 닫히지 않았다.
- **검증/예상 변화:** occurrence/admission checker, hidden-unresolved negative fixture. occurrence가 review-ready가 되어도 `stableClaimCount:0`, grounding blocked.

#### `ZIWEI-P0-TIANFU-CONVENTION` — P0 · high leverage

- **대응 blocker/claim:** `blocker-tianfu-raw-formula-contradiction`, `blocker-tianfu-rotation06-semantic-authority`.
- **자료/locator:** `安紫微/安天府`, `紫微五訣`, base branch, direction, coordinate meaning을 직접 말하는 page와 independent edition.
- **accept/reject:** Chen-anchor/Xu-anchor 중 무엇을 어떤 source가 말하는지, branch가 semantic palace인지 slot인지가 명시되어야 한다. legacy/source-aligned output, rotation-only proof, resolver output은 reject.
- **기존 부족:** 두 convention과 150/150 transform은 있으나 source authority choice가 없다.
- **검증/예상 변화:** Tianfu provenance/discrepancy checker; reviewed-with-limits까지 가능, production 선택·legacy default·readiness unchanged.

#### `ZIWEI-P1-FOUR-TRANSFORMATIONS` — P1 · high leverage

- **대응 blocker/claim:** `blocker-four-transform-source-witness`; 10천간×4사화 40 cells.
- **자료/locator:** `四化`, `化祿`, `化權`, `化科`, `化忌`의 full 10×4 table, stem axis, school/variant notes, page/folio.
- **accept/reject:** all cells와 header/footnote가 readable해야 한다. partial table을 complete로, OCR-only, school convention을 universal로 만드는 자료는 reject.
- **기존 부족:** `transformationRules.js`와 source-evidence artifact는 blocker를 보존한다.
- **검증/예상 변화:** cell observation/checker; edition-scoped coverage만 전진, resolver/readiness unchanged.

#### `ZIWEI-P1-EXTERNAL-ORACLE` — P1

- **대응 blocker/claim:** `blocker-external-oracle-identity`; external fixture chart reproduction.
- **자료:** independent authored calculator/manual worksheet, pinned rule-set/version/settings, raw input/output, licensing.
- **accept/reject:** repository resolver wrapper가 아니고 source/rule-set/setting이 식별되어야 한다. unversioned calculator, matching rows만 제출, wrapper diversity는 reject.
- **기존 부족:** 4 observed matches가 있으나 `verifiedMatches:0`; local runner는 independent oracle가 아니다.
- **검증/예상 변화:** fixture reconciliation에서 독립성 field를 검증하고 mismatch를 보존한다. match만으로 readiness/semantic authority는 승격하지 않는다.

#### `ZIWEI-P1-LIFE-BODY-LEGIBILITY` — P1

- **대응 blocker/claim:** `blocker-life-body-ruler-source-legibility`; 24/144 ambiguous 身主 surfaces.
- **자료/locator:** relevant 命主/身主/五行局 pages의 higher-resolution original image, full-page context, raw glyph alternatives, page/folio.
- **accept/reject:** 24 rows가 실제로 읽혀야 하며 남은 ambiguity는 계속 blocked여야 한다. OCR guess/crop-only/production output fill-in은 reject.
- **기존 부족:** 120 rows만 comparable, 24 rows는 source surface가 불명확하다.
- **검증/예상 변화:** before/after blocked count를 life/body/ruler checker로 확인; resolved rows만 direct observation.

#### `ZIWEI-P2-TIMING-DOMAIN` — P2

- **대응 blocker/claim:** `blocker-timing-domain-absent`; 大限/流年/流月.
- **자료/locator:** explicit source rule, production input/output contract, one complete independent cycle 또는 명시적 unsupported policy.
- **accept/reject:** start/direction/age-year mapping과 source/implementation scope가 explicit해야 한다. natal placement로 timing을 추정하거나 silent feature addition은 reject.
- **기존 부족:** 현재 Ziwei contract에는 timing domain·fixture·외부 대조가 없다.
- **검증/예상 변화:** bounded unsupported/timing artifact와 negative tests. 구현·readiness·production은 이 kit에서 변경하지 않는다.

#### `ZIWEI-NOACTION-RESOLVED-SCOPES` — no-action

`blocker-minor-star-source-witness`는 **6 implemented lucky-star rules 범위**에서, `blocker-12-major-star-direct-rules`는 **12 non-root relative rules 범위**에서 기존 evidence로 resolved 상태다. 새 복제판을 independent witness로 세지 않는다. root/Tianfu/palace semantics와 extended auxiliary stars에는 이 no-action을 확장하지 않는다.

### Western astrology

#### `WESTERN-P0-SEMANTIC-ADJUDICATION` — P0 · high leverage

- **대응 blocker/claim:** `western-b-production-contract`, `western-b-frame-time-correction-bridge`; `astrology.true-node`.
- **최소/최강:** mean/true/osculating, ascending node, geocentric center, ecliptic/frame/equinox, time scale, geometric/apparent correction, instantaneous longitude vs crossing-event를 고정한 source-backed contract + independent adjudication. 최강은 provider specification과 astronomical review.
- **locator:** [Swiss §2.2.2 True Node](https://www.astro.com/swisseph-download/doc/swisseph.pdf) printed pp.17–18/PDF p.20–21, [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)의 geometric/apparent, ecliptic of date/J2000, TDB, osculating elements.
- **accept/reject:** source와 oracle가 같은 complete quantity를 명시해야 한다. Swiss name alone, residual closeness, JPL state/OM only, code에서 frame을 추론하는 것은 reject.
- **기존 부족:** production True Node provider가 없고 current research는 semantic candidates만 가진다.
- **검증/예상 변화:** isolated semantic contract artifact와 true-node boundary checker; definition fields가 review-ready가 될 수 있지만 provider/readiness/activation은 unchanged.

#### `WESTERN-P0-INDEPENDENT-DIRECT-ORACLE` — P0 · high leverage

- **대응 blocker/claim:** `western-b-independent-same-semantic-oracle`; same complete True Node.
- **최소/최강:** source-backed independent implementation/data가 geocentric tropical instantaneous True Node를 직접 출력하고 pinned source/version/data, raw output, license를 제공. 최강은 2 independent implementations 또는 authoritative data + independent implementation, 1900–2101 boundary corpus.
- **accept/reject:** direct same quantity + evaluator/data independence + license-usable이 모두 있어야 한다. Moon crossing event, local state-derived candidate, JPL-family wrapper, GPL/unknown license, numeric closeness alone은 reject.
- **기존 부족:** Swiss는 target quantity, DE405/CSPICE/Horizons는 same-family/state, ERFA/Astronomy Engine은 direct API 없음, Astrolog는 GPL approximation.
- **검증/예상 변화:** isolated frontier intake, exact quantity identity → residual comparison → license checker 순서. `independentTrueNodeReference`는 모든 gate 뒤에만 pending에서 전진할 수 있다.
- **후보 구분:** [Astronomy Engine](https://github.com/cosinekitty/astronomy)은 MIT로 보이지만 direct True Node가 없는 near-miss; [Astrolog pinned source](https://github.com/CruiserOne/Astrolog/tree/5bf172ea231c4b6ea3d7e09ca307571354a41e8a)는 local-held GPL diagnostic이다.

#### `WESTERN-P1-LICENSE-POLICY` — P1

- **대응 blocker/claim:** `western-b-license-policy`; True Node provider deployment eligibility.
- **자료:** AGPL vs Professional 결정, official current contract/license bytes, browser/server/WASM/data redistribution에 대한 written confirmation, source/data hashes.
- **accept/reject:** product deployment shape와 wrapper/data/environment 범위를 직접 덮는 approval이어야 한다. public download, unpaid contract, GPL near-miss, local-only spike는 reject.
- **기존 부족:** `docs/astrology-license-resolution.md`와 local Swiss spike는 pending 질문을 기록할 뿐 서명·결제·written answer가 없다.
- **검증/예상 변화:** existing provider/license readiness checkers와 exact license/source/data hashes. license edge만 전진하며 public deployment/production은 이 kit에서 하지 않는다.

#### `WESTERN-NOACTION-NEAR-MISSES` — no-action

Swiss `SE_TRUE_NODE`, local DE405/CSPICE/Horizons, ERFA `eraMoon98`, Astronomy Engine, Astrolog는 이미 보유/조사한 역할 그대로 둔다. 각각 target definition, same-family corroboration, analytic negative control, state/event near-miss, GPL approximation이다. 이들을 다시 구해 missing qualified oracle로 세지 않는다.

## 기관·catalog 후보 판정

| 후보 | 상태 | 실제 확인된 identity/access | 권위 한계 |
|---|---|---|---|
| NARA F1000000000000101426 | confirmed official open-scan locator | `子060-0001`, 明刊本, 7卷, 2冊, public, image locator 1078787, metadata CC0 | page-level semantic review와 image terms 재확인 필요 |
| NDL `原本子平真詮考玄評註` | confirmed catalog candidate | BibID `000001683371`, `HR511-201`, PID `12282002`, digital restricted | modern annotated edition; access/reproduction 제한 |
| NDL `三命通会 : 明朝版` | confirmed catalog candidate | BibID `027985956`, `HR511-L127`, 東洋書院 2017, 866p | physical/paid modern reprint; local PDF와 same edition 아님 |
| KASI lunar/solar service | confirmed official locator | public service, observed range -59 to 2050-12; certificate request channel | 1901–2100 bulk corpus/reuse terms 미확정 |
| KRISS UTC(KRIS) | confirmed official locator | official UTC(KRIS)/KST documentation | standard time authority이지 astrology rule authority 아님 |
| Chinese Text Project | confirmed project locator candidate | public pages and OCR/image context | OCR draft·modern transcription; primary authority 아님 |
| Swiss Ephemeris manual | confirmed official technical source | §2.2.2 direct semantic text | comparison target itself; independent oracle 아님 |
| NASA/JPL Horizons manual | confirmed official technical source | frames, geometric/apparent, TDB, osculating elements | direct tropical True Node field/semantic bridge 아님 |
| Astronomy Engine | confirmed open-source near-miss | public repo, MIT surfaced | direct instantaneous True Node API 없음 |
| Astrolog 8.00 | held local near-miss | pinned commit, GPL-2.0-or-later | approximation, high-precision authority/production license 아님 |

## 확보 후 공통 검증 순서

1. Original bytes/page images를 materialize하고 actual-byte SHA-256, catalog/edition, page/folio를 먼저 확인한다.
2. `authority`와 `direct observation`을 별도 record로 만든다. OCR/text normalization은 source image와 분리한다.
3. independent evaluator/oracle라면 implementation/data lineage와 license를 별도로 검사한다.
4. existing source-claim/frontier checker와 negative fixture를 실행하고 before/after counts를 보존한다.
5. 결과가 source/semantic/relation/interpretation/readiness 어느 층을 전진시키는지만 명시한다. readiness/activation/production은 별도 승인 없이는 그대로 둔다.

## 새 artifact와 checker

- Markdown: 이 문서.
- Machine-readable: `artifacts/tri-system-evidence-acquisition-field-kit-v1/complete.json`.
- 분해 artifact: `blockers.json`, `targets.json`, `evidenceInventory.json`, `sourceResearch.json` 및 각 integrity sidecar.
- Materializer: `scripts/materialize-tri-system-evidence-acquisition-field-kit-v1.mjs`.
- Checker: `scripts/check-tri-system-evidence-acquisition-field-kit-v1.mjs`.
- Checker가 강제하는 것: current blocker 전체 mapping, target별 accept/reject, authority/observation/licensing 분리, duplicate avoidance field, no-action scope, automatic readiness/production/claim promotion 금지.

## Git 및 남은 경계

현재 worktree의 이 work order 이전 변경은 `?? -.jpg` 하나이며 보존한다. 새 파일은 아직 commit하지 않았다. 이 kit의 `complete` verdict는 acquisition frontier가 소진되었다는 문서 상태이지 Saju/Ziwei/Western readiness 승격이 아니다. 실제 다음 행동은 P0 target에 대해 유료·제한 열람·재배포 권리와 human semantic adjudication을 사용자가 선택하는 것이다.
