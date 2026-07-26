# Astrology Independent Reference Source Decision

기준일: 2026-07-26

## 원칙

Swiss `swetest`, Astro.com chart 또는 Swiss 기반 Wrapper 결과는 regression/end-to-end 참고에는 사용할 수 있지만 Swiss 구현의 독립 외부 검증으로 계산하지 않는다.

외부 Gate artifact는 다음을 보존해야 한다.

- 입력 UTC, 좌표, tropical/geocentric 설정
- house system과 node type
- source 이름, version 또는 생성시점
- 원본 machine-readable 응답 또는 화면/PDF
- 이용 조건과 수집일
- 변환 코드와 hash

허용 오차는 두 출처의 좌표계·빛시간·세차·장동·aberration·equinox 설정을 일치시킨 뒤 실제 차이를 측정해 결정한다. 이번 Phase에서 임의 수치를 만들지 않는다.

## 후보 판정

| 후보 | 행성·달 | ASC·MC | Placidus | True Node | 독립성 판정 |
| --- | --- | --- | --- | --- | --- |
| JPL Horizons | 가능 | 없음 | 없음 | 직접 값 없음 | 행성 상태벡터/좌표의 독립 기준 |
| USNO NOVAS | 구현 가능 | 직접 house 없음 | 없음 | 직접 값 없음 | 행성 보조 기준 |
| Astrolog 8.00, 자체 house module | 참고 | 가능 | 가능 | 설정은 있으나 기본 빌드는 Swiss/Placalc 가능 | house만 조건부 독립 |
| Astro.com / `swetest` | 가능 | 가능 | 가능 | 가능 | same-engine regression 전용 |
| 임의 웹 chart 계산기 | 일부 | 일부 | 일부 | 불명확 | provenance/이용조건 부족 |

공식 자료:

- [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [USNO NOVAS](https://aa.usno.navy.mil/software/novas_info)
- [Astrolog 8.00 documentation](https://www.astrolog.org/ftp/astrolog.htm)
- [Swiss documentation on available clients and house implementations](https://www.astro.com/swisseph-download/doc/swisseph.pdf)

## 최종 선택

### 행성 및 달

`pass`: JPL Horizons를 우선 독립 기준으로 선택한다.

- Swiss compressed Ephemeris와 동일한 JPL 계열 데이터를 활용할 수는 있어도, Swiss C 계산 경로와 파일 포맷을 거치지 않는다.
- Horizons 원본 응답을 저장하고 observer/coordinate/equinox 설정을 명시한다.
- USNO NOVAS를 선택 fixture의 이차 독립 확인에 사용할 수 있다.

### ASC 및 MC

`pending`: Astrolog 8.00의 자체 house calculation module을 후보로 선택했지만 독립 build artifact와 fixture를 아직 확정하지 않았다.

- source commit 후보: `5bf172ea231c4b6ea3d7e09ca307571354a41e8a`
- build 시 Swiss와 Placalc 경로를 끄고 자체 house module만 사용했음을 증명해야 한다.
- build flags, executable hash, 입력 command와 raw output을 보존해야 한다.
- 이 조건을 만족하기 전에는 external Gate에 사용할 수 없다.

### Placidus 12 cusp

`pending`: ASC/MC와 동일하게 Astrolog 자체 house module을 후보로 둔다.

- 일반 위도, 북·남 고위도, 날짜 경계 fixture를 포함한다.
- 고위도에서 Astrolog이 계산 불가 또는 자체 대체를 어떻게 표현하는지 별도 기록한다.
- Swiss가 반환한 Porphyry 결과와 독립 결과를 Placidus 정답으로 혼합하지 않는다.

### True Node

`pending`: 확정된 독립 출처가 없다.

- Astrolog의 True Node 옵션은 존재하지만 Swiss 또는 Placalc 경로를 사용할 수 있어 독립성 provenance가 부족하다.
- JPL Moon/Earth 상태벡터에서 osculating lunar node를 별도 유도하는 방법은 가능성이 있으나, Swiss의 True Node 정의·평활화·좌표계와의 동등성을 먼저 문서화해야 한다.
- 이 유도 파이프라인 또는 다른 독립 엔진의 source/version/artifact를 확정하기 전 `externally_verified`를 선언하지 않는다.

## 이용 조건

- JPL Horizons 출력의 장기 저장·재사용 정책은 fixture 수집 시 NASA/JPL 이용 조건과 acknowledgment 요구를 다시 기록한다.
- Astrolog은 GPL 코드이므로 검증 executable을 저장·배포한다면 해당 source 및 license 의무를 따른다.
- 제3자 웹 UI의 이용약관이 결과 artifact 저장을 허용하는지 확인되지 않으면 사용하지 않는다.

## External Gate

```json
{
  "independentPlanetReference": "pass",
  "independentAscMcReference": "pending",
  "independentPlacidusReference": "pending",
  "independentTrueNodeReference": "pending",
  "externallyVerifiedAllowed": false
}
```

Astro-1의 격리 구현 연구는 가능하지만 Astro-2 External Gate 통과 및 제품 활성화는 불가능하다.
