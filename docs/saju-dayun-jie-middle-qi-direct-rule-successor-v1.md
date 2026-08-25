# 起運 `節`/`中氣` 경계 direct-rule bounded successor v1

상태: `frontier advanced: repeated direct rule in two distinct classical titles`, `12節-side candidate narrowed only for inspected pages`, `《五行精紀》 전체 수용 미확정`, `modern calculation/readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 [계절 범위 selector successor](./saju-dayun-jie-selector-seasonal-range-successor-v1.md)의 `大雪` 관찰과, 그에 앞선 `小寒` 관찰을 덮어쓰지 않고 additive하게 정리한다. 이번 advance의 근거는 검색 결과나 OCR이 아니라, 서로 다른 문헌 제목의 page image에서 반복 확인한 규칙 문장이다. 원면이 없는 곳의 metadata·OCR·전사는 locator 또는 secondary corroboration으로만 둔다.

2026-08-25 재검증 메모: NLC `NLC416-94145-sanming-tonghui.pdf` p.114–115와 NCL `NCL-000002203-xinmingli-tanyuan.pdf` p.62를 다시 육안 대조했다. 전자는 `未來節日時·過去節日時`와 `三日為年`은 직접 보이지만 이 page window에서 `皆遇節而止`는 다시 확인되지 않았다. 후자 p.62는 월건(月建) 배열면으로 확인되어, 이 문서에서는 해당 면을 `立春節·小寒節` worked-example의 직접 locator로 더 이상 사용하지 않는다. 기존 conclusion은 이보다 좁은 직접 관찰 범위로 정정한다.

## 1. Bounded conclusion

두 개의 서로 다른 고전 문헌에서 起運의 target을 `節`로 두고 `中氣`를 제외한다고 직접 읽었다.

1. 《子平命術要訣》 공개 NLC scan PDF p.18(인쇄면 `十四`):

   ```text
   推大運時。先從所生之日起。陽男陰女順行。數至未來節。
   陰男陽女逆行。數至已過去節。皆遇節即止。中氣不論。
   ```

   같은 원면의 worked example은 `十一月初二亥正一刻八分交大雪節`이라고 적는다.

2. Harvard College Library/Harvard-Yenching scan의 《三才發秘》 人部卷之一, 공식 manifest `seq.547` 원면의 `起大運訣`:

   ```text
   其法止論節不論中氣
   ```

   이 문장은 NLC page의 `皆遇節即止。中氣不論`과 문헌·기관이 다른 page image에서 반복된다. 따라서 이번에 안전하게 좁힐 수 있는 것은 **이 inspected textual layer들에서 target class가 `中氣`가 아니라 source가 말하는 `節` 쪽이라는 bounded candidate**다. 전통적 `節/中氣` 대립에 따라 이를 `12節-side candidate`로 기록할 수는 있지만, 이것을 《五行精紀》 전 witness나 모든 고전의 보편 selector로 승격하지 않는다.

이번 successor가 확정하지 않는 것:

- 《五行精紀》 卷33 및 그 현존 copy들이 위 규칙을 전부 수용했다는 주장.
- 특정 공통 조상·판본 선후·textual lineage·정본성.
- `節`을 현대 API의 next/previous-term enum으로 기계적으로 바꾸는 규칙.
- 천문 계산, timezone, endpoint, rounding, 현대 알고리즘, semantic authority, interpretation/production readiness.

## 2. Direct page evidence inventory

| 문헌 / surface | 기관·record 경계 | 직접 locator | 원면에서 확인한 literal | bounded role |
| --- | --- | --- | --- | --- |
| 《子平命術要訣》 | NLC 식별자를 가진 공개 Commons scan; 기관 raw bytes 자체로 취급하지 않음 | PDF p.18, printed `十四` | `皆遇節即止。中氣不論`; worked target `交大雪節` | explicit rule + `大雪` target의 direct corroboration |
| 《三才發秘》 | Harvard 공식 IIIF manifest; Harvard-Yenching Library, HOLLIS `008088435` | manifest `seq.547`, canvas DRS `52823058`; printed folio는 주장하지 않음 | `起大運訣` 아래 `其法止論節不論中氣` | 별도 문헌에서 반복된 explicit rule |
| 《命理探源》 | NLC 공개 scan derivative | PDF p.62, printed `二一` | 재검증 면은 `月建` 배열이며 `立春節·小寒節` worked-example reading을 직접 닫지 못함 | 이 page는 direct target evidence로 사용하지 않음 |
| 《三命通會》 | NLC 공개 scan derivative | PDF p.114–115, `論大運` | `生日後未來節日時`·`生日前過去節日時`, `一辰十歲折除以三日為年`, `立春` example | target/time-count direct corroboration; 이 window의 `節止`·`不論中氣`는 없음 |
| 《命理集成》 | NLC 공개 scan derivative | PDF p.67, `推大運法` | `數至未來節`, `數已過去節`, `皆遇節而止` | `節` stop direct corroboration; `不論中氣`는 없음 |

### 2.1 NLC 《子平命術要訣》

- 공개 record: [Wikimedia Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- page image surface: [public PDF](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- 검토 byte hash: `885bf4db4a6a80a0a7d308ef200ad97da424676b9003f16f72633874f27f795b`
- p.18 image에서 `推大運時` 문단, `中氣不論`, `大雪節`, 그리고 source가 보고한 counting/result를 직접 관찰했다.

이 PDF와 Commons metadata는 공개 derivative의 page-level surface다. 그것만으로 NLC 기관 원본의 raw-byte identity, 《五行精紀》와의 copy binding, 또는 어느 문헌의 정본성을 주장하지 않는다.

### 2.2 Harvard 《三才發秘》

- 공식 item/manifest: [Harvard IIIF manifest](https://nrs.harvard.edu/URN-3:FHCL:23921260:MANIFEST:3)
- catalog identity: [Harvard HOLLIS record](https://id.lib.harvard.edu/aleph/008088435/catalog)
- direct canvas: [manifest canvas seq.547](https://nrs.lib.harvard.edu/URN-3:FHCL:23921260:MANIFEST:3/canvas/canvas-drs:52823058)
- direct image: [Harvard MPS IIIF image DRS 52823058](https://mps.lib.harvard.edu/assets/images/drs:52823058/full/full/0/default.jpg)
- manifest metadata: `陳雯. 三才發秘 :. [China : s.n., 1697?].`; repository `Harvard College Library Harvard-Yenching Library`.
- 검토한 manifest hash: `733bad697cfc65b9de78cacf7380ac11094918c8af2808c072062c9f3d1dbb76`
- 검토한 seq.547 full image hash: `fde34f08ed221104bc91005990290dbcbf14bb31ddc12f0e40a9ccf7885b7805`

seq.547의 오른쪽 leaf에 `起大運訣` 제목과 `其法止論節不論中氣`가 함께 보인다. 공식 canvas label은 `seq.547`이며, printed folio number를 추정하지 않는다. Ctext의 `file=134196&page=30` OCR/locator는 해당 구간을 찾는 secondary route일 뿐, Harvard 원면을 대신하는 증거가 아니다.

## 3. Existing `大雪`·`小寒` observations and rule status

| claim | status | direct basis | 남은 경계 |
| --- | --- | --- | --- |
| `大雪`이 worked target으로 실제 적힘 | `direct, source-local` | 《子平命術要訣》 p.18의 `交大雪節` | 모든 문헌·모든 월령의 target 규칙으로 일반화하지 않음 |
| `小寒`이 worked target으로 실제 적힘 | `unresolved at the prior locator` | 《命理探源》 p.62 재검증은 월건 배열면 | prior observation을 폐기하지 않고, 이 문서의 direct basis로는 사용하지 않음 |
| `立春`도 named `節` target으로 실제 적힘 | `unresolved at the prior locator` | 《命理探源》 p.62 재검증은 target example을 직접 닫지 못함 | 다른 문헌의 직접 `立春` 사례로 대체하지 않음 |
| `節`까지 세고 멈춘다는 문장이 반복됨 | `direct, bounded repeated` | 《子平命術要訣》·《三才發秘》 explicit rule; 《命理集成》의 `皆遇節而止` | 《三命通會》 p.114–115는 stop 문장이 아니라 `節日時`·환산 문맥으로 분리 |
| `中氣`를 제외한다는 명시 문장이 반복됨 | `direct, bounded repeated` | 《子平命術要訣》 `中氣不論`; 《三才發秘》 `不論中氣` | 《五行精紀》 전체 witness에 대한 adoption은 미확정 |
| inspected rule의 target 후보를 `12節-side`로 좁힘 | `bounded frontier advance` | `節`와 `中氣`를 대립시키는 두 distinct-title direct rule | universal `12節-only` policy가 아님 |
| 모든 12節을 포함하고 모든 中氣를 제외 | `unresolved` | 직접 본 named target은 일부뿐 | 미관찰 월령·문헌의 direct rule 필요 |

`大雪`과 `小寒`은 모두 이 문헌들이 말하는 `節` 쪽의 named example로 직접 관찰됐지만, 이 사실만으로 현대 24節氣 API의 enum, next/previous resolver, 또는 formal month-boundary function을 추가하지 않는다.

## 4. Transmission/provenance boundary

이번 evidence는 **문헌별 rule wording의 반복**을 확인한 것이다. 다음 단계로 승격하지 않는다.

- 《五行精紀》 卷33의 `大運`과 위 두 문헌 사이의 직접 textual-layer adoption.
- 《珞琭子》 본문·王廷光 주석·李仝 gloss 중 어느 층에서 이 rule이 만들어졌는지.
- 두 문헌의 공통 조상, 한 문헌의 후대 전사, textual independence, 또는 판본 계보.
- Harvard scan의 기관 보존 raw bytes와 downloaded IIIF derivative의 exact machine binding.
- source wording을 현대 계산 규격이나 semantic authority로 바꾸는 해석.

따라서 현재 source-role은 다음처럼 분리한다.

```text
direct page observation       = PASS for the quoted pages
repeated distinct-title rule  = PASS, bounded corroboration
12節-side candidate           = narrowed, source-language only
五行精紀-wide adoption       = unresolved
edition/textual lineage       = unresolved
semantic authority            = blocked
modern calculation contract   = blocked
readiness / production use   = blocked
```

## 5. Reproduction and preservation

원면 검토에 사용한 대용량 PDF와 rendered image는 `/private/tmp/saju-term-review/`에만 두고 repository에 복사하지 않았다. Harvard page는 manifest에서 `items[546]`을 읽어 direct canvas와 IIIF image를 재현할 수 있다.

```text
curl -L --fail --silent --show-error \
  -o /private/tmp/saju-term-review/sancai-manifest.json \
  'https://nrs.harvard.edu/URN-3:FHCL:23921260:MANIFEST:3'

jq -r '.items[546] | [.id, .items[0].items[0].body.id] | @tsv' \
  /private/tmp/saju-term-review/sancai-manifest.json

curl -L --fail --silent --show-error \
  -o /private/tmp/saju-term-review/harvard-sancai-seq547.jpg \
  'https://mps.lib.harvard.edu/assets/images/drs:52823058/full/full/0/default.jpg'

shasum -a 256 \
  /private/tmp/saju-term-review/sancai-manifest.json \
  /private/tmp/saju-term-review/harvard-sancai-seq547.jpg
```

OCR, Ctext transcription, search snippets, and modern explanations are locator/secondary evidence only. Existing `docs/saju-dayun-jie-selector-seasonal-range-successor-v1.md`와 다음 untracked audit 문서는 이번 commit에서 수정·삭제·stage하지 않는다.

- `docs/saju-sonkeikaku-institution-access-audit-v1.md`
- `docs/saju-wonkwang-copy-page-provenance-audit-v2.md`
- `docs/saju-wonkwang-copy-page-provenance-audit-v3.md`
- `docs/saju-wonkwang-institution-access-audit-v1.md`
