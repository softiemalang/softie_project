# 사주 `起運` 交節 간격→연령 환산 frontier v1

상태: `source-local worked example = FACT`, `generic residual decomposition = insufficient_evidence`

기준일: `2026-09-06 KST`

이번 bounded frontier의 질문은 **생시에서 交節까지의 실제 日·時 간격을 起運 연령의 歲·月·日로 어떻게 처리하는가**이다. 《淵海子平》의 `三日為一歲`와 《三命通會》의 worked example을 출발점으로 삼되, source가 직접 인쇄한 값과 그 값에서 산술적으로 유도한 값을 분리한다. 현대식 일수→년수 환산, 후대 관행, 반올림 규칙은 보충하지 않는다.

## 1. bounded conclusion

이번 pass에서 parent가 원본 scan image를 독립 재확인한 결과는 다음과 같다.

| frontier 질문 | 직접 닫힌 범위 | 판정 |
| --- | --- | --- |
| 기본 관계 | 《淵海子平》 p.4의 `三日為一歲`; 《三命通會》 권2 p.129–130의 `一辰十歲`, `折除以三日為年`, `三日`·`三十六時`·`三百六十日` 관계 | `FACT / source-local` |
| 실제 worked interval | 《三命通會》 p.131의 `五日三時` → `六十三時` → `六百三十日` → `一歲奇九月` | `FACT / direct worked example` |
| 잔여 일·時의 일반 환산 | 특정 worked example에서 `多一時/欠一時` 및 `零一旬/借一旬` 문구는 확인되나, 일반적인 歲·月·日 decomposition 표/공식은 없음 | `UNKNOWN` |
| `零/借/旬` 의미 | 인쇄된 local phrase의 존재는 FACT; `一旬`이 정확히 어떤 양을 뜻하는지, rounding인지 borrowing인지 미확정 | `UNKNOWN` |
| `刻` 처리 | `丑時正一刻`, `子時正一刻`은 경계 시각의 printed observation; `刻`을 generic fractional hour로 환산하는 규칙은 없음 | `UNKNOWN` |
| 윤월·보정 | p.132–133의 `閏四月`, `退還`, `十週年方換一運` worked material은 source-local FACT; 일반 구현 알고리즘은 없음 | `UNKNOWN` |

따라서 이번 frontier에서 안전하게 닫힌 핵심은 다음 하나다.

```text
《三命通會》 四庫本 p.131의 특정 예에서 交節까지 `五日三時`를 세어
`六百三十日`, `一歲奇九月`로 처리한다고 직접 인쇄한다.
```

이는 **특정 source surface의 worked practice**이며, 두 witness를 합쳐 모든 판본에 공통인 완결 converter로 승격하지 않는다.

## 2. source identity and parent provenance

