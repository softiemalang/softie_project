# Ziwei P0 《游藝錄》 CADAL 01025514 semantic-witness candidate v1

## 결론

이 문서는 기존 Ziwei P0 source/frontier/readiness artifact를 수정하지 않는 additive successor다. 1883년 CADAL/Tsinghua 계열 春在堂全書·游藝錄 DjVu를 실제 바이트와 page render hash로 식별하고, 游藝錄五·紫微斗數篇의 scan/CADAL/CText page 130, 131, 136, 139, 140을 직접 시각 검토한 bounded semantic-witness candidate로 기록한다.

이 source는 새 semantic authority가 아니다. 1883 digital resource identity와 다섯 semantic scan surface, 그리고 scan 앞·뒤 경계를 직접 관찰했다. 1·178면은 백지, 2면은 본문 시작, 177면은 본문과 권말 인장으로 확인되었고, 사용 가능한 178면 sequence에서는 title page/colophon이 관찰되지 않았다. 이는 실제 bound copy에 그런 leaf가 절대 없었다는 뜻이 아니다. 1871 edition과의 직접 대조, textual transmission lineage, physical-slot/ordinal coordinate identity, source authority, semantic authority는 여전히 닫지 않았다.

| packet | claims | sources | observations | relations | blockers |
| --- | ---: | ---: | ---: | ---: | ---: |
| predecessor Toyo institutional successor | 30 | 14 | 44 | 134 | 11 |
| this scan successor | 30 | 15 | 50 | 140 | 11 |
| additive delta | 0 | 1 scan candidate | 6 | 6 | 0 |

physicalWitnessCount 후보는 1에서 2로 늘지만 independentPhysicalWitnessesAdmitted는 0이다. rotation-06은 기존대로 representation_only다.

## source identity and exact byte provenance

- source ID: src-youyi-lu-cadal-01025514-1883
- work: 春在堂全書·游藝錄, (清)俞樾, 游藝錄五·紫微斗數篇
- catalog date: 清光緒九年(1883)
- CADAL/Tsinghua identifier: 01025514
- whole scan: 178 pages, 3196×5594
- DjVu bytes: 7,368,126 bytes
- SHA-1: 0ccb501b8fa86358ec1cae34dca4d56df6a1fbd2
- SHA-256: 761a9827a1fe0df8f1aa1e15317b1eb18c528892750fa618f7ed97a5897535ba
- v5 starts at digital page 130; v6 starts at page 166, so the catalog chapter boundary for v5 is pages 130–165.

Source URLs:

