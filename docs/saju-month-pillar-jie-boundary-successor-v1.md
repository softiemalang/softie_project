# 사주 P0 月支·節境界 원표면 검증 successor v1

상태: `frontier narrowed; exact month-branch turnover remains insufficient_evidence`

기준일: `2026-09-05 KST`

이 문서는 기존 월주·월건 source-local 기록을 덮어쓰지 않는 additive checkpoint다. 질문은 `月支 전환이 節·中氣·특정 절기명에 직접 귀속되는가`이며, `月支`와 `月干`을 별도 claim으로 판정한다. 페이지 이미지의 직접 관찰, OCR/전사 후보, cross-page inference, authority/readiness를 합치지 않는다.

## 1. Bounded scope

직접 재확인한 scan surface만 포함했다.

- 《三命通會》 NLC416/13jh000156/94145, PDF p.96 `論人元司事`, p.98 `論四時節氣`, p.109 `論遁月時`.
- 《淵海子平 子平真詮》 NLC416/15jh007754/99036, PDF p.52 `論節候歌`.
- 《刻京臺增補淵海子平大全》 NLC892/2642/210287, 第1冊 PDF p.4 `論年上起月法`.

제외했다.

- 전체 본문 OCR, 검색 snippet의 원문 권위화, 현대 만세력/절기 API, production wiring·readiness·activation.
- 온라인 전사·local Wikisource export는 locator/corroboration 후보로만 사용하며 원표면 FACT로 사용하지 않는다.

## 2. Source identity and byte provenance