| source surface | identity / locator | parent가 직접 확인한 provenance |
| --- | --- | --- |
| 《淵海子平》 增補本 | [NCL scan metadata and PDF](https://commons.wikimedia.org/wiki/File:NCL-06593_%E5%88%BB%E4%BA%AC%E8%87%BA%E5%A2%9E%E8%A3%9C%E6%B7%B5%E5%AD%90%E5%B9%B3%E5%A4%A7%E5%85%A8.pdf), NCL-06593/6593, `刻京臺增補淵海子平大全`, `(明)李欽撰`, 明萬曆二十八年閩書林劉龍田喬山堂刊本, PDF p.4 `○論起大運法` surface | downloaded PDF SHA-256 `9e95627dd6811e6f3daff83c8413dd32a748362f09591be1dadcea1d2be277a6`; parent 600-dpi p.4 render SHA-256 `e9550a0164c629c81040601162d1a1c1ecd72995ba75eba0e089a43445bbb873`; 增補本의 earliest/original layer와의 lineage는 `PARTIAL` |
| 《三命通會》 四庫全書本 권2 | [Internet Archive scan record](https://archive.org/details/06066038.cn), [Ctext library record](https://ctext.org/library.pl?if=gb&remap=gb&res=6109), `06066038.cn`, `(明)萬民英`, 浙江大學圖書館/CADAL scan, 欽定四庫全書 子部七·術數類, PDF p.128–133 | downloaded PDF SHA-256 `af4a8ca65cc4dfdf63d6294adc7925a868214563d0d52664c7ba779b833db14a`; parent render SHA-256: p.129 `ed65cb4437de05ad0c88afff63a3fc300d4307f097554e4cf4b958fcc31fbc9b`, p.130 `fa98008e4b52ff7bea66129656cbaca54840089a3078f7687b485123755b0e4d`, p.131 `623061931f8dadf5f99332c6e4040f7c2cea08ade644db244145136d740326a4`, p.132 600-dpi `fdddc94848cb2b5c1a54c3b1ab5dbe495497594baa794ebb128bc6357a729549`, p.133 600-dpi `7f4610dc5ed69721b16f264539da78957ef706c0cad6aae9de92ddd354515595`; 四庫本의 편집·전승 관계와 earliest layer는 `PARTIAL` |

OCR·검색 전사·Native sidecar는 위치와 glyph 후보를 찾는 데만 사용했다. canonical observation은 parent가 위 원본 PDF의 rendered page image를 직접 다시 읽은 결과다. Sidecar가 p.132의 `零一旬`을 `零二旬`으로 제시한 후보는 parent 고해상도 원본 판독과 불일치하여 폐기했다. 이는 source 간 conflict가 아니라 **delegated reading candidate와 parent reading의 adjudication**이다.

## 3. parent source observation

### 3.1 《淵海子平》 NCL-06593 p.4

- `○論起大運法` surface 안에 `三日為一歲`가 직접 인쇄되어 있다.
- 이 page는 起運의 순역과 交節 기준을 함께 말하지만, `三日為一歲`에서 남는 일반적인 `日·時 → 歲·月·日` 표를 완결해 인쇄하지 않는다.
- 잔여·시각 관련 문구가 인접하지만, 해당 문구만으로 `零/借/旬`의 양이나 rounding 방식을 정규화하지 않는다.

### 3.2 《三命通會》 권2 p.129–130: source-local numeric frame

parent image에서 다음 수량 관계를 직접 확인했다.

- `一辰十歲`, `折除以三日為年` 계열의 문구가 있다.
- `一日`을 `十二時`로 세고, `三日`을 `三十六時`로 세며, `三百六十日`이 그 source-local 10년/一辰 관계를 이룬다고 설명한다.
- 같은 논의에서 `一月`을 30일 단위로 취급하는 numeric frame이 보인다.

이것은 source가 사용한 수량 관계의 **literal observation**이다. `1일=4개월` 또는 현대 달력의 일수·월수로 자동 변환하는 production policy는 아니다.

### 3.3 《三命通會》 p.131: worked example

parent가 같은 physical page에서 다음 문자열과 산술 순서를 직접 재확인했다.

```text
甲子陽男十二月二十四日巳時生
至二十九日申時立春
五日三時
實歷過六十三日 / 折除過六十三時
計六百三十日
乃一歲奇九月
起於丁丑
```

여기서 직접 닫히는 것은 **이 example의 입력·중간 count·출력**이다. 이를 일반 입력에 대한 함수로 재작성하거나, `奇九月`의 잔여 일수까지 source가 계산했다고 주장하지 않는다.

### 3.4 《三命通會》 p.132–133: remainder, boundary, leap material

- `正月初一日丑時正一刻生`에서 `初四日丑時正一刻立春節乃作一歲全`으로 보는 example이 있다.
- 이어 `若春在寅時則多一時乃零一旬若` 및 다음 column의 `欠一時乃借一旬`을 parent 고해상도 image에서 읽었다. `零一旬`을 직접 판독했으며, sidecar의 `零二旬` 후보는 채택하지 않았다.
- 별도 example에는 `甲子年正月初一子時正一刻生`, 다음 해 `正月初一日子時正一刻`, `乃作一歲內小六個月`, `即進六日在初七日子時正一刻方作一歲`가 있다.
- 같은 example은 `本年有閏四月乃多一月矣` 및 `當退還本年十二月初七日子時正一刻交運`을 말하고, 이어 `從此算後十週年方換一運`을 인쇄한다.

이 문장들은 source-local example과 boundary wording의 FACT다. 그러나 `零一旬`을 source가 명시적으로 10일로 정의했는지, `借一旬`이 어느 단위에서 어떤 방향으로 borrow하는지, `閏四月` 보정이 모든 달력 입력에 적용되는지는 이 surface만으로 닫히지 않는다.

## 4. source rule vs mathematical derivation

### 4.1 source가 직접 규정하거나 예시한 값

- `三日為一歲`라는 base relation은 각 witness의 起運 논의에 직접 인쇄되어 있다.
- 《三命通會》의 source-local numeric frame은 `一日=十二時`, `三日=三十六時`, `三百六十日` 및 30일 month frame을 직접 제시한다.
- 특정 example에서 `五日三時`가 `六百三十日`, `一歲奇九月`로 이어진다.
- p.132–133은 `多一時/欠一時`, `零一旬/借一旬`, `正一刻`, 윤월 및 `十週年方換一運`을 직접 인쇄한다.

### 4.2 source 수량을 그대로 산술 모델로 놓았을 때의 derivation

아래는 historical rule이나 production policy가 아니라, 위 source-local 숫자를 일관된 산술 모델로 놓은 경우의 **수학적 유도**다.

```text
T = 12D + H                         # D일 + H時를 時 단위로 표시
Q = 10T                             # source-local 36時 ↔ 360日 관계
Y = floor(Q / 360)
M = floor((Q mod 360) / 30)
R = Q mod 30                        # source-model 日 잔여
```

| 입력 간격 | 산술 유도 | source와의 지위 |
| --- | --- | --- |
| `5日3時` | `T=63時`, `Q=630日` → `1歲 9月 0日` | `Q`와 `1歲奇9月`은 해당 worked example의 `FACT`; 일반 공식으로의 확장은 `INFERENCE` |
| `3日` | `T=36時`, `Q=360日` → `1歲` | source base relation과 일치하는 산술 확인; generic remainder algorithm의 직접 증거 아님 |
| `1日` | `Q=120日` → `0歲 4月` | 수학적 유도만; source가 generic `1日=4月` 규칙으로 직접 명시한 것은 아님 |
| `1時` | `Q=10日` → `0歲 0月 10日` | 수학적 유도만; p.132의 `一旬`과 동일하다고 source가 정의하지 않음 |
| `2日5時` | `T=29時`, `Q=290日` → `0歲 9月 20日` | 수학적 유도만; worked example로 직접 닫히지 않음 |

따라서 `1日=4月`, `1時=10日`, 또는 위의 floor decomposition은 **계산 가능성**이지 역사 source의 generic normative wording이 아니다. 특히 source의 `一歲奇九月`은 5日3時 example의 출력이며, 반올림·버림·잔여 일의 처리 방식을 설명하는 일반 규칙이 아니다.

## 5. FACT / INFERENCE / UNKNOWN / CONFLICT boundary

### FACT — parent-inspected, source-local

- 《淵海子平》 NCL-06593 p.4에 `三日為一歲`가 직접 있다.
- 《三命通會》 권2 p.129–130에 `一辰十歲`, `折除以三日為年`, `一日`·`十二時`·`三十六時`·`三百六十日` 관계가 직접 있다.
- 《三命通會》 p.131의 특정 example은 `五日三時`에서 `六百三十日`, `一歲奇九月`로 이어진다.
- 《三命通會》 p.132–133에는 `零一旬`, `借一旬`, `正一刻`, 윤월·`退還`, `十週年方換一運`이 source-local 문구로 직접 있다.

### INFERENCE — 산술 또는 제한적 해석

- source-local 숫자를 모델로 놓으면 `T=12D+H`, `Q=10T`, `360日=1歲`, `30日=1月`에 따른 floor decomposition을 계산할 수 있다.
- `5日3時`의 `630日`을 `360+270`으로 보고 `1歲9月`을 재현하는 것은 parent 산술 확인이며, source가 generic algorithm을 제공했다는 뜻은 아니다.
- 두 witness의 `三日為一歲`가 병렬로 보인다는 사실만으로 동일 전승층·보편 historical authority가 성립하지 않는다.
- p.132의 `零一旬/借一旬`이 산술 모델의 `10日`과 관련될 가능성은 있으나, source가 이를 명시적으로 정의하지 않았으므로 의미 binding은 닫히지 않는다.

### UNKNOWN — `insufficient_evidence` 유지

- 남는 `日·時`를 모든 입력에 대해 `歲·月·日`로 분해하는 generic source rule.
- `一旬`의 정확한 단위와 `零`/`借`가 zeroing, rounding, truncation, borrowing 중 무엇인지.
- `多一時`/`欠一時`에서 경계에 도달하지 못한 시간을 처리하는 방향과 반올림 여부.
- `正一刻` 및 생시 `刻`을 時의 fractional part로 변환하는 규칙.
- `閏四月`와 `退還`을 일반적인 윤월·경계 보정 algorithm으로 확장하는 방법.
- `三日為一歲`를 현대 calendar duration, 현대식 365/366일, 23:00/00:00 같은 정책으로 연결하는 근거.
- 두 판본의 lineage가 generic normative authority를 제공하는지, production readiness/activation을 열 수 있는지.

### CONFLICT

이번 parent 원본 판독 사이에서 source-level direct contradiction은 확인되지 않았다. p.132의 `零二旬`은 Native sidecar의 glyph candidate였으나 parent 고해상도 원본은 `零一旬`으로 재확인했다. 따라서 이는 **도구 판독 불일치가 parent source observation으로 해소된 사례**이며, 역사 source 간 `CONFLICT`로 기록하지 않는다.

## 6. implementation boundary

현재 historical result만으로 production 起運 converter를 활성화하지 않는다. 구현 proposal을 별도로 작성할 수는 있지만 최소한 다음을 historical FACT와 분리해야 한다.

1. source-ratio arithmetic을 사용할지 여부와 `日·時` 입력 정밀도.
2. residual decomposition의 floor/round/borrow 정책.
3. `旬`·`刻`·윤월을 처리하지 못하는 경우의 fail-closed `UNKNOWN` 상태.
4. 판본·authority 승인과 production activation gate.

어떤 값을 선택하더라도 그 선택은 이 기록의 역사적 authority가 아니라 명시적 implementation policy다.

## 7. next minimum blocker

다음 최소 blocker는 **lineage가 식별된 독립 primary page에서 `零/借/旬`을 단위와 연산으로 정의하거나, 잔여 日·時를 generic하게 歲·月·日로 산출하는 worked example을 직접 확인하는 것**이다. 그 surface가 없으면 현재 결론은 `generic interval→age conversion = insufficient_evidence`로 잠근다.

## 8. machine-readable evidence packet

```json
{
  "schema_version": "historical-document-evidence-v1",
  "mode": "source-analysis",
  "question": "交節까지의 실제 日·時 간격을 起運 연령의 歲·月·日로 환산하는 규칙이 《淵海子平》과 《三命通會》의 parent-inspected primary image에서 어디까지 직접 닫히는가",
  "scope": {
    "included_item_ids": [
      "item-ncl-06593-yuanhai-p4",
      "item-cadal-skqs-06066038-sanmingtonhui-p129-p133"
    ],
    "excluded": [
      "현대식 365/366일 또는 현대 시각 정책",
      "후대 계산 관행의 보충",
      "OCR·검색 전사·sidecar glyph candidate를 canonical text로 승격",
      "零/借/旬/刻 의미의 추정적 정규화",
      "cross-witness composition에 의한 historical authority 승격",
      "production readiness 또는 activation"
    ]
  },
  "sources": [
    {
      "id": "source-ncl-06593-yuanhai-p4",
      "item_id": "item-ncl-06593-yuanhai-p4",
      "kind": "page_image",
      "uri_or_path": "https://commons.wikimedia.org/wiki/File:NCL-06593_%E5%88%BB%E4%BA%AC%E8%87%BA%E5%A2%9E%E8%A3%9C%E6%B7%B5%E5%AD%90%E5%B9%B3%E5%A4%A7%E5%85%A8.pdf",
      "locator": "PDF p.4; 卷之一; ○論起大運法; printed folio unresolved",
      "byte_sha256": "9e95627dd6811e6f3daff83c8413dd32a748362f09591be1dadcea1d2be277a6",
      "directly_inspected": true,
      "identity": {
        "institution": "National Central Library, Taiwan",
        "catalog_id": "NCL-06593",
        "title": "刻京臺增補淵海子平大全",
        "creator": "(明)李欽撰",
        "edition": "明萬曆庚子二十八年閩書林劉龍田喬山堂刊本",
        "date": "明萬曆二十八年"
      },
      "lineage_status": "PARTIAL",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-cadal-skqs-06066038-sanmingtonhui-p129-p133",
      "item_id": "item-cadal-skqs-06066038-sanmingtonhui-p129-p133",
      "kind": "page_image",
      "uri_or_path": "https://archive.org/details/06066038.cn",
      "locator": "PDF p.129-133; 卷二; 論大運 / worked example / remainder material; printed folio unresolved",
      "byte_sha256": "af4a8ca65cc4dfdf63d6294adc7925a868214563d0d52664c7ba779b833db14a",
      "directly_inspected": true,
      "identity": {
        "institution": "浙江大學圖書館; CADAL scan",
        "catalog_id": "06066038.cn",
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
      "id": "finding-yuanhai-three-day-base",
      "classification": "FACT",
      "statement": "Parent-inspected NCL-06593 p.4 directly prints 三日為一歲 in the 起大運 discussion, but does not directly print a complete generic residual 日·時 to 歲·月·日 decomposition.",
      "source_ids": ["source-ncl-06593-yuanhai-p4"]
    },
    {
      "id": "finding-sanmingtonhui-source-ratios",
      "classification": "FACT",
      "statement": "Parent-inspected 四庫本 三命通會 p.129-130 directly prints the source-local 一辰十歲 / 折除以三日為年 relation and the 日·時·三十六時·三百六十日 numeric frame.",
      "source_ids": ["source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-sanmingtonhui-worked-example",
      "classification": "FACT",
      "statement": "Parent-inspected p.131 directly prints the specific 五日三時 example followed by 六十三時, 六百三十日, 一歲奇九月, and 起於丁丑.",
      "source_ids": ["source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-sanmingtonhui-remainder-material",
      "classification": "FACT",
      "statement": "Parent-inspected p.132-133 directly prints 多一時/欠一時 with 零一旬/借一旬, 正一刻 boundary wording, a 閏四月/退還 example, and 十週年方換一運.",
      "source_ids": ["source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-source-ratio-math",
      "classification": "INFERENCE",
      "statement": "If the source-local numeric relations are treated as an arithmetic model, T=12D+H and Q=10T, followed by 360-day-year and 30-day-month floor decomposition, reproduces the 5日3時 to 1歲9月 result; this is a mathematical derivation, not a generic historical rule.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-delegated-glyph-adjudication",
      "classification": "INFERENCE",
      "statement": "A delegated candidate reading 零二旬 was rejected after parent high-resolution reinspection read 零一旬; this is tool-observation adjudication and not a source-level contradiction.",
      "source_ids": ["source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-generic-residual-unresolved",
      "classification": "UNKNOWN",
      "statement": "The sources do not close a generic residual 日·時 to 歲·月·日 algorithm, rounding/truncation policy, or the exact semantic quantity and operation represented by 零/借/一旬.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-ke-and-leap-unresolved",
      "classification": "UNKNOWN",
      "statement": "The generic conversion of 正一刻, leap-month correction, and any modern calendar duration remains unresolved.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    },
    {
      "id": "finding-authority-unresolved",
      "classification": "UNKNOWN",
      "statement": "Lineage and historical authority sufficient for a universal production 起運 converter are not established by these two inspected surfaces.",
      "source_ids": ["source-ncl-06593-yuanhai-p4", "source-cadal-skqs-06066038-sanmingtonhui-p129-p133"]
    }
  ],
  "claims": [
    {
      "id": "claim-direct-worked-interval",
      "statement": "The 四庫本 三命通會 witness directly records a specific 交節 interval of 五日三時 as 六百三十日 and 一歲奇九月.",
      "support": "DIRECT",
      "finding_ids": ["finding-sanmingtonhui-worked-example"]
    },
    {
      "id": "claim-source-local-residual-phrases",
      "statement": "The same witness directly records 零一旬/借一旬 and related date-time boundary material, but these phrases alone do not define a generic residual converter.",
      "support": "PARTIAL",
      "finding_ids": ["finding-sanmingtonhui-remainder-material", "finding-generic-residual-unresolved"]
    },
    {
      "id": "claim-math-not-authority",
      "statement": "A source-ratio arithmetic model can derive values such as 1日=4 source-model months and 1時=10 source-model days, but the inspected sources do not directly authorize those as generic or production rules.",
      "support": "UNRESOLVED",
      "finding_ids": ["finding-source-ratio-math", "finding-generic-residual-unresolved", "finding-authority-unresolved"]
    }
  ],
  "ocr": null,
  "unknowns": [
    {
      "id": "unknown-generic-remainder-decomposition",
      "statement": "Generic 日·時 remainder decomposition into 歲·月·日"
    },
    {
      "id": "unknown-zero-borrow-ten-day",
      "statement": "Semantics of 零/借/一旬 and whether 一旬 equals the mathematically derived ten source-model days"
    },
    {
      "id": "unknown-ke-and-leap",
      "statement": "刻 fraction, rounding, leap-month, and 退還 handling"
    },
    {
      "id": "unknown-lineage-authority",
      "statement": "Lineage and authority sufficient for universal or production use"
    }
  ],
  "boundary": {
    "parent_validation": "Parent reread the source page images and retained only source-local literal observations; OCR, search transcription, and delegated glyph output remain advisory.",
    "historical_authority": "NOT_ESTABLISHED",
    "production_readiness": "NOT_ESTABLISHED",
    "activation": "NOT_REQUESTED",
    "next_minimum_blocker": "A lineage-identified independent primary surface that explicitly defines residual conversion and 零/借/旬 or 刻 semantics."
  }
}
```
