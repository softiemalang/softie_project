# NLC 《精選命理約言》 行運賦 direct-witness adjudication v1

## 결론

새로 제시된 NLC 공식 record 및 official reader 캡처는 기존 Mingli v0의 “target page 접근 차단”을 “p.85–87에 대한 bounded direct visual observation 확보”로 좁힌다. 그러나 이를 raw page-byte witness, 완전한 起運 절차, edition/textual lineage, semantic authority, production authority로 확대하지 않는다.

직접 보이는 것은 다음뿐이다.

- NLC record: data_416 / 17jh002578 / 109774.0, 《精选命理约言》/표지 《精選命理約言》, 民国二十四年[1935], 韦氏命苑[发行者], 1册, (清)陈素庵原著.
- official reader p.85/185, printed folio 二: 行運賦 spread의 주변 문맥.
- official reader p.86/185, printed folio 三: 遞行前月後月之建。, 以男女為別。乃分順行逆行之端。, 男生陽年。女生陰年。則從已往詳觀。, 計生辰之離節。凡有幾日。, 一日則為四月。, 三日則為一歲。
- official reader p.87/185, printed folio 四: 一運管十年。이라는 주변 literal.

## 7개 P0 field 재판정

| field | 직접 관찰 | 재판정 | 승격 |
|---|---:|---|---:|
| 起運法 | 아니오 | 완전한 시작일/시작나이 절차가 캡처에 없음 | 유지 blocker |
| 順逆 | 예 | 남녀·양년/음년을 언급한 bounded fragment만 확인; 전체 matrix 아님 | 승격하지 않음 |
| 節選択 | 예 | 전월/후월의 建과 生辰-離節 일수 fragment만 확인; 완전한 節 알고리즘 아님 | 승격하지 않음 |
| 三日一歲 | 예 | 三日則為一歲。 direct literal | literal 관찰만, 계산 규칙 승격 없음 |
| 一日四月 | 예 | 一日則為四月。 direct literal | literal 관찰만, 계산 규칙 승격 없음 |
| 一時辰十日 | 아니오 | p.85–87 캡처에서 보이지 않음 | whole-volume negative 아님 |
| workedExample | 아니오 | p.85–87 캡처에서 보이지 않음 | whole-volume negative 아님 |

따라서 directlyObservedP0FieldCount=4이지만 completeP0FieldClosureCount=0, unresolvedP0FieldCount=7, promotionCount=0이다. 직접 보인 literal이 있다는 사실과 구현 가능한 완전 규칙이라는 사실을 분리한다.

## Provenance / blocker

NLC reader 화면에 대한 시각 관찰은 확보했지만, 캡처는 NLC 원본 page-image/PDF bytes가 아니다. 다음 blocker는 그대로 열린다.

1. official target-page raw bytes 또는 authorized page-image/IIIF identity.
2. physical copy/call number 및 copy-level collation.
3. title page/colophon/imprint에 의한 edition/textual lineage.
4. 7개 field의 완전한 起運 절차와 worked example.
5. independent semantic corroboration 및 production authority.

기존 v0와 Gemini v7 parent의 status/gate/lineage graph는 변경하지 않았다. Commons mirror는 계속 locator-only이며, 캡처에 없는 一時辰十日이나 worked example을 보충하지 않는다.

## Evidence identity

캡처는 다음 SHA-256으로 고정했다.

- record: c32a7b513ea1a38875b525c0f28dbf18d02117a07901b0f14c20f9ac23c2de65
- reader p.85: 098b93b39aff7dd7109532e4cb968b69be33180c06fc2a507501c1a8e2dcd386
- reader p.86: 8a4829fcf965688349cd405b719eb5a17efff2ce0892c3597090f9f8ccd5ef7d
- reader p.87: c2b033458986e84c3802618dbb2fe43244551923391a035477dec575fe147b1b

이 successor는 캡처 파일을 repository canonical payload로 복사하지 않고, 사용자 제공 경로·해시·픽셀 크기와 관찰 범위를 기록한다. 캡처 경로를 다시 확보하지 못하는 환경에서는 page-byte 재검증이 필요하다.
