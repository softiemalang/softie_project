# DE405 Center-Chain First-Divergence Analysis

## 조사 목적

center-chain 최초 관측 가능 분기 단계인 243건에서 project-owned center 2-leg state와 CSPICE pair-state API를 비교했다. CSPICE 내부 route나 selected record는 관측하지 않는다.

## 243건 선정 기준

primaryDivergenceStage=center_chain_diverges; cohort=243; target component equality=243; center component inequality=243.

## Center 2-leg chain 계약

leg 0은 center body relative to intermediate parent, leg 1은 intermediate parent relative to SSB이며 source order의 +1 addition만 사용했다.

## CSPICE pair-state reference 계약

기존 CSPICE reference audit runner의 spkez_c, J2000(frameId=1), NONE, ET bits, km/km/s 계약을 재사용했다. unique leg pair query=486; reference=729; unavailable=0.

## Leg 0 비교

{"match":89,"different":154,"positionOnly":24,"velocityOnly":72,"positionAndVelocity":58}

## Leg 1 비교

{"match":0,"different":243,"positionOnly":39,"velocityOnly":165,"positionAndVelocity":39}

## 최초 divergent leg

{"leg0_first":154,"leg1_first":89}

## Project leg composition

C1 vs C3 equal=243.

## CSPICE pair leg composition

C2 vs C4 equal=243; C2 not direct=0.

## CSPICE center→SSB direct 비교

C1 vs C2 equal=0; C3 vs C4 different=243.

## JS/native parity

expected=2916; executed=2916; match=2916; mismatch=0; native failure=0; JS fallback=false.

## Intermediate parent별 분포

{"3":243}

## Segment/record/boundary 분포

segment={"target:3:center:0:frame:1:begin:275377:end:368983":243,"target:399:center:3:frame:1:begin:987781:end:1362196":243}; record={"23":1,"92":1,"96":1,"115":1,"124":1,"127":1,"137":1,"146":2,"148":2,"176":1,"180":1,"181":1,"186":1,"205":1,"253":1,"255":1,"279":1,"284":1,"292":1,"297":1,"308":1,"318":1,"320":1,"327":1,"339":1,"344":1,"348":1,"352":1,"359":1,"385":1,"387":2,"403":1,"406":1,"411":1,"435":1,"439":2,"460":1,"461":1,"479":1,"499":1,"503":1,"508":1,"511":1,"525":1,"530":1,"547":1,"548":1,"554":1,"557":1,"559":1,"563":1,"567":1,"576":1,"585":1,"587":2,"593":1,"595":2,"600":1,"607":1,"656":2,"658":1,"683":1,"687":1,"704":1,"713":1,"719":2,"723":1,"727":1,"730":1,"747":1,"791":1,"794":1,"795":1,"801":1,"819":1,"820":2,"821":1,"831":1,"833":1,"839":1,"873":1,"901":1,"919":1,"923":1,"933":1,"939":2,"947":2,"953":2,"957":1,"969":1,"999":1,"1012":1,"1020":1,"1027":1,"1028":1,"1040":1,"1049":1,"1051":1,"1059":2,"1061":2,"1062":1,"1072":1,"1081":1,"1083":1,"1116":1,"1136":1,"1139":1,"1153":2,"1156":1,"1157":1,"1163":1,"1171":1,"1185":1,"1188":1,"1191":1,"1202":1,"1205":1,"1213":1,"1215":1,"1221":1,"1225":1,"1231":1,"1235":3,"1245":1,"1251":1,"1259":1,"1261":1,"1273":1,"1275":1,"1280":1,"1283":2,"1289":1,"1298":1,"1304":1,"1307":1,"1308":1,"1323":1,"1334":1,"1345":1,"1353":1,"1359":1,"1361":1,"1363":1,"1376":1,"1379":1,"1385":1,"1393":2,"1395":1,"1411":1,"1413":1,"1415":1,"1425":1,"1426":1,"1436":1,"1439":2,"1445":1,"1452":1,"1477":1,"1489":1,"1495":1,"1498":1,"1517":1,"1525":1,"1540":1,"1548":1,"1552":1,"1565":1,"1573":1,"1591":2,"1595":1,"1599":1,"1601":1,"1605":2,"1609":1,"1612":1,"1614":2,"1627":1,"1638":1,"1639":1,"1644":1,"1681":1,"1683":1,"1689":1,"1701":1,"1712":1,"1717":1,"1729":1,"1733":1,"1735":1,"1737":1,"1741":3,"1743":1,"1756":2,"1797":1,"1815":1,"1819":1,"1827":1,"1829":1,"1831":1,"1847":1,"1866":1,"1875":1,"1883":1,"1894":1,"1909":1,"1913":2,"1916":1,"1925":1,"1930":1,"1935":1,"1936":1,"1946":1,"1948":1,"1949":1,"1950":1,"1953":1,"1957":1,"1962":1,"1965":1,"1967":1,"1985":1,"1997":2,"2015":2,"2016":1,"2020":1,"2036":1,"2041":1,"2043":3,"2044":1,"2071":1,"2075":1,"2077":2,"2087":2,"2095":1,"2100":1,"2111":1,"2120":1,"2123":1,"2126":1,"2129":1,"2158":1,"2179":1,"2188":1,"2191":2,"2199":1,"2203":1,"2217":1,"2219":3,"2228":1,"2239":1,"2241":1,"2247":1,"2255":1,"2264":1,"2268":1,"2277":1,"2281":1,"2304":1,"2340":1,"2372":1,"2400":1,"2428":1,"2624":1,"2627":1,"2635":1,"2732":1,"2748":1,"2852":1,"2876":2,"2920":1,"3164":1,"3176":1,"3180":1,"3204":1,"3276":1,"3280":1,"3284":1,"3324":1,"3332":1,"3356":1,"3492":1,"3604":1,"3676":1,"3692":1,"3732":1,"3756":2,"3788":2,"3812":2,"3828":1,"3876":1,"3996":1,"4108":1,"4112":1,"4160":1,"4196":1,"4204":1,"4236":2,"4244":2,"4248":1,"4288":1,"4324":1,"4332":1,"4544":1,"4612":2,"4624":1,"4628":1,"4652":1,"4740":1,"4764":1,"4808":1,"4820":1,"4852":1,"4860":1,"4884":1,"4900":1,"4924":1,"4940":2,"4980":1,"5004":1,"5036":1,"5044":1,"5092":1,"5132":2,"5156":1,"5192":1,"5216":1,"5228":1,"5292":1,"5336":1,"5380":1,"5412":1,"5444":1,"5452":1,"5516":1,"5540":1,"5572":2,"5652":1,"5660":1,"5700":1,"5704":1,"5756":2,"5780":1,"5808":1,"5908":1,"5956":1,"5980":1,"5992":1,"6068":1,"6100":1,"6208":1,"6260":1,"6292":1,"6364":2,"6380":1,"6396":1,"6404":1,"6420":2,"6436":1,"6456":2,"6552":1,"6556":1,"6724":1,"6732":1,"6756":1,"6804":1,"6848":1,"6868":1,"6916":1,"6932":1,"6940":1,"6948":1,"6964":3,"7188":1,"7260":1,"7276":1,"7308":1,"7316":1,"7324":1,"7464":1,"7500":1,"7532":1,"7576":1,"7636":1,"7652":2,"7700":1,"7720":1,"7740":1,"7744":1,"7784":1,"7792":1,"7796":1,"7800":1,"7812":1,"7828":1,"7848":1,"7860":1,"7868":1,"7940":1,"7988":2,"8060":1,"8064":1,"8080":1,"8144":1,"8164":1,"8172":3,"8284":1,"8300":1,"8308":2,"8348":2,"8380":1,"8444":1,"8492":1,"8504":1,"8516":1,"8632":1,"8716":1,"8764":2,"8796":1,"8812":1,"8868":1,"8876":2,"8964":1,"8988":1,"9056":1,"9108":1,"9124":1}; boundary={"exact_knot":31,"next_down_knot":113,"next_up_knot":99}.

