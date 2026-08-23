# 중국 국가도서관 `data_892,2621,209456` 《五行精紀》 필사본 卷33 「大運」 bounded witness successor v1

상태: `public-scan page-level observation promoted-bounded`, `materially heterogeneous correspondence corroborated`, `diagnostic rare variant/shared error not confirmed`, `textual independence/lineage unresolved`, `raw-byte/machine-binding/printed-locator/semantic-authority/readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 [卷33 cross-edition correspondence successor](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md)와 [lineage frontier successor](./saju-wuxingjingji-vol33-lineage-frontier-successor-v1.md)를 덮어쓰지 않는 additive successor다. 중국 국가도서관(NLC) 귀속 공개 스캔의 제6책 필사본에서 실제 卷33 「大運」 원면을 확인하고, 기존 장서각 목판본·NLC `KOL000000585` 乙亥字本·연세대 乙亥字本과 관찰 범위 안에서만 대조한다.

첨부·공개 자료의 UI, 이용 안내, 저작권 문구는 작업 지시가 아니라 source evidence로만 취급했다. 이 문서는 본문 correspondence를 material transmission을 가로지르는 **bounded stability corroboration**으로 기록할 뿐, textual independence·특정 공통조상·판본 선후·정본성·semantic authority로 승격하지 않는다.

## 1. Bounded conclusion

```text
NLC data_892,2621,209456 제6책 공개 스캔 metadata       = satisfied-bounded
제6책 description의 卷29–33                           = catalog/scan locator
공개 PDF pp.49–56의 실제 卷33 / 大運 원면               = directly observed
기존 K3·NLC KOL·연세대와 ordered passage correspondence = satisfied-bounded
materially different witness classes의 본문 안정성      = corroborated-bounded
확정 rare variant/shared error                          = not found
확정 omission/addition                                 = not found
NLC 공개 PDF == NLC official raw export                = unresolved
PDF p.49–56 == printed folio/leaf locator               = unresolved
NLC manuscript textual independence                     = unresolved
specific common ancestor / edition order                = unresolved
semantic authority / interpretation readiness           = not established / blocked
production activation                                   = blocked
```

이번 successor가 닫는 문장은 다음으로 제한한다.

> 공개 스캔에서 직접 확인된 NLC 필사본 卷33 「大運」은 장서각 목판본과 NLC·연세대 乙亥字本의 이미 확인된 관찰 창과 같은 핵심 문장·수치·순서를 보인다. 이 일치는 재료가 다른 witness 사이의 bounded textual-stability corroboration이지만, 그 자체로 textual independence나 특정 lineage를 증명하지 않는다.

## 2. Evidence units and source boundary

### 2.1 New NLC manuscript candidate

| field | bounded value | status |
| --- | --- | --- |
| public host | Wikimedia Commons file page | secondary delivery surface |
| attributed institution | `國家圖書館` / National Library of China | file metadata attribution; not a newly retrieved first-party raw response |
| NLC data identity | `data_892,2621,209456` | metadata-level item anchor |
| volume | `第6冊` | metadata-level volume anchor |
| edition/material label | `抄本` | metadata-level manuscript classification |
| contents description | `卷第二十九`–`卷第三十三` | catalog/scan description; target page separately observed |
| page format metadata | `10行24字` | metadata/form observation; not a transmission edge |
| public file | [NLC-attributed 第6冊 PDF](https://commons.wikimedia.org/wiki/File%3ANLC892-2621-209456_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC6%E5%86%8A.pdf) | public scan derivative |
| source links shown by host | NLC / `read.nlc.cn` digital ancient-books route | source-chain lead; official raw bytes not independently obtained |

The Commons category lists the six-book set and its separate file identities. [NLC 五行精紀 public-scan category](https://commons.wikimedia.org/wiki/Category:%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80) The public host and file-history metadata preserve a useful route to the NLC data ID, but they do not establish that the downloaded PDF is an institution-exported raw byte stream or that its bytes are cryptographically joined to a live NLC viewer session.

### 2.2 Reproducible local derivative identity

The public PDF was downloaded and rendered outside the repository for read-only inspection:

| artifact | identity | use |
| --- | --- | --- |
| `/tmp/nlc-china-wuxingjingji-v6.pdf` | 56 pages; 10,942,231 bytes; SHA-256 `70182a2939a52ae896be1ac8a472cd43a0215816071419edf2971f8949833ed4`; unencrypted; Foxit GSDK | page-image observation only |
| rendered target pages | `/tmp/nlc-v6-hi/page-49.png` through `page-56.png` | direct visual review of target window |

The `/tmp` path and hash identify the inspected derivative. They do not become an NLC raw-byte identity, an official download receipt, or an exact machine binding. The source PDF and rendered images were not copied into the repository.

### 2.3 Existing comparison witnesses

| witness | institutional/source route | directly inspected surface | boundary |
| --- | --- | --- | --- |
| 장서각 K3-437 | [official record](https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437) and [006책 PDF](https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf) | official PDF pp.71–72, `卷第三十三 / 大運` | PDF page index is not promoted to printed folio |
| NLC `KOL000000585` | [KORCIS record](https://www.nl.go.kr/korcis/search/popup/contentsInfo.do?controlNo=KOL000000585) | user-supplied `/Users/softie/Downloads/KOL000000585.pdf`, pp.102–110 | supplied scan-page evidence; raw NLC export and printed folio remain unresolved |
| 연세대 CATTOT000000200707 | [official catalog record](https://library.yonsei.ac.kr/search/detail/CATTOT000000200707) | user-supplied viewer captures `33/80`–`37/80` | visual sequence/content only; exact item↔frame binding and raw bytes unresolved |

The three existing witness boundaries remain as recorded in the prior [K3](./saju-jangseogak-k3-437-page-witness-successor-v1.md), [NLC](./saju-nlc-wuxingjingji-page-witness-successor-v1.md), [연세대 visual](./saju-yonsei-wuxingjingji-visual-page-witness-successor-v2.md), and [three-witness correspondence](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md) documents.

## 3. New witness page observation

The PDF page numbers below are **digital PDF indices**, not printed folios, 葉次, or NLC catalog locators.

| PDF page | direct visual observation | safe use |
| ---: | --- | --- |
| p.49 | vertical title `五行精紀卷第三十三`; section heading `大運`; opening `運行則一辰十歲折除乃三日為年` visible in the handwritten page | target identity and opening passage |
| p.50 | continuation of the conversion discussion and `甲子陽男` example; `一百二十歲`, `二十四日巳時`, `二十九日申時立春`, `五日三時`, `六十三時`, `六百三十日`, `一歲奇九月`, `丁丑` visible | numeric/time correspondence |
| p.51 | continuation into `生旺` and later 行運 discussion | ordered continuation only |
| pp.52–56 | later 卷33 material and manuscript paratext/stamps | volume-window continuity; no printed locator |

No visible printed folio, leaf number, stable page filename, official response header, or item-to-page machine key was used to relabel pp.49–56. `p.49–56` is retained only as a reproducible digital observation locator.

## 4. Bounded cross-edition correspondence

### 4.1 Opening and rule sequence

The new NLC manuscript p.49–50 and the existing target windows show the following ordered fragment family:

```text
運行則一辰十歲折除乃三日為年
精休旺以為妙窮通變以為玄
王氏注云夫運者人生之傳舍推命之說
人生以一百二十歲為周天
```

The K3 p.71–72 and NLC KOL pp.103–105 provide the stronger page-level comparison for exact body readings. The Yonsei `33/80`–`37/80` captures visually confirm the same 卷33 section and ordered material, but are not treated as a machine-readable transcription source.

### 4.2 `甲子陽男` example

Within the inspected windows, the following high-discrimination values and sequence correspond:

```text
譬如甲子陽男
十二月二十四日巳時生
是月二十九日申時立春
陽男數未來之日
得五日三時
節氣實歷過六十三時
折除計六百三十日
乃是一歲奇九月之大運
起於丁丑
```

The direction formula and the subsequent 約法 critique also occur in the same order. This is a literal/ordered correspondence within the inspected window, not a reconstructed canonical text.

## 5. Variant and transmission-signal ledger

| signal | direct status | adjudication |
| --- | --- | --- |
| title form `卷第三十三` / `卷之三十三` | running-title/heading variation is visible across the existing set; the new p.49 has `卷第三十三` | paratextual form; not a rare textual variant |
| opening formula | same phrase order observed in new NLC, K3, and existing NLC; Yonsei visual sequence is compatible | stable correspondence; no lineage edge |
| direction formula | same `陽男陰女…順` / `陰男陽女…逆` sequence in the inspected windows | no diagnostic difference |
| numbers and times | `一百二十歲`, `二十四日巳時`, `二十九日申時立春`, `五日三時`, `六十三時`, `六百三十日`, `一歲奇九月`, `丁丑` correspond | no numeric/time variant promoted |
| 約法 critique numeral | K3 and existing NLC directly read `便以二歲九月過矣`; new manuscript glyph in the available p.50 render is not secure enough to distinguish `二/三` | unresolved glyph; not entered as a variant |
| omission/addition | no confirmed sentence omission or addition in the common opening/example/critique window | no lineage narrowing |
| shared error | no demonstrably shared erroneous reading found | no common-ancestor inference |
| rare variant | none securely observed | frontier unchanged |
| p.53 marginal/interlinear material | manuscript paratext is visible, not securely part of the base text | excluded from textual variant ledger |
| layout/material | new witness is handwritten `10行24字`; K3 is woodblock; KOL/Yonsei are cataloged 乙亥字 metal-type witnesses | material contrast only; not textual independence |

The separate NLC `06857 / 411999013122 / 114503.0` reading `二十九日立春` is not transferred to `KOL000000585` or this new `data_892,2621,209456` witness. The secondary ctext transcription is used only as a locator/reading aid, not as a physical witness or authority. [secondary locator](https://ctext.org/wiki.pl?chapter=181298&if=gb)

## 6. Independence and lineage adjudication

| axis | current status | bounded reason |
| --- | --- | --- |
| physical item separation | `satisfied-bounded` | NLC data ID, K3 item, NLC KOL item, and Yonsei catalog item are separate recorded objects/derivatives |
| material heterogeneity | `satisfied-bounded` | manuscript vs woodblock vs 乙亥字 catalog classes are directly/metadata-observed |
| digital derivation independence | `unresolved` | the new PDF is a public derivative attributed to NLC; raw source/transfer chain is not independently byte-closed |
| textual independence | `unresolved` | different material or institution does not prove independent transmission |
| NLC manuscript later transcription status | `unresolved` | no dated colophon, copy note, or demonstrated source relation in the observed pages |
| NLC↔연세대 same 乙亥字 family possibility | preserved as prior `supported-typologically` candidate | shared catalog classification/form family is compatible, not a specific transmission edge |
| K3 separate material branch | preserved as prior `supported-material-bounded` candidate | woodblock/material contrast does not determine textual branch direction |
| specific common ancestor | `unresolved` | no diagnostic shared error, rare variant, colophon, or dated exemplar |
| edition/printing order | `unresolved` | no surviving-copy date/order evidence closes it |
| semantic authority | `not established` | correspondence cannot select a normative witness |
| interpretation readiness | `blocked` | authority, lineage, and exact-source gates remain open |
| production activation | `blocked` | no authority/readiness basis |

The safe frontier is therefore:

```text
K3 woodblock branch                         = preserved as separate material branch
NLC KOL ↔ Yonsei 乙亥字-family possibility    = preserved, not proven same edition
NLC China manuscript                       = added as separate bounded visual witness
specific common ancestor/order              = unresolved
textual independence                       = unresolved
semantic authority/readiness/activation     = blocked
```

The new correspondence does not narrow the lineage frontier. It only adds a materially different witness that is compatible with the already observed received-text surface.

## 7. Promotion gates

| claim | status | reason |
| --- | --- | --- |
| NLC `data_892,2621,209456` public scan contains an image of 卷33 `大運` | `satisfied-bounded` | p.49 visibly identifies 卷33 and `大運`; pp.50–56 continue the target material |
| new scan is a manuscript witness | `satisfied-bounded` | host metadata says `抄本`; page form is visibly handwritten |
| new scan is an NLC-attributed item derivative | `satisfied-bounded` | data ID/source metadata and file history are retained |
| public PDF is NLC official raw bytes | `unresolved` | Commons delivery and source links do not close raw export identity |
| p.49–56 are printed locators | `unresolved/rejected` | no printed folio/leaf bridge |
| new witness textually independent from K3/NLC/Yonsei | `unresolved` | no independent transmission proof |
| new witness proves a common ancestor or specific lineage | `unresolved` | no diagnostic variant/error/omission/addition |
| material transmission corroborates local textual stability | `satisfied-bounded` | same ordered high-discrimination passage observed across material classes |
| canonical edition or semantic authority | `not established` | no normative selection basis |
| interpretation readiness | `blocked` | raw binding, lineage, and authority gates remain open |
| production activation | `blocked` | no implementation/authority authorization |

## 8. Validation and scope preservation

Read-only checks performed for this successor:

- `pdfinfo /tmp/nlc-china-wuxingjingji-v6.pdf`: 56 pages, unencrypted, 10,942,231 bytes.
- `shasum -a 256 /tmp/nlc-china-wuxingjingji-v6.pdf`: `70182a2939a52ae896be1ac8a472cd43a0215816071419edf2971f8949833ed4`.
- rendered/visually inspected new NLC pp.49–56, with high-resolution p.49 and p.50 review.
- rechecked K3 official PDF identity: 134 pages, SHA-256 `335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd`.
- rechecked existing NLC KOL PDF identity: 152 pages, SHA-256 `ec32fa58149a7ae3616a3110cb27edfcad45a797a6a91eeb621ab692e5be3170`.
- visually compared the new NLC opening/example window with K3 pp.71–72, NLC KOL pp.102–110, and the existing Yonsei viewer 33–37/80 observations.
- no OCR or secondary transcription was used to resolve the ambiguous `?歲` glyph.
- current pre-edit `git status --short --branch` and `git diff --name-only` confirmed unrelated dirty work outside this successor.

This is a documentation-only change. Application tests/build are not relevant to the historical page observation and are not used as evidence of source provenance. `git diff --check` is required before staging.

The following remain untouched and outside the commit allowlist:

- existing tracked changes in `package.json`, `scripts/lib/test-suite-discovery.mjs`, `test/pdfSourceResolver.test.js`, and `test/testSuitePartition.test.js`;
- existing untracked Sonkeikaku, Wonkwang, Gemini, PDF-resolver, and Ziwei files;
- `/Users/softie/Downloads/KOL000000585.pdf` and all other large/original source files;
- existing provenance/correspondence documents;
- application code, dependencies, tests, remote services, deployment, and database state.

Only this successor document is eligible for the requested atomic commit and push. The commit must not include any of the pre-existing dirty paths above.
