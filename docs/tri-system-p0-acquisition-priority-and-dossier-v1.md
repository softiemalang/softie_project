# Tri-System P0 acquisition priority and dossier v1

<!-- schema=tri-system-p0-acquisition-priority-and-dossier-v1 verdict=complete_tri_system_p0_acquisition_priority_and_dossier_exhausted_uncommitted head=ee833c0607650897aa76ae7a3b3636337e291117 -->

이 문서는 기존 `tri-system-evidence-acquisition-field-kit-v1`을 수정하지 않는 additive successor다. 기존 Field Kit artifact와 문서에서 P0 8개를 다시 읽어 동일 기준으로 비교하고, 사용자가 실제 자료를 찾을 때 바로 쓸 수 있는 1순위 dossier를 붙였다. 이 문서의 `exhausted`는 조사·우선순위·locator frontier가 현재 권한에서 소진되었다는 뜻이지, source claim/readiness/activation/production이 승격되었다는 뜻이 아니다.

## 판정

지금 가장 먼저 확보할 단일 target은 **`ZIWEI-P0-PALACE-SEMANTIC-WITNESS`**다.

가장 유력한 기관 경로는 일본 국립공문서관 디지털 아카이브의 **`新鋟希夷陳先生紫微斗数全書`**, record `F1000000000000101426`, file `1078787`, volume item `4468520`이다. 이 record는 `子０６０－０００１`, 明刊本, 陳搏（宋）/潘希尹（明）, 7巻, 2冊, 公開를 보여 주며, metadata의 2차 이용은 CC0로 표시된다. 다만 viewer 검색 결과에는 `館内限定閲覧`이 표시되고 image-level 이용 조건은 별도 확인이 필요하므로, **무료 원본 다운로드가 확정된 것으로 말하지 않는다**.

이 target이 1순위인 이유는 한 공식 identity-linked witness가 다음 세 경계를 동시에 검사할 수 있기 때문이다.

- palace name ↔ branch ↔ physical slot ↔ ordinal/direction semantic identity
- occurrence source identity와 stable claim boundary
- `安紫微`/`安天府` 및 `rotation-06`의 semantic authority

차선은 다음 두 개다.

1. **`SAJU-P0-CALENDAR-ORACLE`** — KASI 공개 질의로 boundary row를 즉시 만들 수 있고 Saju/Ziwei upstream에 재사용할 수 있다. 단, 1901–2100 corpus와 bulk/reuse 권리는 닫히지 않았다.
2. **`ZIWEI-P0-CLAIM-SOURCE-IDENTITY`** — 모든 occurrence의 provenance gate다. 다만 1순위와 같은 NARA witness를 많이 재사용하므로 별도 첫 수색보다 1순위 intake의 identity/lineage 단계에 묶는 편이 효율적이다.

실제 비교 artifact의 rank는 다음과 같다.

| rank | target | system | blocker 수 | score / 100 | 판정 |
|---:|---|---|---:|---:|---|
| 1 | `ZIWEI-P0-PALACE-SEMANTIC-WITNESS` | Ziwei | 3 | 88.4 | 선택 |
| 2 | `SAJU-P0-CALENDAR-ORACLE` | Saju | 1 | 85.2 | 차선 1 |
| 3 | `ZIWEI-P0-CLAIM-SOURCE-IDENTITY` | Ziwei | 1 | 84.4 | 차선 2; 1순위와 묶음 수색 |
| 4 | `ZIWEI-P0-CALENDAR-TIME-ORACLE` | Ziwei | 2 | 79.2 | KASI evidence와 중복 |
| 5 | `WESTERN-P0-SEMANTIC-ADJUDICATION` | Western | 2 | 78.0 | public docs는 있으나 adjudication 필요 |
| 6 | `ZIWEI-P0-TIANFU-CONVENTION` | Ziwei | 2 | 77.0 | 같은 witness 가능성은 높지만 오인 위험 큼 |
| 7 | `SAJU-P0-IDENTITY-WITNESS` | Saju | 2 | 63.2 | blocker fan-out은 크나 접근·판본 확정이 약함 |
| 8 | `WESTERN-P0-INDEPENDENT-DIRECT-ORACLE` | Western | 1 | 51.0 | 현재 확인된 direct same-semantic candidate 없음 |

## Source of truth와 범위

P0 목록은 기억이나 과거 보고서에서 추정하지 않고 다음 현재 checkout bytes에서 재구성했다.

