# Astronomy Model Provenance & Formulas v0

## 1. Clean Room Implementation Principles
- 외부 천문 라이브러리(Swiss Ephemeris, Astronomy Engine, IAU SOFA, ERFA, NOVAS, Meeus 구현체 등) 코드 및 원격 API를 복사/포팅/사용하지 않았습니다.
- 본 수식과 상수는 지시서에 명시된 결정론적 공식만을 근거로 작성되었습니다.

---

## 2. Formulas & Mathematical Definitions

### A. Julian Date UTC (proleptic Gregorian)
$$a = \lfloor \frac{14 - M}{12} \rfloor$$
$$y = Y + 4800 - a, \quad m = M + 12a - 3$$
$$\text{JDN} = D + \lfloor \frac{153m + 2}{5} \rfloor + 365y + \lfloor \frac{y}{4} \rfloor - \lfloor \frac{y}{100} \rfloor + \lfloor \frac{y}{400} \rfloor - 32045$$
$$\text{JD}_{\text{UTC}} = \text{JDN} - 0.5 + \frac{\text{hour} \times 3600 + \text{minute} \times 60 + \text{second}}{86400}$$

### B. Time Scales
$$\text{JD}_{\text{UT1}} = \text{JD}_{\text{UTC}} + \frac{\text{DUT1}}{86400}$$
$$\text{JD}_{\text{TT}} = \text{JD}_{\text{UTC}} + \frac{\text{TT\_OFFSET}}{86400}$$
$$\Delta T = \text{TT\_OFFSET} - \text{DUT1}$$

### C. IAU 2000 Earth Rotation Angle (ERA)
$$d_{\text{UT1}} = \text{JD}_{\text{UT1}} - 2451545.0$$
$$\text{ERA}_{\text{raw}} = 0.7790572732640 + 1.00273781191135448 \times d_{\text{UT1}}$$
$$\text{ERA}_{\text{turns}} = \text{ERA}_{\text{raw}} - \lfloor \text{ERA}_{\text{raw}} \rfloor$$
$$\text{ERA}_{\text{degrees}} = \text{normalizeDegrees360}(\text{ERA}_{\text{turns}} \times 360)$$

### D. IAU 2006 Mean Obliquity ($\epsilon$)
$$T = \frac{\text{JD}_{\text{TT}} - 2451545.0}{36525}$$
$$\epsilon'' = 84381.406 - 46.836769 T - 0.0001831 T^2 + 0.00200340 T^3 - 0.000000576 T^4 - 0.0000000434 T^5$$
$$\epsilon^{\circ} = \frac{\epsilon''}{3600}$$

### E. IAU 2006 Greenwich Mean Sidereal Time (GMST) & LMST
$$\text{GMST}_{\text{corr}}'' = 0.014506 + 4612.156534 T + 1.3915817 T^2 - 0.00000044 T^3 - 0.000029956 T^4 - 0.0000000368 T^5$$
$$\text{GMST}^{\circ} = \text{normalizeDegrees360}\left(\text{ERA}^{\circ} + \frac{\text{GMST}_{\text{corr}}''}{3600}\right)$$
$$\text{LMST}^{\circ} = \text{normalizeDegrees360}(\text{GMST}^{\circ} + \lambda_{\text{east}})$$

### F. Mean Midheaven (MC)
$$\theta = \text{LMST}_{\text{radians}}, \quad \epsilon = \epsilon^{\circ}_{\text{radians}}$$
$$\text{MC}_{\text{radians}} = \text{atan2}(\sin\theta, \cos\theta \cos\epsilon)$$
$$\text{MC}^{\circ} = \text{normalizeDegrees360}(\text{MC}_{\text{radians}} \times \frac{180}{\pi})$$

### G. Mean Ascendant (ASC)
$$\phi = \text{geographic\_latitude}_{\text{radians}}$$
$$\text{ASC}_{\text{base}} = \text{atan2}(-\cos\theta, \sin\theta \cos\epsilon + \tan\phi \sin\epsilon)$$
$$\text{ASC}^{\circ} = \text{normalizeDegrees360}((\text{ASC}_{\text{base}} \times \frac{180}{\pi}) + 180)$$
- **Geographic Pole Restriction**: $90^{\circ} - |\text{latitude}| \le 10^{-10}$ 인 경우 ASC 계산 불가 (`blocked`).

---

## 3. External Validation Oracles & License Boundaries
- 본 코어 구현체는 저장소 밖에서 일회성 수치 비교용으로 실행한 **IAU SOFA (2023-10-11 ANSI C)** 및 **Swiss Ephemeris (v2.10.03)** 외부 오라클 결과와 검증되었습니다.
- 외부 라이브러리 소스, 바이너리, 헤더, wrapper, 런타임 호출은 저장소에 전혀 포함되지 않았습니다.
- IAU SOFA 공식 라이선스 및 제3자 지적재산권 고지는 [THIRD_PARTY_NOTICES.md](file:///Users/softie/Documents/softie_project/THIRD_PARTY_NOTICES.md) 및 [docs/astrology/licenses/IAU-SOFA-LICENSE.txt](file:///Users/softie/Documents/softie_project/docs/astrology/licenses/IAU-SOFA-LICENSE.txt)에 보존되어 있습니다.
- 상세 오라클 출처 및 수치 검증 결과는 [docs/astrology/time-angle-external-validation.md](file:///Users/softie/Documents/softie_project/docs/astrology/time-angle-external-validation.md) 문서 참조.
