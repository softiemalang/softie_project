# 子時 日界·`早子` normative witness successor v3

상태: `早子時 exact token FACT`, `早子時 → 日干 group·時干支 table DIRECT`, `full early 日干支·時干支 worked pair PARTIAL/UNKNOWN`, `historical authority·lineage·readiness blocked`

기준일: `2026-09-06 KST`

이 문서는 [v2 lexical witness record](./saju-zi-day-boundary-early-zi-witness-successor-v2.md)의 additive successor다. 이번 bounded frontier는 `早子時`가 실제로 인쇄된 독립 source surface에서 四柱의 日·時 배속 규칙이 직접 연결되는지 확인하는 것이다. `夜子`·`正子/子時正`과 동치화하지 않고, 원면에 쓰인 현대 시각 표현도 source-local observation으로만 보존한다.

## 1. bounded conclusion

이번 pass에서 parent가 두 개의 별도 source surface를 원본 PDF로 직접 확인했다.

### 1.1 `紫微斗数精成全集`의 직접 table binding

`《紫微斗数精成全集 一》` PDF p.4–5는 四柱의 日柱·時柱 산출 절차와 `由日干起时干支表`를 연속해서 싣는다. 특히 p.5의 동일한 table surface는 다음 header와 행을 함께 인쇄한다.

```text
由日干起时干支表
日干→
时辰↓ 甲己 乙庚 丙辛 丁壬 戊癸
早子时 0：01-1：00 甲子 丙子 戊子 庚子 壬子
```

따라서 이 source surface에서 다음 conditional edge는 직접 닫힌다.

```text
早子时 + 日干(甲/己) → 甲子时
早子时 + 日干(乙/庚) → 丙子时
早子时 + 日干(丙/辛) → 戊子时
早子时 + 日干(丁/壬) → 庚子时
早子时 + 日干(戊/癸) → 壬子时
```

이는 `早子时`가 적어도 이 printed rule에서 **日干 group을 조건으로 한 時干支 산출**과 직접 묶인다는 source-local normative FACT다. p.4에는 `排日柱`를 만세력에서 확인하는 별도 문장과 날짜 교대 문장이 있고, p.5 table은 `日干`을 입력으로 삼는다. 그러나 표 자체는 특정 full `日干支` 예컨대 `甲子日`을 특정 `早子时` 사례로 적은 것이 아니다. 따라서 `早子時 → 특정 full 日干支·時干支 pair` 전체를 닫았다고 말하지 않는다.

### 1.2 王德峰 lecture surface의 generic rule

저자 귀속 PDF `《中国古代命理学要义》讲稿——王德峰` p.43–44에는 다음이 parent 원면 확인으로 보인다.

```text
那夜子时，你是0点到1点生的叫早子时。
早子时问题很简单，就是这一天的子时，时干也就查表确定。
早子时顺理成章，今天的新的一天的第一个时辰，早子时，就查表可以的。
```

이 surface는 `早子时`를 새 날의 첫 子時로 설명하고, 시干을 표에서 정한다고 직접 말한다. 다만 early에 귀속된 구체적인 `日干支 → 時干支` worked pair는 없다. p.43–44의 `甲子日 … 丙子`는 문법상 별도의 `夜子时` 설명 안에 있으므로 early rule로 재귀속하지 않는다.

### 1.3 현재 판정

두 source의 관찰을 서로 합성해 역사적 FACT를 만들지 않고 각각 source-local로 유지한다.

```text
`早子时` → `日干 group → 時干支` table rule       = FACT / direct, source-local
`早子时` → 새 날의 첫 子時·查表 wording          = FACT / direct, source-local
`早子时` → 특정 full 日干支·時干支 worked pair    = UNKNOWN
`早子时` → 보편적 historical 四柱 authority       = UNKNOWN / blocked
```

따라서 이번 frontier는 기존 `早子 lexical FACT / semantic binding UNKNOWN`에서 **조건부 時柱 산출 edge가 직접 관찰된 상태**로 좁혀졌지만, full 日柱·時柱 pair와 historical authority는 여전히 닫히지 않았다.

## 2. source identity and parent provenance