- branch: `main`
- `HEAD`: `ee833c0607650897aa76ae7a3b3636337e291117`
- `origin/main`: `ee833c0607650897aa76ae7a3b3636337e291117`
- predecessor artifact: `artifacts/tri-system-evidence-acquisition-field-kit-v1/complete.json`
- predecessor artifact SHA-256: `22f4198092b88ea50d0018d53fc6c69c62903ec6f6b7d4ff472be2757aa2ad7d`
- predecessor document SHA-256: `9f407ddef74227234de0fd8a03b7682ee2ccf1f23e7cd7b4d8f827e33c70968d`
- 기존 `?? -.jpg`: 보존됨

새 artifact는 `sourceOfTruth.predecessorFieldKit`에 predecessor byte hash와 P0 ID 8개를 기록한다. 이 work order에서는 기존 Field Kit, readiness artifact, production calculation, fixture, source bytes를 수정하지 않았다.

## 동일 비교 기준

모든 P0에 0–5 점을 적용했다. 점수가 높을수록 좋고, `wrongMaterialRisk`만 “잘못된 자료를 고를 위험이 낮다”는 뜻이다. 점수는 acquisition planning 판단이며 claim/evidence/readiness의 증거가 아니다.

| 기준 | 가중치 | 판단 질문 |
|---|---:|---|
| blocker 중요도 | 15 | 안전 경계·상류 오염·fan-out이 얼마나 큰가 |
| multi-blocker leverage | 15 | 한 자료가 몇 blocker와 다음 frontier를 함께 여는가 |
| 현재 자료와의 non-duplication | 15 | 이미 가진 PDF/fixture를 다시 요청하지 않는가 |
| source authority 잠재력 | 12 | 기관 catalog·원판/고전 판본·공식 technical source인가 |
| 실제 입수 가능성 | 8 | 지금 사용자가 접근·복사·요청할 수 있는가 |
| 무료/공개 접근 | 8 | 공개 열람/다운로드가 실제로 확인되는가 |
| catalog/scan 확실성 | 6 | record identity와 원문 image route가 함께 닫히는가 |
| license/reuse | 12 | 보관·분석·재사용 조건을 확인할 수 있는가 |
| deterministic 연결성 | 5 | 자료를 받은 뒤 page/hash/row를 즉시 artifact로 묶을 수 있는가 |
| 잘못된 자료 위험 | 4 | 같은 제목의 현대판·mirror·OCR을 피할 수 있는가 |

판정은 유명한 책 또는 P0 label을 가산하지 않고, 각 score와 note를 machine-readable artifact에 보존했다.

## P0 8개 전수 audit

### 1. `SAJU-P0-IDENTITY-WITNESS`

- blocker: `saju-b-source-identity`, `saju-b-core-rule-scope` (둘 다 P0)
- fan-out: 7개 Saju source packet, 43 claims/126 occurrences의 classical verification 경계
- 현재 gap: 5개 local PDF의 actual bytes는 hashable하지만 모두 edition/transmission unresolved이고 classical verification은 0
- 후보: NDL `原本子平真詮考玄評註`와 `三命通会 : 明朝版` catalog는 확인됐지만 restricted/physical/paid이며 free scan이 아니다.
- 왜 7위인가: blocker 중요도와 deterministic fan-out은 크지만, 현재 발견된 후보의 page-image/판본/재사용 조건이 약해 잘못된 현대판을 먼저 구할 위험이 높다.
- next frontier: exact edition identity + 직접 rule witness + non-clone witness의 disagreement matrix

### 2. `SAJU-P0-CALENDAR-ORACLE`

- blocker: `saju-b-calendar-boundaries` (P0)
- fan-out: 절기·음력·윤달·자시·역사 표준시 입력; Ziwei calendar target과 상류 evidence를 공유할 수 있음
- 현재 gap: local converter/fixture만 있고 공식 1901–2100 corpus와 independent source identity가 없다.
- 후보: KASI `월별 음양력`은 공식 공개 질의이며 indexed page에 입력 범위 `-59년 02월 ~ 2050년 12월`과 음력/간지 output이 보인다. 2051–2100, bulk export, terms는 확인되지 않았다.
- 왜 2위인가: 실제 boundary row를 가장 빨리 deterministic fixture로 묶을 수 있고 authority가 강하다. 그러나 page-image corpus가 아니라 query service이고 reuse 권리가 미확정이다.
- next frontier: 입춘/24절기, 윤달, 00:00/子時, 역사 timezone adversarial rows와 independent oracle/certificate

