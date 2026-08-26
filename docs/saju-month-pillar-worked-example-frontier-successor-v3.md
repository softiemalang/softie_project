# 月柱 年干→寅月 worked-example frontier bounded successor v3

상태: `frontier advanced: five 年干-group worked application surfaces direct (5/5)`; `full four-pillar/date-time coverage and cross-copy repetition unresolved`

기준일: `2026-08-26 KST`

이 문서는 [v2 source-local frontier](./saju-month-pillar-source-local-frontier-successor-v2.md)의 additive successor다. 기존 문서를 덮어쓰지 않는다. 이번 단계에서는 `丙辛→庚寅`, `丁壬→壬寅`, `戊癸→甲寅`이 실제 생년·생월·생일·생시를 포함한 worked block의 출력으로 원면에 함께 나타나는지 확인하고, 이미 v2에서 직접 확인한 `甲己→丙寅`, `乙庚→戊寅`과 합산한다.

## 1. Bounded conclusion

### 1.1 이번에 직접 닫힌 범위

출생 연도와 월령을 계산하는 문맥에서, 다음 다섯 묶음의 寅月 시작점이 **실제 사례의 입력 문맥과 결과 표기 사이에서 page-level direct**로 확인된다.

```text
甲己 → 丙寅
乙庚 → 戊寅
丙辛 → 庚寅
丁壬 → 壬寅
戊癸 → 甲寅
```

이는 `named/source-local worked application coverage = 5/5`라는 좁은 갱신이다. 각 묶음이 서로 다른 독립 physical copy에서 두 번씩 확인되었다는 뜻은 아니다. 또한 이 결과만으로 모든 생년월일시의 月柱를 계산하는 생성기, 《五行精紀》의 채택, 특정 판본 계보, 정본성, semantic authority 또는 readiness를 주장하지 않는다.

### 1.2 입력 완전성과 사례의 성격

- `丙辛`, `丁壬`, `戊癸`: 해당 페이지에서 연도·정월 날짜·시각·立春 전후 설명과 寅月 결과가 함께 직접 보인다.
- `甲己`, `乙庚`: 《淵海子平》 p.50의 `如甲子年`, `如乙丑年` worked block에서 생년/정월 문맥과 결과가 직접 보인다. 이 문서에서는 그 면에 인쇄된 범위만 사용하며, 별도의 완전한 사주 네 기둥 입력이나 현대식 시각 정밀도를 추가하지 않는다.
- 따라서 `five-group worked application = direct 5/5`와 `각 사례의 완전한 출생시각·네 기둥 = unresolved`를 분리한다.

## 2. Direct page evidence

### 2.1 `甲己→丙寅`, `乙庚→戊寅`

NLC416 `99036` 《淵海子平》 공개 scan의 PDF p.50(면 하단 인쇄 `三二`)에서 다음 두 worked block을 직접 읽었다.

```text
如甲子年。甲己之年丙作首。正月建丙寅。
如乙丑年。乙庚之歲戊為頭。正月起戊寅。
```

