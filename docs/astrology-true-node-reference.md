# True Node Independent Reference · Astro-0.75

기준일: 2026-07-26
Gate: `independentTrueNodeReference: pending`

## 제품 정의

제품이 요구하는 값은 다음 조건을 모두 고정해야 한다.

- lunar ascending **True Node**, Mean Node 아님
- geocentric
- tropical zodiac
- ecliptic/equinox of date
- UTC instant가 확정된 입력
- longitude와 motion/retrograde의 정의가 동일
- Swiss 측 비교 대상은 `SE_TRUE_NODE`

Swiss Programmer's Manual은 `SE_MEAN_NODE = 10`, `SE_TRUE_NODE = 11`을 별도
body로 정의한다. `swe_mooncross_node*`가 말하는 달의 실제 황도 통과 시점과
임의 시각의 `SE_TRUE_NODE` longitude는 같은 API가 아니므로 혼용하지 않는다.

## Mean Node와 True Node

- Mean Node는 평균화된 세차 운동으로 얻는 매끄러운 기준이다.
- True Node는 달 궤도의 단기 섭동을 반영한 순간적/진동하는 노드다.
- 두 값은 동일하지 않으며, 단순 이름 변경이나 고정 offset으로 변환할 수
  없다.

## 조사한 독립 후보

### Astrolog Matrix-only

Astrolog의 `-Yn`은 UI상 true node를 선택한다. 그러나 Matrix 경로
`ComputeLunar()`는 mean node에 제한된 수의 섭동항을 더하는 오래된
근사식이다. 공식 Astrolog 문서도 Matrix formulas의 행성 정확도를 20세기
약 1 arcminute 수준으로만 설명하며 lunar True Node의 별도 검증 근거를
제공하지 않는다.

판정: raw 관찰은 보존하지만 Tier C Gate에는 `fail`.

### JPL Horizons state vector에서 직접 유도

[JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html)는 Earth와
Moon의 위치·속도 state vector와 osculating elements를 제공할 수 있다.
이론적으로 지구중심 달의 순간 상태에서 osculating orbital plane을 만들고
황도면과의 ascending intersection을 계산할 수 있다.

하지만 채택하려면 다음을 고정해야 한다.

- Earth/Moon center와 Earth-Moon barycenter 처리
- vector time scale(TDB/TT/UTC 변환)
- ICRF에서 ecliptic/equinox of date로의 변환
- apparent/geometric와 nutation/aberration 선택
- osculating plane의 순간 정의와 수치 안정성
- Swiss `SE_TRUE_NODE`가 사용하는 정의 및 보정과의 동등성

현재 공식 자료만으로 마지막 항목을 입증하지 못했다. 직접 구현을 검증
근거로 채택하면 구현과 기준이 동시에 새로 생겨 독립 Gate의 의미가 약해진다.

판정: `pending`, Astro-2 연구 후보.

### USNO NOVAS

[USNO NOVAS](https://aa.usno.navy.mil/software/novas_info)는 독립적인
고정밀 astrometry library지만 공개 API에서 lunar True Node를 직접
산출하는 기능을 확인하지 못했다. NOVAS를 이용해 state-vector 기반 유도를
구현하는 경우에도 위 정의 동등성 문제가 남는다.

판정: 직접 기준으로는 `fail`; 보조 좌표 변환 도구 후보.

### Astronomy Engine

독립 행성·달 엔진이지만 공식 API 기능에서 Swiss `SE_TRUE_NODE`와 비교
가능한 lunar True Node longitude를 확인하지 못했다.

판정: `fail`.

## 현재 선택

현 단계에서는 독립 True Node 기준을 확정하지 않는다.

```json
{
  "definitionPinned": "partial",
  "swissTarget": "SE_TRUE_NODE",
  "astrologMatrixAccepted": false,
  "jplDerivedReference": "pending_definition_equivalence",
  "novasDirectReference": false,
  "independentTrueNodeReference": "pending"
}
```

## 다음 Gate

다음 중 하나가 필요하다.

1. Swiss와 독립적이며 source와 정의가 공개된 검증 엔진이 동일한
   geocentric tropical true node를 직접 출력하거나,
2. JPL/DE state vector 기반 유도 정의를 Swiss `SE_TRUE_NODE`와 연결하는
   공식 알고리즘 근거 및 독립 검토를 확보한다.

그 전에는 True Node를 Astrology 제품 필수값으로 활성화하지 않는다. Astro-1
내부 Adapter는 필드를 구조적으로 보존할 수 있지만 Chat/Unified 승격 Gate는
계속 닫힌다.