### 3. `ZIWEI-P0-PALACE-SEMANTIC-WITNESS`

- blocker: `blocker-palace-semantic-identity`, `blocker-source-identity-unresolved`, `blocker-tianfu-rotation06-semantic-authority`
- fan-out: palace names, branch/slot/ordinal, major-star coordinate interpretation, Tianfu boundary
- 현재 gap: Nanbei p7/p8은 branch diagram과 traversal wording을 보이지만 palace-name semantic을 직접 연결하지 않는다. Nanyangtang 528p PDF는 보유하지만 official page admission과 independent lineage가 닫히지 않았다.
- candidate: NARA official record `F1000000000000101426`, file `1078787`, item `4468520`
- 왜 1위인가: official identity와 image route가 있고, 하나의 full-page witness가 세 blocker를 동시에 검사하며, 받은 page image를 `page/leaf → glyph/layout hash → source observation → deterministic coordinate comparison`으로 바로 연결할 수 있다.
- next frontier: complete 12-palace name/branch/slot/ordinal/direction witness와 human semantic adjudication

### 4. `ZIWEI-P0-CALENDAR-TIME-ORACLE`

- blocker: `blocker-calendar-time-source-identity` (P0), `blocker-external-oracle-identity` (현재 target에 매핑된 P1)
- fan-out: leap month, solar-term crossing, day rollover, 子時 input
- 현재 gap: Ziwei input contract는 status만 기록하고 independent source/oracle identity는 없다.
- 후보: KASI official service/certificate route. Saju calendar target과 같은 row를 재사용할 수 있다.
- 왜 4위인가: 2개 blocker를 건드리지만 Saju calendar target과 중복되고 palace/source semantic에는 전혀 닿지 않는다.
- next frontier: exact fixture request/response bytes, calendar system/timezone/epoch, independent version/hash/license

### 5. `ZIWEI-P0-CLAIM-SOURCE-IDENTITY`

- blocker: `blocker-source-identity-unresolved` (P0)
- fan-out: occurrence identity와 stable claim boundary 전체
- 현재 gap: occurrence provenance는 있으나 cataloged edition/leaf/byte lineage와 duplicate/mirror exclusion이 완결되지 않았다.
- 후보: NARA record가 가장 강하고, Wikisource/CTP는 search locator뿐이다.
- 왜 3위인가: 1순위와 같은 witness를 identity stage에서 함께 intake하면 leverage가 크다. 단독 수색 target으로 분리하면 palace semantic target과 중복된다.
- next frontier: occurrence → edition/leaf/hash relation, mirror/reprint lineage report, unresolved/excluded rows

### 6. `ZIWEI-P0-TIANFU-CONVENTION`

- blocker: `blocker-tianfu-raw-formula-contradiction`, `blocker-tianfu-rotation06-semantic-authority`
- fan-out: `安紫微`/`安天府`, legacy/source-aligned convention, rotation-06 interpretation
- 현재 gap: 150/150 numeric fit은 relation일 뿐 semantic authority가 아니며 두 convention이 code에 남아 있다.
- 후보: NARA 明刊本 scan이 유력하지만 exact `安紫微`/`安天府` leaves와 coordinate meaning은 아직 보지 못했다.
- 왜 6위인가: 중요도는 높지만 formula/semantic statement가 한 witness에 실제로 함께 나타나는지 불명확하고 현대 재편집본 오인 위험이 크다. 1순위 dossier에서 함께 확인하되 독립 first target으로는 낮춘다.
- next frontier: source-stated base/direction/coordinate meaning, disagreement-preserving Tianfu provenance packet

### 7. `WESTERN-P0-SEMANTIC-ADJUDICATION`

- blocker: `western-b-production-contract`, `western-b-frame-time-correction-bridge`
- fan-out: production True Node semantic contract 전체
- 후보: Swiss Ephemeris official documentation과 JPL Horizons manual은 public technical sources다. Horizons manual은 TDB, ecliptic/equinox, osculating output을 설명하지만 direct complete geocentric tropical instantaneous True Node field는 아니다.
- 왜 5위인가: 문서 접근은 좋지만 source 하나를 받는 것으로 끝나지 않고 product definition과 independent human adjudication이 필요하다. deterministic evidence acquisition보다 policy decision이 먼저다.
- next frontier: same-quantity definition, center/frame/equinox/time-scale/correction, instantaneous longitude vs event time, reviewer dissent

