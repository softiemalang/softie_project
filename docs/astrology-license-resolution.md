# Swiss Ephemeris License Resolution · Astro-0.75

기준일: 2026-07-26
법률 자문이 아니라 공식 문서에 근거한 기술·제품 의사결정 기록이다.

## 결론

- 현재 결정 상태: `license_pending`
- 권장 후보: `professional_license_preferred_pending_written_confirmation`
- Browser WASM 재배포: `pending`
- Ephemeris data 재배포: `pending`
- 최종 Readiness: `astro_1_blocked`

2026년 6월판 Professional 계약서는 분산 앱에 Swiss Ephemeris를
컴파일된 형태로 포함하고 필요한 파일을 복제할 권리를 명시한다. 그러나
브라우저에서 직접 내려받을 수 있는 `.wasm`, Glue JS, `.se1` 파일과
Preview/Staging/Production 도메인 범위를 명시적으로 적지는 않는다.
따라서 이 프로젝트의 실제 배포 형태에 대한 Astrodienst의 서면 확인 전에는
Gate를 통과시키지 않는다.

## 검토한 공식 문서

| 문서 | 확인 버전/날짜 | 용도 |
|---|---|---|
| [Swiss Ephemeris licensing information](https://www.astro.com/swisseph/swephinfo_e.htm) | 2026-07-26 열람 | Dual License와 선택 시점 |
| [Professional License contract](https://www.astro.com/swisseph/secont_e.pdf) | Edition June 2026 | 계약 범위, 비용, 기간, 배포 |
| [Official price page](https://www.astro.com/swisseph/swephprice_e.htm) | 2026-07-26 열람 | CHF 700 가격 |
| [Official source repository](https://github.com/aloistr/swisseph) | Phase Astro-0.5 pin | 배포 원본 |
| [Programmer's Manual](https://www.astro.com/swisseph/swephprg.pdf) | Swiss Ephemeris 2.10 | API와 Dual License 재확인 |
| [GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.en.html) | Version 3, 2007-11-19 | Corresponding Source와 네트워크 조항 |
| [GNU license FAQ](https://www.gnu.org/licenses/gpl-faq.en.html) | 2026-07-26 열람 | 바이너리/네트워크 소스 제공 해설 |
| [Astrodienst Sweph-Wasm test](https://www.astro.com/sweph-wasm/) | 2026-07-26 열람 | Browser WASM과 client-side data의 공식 기술 선례 |

공식 Sweph-Wasm 페이지는 unmodified C library가 브라우저에서 실행되고
binary ephemeris files가 client-side에 포함된다고 설명한다. 이는 기술
가능성의 공식 선례일 뿐, 이 프로젝트의 Professional 계약 범위를 자동으로
확정하는 허가는 아니다.

## 공식 문서에 명시된 사실

1. Swiss Ephemeris는 AGPL v3 또는 Professional License의 Dual License다.
2. Swiss 일부를 포함한 소프트웨어를 배포하거나 공개 서비스를 활성화하기
   전에 경로를 선택해야 한다.
3. 공식 안내는 AGPL 경로에서 whole software project를 AGPL 또는 호환
   라이선스로 두어야 한다고 명시한다.
4. 2026년 6월 Professional 계약은 unlimited license를 CHF 700으로
   표시하며 유효기간은 99년이다.
5. 계약은 Swiss 함수를 직접 호출하는 배포 앱뿐 아니라 서버 계산을 요청하는
   앱과 브라우저로 접속하는 서버 소프트웨어도 다룬다.
6. 분산 앱은 Swiss를 compiled form으로 포함하고 필요한 파일을 복제할 수
   있다.
7. Swiss 원본 소스 배포는 의무가 아니지만, 배포한다면 complete Swiss
   source를 포함해야 한다. 수정 소스 배포에는 계약서가 언급한 AGPL 조건이
   적용된다.
8. 저작권 고지는 제거하거나 변경할 수 없다.
9. 계약은 결제 완료 후 유효하다.

## 공식 문서만으로 확정되지 않은 사항

- `.wasm`과 Glue JS가 계약의 compiled form에 명시적으로 포함되는지
- `.se1`을 직접 접근 가능한 Vercel static asset으로 제공할 수 있는지
- 하나의 계약이 Preview, Staging, Production 도메인을 모두 포괄하는지
- 프로젝트가 작성한 최소 Binding의 별도 권리와 배포 조건
- Swiss source/artifact를 저장소에서 제외하고 내부 빌드만 하는 방식
- 모바일 앱 또는 추가 도메인으로 확장할 때 별도 계약이 필요한지
- 계약 전 로컬·비공개 Spike의 허용 범위
- 계약 또는 서비스 종료 후 이미 배포된 artifact 처리

이 항목들은 [공식 문의 초안](./astrology-license-inquiry.md)의 답변으로만
승격한다.

## AGPL 경로 영향

### 확인된 기반

- AGPL 제13조는 수정 프로그램과 네트워크로 상호작용하는 사용자에게 해당
  버전의 Corresponding Source를 받을 기회를 제공하도록 요구한다.
- GNU FAQ는 네트워크 서버에 object code를 제공할 때 Corresponding Source도
  접근 가능하게 해야 한다고 설명한다.
- Swiss 공식 안내는 자체적으로 whole software project 범위를 명시한다.

### 프로젝트 영향 해석

- 프론트에 WASM을 결합하면 C Core, Binding, Glue, 빌드·설치에 필요한
  Corresponding Source 제공 절차가 필요하다.
- 현재 프론트 및 결합 코드, Supabase/Vercel 코드, 별도 저장소까지의 정확한
  공개 범위는 저장소 경계만으로 확정하지 않고 전문 검토가 필요하다.
- 비공개 코드와 향후 상업화 가능성을 유지하려는 현재 방향에는 운영 및 법적
  불확실성이 크다.
- 사용자가 전체 공개 전략을 명시적으로 승인하지 않았으므로
  `agpl_strategy_approved`로 판정하지 않는다.

## Professional License 경로 영향

현재 제품 방향에는 Professional 경로가 더 적합한 후보이다.

- 장점: 계약 문구상 compiled distribution과 browser/server 사용을 다루며,
  Swiss 원본 소스 공개가 필수는 아니다.
- 비용/기간: CHF 700, 99년.
- 운영: 계약서, 결제 증빙, 승인 답변, 사용 Swiss commit과 data hash를
  함께 보관해야 한다.
- 제한: WASM/data의 직접 브라우저 재배포와 다중 환경 범위가 명시적이지
  않아 서면 확인 전 공개 배포할 수 없다.
- 향후 버전·도메인·앱 확장은 계약 답변에 따라 재평가한다.

## 제3자 Wrapper

Swiss 본체 권리와 Wrapper 고유 코드 권리는 별개다. Professional License가
AGPL Wrapper의 의무를 자동으로 해소한다고 가정할 수 없으므로, 제품 후보는
공식 C Core와 프로젝트 소유 최소 Binding을 유지한다.

## Gate

```json
{
  "licenseDocumentationReviewed": "pass",
  "professionalLicenseScopeConfirmed": "pending",
  "agplImpactAssessed": "pass",
  "browserWasmRedistributionConfirmed": "pending",
  "ephemerisDataRedistributionConfirmed": "pending",
  "licenseDecision": "license_pending",
  "publicSwissArtifactDeploymentAllowed": false
}
```

승격 조건은 Astrodienst의 서면 답변, 사용자의 라이선스 경로 승인, 필요한
경우 계약 서명·결제 완료다.
