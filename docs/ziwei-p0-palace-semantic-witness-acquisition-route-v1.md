# Ziwei P0 palace-semantic witness acquisition route v1

<!-- schema=ziwei-p0-palace-semantic-witness-acquisition-route-v1 verdict=complete_ziwei_p0_palace_semantic_witness_acquisition_route_exhausted_uncommitted head=ee833c0607650897aa76ae7a3b3636337e291117 -->

이 문서는 기존 P0 priority/dossier와 Ziwei source-frontier를 수정하지 않는 additive successor다. 목적은 `ZIWEI-P0-PALACE-SEMANTIC-WITNESS`에 대해 공개·합법 경로를 실제로 확인하고, 확보 가능성·source authority·semantic usefulness·independent witness 관계·image reuse 조건을 서로 섞지 않는 것이다.

## 결론

일본 국립공문서관(NARA)의 같은 cataloged record에 연결된 두 volume item은 이제 **실제 공개 이미지 byte를 확보할 수 있는 경로**로 확인됐다.

- record: `F1000000000000101426`
- file: `1078787`
- call number: `子０６０－０００１`
- volume 1 item: `4468520`, 129 canvases
- volume 2 item: `4469314`, 137 canvases
- observed: `2026-08-09T12:31:50Z`
- manifest와 대표 page JPEG endpoint 모두 이 세션에서 HTTP 200으로 응답했고, 실제 byte에서 SHA-256을 산출했다.

따라서 NARA 두 item의 acquisition route는 `confirmed_acquirable` / `immediate_public_download`이다. 그러나 두 item은 동일 record·동일 판본의 권책 쌍이므로 independent second witness가 아니다. 이미지에서 확인된 `安天府圖`, branch/star tables, natal-chart examples도 palace name ↔ branch ↔ physical slot ↔ ordinal/direction 의미를 완결하지 않는다. semantic gate와 `rotation-06` authority gate는 계속 닫혀 있다.

## 실제 byte 관찰

원본 manifest byte는 저장된 임시 capture에서 직접 hash했으며, repository에는 전체 scan을 복사하지 않았다. permanent artifact에는 URL, item/canvas identity, byte length, hash를 남겼다.

| item | manifest bytes / SHA-256 | 직접 관찰한 대표 page |
| --- | --- | --- |
| `4468520` | `117876` / `732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af` | canvas 87 `安天府圖`; canvas 88 branch/star·四化 table; canvas 84/89 rule/table material |
| `4469314` | `125132` / `3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560` | canvas 64/75 natal-chart examples |

대표 page JPEG는 `native.jpg` endpoint에서 실제 fetch한 bytes다. 예를 들어 volume 2 canvas 64는 `832936` bytes, SHA-256 `901dcc10e4fb8863703e0da2c85f883b6e930fd438c05ba1f22a48e44989770a`; canvas 75는 `864238` bytes, SHA-256 `bbf4823b2e4da81db468bed7e45787308d05bd293b8eef9d15a5da41ca9a2e0b`이다. 이미지는 OCR로 판단하지 않고 page image로 직접 관찰했다.

공식 경로:

- [NARA record](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html)
- [NARA volume 1 viewer](https://www.digital.archives.go.jp/img/4468520)
- [NARA volume 2 viewer](https://www.digital.archives.go.jp/img/4469314)
- [volume 1 IIIF manifest](https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json)
- [volume 2 IIIF manifest](https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json)

## access와 rights를 분리한 이유

NARA viewer HTML에는 `館内限定閲覧` 표시가 있으나 capture 당시 숨겨진 상태였고, manifest와 image endpoint는 실제로 원격 HTTP 200을 반환했다. record는 `公開`로 보이며 manifest는 [NARA secondary-use 안내](https://www.digital.archives.go.jp/secondary-use)를 가리킨다. 이것만으로 item별 image redistribution permission을 CC0로 확정하지 않는다. metadata, endpoint accessibility, image-level reuse 조건은 별도 필드로 유지한다.

현재 공개 page bytes가 필요한 acquisition에는 사람의 조치가 필요하지 않았다. 더 높은 해상도/native file 또는 명시적인 image-level reuse terms가 필요해지면 [NARA 이용 안내](https://www.archives.go.jp/english/gettingstarted/guide.html)와 [館内限定閲覧 help](https://www.digital.archives.go.jp/howto/helpKbun_04_05)를 기준으로 다음만 요청한다.

- reference: `F1000000000000101426 / 1078787 / 子０６０－０００１ / 4468520, 4469314`
- request: exact candidate canvas/page copies와 image-level reuse terms
- do not request: source semantic interpretation, production convention approval, or automatic activation
- this work order: no account, payment, reproduction request, or bypass was performed

## 대안 경로의 판정

- NDL Search는 `紫微斗數全書`와 남북산인 현대/근대 catalog record를 보여 주지만, target Ming page-image route를 공개하지 않았다. 합법적인 library copy/reproduction fallback이지만 즉시 witness는 아니다.
- Taiwan NCL의 `紫微斗數` record는 `正統道藏`, 1923–1926 Shanghai facsimile, 3 volumes, China National Library holding으로 기록되어 있다. 잠재적인 별도 textual comparison이지 NARA 明刊本의 공개 image route가 아니다.
- Chinese Text Project의 `正統道藏` text와 `紫微斗數` context는 별도 tradition과 용어 탐색에는 유용하지만 OCR/transcription 및 base-text context이지 page-image witness가 아니다. [CTP library record](https://ctext.org/library.pl?if=gb&res=85160)
- Wikisource는 12개 궁 장 제목을 찾는 text locator다. scan identity와 leaf lineage가 없다. [Wikisource text](https://zh.wikisource.org/zh-hans/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8)
- Google Books의 1985/2025 등 same-title record는 현대판/limited preview이므로 明刊本 witness로 사용할 수 없다.
- 流芳阁는 같은 南阳堂 title family의 266-page preview와 유료 full-scan contact route를 설명하지만 첫 20 page 외에는 공개하지 않고 copying prohibition을 명시한다. 기존 local 528-page PDF와 함께 comparison/lineage lead로만 둔다. [private preview record](https://lfglib.cn/variety/daojia/186456.html)
- Internet Archive/HathiTrust exact-title high-yield search에서는 검증 가능한 target scan record를 확인하지 못했다. 이는 전 세계적인 부재를 뜻하지 않는다.

이 범위에서 actionable한 public/legal non-duplicate witness route는 소진됐다. 향후 exact catalog hit가 나오면 새 candidate로 별도 검증한다.

## 승격 금지 경계

이 artifact는 다음을 자동으로 승격하지 않는다.

- source claim, stable claim count, readiness, grounding, activation
- legacy/source-aligned production coordinate
- `rotation-06` semantic authority
- image-level license/reuse conclusion
- NARA volume 1과 volume 2를 independent second witness로 세는 것

필요한 다음 증거는 complete source-linked leaf set, actual per-page bytes/hashes, edition/folio relationship, human semantic adjudication, 별도 image-reuse decision, 그리고 가능하다면 non-clone second witness다. machine-readable 결과와 hashes는 [companion artifact](../artifacts/ziwei-p0-palace-semantic-witness-acquisition-route-v1/complete.json)에 있다.