| source | locator | source PDF SHA-256 | parent render SHA-256 |
|---|---|---|---|
| [NLC416 三命通會 scan record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf) | PDF p.96, p.98, p.109 | `c6eac6fca6411e45cb801f9b771aca6dd6a6d2dfb57ecc36ea5f42ecf1ac8bf9` | p.96 `58d73eddaa9027b5fd7863f8f1fd577b97417799f91e4a720b989019ab8daa24`; p.98 `d2bc6de34453762ca027c3cb4227d71f36b4ac6a0d2154837f79c0161e9e7b80`; p.109 `ea2385ce6687cec588deb459a1427875e01450674e5215bdccf51acd32f31a65` |
| [NLC416 淵海子平 scan record](https://commons.wikimedia.org/wiki/File%3ANLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9E%E8%A9%AE.pdf) | PDF p.52 `論節候歌` | `fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f` | `7682fe0f866d2eba360d4e64115f0414a597dba5d81be51a15e6153f6a4a1721` |
| [NLC892 刻京臺增補淵海子平大全 scan record](https://commons.wikimedia.org/wiki/File%3ANLC892-2642-210287_%E5%88%BB%E4%BA%AC%E8%87%BA%E5%A2%9E%E8%A3%9C%E6%B7%B5%E6%B5%B7%E5%B9%B3%E5%A4%A7%E5%85%A8_%E7%AC%AC1%E5%86%8A.pdf) | 第1冊 PDF p.4 `論年上起月法` | `17eb28b3a65d0b28908c4646017ebd409ef875366f48945071bb68675f737c82` | `12eff211e777d35675ec5fa3607f56bc3aee392c61516dcb87a5985b9c1f7520` |

NLC416 `三命通會`의 공개 scan metadata는 `三命通會`, 萬民英, 文明書局, 民國十五年(1926)으로 표시된다. NLC416 `淵海子平`은 徐升 편·文明書局·[192-?], NLC892 판은 刻本·明萬曆 표기로 제공된다. 이는 scan identity와 서지 메타데이터의 관찰이지, 명대 원본까지의 transmission lineage나 정본성을 닫지 않는다(`lineage=PARTIAL/UNRESOLVED`).

## 3. Parent direct surface observations — FACT

### 3.1 《三命通會》 p.96 — 月序/建支와 月令 문맥

`論人元司事` 표면에서 `正月建寅`, 이어지는 `二月建卯` 등 월序와 建支가 보이고, 支中所藏의 人元을 `月令用神` 문맥에서 설명한다. 이는 이 scan surface가 월序와 지지 token을 직접 대응시킨다는 FACT다. 이 면에는 `月支가 어느 절기 시각에 바뀐다`는 계산 절차가 직접 쓰였다고 판정하지 않는다.

### 3.2 《三命通會》 p.98 — 節/中의 직접 정의

`論四時節氣` 아래에서 다음 문장이 직접 보인다.

```text
四立者四時之節氣也。丑之終寅之始則為節。月之半則為中。
```

따라서 `節 ↔ 丑之終/寅之始`, `中 ↔ 月之半`이라는 textual edge는 FACT다. 여기서 `中`을 month-boundary selector로 읽거나, `寅`을 `月支` 전환값으로 확정하는 것은 별도 추론이다.

### 3.3 《三命通會》 p.109 — 月干 산출 표면

`論遁月時`와 `古歌曰` 아래에서 다음 오언가가 직접 보인다.

```text
甲己之年丙作首。乙庚之歲戊為頭。
丙辛之歲尋庚上。丁壬壬位順行流。
更有戊癸何處起。甲寅之上好追求。
```

이는 `年干 group ↔ 寅月 시작干` mnemonic의 scan-surface FACT다. `月干`을 `月支` 경계 증거로 사용하지 않고, 두 산출을 분리한다.

### 3.4 《淵海子平》 p.52 — 월명/절기명 병기

`○論節候歌` 표면에 `正月立春雨水節`, `二月驚蟄及春分`부터 `子月大雪冬至節`, `丑月小寒大寒昌`까지 월명과 절기명이 함께 보인다. 이는 `月名 ↔ named-term sequence`의 직접 표면 관찰 FACT다. 운문상의 `節` 위치만으로 첫 항이 월지 전환점이라고 정규화하지 않는다.

### 3.5 《淵海子平》 계열 NLC892 p.4 — 月干 예시

`○論年上起月法` 아래에 `甲己起丙寅`, `乙庚起戊寅`, `丙辛起庚寅`, `丁壬起壬寅`, `戊癸起甲寅`이 직접 보인다. 이는 해당 witness가 월간 시작 조합을 인쇄했다는 FACT이며, p.52의 절기명 병기와 결합해 월지 경계 규칙을 만들지 않는다.

## 4. Claim adjudication

### FACT

- `三命通會 p.96`: 월序/建支와 `月令` 설명이 같은 `論人元司事` 표면에 있다.
- `三命通會 p.98`: `丑之終寅之始則為節`, `月之半則為中`이 직접 인쇄되어 있다.
- `淵海子平 p.52`: 월명과 절기명이 같은 운문 표면에 병기되어 있다.
- `三命通會 p.109` 및 `淵海子平` 계열 p.4: 월간 산출 mnemonic/예시가 각각 직접 인쇄되어 있다.
- `月支` 증거와 `月干` 증거는 서로 다른 절·표면으로 분리되어 있다.

### INFERENCE

p.96의 `正月建寅/二月建卯`와 p.98의 `丑末/寅始=節`을 같은 witness 안에서 cross-page join하면, `月支 경계가 節 쪽에 놓인다`는 해석이 현재 가장 강하다. p.52의 월명-절기명 병기는 `立春/驚蟄...` 예시를 보강하지만, 어느 항이 전환점인지 직접 말하지 않는다. 이 문단은 모두 `INFERENCE`이며 historical FACT로 승격하지 않는다.

### UNKNOWN

- `月支 전환 = 특정 節(예: 立春) 교입 순간`이라는 계산 절차를 한 문장으로 직접 닫은 원표면은 현재 확보 범위에 없다.
- `中氣`가 월지 전환에 사용되지 않는다는 배제 규칙도 직접 닫히지 않았다. p.98의 `月之半則為中`은 `節`과 `中`의 정의를 직접 보여줄 뿐이다.
- `正月立春雨水節` 등의 운문 배치가 첫 항/둘째 항의 boundary 역할까지 명시하는지 불명확하다.
- 1926 scan·明萬曆 표기·공개 mirror 사이의 exact copy lineage, 원작·정본성, physical-copy independence는 닫히지 않았다.
- Gemini Flash sidecar는 `--print-timeout 120` duration validation에서 status 2로 실행 전 종료되어 image-read/OCR result를 반환하지 않았다. 이 sidecar 결과는 evidence에 사용하지 않았고 재시도하지 않았다.

### CONFLICT

이번 target edge에 대해 parent가 직접 확인한 scan surface 사이의 명시적 문장 충돌은 기록하지 않는다. 전사본의 표기 변이·운문 구두점은 원표면 판독을 대체하지 않으므로 conflict로 확대하지 않고 UNKNOWN으로 보존한다.

## 5. Frontier decision

```text
節 ↔ 丑末/寅始 textual edge                 FACT (三命通會 p.98)
月序 ↔ 建支 (正月寅, 二月卯...)              FACT (三命通會 p.96)
月名 ↔ named solar-term sequence             FACT (淵海子平 p.52)
年干 group ↔ 寅月 start-stem                 FACT, 月支와 분리 (p.109 / p.4)
월지 전환의 실제 selector/instant            INSUFFICIENT_EVIDENCE
中氣가 전환 selector인가                     UNKNOWN
historical authority / readiness / activation BLOCKED
```

따라서 이번 frontier는 `월지 전환이 節 쪽이라는 source-local inference`까지 좁혀졌지만, 그 inference를 역사적 authority나 production `月柱` resolver로 승격하지 않는다. 월간 mnemonic은 별도 textual edge로 유지한다. production mapping·activation·push는 이 checkpoint의 범위가 아니다.

## 6. Verification boundary

원본 PDF와 렌더는 `/private/tmp`에서만 사용했고 repository source/production 파일은 수정하지 않았다. staging했던 bounded files는 호출 후 제거했고 before/after SHA가 동일했다. repository 변경은 이 문서 하나뿐이며, 기존 dirty/untracked artifact와 무관한 historical path는 포함하지 않는다.
