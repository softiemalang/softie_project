# 起運 coarse endpoint 산술과 동일시각 경계의 bounded successor v1

상태: `coarse arithmetic direct`, `same-clock equality repeated on two page surfaces`, `modern endpoint relation unresolved`, `semantic authority/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 기존 《子平命術要訣》의 `亥正一刻八分 → 亥時` 관찰과 [fine-time endpoint contrast successor](./saju-dayun-fine-time-endpoint-contrast-successor-v1.md)를 덮어쓰지 않는다. 먼저 그 사례의 coarse 산술을 source-local하게 재현하고, 이어 서로 다른 두 page surface에서 출생시각과 선택된 節 시각의 `丑時正一刻` 경계 사례를 직접 대조한다. 두 문면의 반복은 equality-boundary의 bounded corroboration으로만 사용하며, 공통 저본·직접 계보·보편 알고리즘으로 확장하지 않는다.

## 1. Bounded conclusion

기존 NLC 《子平命術要訣》 p.18(인쇄면 `十四`)의 사례는 다음 coarse 산술로 직접 닫힌다.

```text
十月十八日申時 → 十一月初二日亥時
                 = 十四日零三時
10 × (12 × 14 + 3) ÷ 30 = 57月
57月 = 四年九月
```

원면의 정밀 target `十一月初二亥正一刻八分交大雪節`은 계산문에서 `十一月初二日亥時`로 다시 쓰인다. 따라서 fine target이 coarse endpoint로 대체된 사실은 direct single-example이지만, 그 연산이 단순 축약인지 floor·ceil·nearest 또는 다른 endpoint convention인지는 여전히 unresolved다.

이번에 추가로 직접 확인한 두 page surface는 다음 equality pattern을 반복한다.

```text
生日：正月初一日丑時正一刻
交節：初四日丑時正一刻立春節
結果：乃足一歲
```

즉, 이 두 surface의 source-local 계산에서는 출생시각과 節 시각의 시각 label·정밀도가 같을 때 `三日`이 정확히 `一歲`로 충분하다고 기록한다. 한 `時` 차이가 생기면 별도의 잔여·차감 문장이 붙는다. 이것은 역사적 문면에서 직접 반복된 equality treatment이지만, 현대 수학의 `t_target >= t_birth` 또는 `t_target > t_birth`로 번역할 수 있는 형식 규칙은 아니다.

## 2. Source surfaces and provenance boundary

| surface | item / locator | 직접 확인 | 안전한 역할과 제한 |
| --- | --- | --- | --- |
| NLC-attributed public scan | 《命理集成》, public PDF p.68, printed `四七`; metadata `NLC data_416,13jh001663,59235` | `假如陽命正月初一日丑時正一刻生`부터 `若春在子時則少一時乃借一句`까지 | page-level visual witness; Commons metadata와 파일명은 item lead이며 기관 raw bytes·machine binding으로 승격하지 않음 |
| NCL official record + scan | [《新命理探原》 official record, accession `000002203`](https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203), public PDF p.82, printed `四〇` | `正月初一日丑時正一刻生`부터 `若春在亥時則少一時為欠十天`까지 | official record→digital page route; record page count `487`와 downloaded PDF extent `486`의 차이는 보존하며 억지로 맞추지 않음 |
| existing NLC case | 《子平命術要訣》 public scan p.18, printed `十四` | `亥正一刻八分交大雪節` → `十一月初二日亥時` → `十四日零三時` | fine→coarse 대응의 단일 사례; 절삭 연산으로 승격하지 않음 |

NLC 《命理集成》의 공개 scan은 [file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf)와 [direct PDF](https://upload.wikimedia.org/wikipedia/commons/c/c3/NLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf)에서 추적했다. Commons metadata는 `汪琴南編`, `命理集成`, National Library of China source 및 `[1932]`를 표시하지만, 이를 이번 equality 판정의 composition date·최초 witness·textual lineage로 사용하지 않는다.

NCL의 공식 페이지는 《新命理探原》을 `袁樹珊撰`, `潤德`, `1915`, `487 pages`, accession `000002203`, National Central Library source/storage로 표시한다. [official reader](https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203/reader)는 기관 record와 viewer 경로를 제공한다. 이번 direct image는 그 공개 PDF의 p.82에 한정한다. 공식 record의 487쪽과 다운로드 PDF의 486쪽은 디지털 extent discrepancy로 남긴다.

## 3. Existing NLC coarse arithmetic replay

기존 direct transcription은 다음과 같다.

```text
例如丙申年十月十八日申時生男查曆書本年十一月初二亥正一刻八分交大雪節。
因丙年生男為陽男。故從十月十八日申時順數至十一月初二日亥時。
共得十四日零三時。
```

같은 page의 결과는 `五十七月合四年零九月`, 이어 `五歲上運欠三月`이다. page의 압축 공식은 `10[12×14＋3]÷30＝57`로 읽히며, 다음은 그 문면을 고치는 것이 아니라 source-local 수량을 산술적으로 펼친 것이다.

```text
12 × 14 + 3 = 171時
171時 × 10日/時 ÷ 30日/月 = 57月
57月 = 4年 + 9月
5年 - 4年9月 = 欠3月
```

여기서 직접 닫히는 것은 `申時`와 `亥時`라는 coarse label을 사용한 결과다. `亥正一刻八分`의 `刻·分` 잔여가 이 식에 들어갔다는 증거는 없다. 출생 표지도 `申時`만 제공하므로, 정밀 연속시간 차이는 다음처럼 닫히지 않는다.

```text
Δfine = 14日 + 3時 + (亥 내부 잔여 - 申 내부 잔여)
```

이 식의 역사적 `刻·分` 의미, 출생 `申時`의 anchor, endpoint 처리 방식은 page에서 정의되지 않는다.

## 4. Direct equality-boundary observations

### 4.1 《命理集成》 p.68 / printed `四七`

페이지의 `推大運法` 문맥에서 다음 sequence가 직접 보인다.

```text
假如陽命正月初一日丑時正一刻生。
至初四日丑時正一刻立春節。乃足一歲。
若春在寅時則多一時乃零一句。
若春在子時則少一時乃借一句。
```

이 surface에서 직접 닫히는 내용은 다음이다.

- birth와 target 節이 모두 `丑時正一刻`로 기록된다.
- 두 날짜의 차이는 `三日`이다.
- 같은 시각 정밀도에 도달했을 때 `乃足一歲`라고 한다.
- target이 `寅時`이면 `多一時`, `子時`이면 `少一時`라고 잔여·부족을 분리한다.

`零一句`·`借一句`의 정확한 표기와 단위 해석은 page-local literal로 보존하며, 이 문서에서는 이를 현대 일수로 재기입하지 않는다.

### 4.2 《新命理探原》 p.82 / printed `四〇`

같은 `推大運法` page의 앞 문맥에는 다음 source-local 단위 문장이 직접 보인다.

```text
數至生日後未來節日時為止。
...
必足三十六時方算一日。
必足三日方算一歲。
若餘一時則為多十天。
若少一時則為欠十天。
```

이어지는 equality example은 다음과 같다.

```text
假如陽年生男正月初一日丑時正一刻生
至初四日丑時正一刻立春節乃足一歲
若春在寅時則餘一時為多十天
若春在亥時則少一時為欠十天。
```

이 surface는 같은 `丑時正一刻` equality를 다시 `乃足一歲`로 기록하고, 한 `時`의 잔여를 `多十天` 또는 `欠十天`으로 명시한다. 이는 NLC 《命理集成》 page의 `同時精度 → 足一歲`, `多一時/少一時` 구조와 직접 대응하지만, 두 문헌이 같은 copy·저본·계보라는 뜻은 아니다.

## 5. Endpoint adjudication

| claim | status | direct basis | 승격하지 않은 범위 |
| --- | --- | --- | --- |
| NLC `十四日零三時` coarse count | `direct, source-local` | `申時 → 亥時`, same page result | 정밀 `刻·分`의 산입 |
| `14日+3時 → 57月 → 4年9月` | `direct arithmetic replay, source-local` | page formula와 reported result | 현대 起運 계산 규격 |
| 동일 `丑時正一刻`의 節 도달을 `乃足一歲`로 처리 | `direct` | 《命理集成》 p.68 | 모든 문헌의 formal inclusive operator |
| 같은 equality pattern의 두 번째 직접 surface | `direct repeated bounded corroboration` | 《新命理探原》 p.82 | textual independence·common ancestor·lineage |
| target이 한 `時` 늦으면 잔여가 생김 | `direct, source-local` | `多一時`; NCL은 `多十天`까지 명시 | 모든 `刻·分`의 동일 환산 |
| target이 한 `時` 이르면 부족/차용이 생김 | `direct, source-local` | `少一時`; NCL은 `欠十天`까지 명시 | endpoint의 현대 음수·차용 규칙 |
| equality를 현대 `<=`로 표현 | `not promoted` | 원면은 `乃足一歲`라고만 말함 | `<`/`<=` API/operator |
| equality 직전·직후의 exact boundary behavior | `partial` | 한 `時` 단위의 `多/少` 비교만 있음 | `刻·分`·동일 순간·자정·월 경계 |
| `亥正一刻八分 → 亥時`가 floor/ceil/nearest인지 | `unresolved` | NLC fine→coarse 단일 사례; 다른 page는 residual을 보존 | 절삭·반올림·block projection |
| timezone·천문시각·현대 API·readiness | `blocked` | source page는 이를 정의하지 않음 | production activation/semantic authority |

가장 좁은 현재 결론은 다음이다.

> 서로 다른 두 page surface에서 `出生：丑時正一刻`과 `交節：丑時正一刻`이 함께 기록된 사례가 반복되고, 두 문헌 모두 그 도달을 `乃足一歲`로 처리한다. 따라서 **동일하게 기록된 source-local 시각 경계는 부족으로 처리되지 않고 완결값으로 보고된다는 bounded direct rule**을 승격한다. 그러나 이것을 현대의 `<`/`<=` 또는 모든 정밀 시각 endpoint의 포함·제외 규칙으로 번역하지 않는다.

## 6. Relation to the existing `亥正一刻八分` case

새 equality evidence는 기존 NLC case의 fine→coarse 문제를 해결하지 않는다.

| case | target precision | calculation endpoint | 현재 판정 |
| --- | --- | --- | --- |
| 《子平命術要訣》 | `亥正一刻八分` | `亥時` | fine residual omission direct; operation unresolved |
| 《命理集成》 | `丑時正一刻` | `丑時正一刻` | same-clock equality reaches `足一歲` |
| 《新命理探原》 | `丑時正一刻` | `丑時正一刻` | same-clock equality reaches `足一歲` |

따라서 `丑時正一刻` equality 사례는 **경계에 정확히 도달했을 때의 source-local sufficiency**를 보강하지만, `亥正一刻八分`을 `亥時`로 바꾼 이유가 축약인지 절삭인지 판단하게 해주지는 않는다. 두 문제를 동일한 operator로 합치지 않는다.

## 7. Reproducibility and validation

검토용 PDF와 렌더 이미지는 `/private/tmp/saju-term-review/` 밖의 repository에 복사하지 않았다.

```text
NLC public PDF
https://upload.wikimedia.org/wikipedia/commons/c/c3/NLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf
PDF SHA-256: dbb50d8f5daf8a30269273a3e5dc787133deabd944e76e28d592e58a97348501
render: pdftoppm -f 68 -l 68 -r 300 -jpeg -singlefile ... scan-068-hi
render SHA-256: 1caa885da627bf1178b78ea1d2c88b99d158554c3dc63a38bf4dacc54e4b3aa4

NCL official record / public PDF
https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203
https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf
PDF SHA-256: 3dfee4ef4636d48c2d2e749f90408a825e0eacee99b8c73b9748a03deb73dcfd
render: pdftoppm -f 82 -l 82 -r 300 -jpeg -singlefile ... xin-082
render SHA-256: 8cb8e045a50fe13488083aad03935463a646308794bdff7df7ccfa7ba822ad63
```

문서 전용 successor이므로 앱 runtime test/build는 실행하지 않는다. `git diff --check`, staged-path 확인, 문서 내용의 source locator·hash·blocker 재검증을 수행한다. 기존 tracked/untracked 변경, 대용량 원본, 판단 불가 자료는 stage·수정·삭제 대상이 아니다.

최종 상태:

```text
coarse 14日零三時 → 57月             direct, source-local
same-clock equality → 乃足一歲       direct repeated, bounded
one-時 later/earlier residual         direct, source-local
fine endpoint operator                unresolved
modern < / <=                         not promoted
timezone / API / rounding             unresolved
semantic authority / readiness        blocked
```