### 8. `WESTERN-P0-INDEPENDENT-DIRECT-ORACLE`

- blocker: `western-b-independent-same-semantic-oracle` (P0)
- 현재 gap: Swiss는 comparison target이고 DE405/CSPICE/Horizons는 같은 family 또는 derived diagnostic이며 ERFA/Astronomy Engine은 direct field가 아니다.
- 후보: 이번 조사에서 confirmed direct same-semantic license-usable candidate는 발견하지 못했다. Astronomy Engine은 MIT open-source near-miss이고 Astrolog는 GPL approximation이다.
- 왜 8위인가: blocker 중요도는 최고지만 실제 입수 가능성·무료성·catalog/scan 확실성·license가 모두 낮고 첫 자료를 잘못 oracle로 채택할 위험이 크다.
- next frontier: independently authored direct True Node implementation/dataset, pinned source/data, semantic bridge, redistribution terms

## Web research candidate ledger

분류 의미는 다음과 같다.

- `confirmed`: 공식 기관 record/manual와 기본 identity/access 사실을 확인했음. target content를 채택했다는 뜻은 아님.
- `strong_candidate`: 공식 image/item route가 target material을 낼 가능성이 높지만 exact leaf/content/terms가 아직 닫히지 않음.
- `weak_candidate`: mirror, transcription, modern edition, derivative PDF 또는 search locator. source witness로 승격 금지.

### 1순위 target의 candidate