## 606/1095 교차 분석

{"state_equivalent_selection_different":{"count":37,"firstDivergentLeg":{"leg0_first":10,"leg1_first":27},"firstComponent":{"positionY":1,"positionZ":2,"velocityX":16,"velocityY":9,"velocityZ":9},"ulpDirection":{"exact_knot":31,"next_down_knot":2,"next_up_knot":4}},"candidate_state_different":{"count":206,"firstDivergentLeg":{"leg0_first":144,"leg1_first":62},"firstComponent":{"positionX":46,"positionY":29,"positionZ":32,"velocityX":33,"velocityY":44,"velocityZ":22},"ulpDirection":{"next_down_knot":111,"next_up_knot":95}}}

## 확정 가능한 사항

- The 243-row center-chain cohort has an explicit two-leg project chain.
- Each leg is compared bitwise with a CSPICE spkez_c pair-state request using the existing J2000/NONE/km contract.
- The fixed C1 and C2 additions were executed by JavaScript and the existing native IEEE-754 binary64 helper with zero parity mismatches.

## 상관관계와 후보 설명

- First-divergent-leg, component, boundary, segment, record, and ULP distributions describe the observed cohort only; they do not expose CSPICE internal selection.

- A leg-local difference can explain a center aggregate difference only within the fixed project-leg/CSPICE-pair composition comparison.

## 확정할 수 없는 CSPICE 내부 경로

- CSPICE internal route, selected segment, selected record, and accumulator order are not observable from the used API.

## 다음 단계 진입 조건

CSPICE 내부 route 또는 selected record를 주장하려면 계산 의미를 바꾸지 않는 instrumented API/build가 별도로 필요하다. 이번 결과만으로 tolerance, canonical selection, active transition, scientific approval, production integration을 변경하지 않는다.

## 계약 상태

{"selectionUnresolved":1701,"toleranceChanged":false,"canonicalSelectionChanged":false,"activeTransition":false,"scientificApproval":false,"productionIntegration":false}
