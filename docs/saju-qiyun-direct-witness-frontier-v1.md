# 사주 P0 `起運` direct-witness frontier v1

상태: `순역 결정 = source-local DIRECT FACT`, `기산 단위·일시 산술 = source-local DIRECT FACT`, `판본 계통·보편 historical authority·production converter = insufficient_evidence`

기준일: `2026-09-06 KST`

이번 bounded frontier는 기존에 확보한 《淵海子平》·《三命通會》의 원문 근거에서 **起運의 순역 결정과 실제 기산이 어디까지 같은 printed surface에 직접 닫히는지**를 확인하는 것이다. 후대 계산 관행, 현대식 일수→년수 환산, 두 witness의 조합을 전제하지 않는다. OCR·전사·색인은 위치 후보일 뿐이며, 아래 direct claims는 parent가 원본 page image를 직접 재확인한 것만 포함한다.

## 1. bounded conclusion

이번 pass에서 parent는 다음 두 source surface를 독립적으로 원본 스캔 기준으로 확인했다.

| 질문 | parent가 직접 확인한 범위 | 판정 |
| --- | --- | --- |
| 순역 결정 | 《淵海子平》 NCL-06593 p.4의 `陽男陰女`/`陰男陽女`와 `順`/`逆` | `FACT / DIRECT, source-local` |
| 순역의 기준점 | 같은 p.4의 미래/과거 `交節`; 《三命通會》 권2 p.130의 생일 뒤/앞 `節氣日時` | 각 witness의 `FACT / DIRECT`; cross-witness 보편화는 `INFERENCE` |
| 節과 氣의 구별 | 《淵海子平》 p.4의 `論節不論氣` | `FACT / DIRECT, NCL-06593 source-local` |
| 기본 기산 관계 | 두 surface의 `三日為一歲`; 《三命通會》 p.130의 일·시 수량 관계 | literal historical observation은 `FACT`; 현대 환산은 `UNKNOWN` |
| 실제 기산 | 《三命通會》 p.131–133의 날짜·시각 count, `五日三時`, `六百三十日`, `一歲奇九月`, `初四日...立春`, `子時正一刻`, `十周年方換一運` | `FACT / DIRECT, worked source-local practice` |
| 완결된 보편 알고리즘 | 잔여·借/零·刻 처리, 판본 계통, 모든 경계와 rounding | `insufficient_evidence` |

따라서 이번 frontier에서 안전하게 닫힌 것은 다음이다.

```text
각 witness가 인쇄한 `陽男陰女 → 順`, `陰男陽女 → 逆` 및 미래/과거 節(氣) 기준점 = DIRECT, source-local FACT
각 witness가 인쇄한 `三日為一歲` 및 《三命通會》의 일·시 worked example = DIRECT, source-local FACT
두 witness를 합쳐 보편적 historical authority 또는 production 起運 converter로 승격 = 불가
```

## 2. source identity and parent provenance