| source surface | identity / locator | parent observation | safe role | retained boundary |
| --- | --- | --- | --- | --- |
| `紫微斗数精成全集 一` | [PDF source](https://www.1mbw.com/wp-content/uploads/2012/03/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0%E7%B2%BE%E6%88%90%E5%85%A8%E9%9B%86.pdf), PDF p.1 title; p.4 `第五节 怎样排斗数四柱`; p.5 `由日干起时干支表`; title `紫微斗数精成全集 一`; creator/date/catalog not printed or established in this bounded check | parent rendered and directly viewed p.1, p.4, p.5; p.5 visibly places `早子时` in the `日干→时干支` table with five day-stem groups and five time-pillar outputs | distinct printed source surface; source-local direct table witness | no institution, catalog identity, date, edition lineage, physical-copy provenance, or historical authority established |
| `中国古代命理学要义`讲稿 | [PDF source](https://data.guoxueruanjian.com/books/%E4%B8%AD%E5%9B%BD%E5%8F%A4%E4%BB%A3%E5%91%BD%E7%90%86%E5%AD%A6%E8%A6%81%E4%B9%89%E8%AE%B2%E7%A8%BF-%E7%8E%8B%E5%BE%B7%E5%B3%B0.pdf), PDF p.1 title; p.43–44 rule surface; title `中国古代命理学要义`讲稿; creator `王德峰` | parent rendered and directly viewed p.1, p.43, p.44; p.43–44 visibly print `早子时`, the new-day wording, and the separate `夜子时` worked example | distinct modern author-attributed primary/lecture witness candidate; generic source-local rule | no catalog record, date, edition, physical-item lineage, or historical authority established; generic rule does not supply an early worked pair |

### 2.1 review-byte pins

```text
紫微斗数精成全集 PDF:
  /private/tmp/agy-early-zi-research.dhb5Fe/ziwei-jingcheng.pdf
  SHA256: 02e3381f8ca30da79734fc9d60cbe938de551c2e7c66f37d4d3050e01dc78d11
  Pages: 381
  parent render p.1: 5227f6f34b350cf2df50c262247dd1f85f19fef343309c6f3b126039fabfc812
  parent render p.4: 601861847d6cf56001013f60a456224d5e1faa7226919096e94a20cddeb29baf
  parent render p.5: 90073d0b788c8615c93e7b42d032982715564344323492b81f3ce93ca1ec27b9

王德峰 PDF:
  /private/tmp/agy-early-zi-research.dhb5Fe/wang-defeng.pdf
  SHA256: 029b9ad1309534065a6704c74d344fe72bc8165d00d07f0aef14f7eef9e6f620
  Pages: 73
  parent render p.1:  77b8257e0ad46f586263e9dfcb06b1824f32d2c39804ebeae1387838e4456383
  parent render p.43: c10b6d8e829fbeed18ad3edff06435fd58ae3aa80b02809f863ca1bb2b185725
  parent render p.44: 8a30c76b4b48544190e5eff0709c718f124602040082fc96ffd07cb4d4a735d6
```

PDF hash와 rendered page hash는 이번 review surface의 provenance pin이다. parent는 두 PDF의 title/rule pages를 직접 대조했다. 검색 색인과 OCR은 후보 위치 확인에만 사용했고 canonical text로 사용하지 않았다. `0：01-1：00`, `0点到1点` 등 시각 표현은 원면의 literal observation이며 별도 현대 시각 policy로 정규화하지 않는다.

## 3. FACT / INFERENCE / UNKNOWN / CONFLICT 경계

### 3.1 FACT: `紫微斗数精成全集` direct table

- PDF p.1은 `紫微斗数精成全集 一`를 표면에 인쇄한다.
- PDF p.4의 `第五节 怎样排斗数四柱`는 日柱와 時柱를 별도로 설명하고, 日干을 기준으로 時干을 산출한다고 이어진다.
- PDF p.5의 `由日干起时干支表`는 `日干→` 열과 `时辰↓` 행을 함께 둔다.
- 같은 p.5 table의 `早子时` 행은 day-stem groups `甲己`, `乙庚`, `丙辛`, `丁壬`, `戊癸`에 각각 `甲子`, `丙子`, `戊子`, `庚子`, `壬子`를 대응시킨다.
- 이 대응은 `早子时 + 日干 group → 時干支`의 direct printed table edge다.
- 같은 table에는 별도의 `晚子时` 행도 인쇄되지만, 그 행의 값이 같다는 사실을 근거로 두 term을 동치화하지 않는다.

### 3.2 FACT: 王德峰 source-local generic rule

- PDF p.1은 `《中国古代命理学要义》讲稿——王德峰`를 표면에 인쇄한다.
- p.43은 정확한 token `早子时`와 `这一天的子时，时干也就查表确定`을 인쇄한다.
- p.44는 `今天的新的一天的第一个时辰，早子时，就查表可以的`를 인쇄한다.
- p.43–44의 구체적인 `甲子日 … 丙子`는 `夜子时` 문단 안에 있으며, early pair가 아니다.
- p.43–44에는 early에 귀속된 특정 full `日干支·時干支` worked pair가 없다.

### 3.3 INFERENCE: 좁혀진 semantic edge

`紫微斗数精成全集` p.5는 exact `早子时`와 day-stem group별 time-pillar output을 같은 table에 직접 연결한다. 따라서 이 source-local 범위에서는 `早子时`의 時干支가 日干 group에 의해 선택된다는 inference가 아니라 table observation에서 직접 읽을 수 있다. 다만 p.4의 日柱 설명과 p.5 table을 결합해 특정 full `日干支` 입력 사례를 재구성하는 것은 별도의 계산이며, 이 기록에서는 inference로만 남긴다.

두 source가 비슷한 방향을 말한다는 것은 bounded corroboration 후보일 뿐이다. 서로 다른 witness를 합성해 historical authority나 full rule을 만드는 것은 허용하지 않는다.

### 3.4 UNKNOWN

- 특정 full `日干支`, 예를 들어 `甲子日`,이 `早子时`의 특정 `時干支`와 한 사례로 직접 인쇄된 surface는 UNKNOWN이다.
- `早子时`의 日柱가 어떤 full day-ganzhi를 취하는지에 대한 명시적 early worked assignment는 UNKNOWN이다.
- `紫微斗数精成全集`의 creator, date, edition, physical-item identity, lineage, institution, historical authority는 UNKNOWN이다.
- 王德峰 PDF의 date, edition, physical-item identity, lineage, historical authority는 UNKNOWN이다.
- 어떠한 source-local table도 production mapping, readiness, activation을 결정하지 않는다.

### 3.5 CONFLICT boundary

`紫微斗数精成全集`가 `早子时`와 `晚子时`에 같은 출력 행을 인쇄한다는 것은 literal table observation이다. 이를 `早子 = 晚子/夜子` 또는 `正子/子時正`으로 번역하지 않는다. 王德峰 source의 `甲子日 → 丙子`는 `夜子时`에 한정된 별도 예시이므로 `早子`와 conflict로 만들거나 early rule에 재귀속하지 않는다. v1의 `夜子`·`正子/子時正` findings와 v2의 NLC lexical/source-local findings는 변경하지 않는다.

## 4. claim-level adjudication

| claim | status | allowed wording | not promoted |
| --- | --- | --- | --- |
| `紫微斗数精成全集` p.5에 exact `早子时`가 인쇄됨 | `DIRECT` | parent-verified lexical FACT | 모든 판본의 lexical authority |
| `早子时 + 日干 group → 時干支` | `DIRECT, source-local` | p.5 table의 `甲己→甲子`, `乙庚→丙子`, `丙辛→戊子`, `丁壬→庚子`, `戊癸→壬子` | full `日干支` worked example 또는 historical rule |
| p.4–5가 日柱 산출과 時干表를 설명함 | `DIRECT within source; composition remains bounded` | 같은 장의 인쇄 절차 observation | page composition을 별도 witness authority로 확장 |
| 王德峰 p.43–44의 `早子时` generic rule | `DIRECT, source-local` | 새 날의 첫 子時 및 查表 wording | 구체적 early 日干支·時干支 pair |
| `早子时 → 특정 full 日干支·時干支` | `PARTIAL / UNRESOLVED` | conditional 時柱 edge는 닫혔으나 full day-pillar pair 없음 | `甲子日` 등으로 임의 보완 |
| `甲子日 → 丙子` | `DIRECT, but 夜子-only` | 王德峰 p.43의 `夜子时` example | 이를 early rule로 재귀속 |
| historical authority / readiness / activation | `BLOCKED` | 없음 | production mapping 또는 activation |

## 5. machine-readable evidence packet

```json
{
  "schema_version": "historical-document-evidence-v1",
  "mode": "source-analysis",
  "question": "Does an independently identified primary source surface directly connect exact 早子時 with a day-stem-to-time-pillar assignment, without normalizing it to 夜子 or 正子/子時正?",
  "scope": {
    "included_item_ids": [
      "item-ziwei-jingcheng-quanji-volume-1-p4-p5",
      "item-wang-defeng-gu-dai-ming-li-xue-jiang-gao-p43-p44"
    ],
    "excluded": [
      "modern clock normalization",
      "synonym normalization",
      "夜子-only worked example reassigned to 早子",
      "OCR or search index as canonical text",
      "cross-witness composition into historical authority",
      "readiness or activation promotion"
    ]
  },
  "sources": [
    {
      "id": "source-ziwei-jingcheng-quanji-volume-1",
      "item_id": "item-ziwei-jingcheng-quanji-volume-1-p4-p5",
      "kind": "book_pdf",
      "uri_or_path": "https://www.1mbw.com/wp-content/uploads/2012/03/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0%E7%B2%BE%E6%88%90%E5%85%A8%E9%9B%86.pdf",
      "locator": "PDF p.1 identity; PDF p.4-5 四柱 procedure and 由日干起时干支表",
      "byte_sha256": "02e3381f8ca30da79734fc9d60cbe938de551c2e7c66f37d4d3050e01dc78d11",
      "directly_inspected": true,
      "identity": {
        "institution": null,
        "catalog_id": null,
        "shelfmark": null,
        "title": "紫微斗数精成全集 一",
        "creator": null,
        "edition": null,
        "date": null
      },
      "lineage_status": "UNRESOLVED",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-wang-defeng-gu-dai-ming-li-xue-jiang-gao",
      "item_id": "item-wang-defeng-gu-dai-ming-li-xue-jiang-gao-p43-p44",
      "kind": "author-attributed_lecture_pdf",
      "uri_or_path": "https://data.guoxueruanjian.com/books/%E4%B8%AD%E5%9B%BD%E5%8F%A4%E4%BB%A3%E5%91%BD%E7%90%86%E5%AD%A6%E8%A6%81%E4%B9%89%E8%AE%B2%E7%A8%BF-%E7%8E%8B%E5%BE%B7%E5%B3%B0.pdf",
      "locator": "PDF p.1 identity; PDF p.43-44 早子时 rule surface",
      "byte_sha256": "029b9ad1309534065a6704c74d344fe72bc8165d00d07f0aef14f7eef9e6f620",
      "directly_inspected": true,
      "identity": {
        "institution": null,
        "catalog_id": null,
        "shelfmark": null,
        "title": "中国古代命理学要义讲稿",
        "creator": "王德峰",
        "edition": null,
        "date": null
      },
      "lineage_status": "UNRESOLVED",
      "independence_status": "UNRESOLVED"
    }
  ],
  "findings": [
    {
      "id": "finding-ziwei-early-table",
      "classification": "FACT",
      "statement": "Parent inspection of PDF p.5 directly confirms the 早子时 row in the 由日干起时干支表 with day-stem groups 甲己, 乙庚, 丙辛, 丁壬, 戊癸 and outputs 甲子, 丙子, 戊子, 庚子, 壬子.",
      "source_ids": ["source-ziwei-jingcheng-quanji-volume-1"]
    },
    {
      "id": "finding-ziwei-day-pillar-procedure",
      "classification": "FACT",
      "statement": "Parent inspection of PDF p.4 directly confirms the source's separate 日柱 procedure and its instruction to derive time-stem output from 日干 in the following table section.",
      "source_ids": ["source-ziwei-jingcheng-quanji-volume-1"]
    },
    {
      "id": "finding-wang-early-generic-rule",
      "classification": "FACT",
      "statement": "Parent inspection of PDF p.43-44 directly confirms 早子时, the new-day first 子时 wording, and the instruction that the time stem is determined by table lookup.",
      "source_ids": ["source-wang-defeng-gu-dai-ming-li-xue-jiang-gao"]
    },
    {
      "id": "finding-wang-night-example-boundary",
      "classification": "FACT",
      "statement": "The specific 甲子日 to 丙子 example on Wang p.43-44 is grammatically inside the separate 夜子时 explanation and is not an early-zi pair.",
      "source_ids": ["source-wang-defeng-gu-dai-ming-li-xue-jiang-gao"]
    },
    {
      "id": "finding-no-full-early-pair",
      "classification": "FACT",
      "statement": "Neither inspected source surface prints a specific full 日干支 and 時干支 pair explicitly assigned to 早子时.",
      "source_ids": [
        "source-ziwei-jingcheng-quanji-volume-1",
        "source-wang-defeng-gu-dai-ming-li-xue-jiang-gao"
      ]
    },
    {
      "id": "inference-conditional-early-time-binding",
      "classification": "INFERENCE",
      "statement": "The bounded frontier advances to a source-local conditional 早子时 day-stem-group to time-pillar edge; a full day-ganzhi assignment remains open.",
      "source_ids": ["source-ziwei-jingcheng-quanji-volume-1"]
    }
  ],
  "claims": [
    {
      "id": "claim-early-time-pillar-table-binding",
      "statement": "A directly inspected source table binds 早子时 to a time-pillar output conditional on the 日干 group.",
      "support": "DIRECT",
      "finding_ids": ["finding-ziwei-early-table"]
    },
    {
      "id": "claim-early-full-pillar-binding",
      "statement": "The inspected sources establish a specific full 四柱 日干支 and 時干支 assignment for 早子时.",
      "support": "PARTIAL",
      "finding_ids": [
        "finding-ziwei-early-table",
        "finding-ziwei-day-pillar-procedure",
        "finding-no-full-early-pair"
      ]
    },
    {
      "id": "claim-no-term-normalization",
      "statement": "The evidence does not justify equating 早子 with 夜子, 正子, or 子時正, and source clock wording is not a production time policy.",
      "support": "DIRECT",
      "finding_ids": [
        "finding-ziwei-early-table",
        "finding-wang-early-generic-rule",
        "finding-wang-night-example-boundary"
      ]
    }
  ],
  "ocr": null,
  "unknowns": [
    {
      "id": "unknown-full-early-day-time-pair",
      "statement": "A specific full early-zi 日干支·時干支 worked pair is not printed on the inspected surfaces.",
      "blocks_claim_ids": ["claim-early-full-pillar-binding"],
      "next_check": "Require a bounded independent primary surface with exact 早子时 and an explicit full day-pillar plus time-pillar assignment."
    },
    {
      "id": "unknown-source-lineage-and-authority",
      "statement": "The edition, physical-item identity, transmission lineage, and historical authority of both modern PDF surfaces remain unresolved.",
      "blocks_claim_ids": ["claim-early-full-pillar-binding"],
      "next_check": "Inspect a stable primary or institutional witness with inspectable identity before any authority promotion."
    }
  ],
  "boundary": {
    "ocr_is_canonical_text": false,
    "source_authority_promoted": false,
    "semantic_authority_established": false,
    "readiness_decided": false,
    "policy_or_permission_decided": false,
    "activation_decided": false,
    "automatic_fallback_used": false
  }
}
```

## 6. frontier delta and minimum blocker

```text
BEFORE: 早子 exact token = FACT; normative semantic binding = UNKNOWN
NOW:    早子时 + 日干 group → 時干支 table = DIRECT, source-local
        早子时 → 새 날의 첫 子時·查表 wording = DIRECT, source-local
        早子时 → 특정 full 日干支·時干支 worked pair = UNKNOWN
        historical authority / lineage / readiness = blocked
```

다음 최소 blocker는 `早子时`와 **그 token에 귀속된** 특정 full `日干支` 및 `時干支` pair를 같은 명시적 적용 문장·표·worked example로 직접 인쇄한 독립 primary witness다. 현재 table의 `日干 group → 時干支` edge는 유지하되, `日柱`를 임의로 보완하거나 `甲子日→丙子`를 `夜子`에서 early로 옮기지 않는다. blocker가 닫히기 전에는 이 source-local rule을 historical authority, production mapping, readiness, 또는 activation 근거로 사용하지 않는다.
