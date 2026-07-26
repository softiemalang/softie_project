# Astrology Swiss WASM Spike Report

기준일: 2026-07-26
범위: 로컬 기술 평가 전용. 제품 `src/`와 연결하지 않았고 Swiss 산출물은 Git에서 제외했다.

## 판정

- 공식 Swiss C Core의 최소 WebAssembly Binding 빌드: `pass`
- 동일 경로 재빌드 재현성: `pass`
- requested/effective Ephemeris mode 구분: `pass`
- Moshier fallback 탐지: `pass`
- Placidus/Porphyry fallback 구분: `pass`
- 제품 채택: 라이선스 결정 전 `blocked`

## Source 및 Build provenance

| 항목 | 값 |
| --- | --- |
| 공식 저장소 | `https://github.com/aloistr/swisseph` |
| Swiss commit | `59ac051b5a5812c684973ca0fcedb1c8c3e9c5dc` |
| Swiss commit date | 2026-06-19 16:15:03 +0200 |
| Engine version | `2.10.03` |
| Emscripten SDK repo commit | `2be309c35198053e5211e25686b136ad50b9b360` |
| Emscripten | `6.0.4` |
| Emscripten compiler commit | `fe5be6afdff43ad58860d821fcc8572a23f92d19` |
| Python | `3.13.13` |
| Host | Apple Silicon macOS |

Emscripten은 프로젝트 의존성으로 설치하지 않고 `/tmp/softie-astro05-toolchain/` 아래에만 설치했다. 공식 설치 절차는 [Emscripten SDK 문서](https://emscripten.org/docs/getting_started/downloads.html)를 따랐다.

## 최소 Binding

파일:

- `spikes/astrology-swiss-wasm/native/swiss_spike.c`
- `spikes/astrology-swiss-wasm/scripts/build-swiss.sh`
- `spikes/astrology-swiss-wasm/scripts/run-smoke.mjs`

노출 함수:

- `astro_spike_version`
- `astro_spike_init`
- `astro_spike_julday`
- `astro_spike_calculate_body`
- `astro_spike_calculate_houses`

사용한 Swiss C 단위:

- `swedate.c`
- `swehouse.c`
- `swejpl.c`
- `swemmoon.c`
- `swemplan.c`
- `sweph.c`
- `swephlib.c`
- `swecl.c`
- `swehel.c`

핵심 컴파일 설정:

```text
-O2
-sMODULARIZE=1
-sEXPORT_ES6=1
-sENVIRONMENT=web,node
-sALLOW_MEMORY_GROWTH=1
--preload-file sepl_18.se1@/ephe/sepl_18.se1
--preload-file semo_18.se1@/ephe/semo_18.se1
```

정확한 실행 명령은 Build Script 자체를 provenance로 사용한다.

## Artifact fingerprint

| 파일 | bytes | SHA-256 | gzip bytes |
| --- | ---: | --- | ---: |
| `swiss-spike.mjs` | 65,742 | `812ead5aaeaca552ba465595b42ee959ffb3e224d428afde2f7afe14164c882f` | 18,530 |
| `swiss-spike.wasm` | 385,469 | `bcf9303cacde2451ae7e6c934b338259e560fabefe7f6cb5a7f89763ba9f551b` | 186,966 |
| `swiss-spike.data` | 1,788,832 | `0bd5378a32a7c39ee513650d7b2f732c7adcb2a9326ae62c52925f329f072ab3` | 1,662,638 |

데이터 원본:

| 파일 | bytes | SHA-256 |
| --- | ---: | --- |
| `sepl_18.se1` | 484,061 | `ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66` |
| `semo_18.se1` | 1,304,771 | `1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7` |

Brotli CLI가 로컬에 없어 Brotli 크기는 측정하지 않았다.

## 재현성

- 같은 source/toolchain/flags와 같은 output path로 두 번 빌드했을 때 `.mjs`, `.wasm`, `.data` SHA-256이 모두 일치했다.
- 서로 다른 output directory로 빌드하면 WASM과 data는 같지만 glue `.mjs`에 절대 output path가 들어가 hash가 달라졌다.
- 따라서 재현 빌드는 고정 컨테이너 또는 고정 상대 output path를 사용해야 한다.

## Smoke fixture

실제 사용자 정보가 아닌 합성 fixture:

```text
UTC: 2000-01-01T12:00:00Z
JD UT: 2451545.0
location: synthetic 37.5665 N, 126.978 E
```

관측:

| body | longitude | longitude speed | retrograde | effective flags |
| --- | ---: | ---: | --- | ---: |
| Sun | 280.3689186698997 | 1.019434162943553 | false | 258 |
| Moon | 223.32375144635085 | 12.021303766986243 | false | 258 |
| Mercury | 271.88927704616657 | 1.55625812130255 | false | 258 |
| True Node | 123.95402283857794 | -0.054738482684248 | true | 258 |

이 수치는 연결 Smoke일 뿐 Golden Fixture 또는 외부 검증 결과가 아니다.

## Ephemeris fallback

요청 flags는 `SEFLG_SWIEPH | SEFLG_SPEED = 258`이다.

- 데이터 정상: effective flags `258`, 오류 없음
- `/missing/` path: effective flags `260`
- `260`은 `SEFLG_MOSEPH | SEFLG_SPEED`
- 오류: Swiss 파일을 찾지 못해 Moshier를 사용했다는 문자열 반환

따라서 다음 삼중 검사로 fallback을 실패 처리할 수 있다.

1. `effectiveFlags & ephemerisMask`가 requested mode와 같은지
2. 오류 문자열이 비어 있는지
3. 파일 fingerprint가 Activation Registry와 같은지

결과가 계산되었더라도 위 조건이 다르면 정규화하지 않는다.

## Placidus 및 고위도

일반 위도:

- requested `P`
- return code `0`
- ASC, MC, 12 cusp 반환

북위 80도와 남위 80도:

- requested `P`
- return code `-1`
- 오류 `within polar circle, switched to Porphyry`
- 반환 cusp가 명시적으로 요청한 `O` 결과와 일치

Swiss Programmer's Manual도 극권 밖에서 Placidus/Koch 계산 불가와 오류 반환을 설명한다. [공식 Programmer's Manual](https://www.astro.com/swisseph/swephprg.htm)

제품 정책:

- `returnCode < 0`이면 ASC/MC/house component를 unavailable로 둔다.
- 반환된 Porphyry cusp를 Placidus로 저장하지 않는다.
- `houseSystemEffective`를 추정하지 않고 오류 및 비교 결과를 provenance로 남긴다.

## 남은 제약

- 라이선스 결정 전 Swiss 산출물 공개 배포 금지
- 이번 fixture는 외부 정확도 Gate가 아님
- WASM 메모리·장기 반복 호출·여러 chart 동시성은 미검증
- 데이터 전체 날짜 범위와 추가 행성 파일 loading 정책은 Astro-1에서 설계
