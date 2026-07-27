# Astrology Core License Boundaries & Clean Room Policy

## 1. 라이선스 경계 및 출처 원칙
`Mallang Astrology Rule Core v0` 구현 시 모든 외부 천문 라이브러리 및 저작권 불분명 코드의 유입을 엄격히 금지합니다.

- **Swiss Ephemeris 및 모든 Wrapper 사용 금지** (GPL/Proprietary 라이선스 위험 방지)
- **Astronomy Engine, IAU SOFA, USNO SOFA 사용 금지**
- **외부 웹사이트, 블로그, GitHub 점성학 포팅 코드 사용 금지**
- **외부 API 및 원격 천문 계산 서비스 의존 금지**

## 2. 순수 수학 규칙 기반 구현
본 v0 코어는 저장소 내부 코드와 이 지시서에 명시된 명확한 기본 수학 공식(각도 정규화, 반열린 구간 검색, 벡터 상대속도 산출 등)만을 사용하여 클린룸(Clean Room) 방식으로 개발되었습니다.

## 3. 후속 천문 연산 모듈 도입 시 정책
향후 실제 천체 위치 계산 엔진(Astronomy Core) 도입 시:
- 오픈소스 라이선스(MIT/BSD 등)가 명확히 검증된 라이브러리만 선별 사용합니다.
- 허용 오차(Tolerance) 및 Golden Fixture 검증 프로세스를 거쳐 단계적으로 도입합니다.