- [Commons source DjVu](https://commons.wikimedia.org/wiki/File:CADAL01025514_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%C2%B7%E6%B8%B8%E8%97%9D%E9%8C%84.djvu)
- [CADAL record](https://cadal.edu.cn/cardpage/bookCardPage?ssno=01025514)
- [CiNii 1883 record](https://ci.nii.ac.jp/ncid/BB19945538)
- [CiNii 1871 earlier-edition candidate](https://ci.nii.ac.jp/ncid/BD19656670)

The 1871 record is retained as an unresolved earlier-edition candidate. It was not text-compared with the 1883 scan and was not merged as corroboration.

## page locator and OCR boundary

Each semantic observation binds:

Commons DjVu page = CADAL digital page = CText library file 192852 page

The reviewed render SHA-256 values are:

| page | render SHA-256 |
| ---: | --- |
| 130 | a0a7a185b795225a3b206ac828cc761e046b6028939093b2139835eae9311206 |
| 131 | 05e4d55ad718229036a636ac36da898605a48fd4f40073a8d9c2293845df517f |
| 136 | 4f20ac6bbf906e1ecfcc2e08e78b4f9f3e5710617eef3d49714dffd153b2b64b |
| 139 | 22ad4198302e8ffbbdb913ee813f5f6bbb0efb9da41591617719cb764fa9621a |
| 140 | 556a53e005ad6debb19fef94d939c263349e6b46678df482e91d70a536f295a6 |

[CText 游藝錄五·紫微斗數篇 page](https://ctext.org/wiki.pl?chapter=299125&if=gb)는 scan 확인을 위한 OCR/text locator로만 사용했다. OCR의 曰/日, 官/宮, 戊/戌, 開/寅, 西/酉 등 오류 가능성은 보존했고, artifact의 rawVisibleText와 normalized transcription은 scan render 시각 검토에서 작성했다. OCR은 canonical claim text가 아니다.

Printed folio/丁은 확인하지 않았으므로 artifact에서 발명하지 않았다.

## scan boundary review

원본 DjVu의 Commons page-render를 별도로 받아 직접 시각 확인한 boundary surface는 다음과 같다. 이 render들은 repository에 저장하지 않고 hash와 URL만 기록했다.

| scan page | 직접 관찰 | Commons render SHA-256 |
| ---: | --- | --- |
| 1 | 백지 leaf; title-page text/imprint 없음 | 7f6332ae04d3569e205f51efcef52d3a659552b6aa4665ae22531eaf4b0f69f3 |
| 2 | printed text 시작; title-page/imprint surface 없음 | 514e9b1e8dbf514f98d3eb148a6f2920d2a90b660c00524d8760e72ccdc43e77 |
| 177 | printed text와 권말 인장; colophon/imprint surface 없음 | c5cc4d329d0f0dd99757e246668a0b78d9ff4763859b49c259cbbb9a64253fac |
| 178 | 백지 leaf; colophon text 없음 | 7f6332ae04d3569e205f51efcef52d3a659552b6aa4665ae22531eaf4b0f69f3 |

pages 3–10도 front sequence 확인 범위에 포함했다. 이 결과는 scan boundary가 검토되었다는 사실을 강화하지만, printed-copy identity와 textual transmission lineage를 자동으로 닫지 않는다.

## 직접 확인된 semantic surface

### Page 130: 命宮/身宮과 十二宮 순서

스캔은 二月辰時 예에서 卯를 월건 출발점으로 삼아 命宮을 亥, 身宮을 未에 두는 문장을 보여 준다. 이어서 다음 이름 순서를 직접 열거한다.

命宮 → 兄弟宮 → 夫妻宮 → 子息宮 → 財帛宮 → 疾厄宮 → 遷移宮 → 奴僕宮 → 官祿宮 → 田宅宮 → 福德宮 → 父母宮

乃逆行而布十二宮이라고 하고, 命立子宮이면 兄弟宮=亥, 夫妻宮=戌, 命立丑宮이면 兄弟宮=子, 夫妻宮=亥라고 예시한다.

기존 src/ziwei/mingShenCleanRuleSeedPilot.js의 동일 입력 계산은 命宮=亥, 身宮=未와 일치한다. 이는 deterministic relation이며 독립 oracle이나 semantic authority가 아니다.

### Page 131: 對衝과 三合

직접 보이는 branch-token 표면은 다음과 같다.

- 對衝: 子午、丑未、寅申、卯酉、辰戌、巳亥
- 三合: 寅午戌、巳酉丑、申子辰、亥卯未
- 예: 命立子宮 → 午為對, 申·辰為合; 命立午宮 → 子為對, 寅·戌為合

이는 branch relation surface다. physical slot, printed diagram orientation, production ordinal identity를 닫는 완전한 chart witness로 승격하지 않았다.

### Pages 136 and 139: 天府 斜對와 branch-pair surface

Page 136은 생일이 놓인 五局 궁에 紫微를 두고 於其斜對之宮安天府星이라고 직접 말한다.

Page 139의 worked surface는 다음을 직접 준다.

- 紫微丑 → 天府卯
- 紫微卯 → 天府丑
- 子↔辰, 亥↔巳, 戌↔午, 酉↔未
- 寅·申에서는 紫微·天府 同宮

이 텍스트를 branch-token map으로 정규화하면 기존 source_aligned numeric adapter (4-Z) mod 12와 12/12 일치하고, production 기본 (10-Z) mod 12와는 0/12 일치한다. 이것은 source surface와 계산 adapter의 관계 사실일 뿐, 어느 좌표가 실제 같은 궁인지 또는 production convention이 옳다는 뜻이 아니다. 기존 integrated corpus에서도 identity는 0/150, rotation-06은 150/150으로 유지된다.

기존 source evidence와도 분리해 대조했다.

- Ming printed `安天府圖`(기존 source evidence PDF p172)는 `紫微丑 → 天府卯`와 `寅·申同宮` anchor를 직접 보존한다. Youyi와 이 두 anchor는 일치하지만, 그 diagram은 이 packet에서 full 12-row cell map으로 비교 가능한 표면이 아니므로 semantic authority가 아니다.
- Nanbei `甲六、安天府` 표(기존 source evidence PDF p13, printed folio 三十四)는 12행을 직접 보존하며 Youyi와 12/12 일치한다. 이는 두 source surface의 관계 사실이지 edition lineage·independence·semantic authority의 확정이 아니다.
- production legacy `(10-Z) mod 12`는 Youyi 12행과 0/12, source-aligned `(4-Z) mod 12`는 12/12이다. 기존 integrated test의 identity는 0/150, rotation-06은 150/150이지만 rotation-06 상태는 계속 `representation_only`다.

따라서 Ming 安天府圖·Nanbei·Youyi가 같은 branch-token 표면을 지지하는 부분은 P0의 source-surface frontier를 넓히지만, physical slot↔palace name↔ordinal/direction을 닫거나 production/rotation-06을 선택하지 않는다.

### Page 140: 紫微계/天府계 방향

紫微가 寅일 때 스캔은 天機丑, 太陽亥, 武曲戌, 天同酉, 廉貞午를 역행으로 놓는다. 天府가 寅일 때는 太陰卯, 貪狼辰, 巨門巳, 天相午, 天梁未, 七殺申, 破軍子를 순행으로 놓는다.

이 worked example은 현재 code offset surface와 일치하지만, complete 14-star source authority나 source lineage를 닫지 않는다.

## provenance-separated judgment

| layer | result |
| --- | --- |
| calculation fact | local source evaluator example 亥/未; source-aligned Tianfu adapter 12/12; current production identity 0/150, rotation-06 150/150 |
| direct observation | pages 130/131/136/139/140의 scan render에서 위 문장·branch relations·worked placements를 직접 확인 |
| source lineage | 1883 scan/catalog identity bounded; 1871 earlier edition and cross-corpus textual transmission unresolved |
| independence | repository/file identity is distinct; textual/physical lineage independence not admitted |
| semantic authority | not established |
| interpretation | not generated |
| readiness | not_safe_to_start |
| grounding | blocked |
| activation | experimental_only |
| image reuse | Commons public-domain mark를 기록했지만 image-level repository reuse는 human/policy review |

## 보존과 재현

- 기존 predecessor artifact, source matrix, field kit, production rule, DB, deployment를 수정하지 않았다. 이 successor packet 자체는 boundary review 결과를 반영해 재생성했다.
- 원본 DjVu와 page render는 임시 외부 검토에서 hash만 기록했고 Git에 저장하지 않았다.
- 보호 asset -.jpg의 canonical bytes를 materializer/checker가 계속 검증한다.
- materializer는 network를 사용하지 않으며, OCR을 canonical source로 사용하지 않는다.
- commit, push, deploy, remote DB mutation은 수행하지 않았다.

재현 명령:

    node scripts/materialize-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs
    node scripts/check-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1.mjs
    node scripts/check-ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1-negative-v0.mjs
    node --test test/ziweiP0YouyiLuCadalSemanticWitness.test.js

Machine-readable evidence is in artifacts/ziwei-p0-youyi-lu-cadal-01025514-semantic-witness-v1/.
