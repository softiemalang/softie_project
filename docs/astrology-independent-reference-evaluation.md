# Independent Astrology Reference Evaluation · Astro-0.75

기준일: 2026-07-26

## 평가 기준

Tier C 독립 기준은 Swiss/Placalc를 사용하지 않고, source commit·build
command·artifact hash·raw output을 보존할 수 있어야 한다. Tropical,
Geocentric, UTC, 좌표, Placidus, True/Mean Node 설정을 구분할 수 있어야
하며 README 주장만으로 독립성을 인정하지 않는다.

## 후보 요약

| 후보 | Swiss 독립성 | ASC/MC | Placidus | True Node | 판정 |
|---|---|---:|---:|---:|---|
| Astrolog 8.00 Matrix-only | 조건을 지킨 빌드만 독립 | 지원 | 지원, 극지 fallback 탐지 | 자체 근사식은 있으나 정의·정확도 불충분 | ASC/MC/Placidus 채택 |
| Astronomy Engine | 독립, MIT | 점성학 ASC/MC API 없음 | 없음 | 직접 지원 없음 | House/Node 기준 제외 |
| Kerykeion | `pyswisseph` 의존 | Swiss 결과 | Swiss 결과 | Swiss 결과 | 동일 엔진이라 제외 |

## Astrolog 상세 평가

### Source와 라이선스

- 공식 사이트: [Astrolog](https://www.astrolog.org/astrolog.htm)
- 소스 미러: [CruiserOne/Astrolog](https://github.com/CruiserOne/Astrolog)
- pin: `5bf172ea231c4b6ea3d7e09ca307571354a41e8a`
- version: 8.00, release 2026-05-31
- license: GPL-2.0-or-later

### 기본 빌드가 부적합한 이유

`astrolog.h` 기본 설정은 `SWISS`, `PLACALC`, `MATRIX`를 모두 정의한다.
기본 Makefile도 Swiss와 Placalc source를 링크한다. 따라서 기본 executable
또는 `-bm` 런타임 스위치만으로는 독립성을 입증할 수 없다.

### 독립 빌드 조건

Spike는 다음을 모두 적용한다.

- `SWISS`, `PLACALC`, `JPLWEB` 비활성화
- X11과 모든 graphics output 비활성화
- Matrix core만 유지
- source allowlist만 clang++에 전달
- Swiss/Placalc source와 header를 source copy에 포함하지 않음
- `nm -u`에서 `swe` 또는 `placalc` symbol이 발견되면 실패
- source commit, compiler, binary SHA-256 기록

빌드 과정은
[`spikes/astrology-independent-reference`](../spikes/astrology-independent-reference/README.md)에
고정했다.

### House 구현 위치

- `matrix.cpp`: `CuspMidheaven`, `CuspAscendant`, `CuspPlacidus`,
  `HousePlacidus`
- `calc.cpp`: `ComputeHouses`, ASC/MC 산출과 house dispatch

[공개 source](https://github.com/CruiserOne/Astrolog/blob/master/matrix.cpp)에서
Placidus iterative formula를 확인할 수 있다.

### 고위도 처리

Astrolog은 Placidus가 정의되지 않는 극지 위도에서 warning을 출력하고
Porphyry로 fallback한다. Spike는 stderr warning을 필수 검출하며 해당 cusp를
Placidus로 수용하지 않는다. Astrolog 출력은 effective system을 별도 구조
필드로 제공하지 않으므로 warning 누락 시 안전하게 판정할 수 없다.

### True Node

`-Yn`은 True Node 표시를 요청하지만 Matrix 경로의 `ComputeLunar()`는 짧은
섭동항 근사식을 쓴다. Astrolog 문서도 Matrix formula를 매우 오래된
근사식으로 설명한다. 이는 Swiss `SE_TRUE_NODE`와 같은 정의·보정·정확도를
독립적으로 입증하지 못하므로 True Node Gate에는 사용하지 않는다.

### Raw output와 재현성

- 정확한 UTC/좌표를 명령줄에 전달 가능
- `-c 0`: Placidus
- `-Yn`: Astrolog 자체 true-node 모드 관찰
- `-b0 -C -v`: arcsecond 단위 ASC/MC/12 cusp raw text
- 동일 입력 2회 결과 일치
- 동일 output path에서 2회 build SHA-256 일치
- macOS arm64 executable SHA-256:
  `7f1231a43c89ad2e2a89c08d74e3ca8252ea023f8679fabae9f39de4bb439f3a`
- executable은 Git에 포함하지 않음

### 채택 범위

- ASC: Tier C source `pass`
- MC: Tier C source `pass`
- 중위도·남반구 Placidus cusps: Tier C source `pass`
- 고위도 Placidus: `unavailable`; fallback 탐지 `pass`
- True Node: `pending`
- 행성값: 이 Spike에서 검증 근거로 사용하지 않음

`pass`는 독립 source/provenance 확보를 의미한다. Swiss와의 수치 허용 오차
Gate는 Astro-2 Golden Fixture에서 별도로 수행한다.

### 라이선스 및 보존 범위

Astrolog은 GPL-2.0-or-later다. 이번 Spike에서는 pinned source를 외부
temporary checkout에서 내부 검증용으로 빌드했고 executable이나 upstream
source를 Git에 포함하지 않았다. 저장소에는 source pin, build procedure,
temporary define 변환 절차, 공개·합성 입력과 raw text만 보존한다. 향후
executable 또는 수정 source를 제3자에게 배포한다면 GPL의 complete source와
notice 의무를 별도로 이행해야 한다. 이 기록은 법률 자문이 아니다.

## 추가 후보

### Astronomy Engine

[공식 저장소](https://github.com/cosinekitty/astronomy)는 MIT이며 VSOP87과
NOVAS 기반의 독립 행성·달 계산을 제공하고 JPL Horizons와 검증한다. 그러나
공식 기능 목록에 점성학 ASC/MC, Placidus 12 cusp, lunar True Node API가
없어 이 Phase의 House/Node Tier C 기준으로는 제외한다.

### Kerykeion

[공식 pyproject](https://github.com/g-battaglia/kerykeion/blob/main/pyproject.toml)은
`pyswisseph>=2.10.3.2`를 직접 의존성으로 선언하고 house systems도 Swiss
Ephemeris 기반이라고 설명한다. 같은 엔진 end-to-end 참고는 가능하지만
독립 검증에는 사용할 수 없다.

## Source Tier

```json
{
  "planets": {
    "source": "JPL Horizons",
    "tier": "A",
    "status": "pass"
  },
  "moon": {
    "source": "JPL Horizons",
    "tier": "A",
    "status": "pass"
  },
  "ascendant": {
    "source": "Astrolog 8.00 Matrix-only",
    "tier": "C",
    "status": "pass"
  },
  "mc": {
    "source": "Astrolog 8.00 Matrix-only",
    "tier": "C",
    "status": "pass"
  },
  "placidusCusps": {
    "source": "Astrolog 8.00 Matrix-only",
    "tier": "C",
    "status": "pass"
  },
  "trueNode": {
    "source": null,
    "tier": "C",
    "status": "pending"
  }
}
```

Astrodienst chart는 Swiss 기반이므로 Tier D 참고만 가능하다. 출처 불명 웹
계산기는 Tier E로 사용하지 않는다.