| 분류 | candidate | 실제 경로 | 확인된 것 | 아직 확인하지 못한 것 |
|---|---|---|---|---|
| confirmed | NARA record | [F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html), [file 1078787](https://www.digital.archives.go.jp/file/1078787) | 제목, 明刊本, 陳搏/潘希尹, 7巻/2冊, 子060-0001, 公開, CC0 metadata | target leaf의 actual glyph/layout, image-level terms, remote free download |
| strong_candidate | NARA volume 1 | [item 4468520](https://www.digital.archives.go.jp/item/4468520), [viewer](https://www.digital.archives.go.jp/img/4468520) | official item, scan viewer, content-download controls가 indexed page에 표시됨 | viewer `館内限定閲覧`, exact leaf numbers, page-level permission |
| weak_candidate | local Nanyangtang derivative | local 528p PDF, embedded NARA URL | actual bytes/hash와 NARA locator metadata | official original lineage, independent witness, image rights |
| weak_candidate | Wikisource | [紫微斗數全書](https://zh.wikisource.org/wiki/紫微斗數全書) | free text와 chapter/search terms | scan identity, edition lineage, target leaf |
| weak_candidate | Chinese Text Project | [紫微斗數 context](https://ctext.org/datawiki.pl?if=gb&res=8418262) | terminology/navigation | direct scan, edition identity, semantic authority |
| weak_candidate | Google Books records | [1985 record](https://books.google.com/books/about/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8.html?id=OrgFzQEACAAJ) | same-title modern bibliographic confusion source | Ming witness, full free scan |

이번 pass에서 공식 기관·국립도서관·원판 scan repository를 이 경로들보다 강한 공개 candidate로 확인하지 못했다. NARA가 가장 강하지만, NARA record 확인과 semantic page admission은 다른 단계다.

### 다른 P0를 판단하는 데 사용한 공식 경로

- [KASI 월별 음양력](https://astro.kasi.re.kr/life/pageView/5): public query, -59년 02월–2050년 12월 범위가 표시됨. bulk corpus/license는 별도 확인 필요.
- [NDL 原本子平真詮考玄評註](https://ndlsearch.ndl.go.jp/books/R100000039-I12282002): 1983, 武田考玄, HR511-201, digital but library/registered-user restricted.
- [NDL 三命通会 : 明朝版](https://ndlsearch.ndl.go.jp/en/books/R100000002-I027985956): 2017, 866p, paper, ¥27000, HR511-L127. 무료 원판 scan이 아님.
- [Swiss Ephemeris documentation](https://www.astro.com/swisseph-download/doc/swisseph.pdf): public technical definition source, independent oracle 아님.
- [NASA/JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html): public frame/time/state manual, direct True Node oracle 아님.

## 1순위 acquisition dossier

### Target identity

- target ID: `ZIWEI-P0-PALACE-SEMANTIC-WITNESS`
- system: Ziwei
- linked blockers: `blocker-palace-semantic-identity`, `blocker-source-identity-unresolved`, `blocker-tianfu-rotation06-semantic-authority`
- exact material type: catalog-linked historical/critical page-image witness; OCR·현대 전사본·도식 crop은 불충분
- preferred institution: National Archives of Japan Digital Archive
- record: `F1000000000000101426`
- file: `1078787`
- first item route: `4468520`

### 정확히 찾을 자료

**최소 합격 자료**는 NARA official record와 연결된 target leaf의 complete readable image set이다. 표지/서명·저자/편자·판본/권책/소장 metadata와 대상 면 전체를 함께 확보해야 한다. 자료 하나가 palace semantic을 직접 닫지 못하고 여러 leaf에 나누어 둔다면 해당 leaf와 cross-reference를 모두 받아야 한다.

**이상적인 최강 자료**는 NARA의 고해상도/무손실 원본 page bytes와 명시적인 image-level reuse terms, 그리고 독립 catalogued second witness다. second witness는 동일 local PDF mirror나 modern reprint가 아니라 별도 기관 record와 lineage를 가져야 한다.

### 저자·시대·권차·판본·간행정보

| 필드 | 요구값 |
|---|---|
| title | `新鋟希夷陳先生紫微斗数全書` / traditional `新鋟希夷陳先生紫微斗數全書` |
| selector/author | 陳搏（宋） |
| supplementer | 潘希尹（明） |
| era/edition | 明刊本 |
| volume | 七巻 |
| physical units | 二冊 |
| collection | 内閣文庫・漢書・子の部 |
| call number | 子０６０－０００１ |
| former holder | 紅葉山文庫 |
| language | 中文 |

generic `紫微斗數全書`만 일치하는 1984/1985/2000/2008/2025 reprint는 이 target의 자료가 아니다. 그 책들은 edition-comparison의 별도 candidate로만 기록한다.

### 정확한 locator와 검색 순서

NARA scan의 exact page/leaf number는 현재 viewer에서 직접 관찰하지 못했으므로 임의로 매기지 않는다. 사용자는 `item/4468520`에서 archive가 표시하는 **실제 image index와 printed folio marker**를 함께 기록해야 한다. 아래는 이미 보유한 비교 witness의 정확한 locator와 NARA에서 찾아야 할 equivalent section이다.

| 우선 | 비교 witness locator | NARA에서 반드시 찾을 equivalent |
|---:|---|---|
| 1 | Nanbei PDF p7 `十二宮冠蓋` | 12-cell palace/branch diagram 또는 그에 대응하는 table의 full leaf |
| 2 | Nanbei PDF p8 `定命、身二宮` | `寅起月`, `命宮逆數`, `身宮順數`가 subject/start/direction과 함께 보이는 leaf |
| 3 | Nanbei PDF p10 `命宮·身宮·五行局` | palace/branch/局 anchor table 및 앞뒤 context |
| 4 | Nanbei PDF p11–p12, printed 三十一/三十三 | `起紫微五訣`, `起紫微簡索表`, branch/base/ordinal table |
| 5 | Nanbei PDF p13, printed 三十四 | `甲六、安天府`, 12-row 紫微→天府 table, base/direction |
| 6 | Nanyangtang derivative PDF p148/p172 | `紫微/天府` series와 `安天府圖`; printed page는 현재 direct capture에서 불명확하므로 search-start hint일 뿐 |

**반드시 보여야 하는 핵심 문구·구조·도식**은 다음이다.

- 12개 palace names: 命、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母
- 12 branches: 子丑寅卯辰巳午未申酉戌亥와 각 physical slot
- direction/order/ordinal/base, 특히 `寅起月`
- `命宮逆數`와 `身宮順數`, 시작점과 subject
- `安紫微`/`安天府`가 보일 경우 12-row relation, base branch, direction, 그리고 branch가 semantic palace인지 raw diagram slot인지
- page/leaf marker, table boundary, adjacent context, cover/colophon identity

### Accept / reject

**Accept**

- NARA identity, item/leaf route, page/folio, downloaded/captured bytes가 서로 일치한다.
- full-page glyph/layout/table boundary가 직접 판독 가능하다.
- palace name ↔ branch ↔ slot ↔ ordinal/direction edge가 한 leaf 또는 cross-referenced complete leaf set에서 직접 보인다.
- source authority, direct observation, deterministic relation, semantic interpretation, licensing가 separate fields로 기록된다.
- second witness를 추가할 때 catalog identity와 non-clone lineage가 증명된다.

**Reject**

- catalog title만 있고 target page/leaf image가 없다.
- OCR/전사/현대 해설/수치 `rotation-06` fit만 있다.
- arrows, labels, subject 또는 table edge가 잘린 crop이다.
- local 528p derivative를 NARA independent witness로 세었다.
- `紫微斗數全書`라는 제목만 같고 明刊本·潘希尹·七巻二冊·子060-0001 identity가 없다.
- NARA metadata의 CC0를 page-image derivative 전체의 재배포 허가로 해석했다.

### 잘못된 판본과 clone 구분

1. 긴 서명과 陳搏/潘希尹 attribution을 먼저 확인한다. generic title은 통과시키지 않는다.
2. `子０６０－０００１`, `明刊本`, `七巻`, `二冊`, `内閣文庫`, `紅葉山文庫`를 record·표지·권책 metadata와 교차 확인한다.
3. cover, 序/跋, 刊記/colophon, volume marker, folio topology를 보존하고 현대 punctuation/annotation/re-pagination을 derivative layer로 표시한다.
4. file hash가 다르다고 독립 witness로 판정하지 않는다. 같은 page defect·crop·re-pagination·embedded URL이면 shared lineage를 먼저 의심한다.
5. modern transcription·OCR·Wikisource·CTP는 검색어와 locator 보조로만 사용한다.

### 파일 수령 직후 기록할 것

- PDF/image container page count와 printed folio/leaf count를 별도로 기록
- exact unedited bytes의 SHA-256
- title, creator/author, publisher/collection, creation/modification, producer, encryption, byte length, MIME/container
- institution, record/item/file ID, call number, title, author/editor, era/edition, volume count, language, page/folio, rights/terms
- download/view URL, access date/time, page-image derivative hash
- 원본 bytes와 manifest 보존; glyph/layout을 normalize하여 원본을 덮어쓰지 않음

현재 보유한 Nanyangtang 비교 PDF의 실제 관찰값은 다음과 같다. 이는 **공식 원본이 아니라 comparison-only**다.

- pages: 528
- bytes: 36,201,526
- SHA-256: `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`
- encrypted: no
- PDF metadata subject: `书格（shuge.org）整理发布`
- creator: `PDFPatcher 0.6.2.3572`
- producer: `iTextSharp 5.5.14-SNAPSHOT`
- creation: 2020-03-22 KST
- embedded locator: NARA record URL

이 metadata는 NARA identity-linkage investigation에는 유용하지만, NARA에서 직접 받은 original bytes·page-level rights·independent witness를 증명하지 않는다.

### 확보 후 blocker 전진 조건

| blocker | 자료 조건 | 가능한 bounded advance |
|---|---|---|
| `blocker-source-identity-unresolved` | catalog/edition/leaf/bytes lineage complete | source identity observation을 review-ready로 전진; stable claim은 여전히 open |
| `blocker-palace-semantic-identity` | 12 palace name ↔ branch ↔ slot ↔ ordinal/direction이 직접 보이고 human review 완료 | pending adjudication 또는 scoped support; 자동 verified/readiness 아님 |
| `blocker-tianfu-rotation06-semantic-authority` | `安紫微`/`安天府`의 source-stated base/direction/coordinate meaning 확인 | formula discrepancy adjudication 가능; production convention은 별도 명시 결정 전 unchanged |

이 수색 자료만으로 `stableClaimCount`, readiness, grounding, activation, production coordinates, legacy/source-aligned default를 자동 승격하지 않는다.

## 현장 검색 checklist

### 검색어

- 한국어: `자미두수 전서 명간본 남양당`, `자미두수 십이궁 관개 명궁 신궁`, `명궁 역수 신궁 순수`, `안자미 안천부 원문 스캔`
- 한자 번체: `十二宮冠蓋`, `定命身二宮`, `命宮逆數`, `身宮順數`, `寅起月`, `紫微五訣`, `安紫微`, `安天府`, `安天府圖`, `新鋟希夷陳先生紫微斗數全書`
- 한자 간체: `十二宫冠盖`, `定命身二宫`, `命宫逆数`, `身宫顺数`, `安紫微`, `安天府`
- 일본어: `新鋟希夷陳先生紫微斗数全書`, `内閣文庫 子060-0001`, `紫微斗数全書 明刊本`, `潘希尹 補訂`
- 영어: `"Xin kan Xi Yi Chen xiansheng Ziwei doushu quanshu"`, `National Archives of Japan Ziwei Dou Shu`, `Ming printed edition Ziwei dou shu quanshu Pan Xiyin`

### 기관별 query

- NARA: `site:digital.archives.go.jp "F1000000000000101426"`, `site:digital.archives.go.jp "子０６０－０００１"`
- NDL: `site:ndlsearch.ndl.go.jp 紫微斗数全書`
- Taiwan NCL: `site:rarebooks.ncl.edu.tw 紫微斗數全書`
- scan repository locator: `site:archive.org/details 紫微斗數全書 原本 scan` — 결과가 나와도 원본/derivative를 분리

### 판본 식별 키워드

`明刊本`, `七巻`, `二冊`, `新鋟`, `潘希尹補訂`, `内閣文庫`, `子０６０－０００１`, `紅葉山文庫`, `嘉靖`, `原刻`, `影印`, `卷一`, `卷二`

### 피해야 할 혼동 자료

- 南北山人編註 및 1980s/2000s/2025 commercial reprint
- generic `紫微斗數全書` Google Books preview
- Wikisource/CTP text
- Shuge/Internet Archive derivative PDF를 catalog original로 오인
- OCR-only, cropped diagram, page marker 없는 screenshot
- 같은 local PDF bytes를 다른 URL에서 다시 받은 것을 second witness로 계산

## 다음 `/goal`에서 Luna가 수행할 검증 계획

1. 사용자가 NARA item의 실제 page images 또는 허용된 copies를 확보하면 archive가 표시하는 exact image index/printed folio를 먼저 기록한다.
2. actual bytes에서 page count, metadata, SHA-256, target page image hashes를 가진 additive source-observation packet을 materialize한다.
3. `check-ziwei-archive-scan-source-witness-admission-v0.mjs`, `check-ziwei-palace-semantic-source-frontier-v1.mjs`, `check-ziwei-palace-source-acquisition-field-kit-v0.mjs`, `check-ziwei-source-identity-claim-boundary-audit-v1.mjs`를 각각 실행하고 negative findings를 보존한다.
4. source rows와 현재 production coordinate를 diagnostic으로 비교하되 `rotation-06` 또는 어떤 convention도 자동 선택하지 않는다.
5. direct witness, deterministic relation, semantic interpretation, license를 분리한 human adjudication record를 작성한다.

## Artifact / checker

- machine-readable artifact: `artifacts/tri-system-p0-acquisition-priority-and-dossier-v1/complete.json`
- materializer: `scripts/materialize-tri-system-p0-acquisition-priority-and-dossier-v1.mjs`
- checker: `scripts/check-tri-system-p0-acquisition-priority-and-dossier-v1.mjs`
- targeted test: `test/triSystemP0AcquisitionPriorityAndDossier.test.js`
- generated artifact SHA-256 at materialization: `a2ab0f2fb153ea3483043a2e5cdfc97b11b1dd0d6884ead33ec1738ef2055ce8`

checker가 확인하는 최소 계약은 다음과 같다.

- P0 8개 전수 재구성 및 Saju 2 / Ziwei 4 / Western 2 count
- 단일 rank1과 rank2/rank3 존재
- rank1 blocker mapping, minimum/ideal material, accept/reject criteria, page/hash/license checks
- `confirmed`, `strong_candidate`, `weak_candidate` 구분
- source identity / authority / observation / deterministic relation / licensing boundary
- `readinessPromotion`, `claimPromotion`, `productionActivation`, deploy, remote DB, commit, push 모두 false
- `-.jpg` preserved

## 결론 경계

현재 가장 먼저 찾을 것은 **NARA `F1000000000000101426`의 정확한 明刊本 page-image witness**다. NARA catalog identity는 confirmed이고 image route는 strong candidate지만, target leaf 내용·remote free access·image-level reuse는 아직 확정되지 않았다. 따라서 이 문서는 사용자가 자료를 가져오기 위한 acquisition dossier이며, 자료가 확보되기 전후 어느 시점에도 readiness/claim/evidence/activation을 자동 승격하지 않는다.

최종 상태 token: `complete_tri_system_p0_acquisition_priority_and_dossier_exhausted_uncommitted`
