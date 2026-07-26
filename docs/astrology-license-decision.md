# Astrology License Decision · Astro-0.5

기준일: 2026-07-26
결정 상태: `license_pending`
법률 자문이 아니라 공식 배포 문서와 계약서 문구를 바탕으로 한 기술·제품 의사결정 기록이다.

> Astro-0.75의 최신 공식 근거, 문의 초안, Gate는
> [astrology-license-resolution.md](./astrology-license-resolution.md)를
> 따른다. `license_pending` 판정은 유지된다.

## 결론

Swiss Ephemeris를 공개 제품에 포함하거나 공개 서비스에서 사용하기 전 다음 둘 중 하나를 사용자가 명시적으로 승인해야 한다.

1. 저장소와 서비스 전체에 적용할 AGPL 전략
2. Astrodienst와 체결한 Swiss Ephemeris Professional License

현재 어느 경로도 승인되지 않았다. 따라서 공식 C Core를 사용한 이번 로컬 기술 Spike는 평가 목적에 한정하며, Swiss WASM 및 Ephemeris 데이터 파일을 Vercel 또는 Production에 배포하지 않는다. 현 상태에서는 Astro-1 제품 구현을 시작할 수 없다.

## 공식 확인 사실

공식 Swiss Ephemeris 안내와 Programmer's Manual은 다음을 명시한다.

- Swiss Ephemeris는 AGPL 또는 Professional License의 이중 라이선스다.
- Swiss 코드를 포함한 소프트웨어를 배포하거나 이를 사용하는 공개 서비스를 활성화하기 전에 하나를 선택해야 한다.
- AGPL 경로는 전체 소프트웨어 프로젝트를 AGPL 또는 호환 라이선스로 두어야 한다고 공식 안내한다.
- Professional 경로는 계약서 서명과 구매 완료 후 유효하다.

2026년 6월판 Professional 계약서에서 확인한 항목:

- 무제한 라이선스 가격은 CHF 700이다.
- 유효기간은 99년이다.
- 배포 앱은 Swiss 함수를 직접 호출하거나 서버 계산을 요청하는 형태를 모두 포함한다.
- 서버에서 Swiss를 호출하고 사용자가 브라우저로 이용하는 형태도 계약 범위에 포함된다.
- 배포 앱은 Swiss를 컴파일된 형태로 포함하고 필요한 파일을 복제할 수 있다.
- Swiss 원본 소스 배포는 의무가 아니지만, 배포한다면 전체 Swiss 소스를 포함해야 한다.
- 수정한 Swiss 소스를 배포하는 경우 해당 수정에는 계약서가 언급한 AGPL 조건이 붙는다.
- 저작권 고지를 제거하거나 변경할 수 없다.

공식 자료:

- [Swiss Ephemeris licensing information](https://www.astro.com/swisseph/swephinfo_e.htm)
- [Swiss Ephemeris Professional License contract, June 2026](https://www.astro.com/swisseph/secont_e.pdf)
- [Swiss Ephemeris Programmer's Manual](https://www.astro.com/swisseph/swephprg.htm)
- [GNU AGPL v3](https://www.gnu.org/licenses/agpl-3.0.en.html)

## AGPL 경로 영향

공식 Swiss 안내가 요구하는 “whole software project” 범위와 AGPL 제13조의 네트워크 상호작용 소스 제공 의무를 기준으로 다음을 전제로 해야 한다.

- 브라우저 번들에 Swiss WASM을 포함하면 그 WASM과 연결 코드의 Corresponding Source, Binding, Build Script를 제공해야 한다.
- 사용자가 네트워크로 수정 프로그램과 상호작용할 경우 해당 버전의 소스에 접근할 수단이 필요하다.
- 현재 프론트, WASM과 결합되는 코드, 빌드·설치에 필요한 스크립트까지 공개 범위 검토가 필요하다.
- 비공개 비즈니스 로직, 서버 코드, 별도 저장소에 미치는 범위는 저장소 경계만으로 임의 판정하지 않고 법률 검토가 필요하다.
- 향후 비공개 또는 상업 서비스 정책과 충돌할 가능성이 크므로 사용자의 명시적 오픈소스 전략 승인이 선행되어야 한다.

## Professional License 경로 영향

현재 제품 방향에는 Professional License가 더 자연스러운 후보지만, 아직 `professional_license_preferred`로 확정하지 않는다.

계약 전 Astrodienst에 서면 확인할 질문:

1. 브라우저에 전달되는 WASM이 계약 제4조의 compiled form 배포에 해당하는가?
2. `sepl_18.se1`, `semo_18.se1` 등 필요한 데이터 파일을 브라우저 asset으로 재배포할 수 있는가?
3. 단일 라이선스에 도메인, Preview 도메인, 앱 수, 배포 대상 수 제한이 있는가?
4. Vercel Preview 및 내부 QA 배포가 공개 배포와 동일하게 취급되는가?
5. C Core를 변경하지 않고 프로젝트 소유의 Binding만 추가할 때 Binding 배포 조건은 무엇인가?
6. 버전 또는 Ephemeris 데이터 업데이트 시 추가 계약이나 비용이 필요한가?
7. 계약 전 로컬·비공개 기술 평가의 허용 범위는 어디까지인가?

계약 체결 전 허용 범위를 추정하지 않는다. 이번 Spike의 Swiss 산출물은 로컬에서만 생성했고 Git에 포함하지 않았다.

## 제3자 Wrapper 권리

Swiss 본체의 권리와 Wrapper 고유 코드의 권리는 별개다.

- Swiss Professional License를 구매해도 AGPL Wrapper의 저작권 의무가 자동으로 사라지지 않는다.
- Wrapper가 별도 허용을 제공하지 않으면 Wrapper 저작권자의 별도 라이선스 또는 직접 구현이 필요하다.
- 따라서 제3자 Wrapper를 제품 의존성으로 채택하지 않고 공식 C Core와 프로젝트 소유 최소 Binding을 우선 검증했다.

## 결정 Gate

```json
{
  "licenseDecision": "pending",
  "decisionRecord": "license_pending",
  "publicSwissArtifactDeploymentAllowed": false,
  "astro1ProductImplementationAllowed": false
}
```

승격 조건:

- `agpl_strategy_approved`: 사용자가 전체 공개 범위와 소스 제공 절차를 승인
- `professional_license_preferred`: 서명·결제 완료 및 브라우저 WASM/데이터 재배포 질문에 서면 답변 확보
- `swiss_ephemeris_rejected`: 두 경로 모두 제품 방향과 맞지 않아 대안 엔진 재검토
