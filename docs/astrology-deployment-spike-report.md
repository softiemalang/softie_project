# Astrology Deployment Spike Report

기준일: 2026-07-26

## 안전 경계

`license_pending` 상태이므로 Swiss WASM과 Swiss Ephemeris data는 Vercel에 올리지 않았다.

- 실제 Swiss build: 로컬 Vite dev 및 local production preview까지만 검증
- Vercel Preview: 동일 loading 형태와 유사 payload 크기의 라이선스 중립 probe만 배포
- 제품 route, 메뉴, Interpretation Prep pipeline과 연결하지 않음
- Production 배포 없음

## Vite local

환경:

- Vite `5.4.21`
- lazy dynamic import
- `.wasm` 및 `.data`는 별도 asset
- 초기 앱 번들에서 Swiss 모듈을 import하지 않음

결과:

| 항목 | 결과 |
| --- | --- |
| local dev | pass |
| production build | pass |
| local preview | pass |
| direct URL | pass |
| reload | pass |
| Safari | pass |
| in-app Chromium dev | pass |
| Chromium production preview | 미완료 |

Vite는 `public/` 안의 JavaScript를 정적 import 대상으로 허용하지 않았다. 해결은 runtime URL을 만들고 `import(/* @vite-ignore */ runtimeUrl)`로 lazy-load하는 방식이었다.

Local preview 응답:

- actual Swiss local URL: `http://127.0.0.1:5188/swiss-local.html`
- asset base: `/swiss/`

| asset | status | Content-Type |
| --- | --- | --- |
| HTML | 200 | `text/html` |
| glue `.mjs` | 200 | `text/javascript` |
| WASM | 200 | `application/wasm` |
| `.data` | 200 | 명시 타입 없음 |

`.data`는 Emscripten fetch에서 byte payload로 읽혔으나, 배포 시에는 `application/octet-stream`을 명시하는 편이 안전하다.

실제 Swiss local browser 계산은 Engine `2.10.03`, Sun effective flags `258`, Placidus return code `0`을 표시했다.

## Vercel Preview

Preview:

- deployment id: `dpl_87tRjV3JSQY9dc7bVb9C9ovpuPea`
- protected URL: `https://project-fp5ie-9yuwlzo3p-softiemalangs-projects.vercel.app/`
- inspector: `https://vercel.com/softiemalangs-projects/project-fp5ie/87tRjV3JSQY9dc7bVb9C9ovpuPea`
- target: Preview
- Production 승격: 없음
- 접근: Vercel Preview 보호 적용
- 검색 노출: `noindex`

배포 내용은 다음 라이선스 중립 asset뿐이다.

- 229-byte C probe WASM
- 484,078-byte zero-filled shape payload
- 1,251,136-byte zero-filled shape payload
- loader HTML/JS/CSS

Swiss 소스, Swiss WASM, Swiss data는 포함하지 않았다.

Vercel 결과:

| 항목 | 결과 |
| --- | --- |
| WASM | 200, `application/wasm` |
| shape `.bin` | 200, `application/octet-stream` |
| cache | `public, max-age=0, must-revalidate` |
| SPA rewrite 간섭 | 없음 |
| protected Preview direct URL | pass |
| Chromium cold/warm load | pass |
| Safari cold/warm load | pass |
| Safari responsive iPhone preset | pass |
| CSP 추가 요구 | 관측 없음 |
| cross-origin 문제 | 관측 없음 |

원격 fingerprint는 로컬과 일치했다.

| asset | SHA-256 |
| --- | --- |
| neutral probe WASM | `39c5486e9ca3d4c1bb89493a6e984a8eb1902e40b87ae2797ca5a6c8dea5b5bd` |
| planet-shaped payload | `a9813c17d65e3cd1da7db3fd05d5c76ddd3c83045d8bee2f6ff651692ba93459` |
| moon-shaped payload | `129e2ffd9694ba8548e92a491170f449c448cb7c27aa2a4d0ba7939e1be4402b` |

## 요청 수와 cache

Probe 첫 계산에는 HTML 외에 JS, CSS, WASM, 2개 data-shaped asset이 필요했다. 실제 Emscripten 구성은 glue module, WASM, preloaded data의 3개 핵심 계산 요청을 만든다.

현재 Preview cache header는 재검증을 요구한다. Astro-1에서는 content hash가 포함된 immutable asset URL과 다음 원칙을 검토한다.

- hashed WASM/data: 장기 immutable cache
- HTML/manifest: 짧은 cache 또는 revalidate
- runtime이 기대하는 SHA-256과 응답 SHA-256 일치 필수

## 배포 Gate 판정

```json
{
  "viteLocalActualSwiss": "pass",
  "localProductionPreviewActualSwiss": "pass",
  "vercelPreviewTransportNeutral": "pass",
  "vercelPreviewActualSwiss": "not_run_license_blocked",
  "vercelPreviewGate": "fail"
}
```

Gate schema가 `pass | fail`만 허용하므로 실제 Swiss artifact를 Vercel에서 검증하지 않은 현재 상태는 `fail`로 기록한다. 라이선스 승인 뒤 exact artifact를 Preview에 올려 fingerprint, MIME, Safari/Chromium 계산을 다시 확인해야 `pass`로 승격할 수 있다.
