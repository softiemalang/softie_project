# 사주 時柱 역사적 시간 기준 frontier v1

상태: 'historical authority = insufficient_evidence'

기준일: '2026-09-06 KST'

이 문서는 기존 子時·日柱·起運 frontier를 덮어쓰지 않는 additive successor다. 이번 bounded question은 원전이 출생 '生時/時辰/時柱'를 출생지의 지방 태양 위치·日中·日晷 같은 실제 태양 관측 기준으로 정하라고 직접 규정하는지, 그리고 그 규칙을 현대의 경도 보정·均時差를 포함한 真太陽時 계산과 분리할 수 있는지다.

## 1. Bounded conclusion

이번 원본 재확인으로 다음의 좁은 source-local 사실은 직접 닫힌다.

1. NLC 《命理集成》 PDF p.61의 '看日定時之圖'는 '東/北/西/南' 방위와 태양의 위치를 읽어 시각 표지로 연결하는 도표를 인쇄한다. 같은 도표면에는 '面向南坐。照此圖看。'가 보인다.
2. 같은 책 PDF p.62의 '定日出日沒時法'은 계절별 '日出/日入' 시각을 '卯/辰/寅/酉/戌/申' 등의 時名으로 설명하고, '各省增減刻數'가 역서에 실린다고 적는다.
3. NLC 《三命通會》 권1 PDF p.101–104의 '論日刻'·'論時刻'은 '晝夜十二時均分百刻'을 설명하고, 冬至·夏至·立春 등 절후의 '日出/日入' 시각을 '初/正'과 刻數로 열거한다. p.104에는 '看命之法以時為低昂'도 직접 보인다.
4. 《命理集成》 p.60에는 '推時之法。由人生日時遁得生時之幹枝為主。'가 직접 보인다. 이는 四柱의 生時干支 입력 역할은 닫지만, 그 生時를 지방 태양시로 보정하라는 조건은 닫지 않는다.

그러나 위 항목들은 서로 다른 면과 절·문단을 포함한다. '看日定時之圖' 또는 계절별 일출·일몰 표면에는 '出生地/地方'의 출생 '生時'·'時柱'를 그 태양 위치로 배속하라는 명령이나 worked example이 없다. 따라서 다음의 목표 claim은 아직 승격하지 않는다.

~~~
historical Saju authority:
  出生地의 지방 태양시로 生時/時柱를 정하라 = UNKNOWN
  日晷/日中을 사용한 四柱 時柱 배속 = UNKNOWN
  역사 원전이 현대 longitude + equation-of-time 真太陽時를 요구한다 = UNKNOWN
~~~

'CONFLICT'는 이번 finite set에서 관찰되지 않았다. 서로 모순하는 時柱 규칙이 나온 것이 아니라, 태양·계절 시각 표면과 四柱 時柱의 직접 semantic binding 사이에 scope/locator gap이 남아 있다.

## 2. Parent-verified source provenance