| source surface | identity / locator | 직접 관찰 | provenance / boundary |
| --- | --- | --- | --- |
| 《淵海子平》 增補本 | [NCL scan metadata and PDF](https://commons.wikimedia.org/wiki/File:NCL-06593_%E5%88%BB%E4%BA%AC%E8%87%BA%E5%A2%9E%E8%A3%9C%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3%E5%A4%A7%E5%85%A8.pdf); National Central Library Taiwan, `NCL-06593`/6593; `刻京臺增補淵海子平大全`; `(明)李欽撰`; `明萬曆庚子二十八年閩書林劉龍田喬山堂刊本`; PDF p.4, printed folio unresolved | `○論起大運法`; `陽男陰女` 순행·미래 交節, `陰男陽女` 역행·과거 交節; `論節不論氣`; `三日為一歲`; 같은 표면의 잔여·시각 관련 문구 | downloaded PDF SHA-256 `9e95627dd6811e6f3daff83c8413dd32a748362f09591be1dadcea1d2be277a6`; parent 600-dpi p.4 render SHA-256 `e9550a0164c629c81040601162d1a1c1ecd72995ba75eba0e089a43445bbb873`; `lineage=PARTIAL` — 增補 판본이므로 earliest/original layer의 authority는 닫히지 않음 |
| 《三命通會》 四庫全書本 | [Internet Archive scan record](https://archive.org/details/06066038.cn) 및 [Ctext library record](https://ctext.org/library.pl?if=gb&remap=gb&res=6109); IA item `06066038.cn`, 권2, `三命通會·卷二`; creator `(明)萬民英`; source Zhejiang University Library, CADAL scan; `欽定四庫全書·子部七·術數類`; PDF p.128–133 | p.128의 `論大運`; p.130의 `三日為一歲`, 일·시 관계와 미래/과거 `節氣日時` 순역; p.131의 `五日三時`·`六百三十日`·`一歲奇九月` worked example; p.132–133의 `丑時正一刻`·`立春`·`零/借`·`十周年方換一運` 문구 | downloaded PDF SHA-256 `af4a8ca65cc4dfdf63d6294adc7925a868214563d0d52664c7ba779b833db14a`; parent 320-dpi p.130 render SHA-256 `fa98008e4b52ff7bea66129656cbaca54840089a3078f7687b485123755b0e4d`, p.132 `2dcf81cbe0b723a8eba1913203ac14184222505cf8880268b22dbf45a5e610e8`, p.133 `4f793ea1df0e35178afefbdd082c26d6d5c7be3b2821c311d7b3b65984354130`; `lineage=PARTIAL` — 四庫本의 편집·전승 관계와 earliest layer는 닫히지 않음 |

검색 전사와 OCR은 parent 관찰의 근거로 승격하지 않았다. 특히 `三命通會`의 indexed text는 위치·문자 후보를 제공했을 뿐이며, claim은 위 p.128–133 image surface의 직접 판독에서만 취했다.

## 3. source observation

### 3.1 《淵海子平》 NCL-06593 p.4

- p.4 오른쪽 printed surface에 `○論起大運法`이 있다.
- 같은 surface에서 `陽男陰女` 뒤에 `順` 및 미래 `交節`을 세는 문장이, `陰男陽女` 뒤에 `逆` 및 과거 `交節`을 세는 문장이 이어진다. 이는 현대적인 성별/간지 함수로 재작성하지 않고 원문 pairing 그대로 보존한다.
- `論節不論氣`가 직접 인쇄되어 있다. 이 witness에 한해 起運의 기준을 `節`로 두고 `氣`와 구별한다는 lexical/semantic observation은 닫힌다. 이를 《三命通會》의 `節氣` 표현과 자동으로 같은 범위라고 판정하지 않는다.
- `三日為一歲`가 같은 起大運 논의 안에 인쇄되어 있다.
- `交節` 전후의 날짜·시각, 잔여 및 `零/借`에 해당하는 문구가 이어지지만, 모든 글자의 기능적 의미와 rounding을 parent가 production rule로 정규화하지 않았다.

### 3.2 《三命通會》 권2 p.128–133

- p.128 왼쪽에 `論大運` 표제가 직접 보이고, p.129부터 운의 의미와 기산 설명이 이어진다.
- p.129–130에는 `一辰十歲`, `三日為年/三日為一歲` 계열의 설명과 `一日`의 `十二時`, `三日`의 `三十六時`, `三百六十日` 및 `一月`의 시수 관계가 인쇄되어 있다. 이 수량 관계는 source literal observation이며, 별도의 현대 단위 환산으로 확장하지 않는다.
- p.130에는 `陽男陰女`가 생일 뒤의 미래 `節氣日時`를 세어 `順`, `陰男陽女`가 생일 앞의 과거 `節氣日時`를 세어 `逆`으로 행한다는 문장이 직접 보인다.
- p.130–131의 worked example은 `甲子陽男`, 12월 24일 巳時 출생, 29일 申時 立春을 놓고 `五日三時`, `實歷過六十三日`, `過六十三時`, `六百三十日`, `一歲奇九月`, `起於丁丑`을 차례로 인쇄한다.
- p.132–133에는 `陽命正月初一日丑時正一刻`에서 `初四日丑時正一刻立春`까지를 `一歲全`으로 보는 example, `多一時/欠一時`에 대한 `零/借` 표현, `子時正一刻` 기준의 다음 사례, `十周年方換一運`, 출생 `刻`을 모를 때의 별도 문장이 있다.
- 이 example들은 이 四庫本 surface가 실제로 어떤 날짜·시각 count를 서술하는지 보여주는 `FACT`다. 그러나 각각의 수량을 모든 생시 입력에 적용하는 보편적 converter 또는 후대 표준으로 승격하지 않는다.

## 4. FACT / INFERENCE / UNKNOWN / CONFLICT

### 4.1 FACT — source-local direct rules

- NCL-06593 p.4는 `陽男陰女 → 順`, `陰男陽女 → 逆`을 미래/과거 `交節` count와 직접 결합한다.
- NCL-06593 p.4는 `論節不論氣`를 직접 인쇄한다.
- NCL-06593 p.4와 四庫本 《三命通會》 p.130은 각각 `三日為一歲`를 직접 인쇄한다.
- 四庫本 《三命通會》 p.130은 미래/과거 `節氣日時` count와 순역을 직접 결합한다.
- 四庫本 《三命通會》 p.131–133은 날짜·시각을 포함한 worked calculation과 `交運`·`換一運` 문구를 직접 인쇄한다.

### 4.2 INFERENCE — composition을 허용하지 않는 제한적 해석

- 두 source가 순역과 3일 관계를 모두 보인다는 것은 **각 source-local observation의 병렬성**이다. 두 문장을 합쳐 “모든 《淵海子平》·《三命通會》 전승에 공통인 단일 규칙”이라고 말하는 것은 inference이며, 현재 authority claim이 아니다.
- `論節不論氣`와 《三命通會》의 `節氣日時`가 실제로 같은 절기 집합을 지시한다고 판단하는 것은 아직 inference다. 후자의 문맥과 worked example이 `立春`을 보인다는 사실만으로 `中氣` 배제까지 닫지 않는다.
- `一辰十歲`, `三日為一歲`, `三十六時`를 production data model의 고정 단위로 옮기는 것은 구현 설계이지 historical FACT가 아니다.

### 4.3 UNKNOWN — `insufficient_evidence` 유지

- NCL-06593의 增補 문구가 earliest/original 《淵海子平》 layer와 동일한지 UNKNOWN이다.
- 四庫本 《三命通會》의 해당 문구가 어떤 이전 판본을 얼마나 보존하는지, NCL-06593과 독립 corroboration으로 얼마만큼의 authority를 갖는지 UNKNOWN이다.
- `零/借`, `一旬`, 잔여 일·시·刻의 정확한 semantic quantity와 rounding/borrowing 규칙은 UNKNOWN이다. 인쇄 문구의 존재와 그 의미의 완결을 분리한다.
- `三日為一歲`를 현대적인 `일수→년·월`, 시간/刻의 fractional conversion으로 확장할 근거는 UNKNOWN이다. `1일=4개월` 같은 관행을 도입하지 않는다.
- 모든 가능한 입장에서 첫 起運 시점, 첫 운의干支 선택, 윤월·경계일 처리까지 완결하는 보편 알고리즘은 UNKNOWN이다.
- historical authority, readiness, production wiring, activation은 결정하지 않았다.

### 4.4 CONFLICT

이번 두 parent-inspected surface 사이에서 같은 범위의 문장을 정면으로 부정하는 직접 `CONFLICT`는 관찰되지 않았다. 다만 `論節不論氣` 대 `節氣日時`의 용어 범위 차이는 unresolved semantic boundary이므로 `CONFLICT`로 강제하지 않고 `UNKNOWN`으로 보존한다.

## 5. historical rule와 implementation practice의 분리

### 역사 source가 직접 말하는 것

1. 특정 source wording의 `陽男陰女/陰男陽女` pairing과 순/역 방향.
2. 미래/과거의 節 또는 節氣日時를 세는 서술.
3. `三日為一歲` 및 각 source가 제시한 날짜·시각 worked example.

### production 구현으로 아직 채택하지 않는 것

1. 두 witness의 문장을 하나의 canonical authority로 합치는 것.
2. `節氣`를 자동으로 `節` 또는 `中氣` 중 하나로 정규화하는 것.
3. `零/借`와 `一旬`을 현대적인 반올림·보정 함수로 구현하는 것.
4. 3일/1년 관계에서 월·일·시의 고정 환산표를 파생하는 것.
5. 이 기록만으로 production readiness나 activation을 여는 것.

따라서 현재 production 상태는 `起運 historical authority = insufficient_evidence`이며, 필요한 경우 별도 implementation policy를 만들더라도 historical FACT와 분리된 정책·승인·activation gate가 필요하다.

## 6. 다음 최소 blocker

가장 작은 다음 blocker는 **판본·계통이 명시된 별도 primary image surface 하나에서 `論節不論氣`/`節氣日時`의 범위와 `零/借`·시각 잔여 처리를 문자 단위로 직접 비교하는 것**이다. 그 비교가 닫히기 전까지는 현재의 source-local FACT만 유지하고, 현대 환산이나 보편 production converter를 추가하지 않는다.

## 7. machine-readable evidence packet

```json
{
  "schema_version": "historical-document-evidence-v1",
  "mode": "source-analysis",
  "question": "《淵海子平》與《三命通會》의 起運 순역 결정과 실제 기산이 parent-inspected primary image surface에서 어디까지 직접 닫히는가",
  "scope": {
    "included_item_ids": [
      "item-ncl-06593-yuanhai-p4",
      "item-cadal-skqs-06066038-sanmingtonhui-p128-p133"
    ],
    "excluded": [
      "후대 계산 관행의 보충",
      "현대식 일수→년수·월수·시수 환산",
      "OCR·색인·전사를 canonical text로 사용",
      "cross-witness composition을 historical authority로 승격",
      "readiness 또는 activation 결정"
    ]
  },
  "sources": [
    {
      "id": "source-ncl-06593-yuanhai-p4",
      "item_id": "item-ncl-06593-yuanhai-p4",
      "kind": "page_image",
      "uri_or_path": "https://commons.wikimedia.org/wiki/File:NCL-06593_%E5%88%BB%E4%BA%AC%E8%87%BA%E5%A2%9E%E8%A3%9C%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3%E5%A4%A7%E5%85%A8.pdf",
      "locator": "PDF p.4; 卷之一; printed folio unresolved; ○論起大運法 surface",
      "byte_sha256": "9e95627dd6811e6f3daff83c8413dd32a748362f09591be1dadcea1d2be277a6",
      "directly_inspected": true,
      "identity": {
        "institution": "National Central Library, Taiwan",
        "catalog_id": "NCL-06593",
        "shelfmark": "6593",
        "title": "刻京臺增補淵海子平大全",
        "creator": "(明)李欽撰",
        "edition": "明萬曆庚子二十八年閩書林劉龍田喬山堂刊本",
        "date": "明萬曆二十八年"
      },
      "lineage_status": "PARTIAL",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-cadal-skqs-06066038-sanmingtonhui-p128-p133",
      "item_id": "item-cadal-skqs-06066038-sanmingtonhui-p128-p133",
      "kind": "page_image",
      "uri_or_path": "https://archive.org/details/06066038.cn",
      "locator": "PDF p.128-133; 卷二; p.128 論大運; printed folio unresolved",
      "byte_sha256": "af4a8ca65cc4dfdf63d6294adc7925a868214563d0d52664c7ba779b833db14a",
      "directly_inspected": true,
      "identity": {
        "institution": "浙江大學圖書館; CADAL scan",
        "catalog_id": "06066038.cn",
        "shelfmark": null,
        "title": "三命通會·卷二",
        "creator": "（明）萬民英",
        "edition": "欽定四庫全書本; 子部七·術數類",
        "date": null
      },
      "lineage_status": "PARTIAL",
      "independence_status": "UNRESOLVED"
    }
  ],
  "findings": [
    {
      "id": "finding-yuanhai-direct-direction-boundary",
      "classification": "FACT",
      "statement": "NCL-06593 p.4 directly prints the 起大運 surface with 陽男陰女 paired with 順 and future 交節, 陰男陽女 paired with 逆 and past 交節, and also prints 論節不論氣.",
      "source_ids": ["source-ncl-06593-yuanhai-p4"]
    },
    {
      "id": "finding-yuanhai-direct-base-relation",
      "classification": "FACT",
      "statement": "NCL-06593 p.4 directly prints 三日為一歲 in the 起大運 discussion and includes adjacent date/time remainder material.",
      "source_ids": ["source-ncl-06593-yuanhai-p4"]
    },
    {
      "id": "finding-sanmingtonhui-direct-rule",
      "classification": "FACT",
      "statement": "The parent-inspected 四庫本 scan p.128-133 directly prints 論大運, the 陽男陰女/陰男陽女 future/past 節氣日時 順逆 rule, 三日為一歲, and date/time worked examples.",
      "source_ids": ["source-cadal-skqs-06066038-sanmingtonhui-p128-p133"]
    },
    {
      "id": "finding-sanmingtonhui-worked-practice",
      "classification": "FACT",
      "statement": "The same 四庫本 surface directly prints the 五日三時 / 六百三十日 / 一歲奇九月 example and the later 丑時正一刻 / 立春 / 零借 / 十周年換一運 material; this records source-local practice, not a universal modern converter.",
      "source_ids": ["source-cadal-skqs-06066038-sanmingtonhui-p128-p133"]
    },
    {
      "id": "finding-cross-witness-parallel",
      "classification": "INFERENCE",
      "statement": "The two witnesses show parallel direction and three-day relation observations, but their agreement does not by itself establish a common transmission layer or historical authority.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p128-p133"]
    },
    {
      "id": "finding-authority-lineage-unresolved",
      "classification": "UNKNOWN",
      "statement": "The evidence does not close the relation of either inspected wording to an earliest/original textual layer or a universal historical authority for production 起運.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p128-p133"]
    },
    {
      "id": "finding-fractional-semantics-unresolved",
      "classification": "UNKNOWN",
      "statement": "The semantic quantities and rounding behavior of 零/借, 一旬, residual day/hour/刻 clauses, and any modern day-to-year/month conversion remain unresolved.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p128-p133"]
    },
    {
      "id": "finding-no-direct-conflict",
      "classification": "INFERENCE",
      "statement": "No same-scope direct contradiction was observed; the difference between 論節不論氣 and generic 節氣日時 is retained as UNKNOWN scope, not forced into a conflict.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p128-p133"]
    }
  ],
  "claims": [
    {
      "id": "claim-source-local-yuanhai-rule",
      "statement": "The NCL-06593 witness directly records 起運 direction and a 節-not-氣 distinction together with 三日為一歲.",
      "support": "DIRECT",
      "finding_ids": ["finding-yuanhai-direct-direction-boundary", "finding-yuanhai-direct-base-relation"]
    },
    {
      "id": "claim-source-local-sanmingtonhui-rule-and-example",
      "statement": "The 四庫本 三命通會 witness directly records 起運 direction, future/past 節氣日時 counting, the three-day relation, and worked date/time examples.",
      "support": "DIRECT",
      "finding_ids": ["finding-sanmingtonhui-direct-rule", "finding-sanmingtonhui-worked-practice"]
    },
    {
      "id": "claim-common-historical-authority",
      "statement": "The two source surfaces establish one common, complete, historically authoritative, production-ready 起運 algorithm.",
      "support": "UNRESOLVED",
      "finding_ids": ["finding-cross-witness-parallel", "finding-authority-lineage-unresolved", "finding-fractional-semantics-unresolved"]
    }
  ],
  "ocr": null,
  "unknowns": [
    {
      "id": "unknown-lineage-and-edition-authority",
      "statement": "Edition-to-edition transmission, earliest layer, and historical authority remain unresolved.",
      "blocks_claim_ids": ["claim-common-historical-authority"],
      "next_check": "Compare one lineage-identified independent primary image surface at character level."
    },
    {
      "id": "unknown-fractional-and-boundary-semantics",
      "statement": "The scope of 節氣 versus 節/氣 and the exact semantics of residual day/hour/刻, 零/借, and 一旬 remain unresolved.",
      "blocks_claim_ids": ["claim-common-historical-authority"],
      "next_check": "Parent-inspect a bounded independent page with the full remainder paragraph; do not supply modern conversion."
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

이번 기록은 위 두 source surface의 parent-verified observation과 boundary만 추가한다. 기존 `docs/saju-zi-day-boundary-early-zi-normative-witness-successor-v3.md` 및 기타 dirty/untracked 작업은 수정하지 않았다.
