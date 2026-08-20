# NCL 06589 《三命通會》 official-viewer adjudication v1

## 결론

새 캡처는 기존 `saju-five-classics-source-identity-frontier-v0`의 Sanming 1578 blocker를 `open_narrowed`로 재판정한다. NCL 공식 record의 `06589 / 306.5 06589 / rarecatx0136467` item-record identity와, 같은 공식 viewer의 p.2–3, p.7, p.99–101, p.146–151, p.187–188, p.1184–1185 화면을 직접 관찰했다.

- record 캡처: 《三命通會十二卷》, (明)萬民英(撰), `明萬曆戊寅(六年, 1578)刊本`, 12冊, 線裝, 匡 21.4×14.7cm, 06589, 306.5 06589, 國家圖書館.
- viewer p.2: 위 record panel 아래의 판면에 내부 표기 `007583`이 보인다. 이는 `007583`을 06589 accession/copy로 확정하는 증거가 아니라, “06589 viewer record 아래에서 007583 표기를 관찰했다”는 bounded intra-viewer pairing이다.
- viewer p.150/1187: `論大運`, `折除以三日為年`, 남녀 방향 및 立春 example context가 보인다.
- viewer p.151/1187: `論大運` continuation과 `三日而成一歲` 계열의 conversion/progression text가 보인다.
- viewer p.101/1187: viewer outline의 `第2卷` 제1면과 판면의 `三命通會卷之二` 표기가 보인다.
- viewer p.187/1187: viewer outline의 `第2卷` 후반부와 판면의 `三命通會卷之二終` 표기가 보이며, p.188은 그 직후의 후속 viewer context다.
- 따라서 viewer ordinal상 p.150–151이 p.101–187의 `第2卷` 구간 안에 있다는 것은 bounded sequence observation으로 추가한다. 이는 printed folio나 physical-copy identity가 아니다.
- 추가로 p.149–151의 版心·魚尾/페이지 가장자리를 직접 확대했지만 `葉次`는 판독되지 않았다. 이 결과는 “판독 시도는 완료했으나 folio가 닫히지 않음”이라는 음성 evidence이며, `149/1187`, `150/1187`, `151/1187`을 인쇄 葉次로 승격하지 않는다.

## 기존 provenance와의 대조

기존 v0에는 Commons mirror `NCL-06589_1`의 1,000-page object와 leaf 150–151 locator, 공식 NCL thumbnail bridge, 그리고 06589/06590의 별도 catalog records가 있었다. 이번 official viewer는 p.150–151을 first-party surface에서 직접 보게 했고, p.2의 `007583` internal label을 06589 metadata panel과 함께 보이게 했다.

그러나 official viewer는 총 `1187` page index를 표시하고 기존 Commons object는 `1000` pages이다. 원본 official page bytes나 derivation manifest도 확보되지 않았다. 따라서 viewer p.150/151을 Commons leaf 150/151과 byte-identical하다고 하지 않고, section/phrase correspondence만 기록한다. p.101–187의 volume boundary 역시 viewer ordinal/outline과 visible end marker에 한정한다. 이번 版心·魚尾 확대도 葉次를 읽게 해 주지 않았으므로 printed-folio crosswalk로 취급하지 않는다. 새 독립 witness나 canonical transmission edge도 추가하지 않는다.

## 닫힌 범위와 남은 blocker

닫힌 것은 다음의 bounded observation뿐이다.

- first-party NCL catalog record identity observation
- official viewer p.2의 `007583` internal-label / 06589 record pairing
- official viewer p.150–151의 `論大運` target-page visual observation
- official viewer p.101–187의 bounded `第2卷` ordinal sequence context
- official viewer p.149–151의 版心·魚尾 직접 확대 시도와 `葉次` 불판독 결과 기록

다음은 모두 계속 blocker다.

1. official page-image/PDF raw bytes와 byte-level derivation identity
2. printed folio: `150/1187`, `151/1187`은 viewer index이다. p.149–151의 版心·魚尾까지 확대했지만 `葉次`가 읽히지 않아 printed folio로 승격하지 않음
3. `007583`과 `06589` 사이의 accession/copy mapping
4. physical copy 및 copy-level lineage
5. 06589와 별도 06590 record의 물리 item/판본 관계
6. local 三命通會 PDF와 1578 copy의 transmission/edition collation
7. semantic authority, interpretation readiness, production activation

기존 timing relations `relation.dayun-direction`, `relation.three-days-one-year-start-age`, `relation.dayun-progression`은 evidence reference만 additive하게 보강하고 status, semantic equivalence, lineage, promotion은 변경하지 않았다. `availableForInterpretation=false`, `semanticAuthority=not_established`, `productionActivation=blocked`, promotion count `0`을 유지한다.

## Evidence identity

캡처는 repository canonical payload로 복사하지 않고 사용자 제공 경로·SHA-256·픽셀 크기와 관찰 범위만 기록한다. p.2 evidence는 다음과 같다.

`23701e17a30240ccc2920a3df730e44c974eb90a76679fc4138caa7e7eb6ca36` / 2,653,902 bytes / 2426×1344.

기존 추가 10개 캡처는 p.3, p.7, p.99–101, p.187–188, p.1184–1185의 viewer context로, 이번 추가 9개 캡처는 p.149(6개), p.150(1개), p.151(2개)의 版心·魚尾/葉次 판독 시도로 v1 `evidence[]`에 고정되어 있다. 전체 evidence count는 27개다. 이번 9개는 모두 사용자 제공 PNG의 경로·SHA-256·크기만 기록하며, official raw page bytes나 printed folio를 대신하지 않는다. 이 successor는 v0 artifact를 덮어쓰지 않는다.