| source | parent가 직접 확인한 surface | byte/provenance | 역할과 한계 |
| --- | --- | --- | --- |
| NLC 《命理集成》, item 'NLC416-13jh001663-59235' | [PDF p.60–62](https://upload.wikimedia.org/wikipedia/commons/c/c3/NLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf#page=61), printed folios가 보이는 '推時之法'·'看日定時之圖'·'定日出日沒時法' | PDF SHA-256 'dbb50d8f5daf8a30269273a3e5dc787133deabd944e76e28d592e58a97348501'; 400 dpi p.60 'e95f45fc8a4fd0d900dc5ffe7a26617e3e2f8885dfe7a5d9e61194d41cb3a89e', p.61 'ec6a363c03fe915fcfcaff6a4c928eb12c85d4d89316d5e7a7edb96643cdcf09', p.62 '25205b9bbec3d5c58a7f89ef5b7e924050484116c46b680fef0390e3d91c4e80' | 태양 위치·日出日沒·各省刻數의 direct source-local surface; birth 時柱 binding은 별도 |
| NLC 《三命通會》, item 'NLC416-13jh000156-94145' | [PDF p.101–104](https://upload.wikimedia.org/wikipedia/commons/2/23/NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf#page=102), printed '二三–二六', '論日刻'·'論時刻' | PDF SHA-256 'c6eac6fca6411e45cb801f9b771aca6dd6a6d2dfb57ecc36ea5f42ecf1ac8bf9'; 350 dpi p.101 '8ed1fec11af2834504abdef0b5cba7800089627b76069e97b2487fbd0b44e095', p.102 '3d3e72bea453a3642e0ec1d0e192c7134c78fb0a0423c4025481c5e1c943f1bf', p.103 '231d3beded55e99fb01219260b0e7613f7465fad8eea527e858b99f9ff72da12', p.104 '72f21d12b16bb01608f53bccb409c87656a9f17dd4db4360035f4b27f9513554' | 時刻·日出日入·命論에서 時의 역할을 직접 확인; 지방 真太陽時 명령은 없음 |
| Ctext 《三命通會》 권1/권2 web transcription | [論四時節氣·論日刻·論時刻](https://ctext.org/wiki.pl?chapter=578162&if=gb) | byte hash 미확인 | 원본 scan 판독의 locator 보조; lineage와 transcription 독립성은 닫지 않음 |
| 《淵海子平》 Wikisource web witness | [bounded page surface](https://zh.wikisource.org/zh-hant/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3) | byte hash 미확인 | '日出/太陽/日晷/生時/時辰' 검색에서 positive direct surface를 얻지 못한 bounded negative observation; 작품 전체 부재 주장이 아님 |
| 《春樹齋叢説》 CADAL web surface 'CADAL02031739' | [관련 chapter](https://www.shidianguji.com/zh/book/CADAL02031739/chapter/1l6uzvocet5p6) | byte hash 미확인 | '生時/時辰'과 일출·천문·命宮을 연결하는 star-命 문맥의 partial witness; 四柱 時柱 규칙으로 전이하지 않음 |
| U.S. Naval Observatory | [The Equation of Time](https://aa.usno.navy.mil/faq/eqtime) | byte hash 미확인 | 현대 apparent/mean solar time와 longitude/equation-of-time 정의만 제공; 역사 authority 아님 |
| NOAA Global Monitoring Division | [General Solar Position Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) | byte hash 미확인 | 현대 'time_offset = eqtime + 4*longitude - 60*timezone' 계산식의 방법론 source; Saju policy 아님 |

NLC PDF metadata와 mirror identity는 별도 문제다. PDF hash는 현재 확보한 byte를 고정할 뿐, 그 mirror가 원본 판본의 최초성·전승 계보·semantic authority임을 증명하지 않는다. 두 NLC scan의 edition lineage와 Ctext/Wikisource transcription의 원본 page binding은 'PARTIAL/UNRESOLVED'로 둔다.

## 3. Direct source observation

### 3.1 《命理集成》 p.60–62

- p.60의 '推時之法'은 '由人生日時遁得生時之幹枝為主'로 生日時에서 生時干支를 얻는다고 적는다. 이 문면은 四柱 입력과 時干支 산출의 source-local relation이다.
- p.61의 '看日定時之圖'는 한 physical page 안에 '東/北/西/南'과 호(arc)상의 시각/時名 표지를 배치한다. 본문에 '面向南坐。照此圖看。'가 보인다. 이 면이 직접 닫는 것은 **태양 위치를 관찰해 시각 표지를 읽는 도표가 존재한다**는 사실이다.
- p.62의 '定日出日沒時法'은 '日出卯時日入酉'를 기본 예로 들고, 五月에는 '日出寅時·日入戌時', 十月에는 '日出辰時·日入申時'처럼 계절별 차이를 설명한다. 이어 '各省增減刻數'를 매년 역서에 싣는다고 한다. 이는 지역·계절별 일출/일몰 표의 존재를 직접 보이지만, '各省'의 차이를 현대 경도 보정이나 均時差로 정의하지 않는다.

같은 p.60–62의 인접 chapter 문맥은 “이 표가 생시 산정에 쓰였을 수 있다”는 후보를 만든다. 그러나 '推時之法'의 生時干支 문장과 p.61–62의 태양/일출 surface가 서로 다른 physical page/절에 있고, p.61–62 자체에 '出生'·'四柱'·'時柱'를 태양 관측으로 정하라는 predicate가 없다. 이 결합은 'INFERENCE'로만 둔다.

### 3.2 《三命通會》 p.101–104

- p.101의 '論日刻'과 p.102의 '論時刻'은 '晝夜十二時均分百刻' 및 '初/正' 내부의 刻 단위를 설명한다.
- p.102–104는 冬至·夏至·立春 등 절후에 대해 '日出'·'日入'이 어느 時의 어느 初/正·刻인지 표로 열거한다. 이는 고전적 천문/역법 시각 표면의 direct observation이다.
- p.104의 논평은 '看命之法以時為低昂'이라고 하여 命을 볼 때 時의 비중을 직접 언급한다. 이어 '初/正'의 기운 차이와 '用時之法'을 논하지만, 출생 장소의 지방 태양 위치를 입력으로 하라는 문장은 확인되지 않는다.

따라서 이 witness에서 직접 닫히는 것은 '歷法/命論에서 時刻의 구조와 時의 중요성이 인쇄되어 있다'는 범위다. '日出/日入 표 → 출생 四柱 時柱의 지방 태양시 보정'은 cross-surface inference이며 FACT로 승격하지 않는다.

### 3.3 scope-separated star-命 witness

《春樹齋叢説》의 해당 web surface는 '時刻十二宮'·'十二時辰' 및 '建生之時'를 태양의 일출/일몰과 연결하는 천문적 命宮 논의를 보인다. 이것은 “역사 문헌에 출생 시각과 태양/천문 geometry를 연결하는 별도의 명리 전통이 있다”는 부분 관찰에는 유용하다. 그러나 그 surface는 四柱의 '時柱'·'時干支' 산정 규칙이 아니라 star-命/命宮 설명이므로, 이번 Saju P0의 historical authority로 전이하지 않는다.

## 4. FACT / INFERENCE / UNKNOWN / CONFLICT ledger

| classification | 이번 bounded set에서의 판정 |
| --- | --- |
| FACT | '命理集成' p.61에 방위·태양 위치·時名을 함께 읽는 '看日定時之圖'가 있다. |
| FACT | '命理集成' p.62가 계절별 '日出/日入' 時名과 '各省增減刻數'를 직접 인쇄한다. |
| FACT | '三命通會' p.101–104가 十二時·百刻·初正 및 절후별 日出/日入 시각을 직접 인쇄한다. |
| FACT | '命理集成' p.60의 '人生日時 → 生時之幹枝' 문장은 生時干支가 四柱 산출의 입력/결과라는 source-local relation을 보인다. |
| FACT | '三命通會' p.104의 '看命之法以時為低昂'은 命論에서 時의 중요성을 직접 말한다. |
| INFERENCE | '命理集成' p.60–62의 인접 문맥은 태양관측 시각법이 생시 판정의 보조였을 가능성을 시사하지만, page/절 join과 명시적 birth predicate 부재 때문에 직접 규칙이 아니다. |
| INFERENCE | '各省增減刻數'는 지역·계절 보정 표면일 수 있으나, 그것을 longitude correction 또는 equation-of-time과 동치화할 근거는 없다. |
| UNKNOWN | 출생지의 지방 태양 위치·日中·日晷로 '生時/時辰/時柱'를 정하라는 四柱 normative clause 또는 worked example. |
| UNKNOWN | 역사 source가 현대식 longitude + 均時差/eqtime 真太陽時 계산을 요구하는지 여부. |
| UNKNOWN | NLC scan metadata·mirror와 고전 텍스트의 정확한 판본 lineage, Ctext/Wikisource transcription의 독립성. |
| CONFLICT | 없음. 이번 set의 문제는 직접 모순이 아니라 target semantic binding의 미확정이다. |

## 5. Evidence packet

~~~json
{
  "schema_version": "historical-document-evidence-v1",
  "mode": "source-analysis",
  "question": "원전이 출생 生時/時辰/時柱를 출생지의 지방 태양 위치·日中·日晷 기준으로 정하는지, 그리고 이를 현대 longitude·equation-of-time 真太陽時와 구분할 수 있는가?",
  "scope": {
    "included_item_ids": [
      "NLC416-13jh001663-59235",
      "NLC416-13jh000156-94145",
      "ctext-sanming-tonghui-web",
      "wikisource-yuanhai-zi-ping-web",
      "CADAL02031739",
      "usno-eqtime-web",
      "noaa-solar-equations-pdf"
    ],
    "excluded": [
      "현대 사주 구현 정책·production wiring·activation",
      "전체 작품 무차별 OCR",
      "agy 실패 호출에서 반환되지 않은 Gemini 관찰"
    ]
  },
  "sources": [
    {
      "id": "source-nlc-mingli-jicheng-scan",
      "item_id": "NLC416-13jh001663-59235",
      "kind": "scan",
      "uri_or_path": "https://upload.wikimedia.org/wikipedia/commons/c/c3/NLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf",
      "locator": "PDF p.60–62; printed folios 三九–四一; 推時之法, 看日定時之圖, 定日出日沒時法",
      "byte_sha256": "dbb50d8f5daf8a30269273a3e5dc787133deabd944e76e28d592e58a97348501",
      "directly_inspected": true,
      "identity": {
        "institution": "National Library of China",
        "catalog_id": "NLC416-13jh001663-59235",
        "shelfmark": null,
        "title": "命理集成",
        "creator": null,
        "edition": null,
        "date": null
      },
      "lineage_status": "PARTIAL",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-nlc-sanming-tonghui-scan",
      "item_id": "NLC416-13jh000156-94145",
      "kind": "scan",
      "uri_or_path": "https://upload.wikimedia.org/wikipedia/commons/2/23/NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf",
      "locator": "PDF p.101–104; printed 二三–二六; 論日刻, 論時刻",
      "byte_sha256": "c6eac6fca6411e45cb801f9b771aca6dd6a6d2dfb57ecc36ea5f42ecf1ac8bf9",
      "directly_inspected": true,
      "identity": {
        "institution": "National Library of China",
        "catalog_id": "NLC416-13jh000156-94145",
        "shelfmark": null,
        "title": "三命通會",
        "creator": "萬民英",
        "edition": "秦慎安校勘; 文明書局",
        "date": "民國十五年[1926]"
      },
      "lineage_status": "PARTIAL",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-ctext-sanming-tonghui-transcription",
      "item_id": "ctext-sanming-tonghui-web",
      "kind": "transcription",
      "uri_or_path": "https://ctext.org/wiki.pl?chapter=578162&if=gb",
      "locator": "卷一/卷二 web transcription; 論四時節氣, 論日刻, 論時刻",
      "byte_sha256": null,
      "directly_inspected": true,
      "identity": {
        "institution": "Chinese Text Project",
        "catalog_id": null,
        "shelfmark": null,
        "title": "三命通會",
        "creator": "萬民英",
        "edition": "web transcription of 四庫全書本",
        "date": null
      },
      "lineage_status": "PARTIAL",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-yuanhai-web-witness",
      "item_id": "wikisource-yuanhai-zi-ping-web",
      "kind": "transcription",
      "uri_or_path": "https://zh.wikisource.org/zh-hant/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3",
      "locator": "bounded page search for 日出, 太陽, 日晷, 生時, 時辰",
      "byte_sha256": null,
      "directly_inspected": true,
      "identity": {
        "institution": "Wikisource",
        "catalog_id": null,
        "shelfmark": null,
        "title": "淵海子平",
        "creator": null,
        "edition": "web witness",
        "date": null
      },
      "lineage_status": "UNRESOLVED",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-cadal-chunshuzhai-web",
      "item_id": "CADAL02031739",
      "kind": "transcription",
      "uri_or_path": "https://www.shidianguji.com/zh/book/CADAL02031739/chapter/1l6uzvocet5p6",
      "locator": "春樹齋叢説 chapter surface; 時刻十二宮, 十二時辰, 建生之時, 日出辰/日出寅",
      "byte_sha256": null,
      "directly_inspected": true,
      "identity": {
        "institution": "CADAL-linked web witness",
        "catalog_id": "CADAL02031739",
        "shelfmark": null,
        "title": "春樹齋叢説",
        "creator": null,
        "edition": "web surface",
        "date": null
      },
      "lineage_status": "UNRESOLVED",
      "independence_status": "UNRESOLVED"
    },
    {
      "id": "source-usno-equation-of-time",
      "item_id": "usno-eqtime-web",
      "kind": "transcription",
      "uri_or_path": "https://aa.usno.navy.mil/faq/eqtime",
      "locator": "official web page defining apparent/mean solar time and equation of time",
      "byte_sha256": null,
      "directly_inspected": true,
      "identity": {
        "institution": "U.S. Naval Observatory",
        "catalog_id": null,
        "shelfmark": null,
        "title": "The Equation of Time",
        "creator": null,
        "edition": "official web page",
        "date": null
      },
      "lineage_status": "ESTABLISHED",
      "independence_status": "NOT_APPLICABLE"
    },
    {
      "id": "source-noaa-solar-equations",
      "item_id": "noaa-solar-equations-pdf",
      "kind": "transcription",
      "uri_or_path": "https://gml.noaa.gov/grad/solcalc/solareqns.PDF",
      "locator": "official PDF; true-solar-time equation",
      "byte_sha256": null,
      "directly_inspected": true,
      "identity": {
        "institution": "NOAA Global Monitoring Division",
        "catalog_id": null,
        "shelfmark": null,
        "title": "General Solar Position Calculations",
        "creator": null,
        "edition": "official PDF",
        "date": null
      },
      "lineage_status": "ESTABLISHED",
      "independence_status": "NOT_APPLICABLE"
    }
  ],
  "findings": [
    {
      "id": "fact-jicheng-birth-time-input",
      "classification": "FACT",
      "statement": "命理集成 PDF p.60의 推時之法이 由人生日時遁得生時之幹枝為主라고 직접 인쇄한다. 이 surface는 生日時를 時干支 산출의 입력 관계로 보이지만 지방 태양시 조건은 말하지 않는다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan"
      ]
    },
    {
      "id": "fact-jicheng-solar-position-diagram",
      "classification": "FACT",
      "statement": "命理集成 PDF p.61의 看日定時之圖는 東/北/西/南 방위, 호상의 태양 위치와 時名 표지를 같은 physical page에 배치하고 面向南坐。照此圖看。를 인쇄한다. 이 면은 태양 위치를 읽어 시각 표지를 얻는 도표의 존재만 직접 확정한다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan"
      ]
    },
    {
      "id": "fact-jicheng-seasonal-local-sunrise",
      "classification": "FACT",
      "statement": "命理集成 PDF p.62의 定日出日沒時法은 계절별 日出/日入을 寅/卯/辰/申/酉/戌 등의 時名으로 설명하고 各省增減刻數가 역서에 실린다고 직접 인쇄한다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan"
      ]
    },
    {
      "id": "fact-sanming-chronometric-solar-table",
      "classification": "FACT",
      "statement": "三命通會 PDF p.101–104의 論日刻·論時刻은 晝夜十二時均分百刻, 初/正 및 절후별 日出/日入의 時·刻 표기를 직접 인쇄한다.",
      "source_ids": [
        "source-nlc-sanming-tonghui-scan"
      ]
    },
    {
      "id": "fact-sanming-time-role-in-ming",
      "classification": "FACT",
      "statement": "三命通會 PDF p.104는 看命之法以時為低昂이라고 직접 인쇄하여 命論에서 時의 중요성을 말한다. 같은 면은 출생지의 지방 태양 위치로 時柱를 정하라는 조건까지는 말하지 않는다.",
      "source_ids": [
        "source-nlc-sanming-tonghui-scan"
      ]
    },
    {
      "id": "fact-star-命-solar-scope",
      "classification": "FACT",
      "statement": "CADAL-linked 春樹齋叢説 web surface는 時刻十二宮·十二時辰·建生之時와 日出/천문 geometry를 함께 서술한다. 이는 star-命/命宮 scope의 web-text observation이며 四柱 時柱 rule로 전이하지 않는다.",
      "source_ids": [
        "source-cadal-chunshuzhai-web"
      ]
    },
    {
      "id": "fact-yuanhai-bounded-negative",
      "classification": "FACT",
      "statement": "淵海子平 Wikisource web witness에서 日出·太陽·日晷·生時·時辰을 대상으로 bounded search했으나 이번 surface set에는 목표 direct solar-time binding이 나타나지 않았다. 이는 작품 전체의 부재를 뜻하지 않는다.",
      "source_ids": [
        "source-yuanhai-web-witness"
      ]
    },
    {
      "id": "inference-jicheng-birth-solar-join",
      "classification": "INFERENCE",
      "statement": "命理集成 p.60의 生時干支 문장과 p.61–62의 看日定時/日出日沒 surface가 같은 推步 문맥에 인접하므로 태양관측 시각법이 생시 판정에 보조적으로 쓰였을 가능성은 있다. 하지만 서로 다른 page/절의 join이고 p.61–62에 birth·四柱·時柱 predicate가 없어 직접 규칙으로 승격하지 않는다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan"
      ]
    },
    {
      "id": "inference-local-counts-not-modern-true-solar",
      "classification": "INFERENCE",
      "statement": "各省增減刻數는 지역·계절에 따른 고전적 표/보정일 수 있으나, inspected source는 이를 longitude correction 또는 equation-of-time/均時差라고 정의하지 않는다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan",
        "source-nlc-sanming-tonghui-scan",
        "source-usno-equation-of-time",
        "source-noaa-solar-equations"
      ]
    },
    {
      "id": "fact-modern-method-separation",
      "classification": "FACT",
      "statement": "USNO는 local apparent solar time, mean solar time, longitude와 equation of time을 구분하고, NOAA는 eqtime·longitude·timezone을 포함하는 true-solar-time 계산식을 제공한다. 이는 현대 천문 방법의 사실이지 고전 사주 semantic authority가 아니다.",
      "source_ids": [
        "source-usno-equation-of-time",
        "source-noaa-solar-equations"
      ]
    },
    {
      "id": "unknown-direct-birth-hour-solar-rule",
      "classification": "UNKNOWN",
      "statement": "이번 원본 surface set에는 출생지/지방 태양 위치·日中·日晷를 출생 生時/時辰/四柱 時柱의 배속 조건으로 명시하는 direct clause 또는 그 적용을 보여 주는 worked example이 없다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan",
        "source-nlc-sanming-tonghui-scan",
        "source-yuanhai-web-witness"
      ]
    },
    {
      "id": "unknown-historical-modern-equivalence",
      "classification": "UNKNOWN",
      "statement": "역사 source가 현대 longitude + equation-of-time/均時差 真太陽時 계산을 요구하거나, 各省增減刻數를 그 공식과 동치화하는 근거는 닫히지 않았다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan",
        "source-nlc-sanming-tonghui-scan",
        "source-usno-equation-of-time",
        "source-noaa-solar-equations"
      ]
    },
    {
      "id": "unknown-lineage-and-independence",
      "classification": "UNKNOWN",
      "statement": "NLC mirror PDF의 edition lineage, Ctext/Wikisource transcription의 underlying copy와 독립성, CADAL-linked web surface의 exact page-image binding은 이 packet에서 확정하지 않는다.",
      "source_ids": [
        "source-nlc-mingli-jicheng-scan",
        "source-nlc-sanming-tonghui-scan",
        "source-ctext-sanming-tonghui-transcription",
        "source-yuanhai-web-witness",
        "source-cadal-chunshuzhai-web"
      ]
    }
  ],
  "claims": [
    {
      "id": "claim-source-local-solar-time-reading",
      "statement": "命理集成은 태양 위치·방위·日出日沒을 이용해 고전적 時名/刻을 읽는 source-local surface를 직접 보인다.",
      "support": "DIRECT",
      "finding_ids": [
        "fact-jicheng-solar-position-diagram",
        "fact-jicheng-seasonal-local-sunrise"
      ]
    },
    {
      "id": "claim-source-local-sanju-timekeeping",
      "statement": "三命通會는 十二時·百刻·初正과 절후별 日出/日入 시각을 직접 보이며, 命論에서 時의 중요성을 직접 말한다.",
      "support": "DIRECT",
      "finding_ids": [
        "fact-sanming-chronometric-solar-table",
        "fact-sanming-time-role-in-ming"
      ]
    },
    {
      "id": "claim-birth-hour-pillar-local-solar-authority",
      "statement": "검토한 고전 witness가 출생지의 지방 태양시로 四柱 生時/時柱를 정하라는 normative historical authority를 확립한다.",
      "support": "UNRESOLVED",
      "finding_ids": [
        "fact-jicheng-birth-time-input",
        "fact-jicheng-solar-position-diagram",
        "fact-jicheng-seasonal-local-sunrise",
        "fact-sanming-time-role-in-ming",
        "inference-jicheng-birth-solar-join",
        "unknown-direct-birth-hour-solar-rule"
      ]
    },
    {
      "id": "claim-historical-true-solar-algorithm",
      "statement": "검토한 고전 witness가 현대 longitude + equation-of-time/均時差 真太陽時 계산을 직접 요구한다.",
      "support": "UNRESOLVED",
      "finding_ids": [
        "inference-local-counts-not-modern-true-solar",
        "fact-modern-method-separation",
        "unknown-historical-modern-equivalence"
      ]
    },
    {
      "id": "claim-star-solar-scope-not-saju",
      "statement": "春樹齋叢説의 태양·生時·命宮 연결은 四柱 時柱의 직접 규칙이 아니라 별도의 star-命 scope로만 보존해야 한다.",
      "support": "PARTIAL",
      "finding_ids": [
        "fact-star-命-solar-scope",
        "unknown-direct-birth-hour-solar-rule"
      ]
    }
  ],
  "ocr": null,
  "unknowns": [
    {
      "id": "unknown-missing-birth-predicate",
      "statement": "同一 primary page에서 出生/生時/時柱와 지방 태양 위치·日中·日晷 및 그 배속 결과를 함께 확인할 surface가 없다.",
      "blocks_claim_ids": [
        "claim-birth-hour-pillar-local-solar-authority"
      ],
      "next_check": "lineage와 locator가 닫힌 四柱 primary witness에서 birth-time solar assignment 문장 또는 worked example 한 건을 확인할 때까지 보류"
    },
    {
      "id": "unknown-no-historical-eqtime",
      "statement": "고전 source에서 各省增減刻數와 longitude/equation-of-time의 semantic equivalence가 직접 닫히지 않는다.",
      "blocks_claim_ids": [
        "claim-historical-true-solar-algorithm"
      ],
      "next_check": "현대 계산을 historical fact로 승격하지 않고 별도 implementation policy로 유지"
    },
    {
      "id": "unknown-lineage",
      "statement": "mirror/transcription의 exact edition lineage와 독립성은 미확정이다.",
      "blocks_claim_ids": [
        "claim-birth-hour-pillar-local-solar-authority",
        "claim-star-solar-scope-not-saju"
      ],
      "next_check": "새 lineage-closed primary witness가 들어오기 전 authority 승격 금지"
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
~~~

## 6. External-worker boundary

이번 parent verification에는 bounded Native advisory discovery가 사용됐지만, 최종 판정은 parent가 위 원본 scan bytes와 고해상도 render를 독립적으로 다시 읽은 값만 반영했다. Gemini Flash 호출은 '--print-timeout 120000'의 duration unit 누락으로 실행 전에 종료되어 관찰 packet을 반환하지 않았다. 따라서 Flash OCR/해석을 FACT로 사용하지 않았고, 계약에 따라 retry·fallback·permission bypass를 하지 않았다.

## 7. Modern 真太陽時 separation

USNO의 정의에 따르면 local apparent solar time은 longitude에 따라 달라지고 mean solar time과 equation of time이 구분된다. NOAA의 현대 계산식은 'eqtime + 4*longitude - 60*timezone' 항을 사용한다. 이 두 source는 **현대 천문 계산을 어떻게 할지**를 직접 뒷받침하지만, 고전 사주가 그 계산을 요구했다는 증거는 아니다.

따라서 다음을 혼합하지 않는다.

| 층위 | 이번 판정 |
| --- | --- |
| 고전 source의 '日出/日入', 방위, 初/正, 刻, 各省增減刻數 | historical FACT, source-local |
| 출생 '生時/時柱'를 그 태양 관측으로 정하라는 四柱 규범 | 'UNKNOWN', authority 'insufficient_evidence' |
| longitude 보정·均時差/eqtime를 포함한 현대 真太陽時 | 현대 방법 FACT; historical authority 아님 |
| production에서 어떤 시각을 채택할지 | 별도 implementation policy/승인 gate 대상; 이번 문서에서 결정하지 않음 |

## 8. Next minimum blocker

다음 한 건의 primary surface가 필요하다.

> 동일한 lineage-identified 四柱 witness 안에서 '出生/生時/時辰/時柱'와 '地方/日出/日中/日晷/太陽' 중 하나를 한 문장·도표·worked example으로 직접 연결하고, 그 결과로 어느 '時辰' 또는 '時干支'를 취하는지 보여 주는 면.

그 surface가 들어오기 전까지 'historical authority = insufficient_evidence'를 유지하고, 현대 真太陽時計算은 역사 FACT가 아닌 별도 policy 후보로만 취급한다. 이번 연구는 위 문서만 additive하게 기록했으며 production wiring·activation·push는 수행하지 않았다.
