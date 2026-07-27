# Astrology Core Validation Policy & Test Guidelines

## 1. 검증 체계
`Mallang Astrology Rule Core v0`의 검증은 다음 두 가지 검증 원칙에 따라 수행됩니다.

1. **결정론적 규칙 단위 검증**:
   - 각도 정규화(360°, signed 180°, 각거리)
   - 12별자리 구간 및 반열린 구간 `[start, end)` 경계 판정
   - 운동 상태(`direct`, `retrograde`, `stationary`, `unavailable`)
   - Whole Sign 하우스 인덱싱
   - 5대 Major Aspect 및 Orb 경계 근접 감지
   - 상대 속도 기반 Aspect Phase (`applying`, `separating`, `exact`, `indeterminate`)
   - 룰러 및 원소/양식/극성 개수 집계 (동률 시 단일 지배값 강제 안 함)
   - 입력 순서 변경 시에도 완전히 일치하는 출력을 보장하는 순서 독립성

2. **합성 피처(Synthetic Fixtures) 기반 테스팅**:
   - 외부 서비스나 실제 차트 결과를 golden fixture로 복사하지 않고 오직 수학적 계산 검증용 합성 피처(`synthetic_astrology_rule_fixture_001` 등)만을 사용합니다.

## 2. 기존 서비스 회귀 방지
- 사주(Saju) 및 자미두수(Ziwei) 관련 모든 기존 테스트(244개)는 100% 통과를 유지합니다.
- 기존 데이터 계약 및 상태 모델을 훼손하지 않습니다.