- [NLC record route](https://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754)
- [public scan PDF p.50](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf#page=50)
- local review bytes: `/private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf`
- local SHA-256: `fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f`

이 두 항목은 v2의 직접 사례 2/5를 유지한다. 이 면의 大運 산술 문장과 月柱 출력은 별도 claim으로 취급한다.

### 2.2 `丙辛→庚寅`

NLC416 `5318` 《命理探源》 공개 scan PDF p.55에서 다음 연결이 한 worked block 안에 직접 보인다.

```text
丙午年正月初九日午時生……已交立春……
丙辛必定尋庚起……庚寅。
```

출생 입력 `丙午年正月初九日午時`와 `庚寅` 결과를 직접 확인했지만, 이 문서에서는 그 페이지의 source-local 표기만 보존한다. 정확한 인쇄면 번호·기관 원본 byte derivation은 별도 확정하지 않는다.

- [public scan PDF p.55](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E6%BA%90.pdf#page=55)
- local review bytes: `/private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf`
- local SHA-256: `8e8ebf3aa66781a3fb49a4acfc17229b6d0255af81a7cb9de0f83bafd43eb5ab`

### 2.3 `丁壬→壬寅`

같은 NLC416 `5318` scan PDF p.54에서 다음 worked block을 직접 확인했다.

```text
丁卯年正月初一日子時生……
丁壬壬位順行流……壬寅。
```

따라서 `丁壬` 계열의 실제 날짜·시각 입력과 `壬寅` 출력은 direct page observation이다. `丙午年十二月` 사례 등 인접 block의 다른 경계 처리는 이 항목의 결과에 합산하지 않는다.

- [public scan PDF p.54](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E6%BA%90.pdf#page=54)
- local review bytes와 SHA-256은 §2.2와 같다.

### 2.4 `戊癸→甲寅`

NCL 파일 식별자 `NCL-000002203`의 《新命理探原》 공개 scan에서 PDF pp.74–75(인쇄면 `三二–三三`)를 직접 대조했다. p.74의 `例四`는 다음 입력·경계를 인쇄한다.

```text
清光緒三十四年戊申，正月初四日未時生人。
……正月初四日午時立春……未時在午時之後，已過立春……
更有戊癸何方覓，甲寅之上好追求。
```

p.75의 연속된 식에는 `戊申（年柱）／甲寅（月柱）`가 직접 보인다. 따라서 이 사례에서만 `戊申` 입력, `未時` 및 立春 경계 설명, `甲寅` 결과를 함께 승격한다. 같은 사례군의 `巳時` 이전 경계와 `丁未／癸丑` 결과를 `甲寅` 변이로 취급하지 않는다.

- [public scan PDF p.74](https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=74)
- [public scan PDF p.75](https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=75)
- local review bytes: `/private/tmp/saju-term-review/NCL-000002203-xinmingli-tanyuan.pdf`
- local SHA-256: `3dfee4ef4636d48c2d2e749f90408a825e0eacee99b8c73b9748a03deb73dcfd`

이 파일은 공개 scan의 파일 식별자와 면 이미지만 확인한 것이다. 이 turn에서 `NCL-000002203`의 공식 catalog record, 기관 보존 원본과 공개 PDF의 raw-byte derivation, exact machine binding을 별도로 닫지 않았다. 그러므로 `戊癸→甲寅`은 page-level direct observation으로는 기록하되 기관 copy-level claim으로 올리지 않는다.

## 3. Claim-level adjudication

| claim | status | 승격 가능한 표현 | 보존할 한계 |
|---|---|---|---|
| `甲己→丙寅` | `direct, one named worked block` | NLC416 《淵海子平》 p.50의 `如甲子年` 문맥과 `正月建丙寅` | 완전한 네 기둥, second physical-copy repetition |
| `乙庚→戊寅` | `direct, one named worked block` | 같은 p.50의 `如乙丑年` 문맥과 `正月起戊寅` | 같은 한계 |
| `丙辛→庚寅` | `direct, date/time worked block` | 《命理探源》 p.55의 `丙午年正月初九日午時`와 `庚寅` | 기관 raw-byte/machine binding, 다른 copy에서의 반복 |
| `丁壬→壬寅` | `direct, date/time worked block` | 《命理探源》 p.54의 `丁卯年正月初一日子時`와 `壬寅` | 같은 한계 |
| `戊癸→甲寅` | `direct, adjacent-page worked block` | 《新命理探原》 pp.74–75의 `戊申年正月初四日未時`와 `戊申／甲寅` | 공식 record와 exact copy binding, 같은 source의 다른 witness 반복 |
| five-group actual application coverage | `direct 5/5, source-local` | 각 group에 적어도 하나의 출생/정월 worked surface가 있음 | 각 group의 독립 반복, 《五行精紀》 전이, 보편 생성기 |
| `五年干→寅月` rule itself | `direct repeated application rule` | v2의 《命理集成》·《韋千里命學講義》 명시 규칙과 이번 사례들의 일치 | 동일 텍스트의 계보·공통 저본·판본 선후 |
| 12개월 月支와 현대 月柱 함수 | `unresolved` | 위 페이지들의 source-local output만 유지 | 절기 API, timezone, 진태양시, endpoint, rounding |
| edition/textual lineage·정본성 | `unresolved` | textual correspondence/case output의 관찰만 유지 | 특정 공통조상·직접 계보·독립성·정본성 |
| semantic authority·interpretation readiness·production activation | `blocked` | 없음 | 직접 authority와 readiness gate가 닫힐 때까지 승격 금지 |

## 4. 독립성과 반복의 분리

```text
page-level direct observations
  ├─ 淵海子平 p.50              : 甲己→丙寅, 乙庚→戊寅
  ├─ 命理探源 p.54              : 丁壬→壬寅
  ├─ 命理探源 p.55              : 丙辛→庚寅
  └─ 新命理探原 pp.74–75        : 戊癸→甲寅

bounded result
  └─ five-group worked application coverage = 5/5

아직 말할 수 없음
  ├─ 다섯 group 각각의 독립 physical-copy 재현
  ├─ NCL/NLC/NCL 공개 PDF와 기관 원본 byte의 exact binding
  ├─ 《五行精紀》가 이 규칙을 직접 채택했다는 copy/page claim
  ├─ 특정 공통 저본·판본 선후·textual lineage·정본성
  └─ semantic authority·현대 계산 규격·readiness·activation
```

서로 다른 제목·파일·기관 문자열의 수를 physical-copy independence의 수로 세지 않는다. 공개 scan의 면을 직접 읽은 것은 해당 이미지의 본문 관찰을 강화하지만, 그 자체로 기관 원본의 byte provenance나 문헌 간 계보를 확정하지 않는다.

## 5. 재현 경로와 Git 경계

원본 PDF를 repository에 복사하지 않았고, `/private/tmp/saju-term-review/`의 review bytes 및 기존 연구자료를 수정·삭제하지 않았다. 필요한 page image는 다음처럼 재렌더링할 수 있다.

```bash
pdftoppm -f 50 -l 50 -r 300 -png \
  /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf \
  /private/tmp/current-witness-review/worked-yuanhai-p50
pdftoppm -f 54 -l 55 -r 300 -png \
  /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf \
  /private/tmp/current-witness-review/worked-mingli-tanyuan-p
pdftoppm -f 74 -l 75 -r 300 -png \
  /private/tmp/saju-term-review/NCL-000002203-xinmingli-tanyuan.pdf \
  /private/tmp/current-witness-review/worked-xinmingli-p
```

해시는 현재 review에 사용한 local PDF bytes의 식별자이지 기관 원본의 canonical hash라고 주장하지 않는다. 이 successor의 allowlist는 이 문서 하나뿐이다. 기존 working tree의 수정된 design/scheduler scripts와 Wonkwang·Sonkeik 관련 untracked 자료는 stage·수정·삭제하지 않는다.

최종 frontier:

```text
甲己→丙寅 worked application       direct, 1 page block
乙庚→戊寅 worked application       direct, 1 page block
丙辛→庚寅 worked application       direct, date/time block
丁壬→壬寅 worked application       direct, date/time block
戊癸→甲寅 worked application       direct, adjacent-page block
five-group worked coverage         direct 5/5, source-local
independent repetition/lineage     unresolved
《五行精紀》 copy/page adoption     unresolved
semantic authority/readiness        blocked
modern calculation/activation      blocked
```
