# deterministic-reading architecture orientation layer

이 문서는 기존 `codex-remote-workflow` 지도와 분리된 두 번째 repository-local
Archify 지도다. 목적은 새 대화나 worker가 현재 deterministic-reading 구조를
빠르게 읽도록 돕는 것이며, 계산·source authority·해석·readiness·activation의
판정기가 아니다.

## 산출물과 경계

- source: [`deterministic-reading.architecture.json`](../architecture/archify/deterministic-reading.architecture.json)
- materialized HTML: [`deterministic-reading.html`](../architecture/archify/deterministic-reading.html)
- receipt: [`deterministic-reading.receipt.json`](../architecture/archify/deterministic-reading.receipt.json)
- selected drift-sync: `node tools/archify-drift-sync.mjs --artifact deterministic-reading`

Archify는 stable `v2.16.0`, revision
`c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de`로 고정되어 있다. source/HTML/receipt
구조와 기존 `last-good` 교체 경계를 재사용하며, `package.json` dependency,
product runtime, remote workflow, credential, operating state, snapshot/apply
경계를 추가하거나 변경하지 않는다. drift-sync의 인자 없는 기본 경로는 기존
remote 지도를 계속 선택한다.

## 지도의 읽기 규칙

공통 영역의 `Reading orientation principles`와 하단 card는 방향성만 표시한다.
현재 계약이 실제로 지키는 다음 경계를 요약하지만 runtime dependency나 새로운
구현 사실로 읽으면 안 된다.

- frozen Deterministic Base의 `FACT`와 이후 interpretation을 분리한다.
- `base_fact`, `literature_claim`, `modern_synthesis`, `ai_inference`,
  `user_experience` evidence kind를 합치지 않는다.
- `supports`와 `conflicts`를 함께 보존하고 충돌은 `preserved_tension`으로
  남긴다.
- `candidate`, `unverified`, `unsupported` 자료로 빈칸을 추정하거나 규칙을
  권위 있는 FACT·semantic basis로 승격하지 않는다.
- 세 체계의 agreement는 vote·majority·term merge가 아니다.

`tag`는 orientation 상태다. `verified`는 해당 node의 코드·contract·test
근거가 확인되었다는 뜻이지 전체 기능의 완료·authority·readiness를 뜻하지
않는다. `pilot`은 bounded consumer 또는 experimental 표현, `blocked`는
해당 authority/integration 경계가 닫혀 있음을 뜻한다. `Mac-only`는 host
경계에만 쓰는 공통 상태 어휘이며 이 domain map에는 붙이지 않았다.

## 실제로 확인된 세 묶음

세 묶음은 의도적으로 대칭적인 이론 목록이 아니라 현재 repository가 직접
확인하는 최소 node와 관계다. 각 node의 repository-relative locator는 source
JSON 안에 있으며, 아래 설명은 그 locator를 요약한다.

- **사주** — `Saju calculation engine`은 현재 implementation policy와 상태
  보존을 나타내며 `verified`는 그 구현 경계에만 해당한다. `Saju evidence
  consumer`는 `pilot`으로, source/locator/lineage 범위의 evidence를 소비하고
  unresolved·conflict를 보존하며 semantic authority를 만들지 않는다.
- **자미두수** — `Ziwei fixed RuleSet calculation`은 고정 RuleSet 기반의
  experimental calculation으로 `pilot`이다. `Ziwei source frontier`는
  외부 oracle·palace binding·source authority가 닫히지 않고 conflict가
  남아 있으므로 `blocked`로 표시한다. 현재 FACT로 보고할 수 있는 범위와
  semantic meaning이 없는 상태를 함께 표시한다.
- **점성학** — `Astrology discrete FACT boundary`는 source-relative
  uncertainty와 discrete FACT 보존 경계를 코드·테스트로 확인할 수 있어
  `verified`다. `Verified astrology adapter`는 dry-run 구현이지만
  `not_connected`·`serviceEligibility=blocked`이므로 `blocked`다. 이는
  점성학 서비스가 연결되었다는 뜻이 아니다.

공통 `Independent system context`는 세 system을 별도 context로 구성하고
가용하지 않은 체계를 합성에서 제외한다. 연결선은 코드와 pipeline이 직접
확인하는 assembly 또는 닫힌 lane만 표시한다. 각 domain boundary 안에서
계산 node와 evidence/frontier node를 함께 보이는 것은 orientation grouping이며
둘 사이의 자동 data flow를 주장하지 않는다. 세 분야 사이에 임의의 이론 관계나
문헌 목록도 추가하지 않았다.

## 재현과 drift-sync

Archify를 저장소 dependency로 설치하지 않고 임시 경로에 동일 revision으로
준비한다.

```text
ARCHIFY_TMP=$(mktemp -d /private/tmp/archify-deterministic-reading.XXXXXX)
git clone https://github.com/tt-a1i/archify.git "$ARCHIFY_TMP/archify"
git -C "$ARCHIFY_TMP/archify" checkout c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de
ARCHIFY_ROOT="$ARCHIFY_TMP/archify"
env NPM_CONFIG_CACHE="$ARCHIFY_TMP/npm-cache" npm --prefix "$ARCHIFY_ROOT" ci --ignore-scripts --no-audit --no-fund
REPO_ROOT=$(git rev-parse --show-toplevel)
ARCHIFY_ROOT="$ARCHIFY_ROOT" node "$REPO_ROOT/tools/archify-drift-sync.mjs" --artifact deterministic-reading
```

선택된 source만 canonical meaningful hash로 비교한다. 변경이 있으면
`validate -> deliver(temporary) -> check -> artifact attestation`을 모두
통과한 뒤 HTML과 receipt를 교체하고, 실패하면 기존 last-good을 보존한다.
source JSON 자체를 자동 수정하거나 다른 artifact를 건드리지 않는다.

## 실제 생성·검증 결과

검증 basis는 현재 HEAD `ba9e5f21b10bb96d57ebbff8024ca19568e00f33`이며, source의
33개 repository locator가 모두 현재 checkout에서 확인됐다.

- source `validate --quality showcase`: 9/9 checks, composition `pass`, errors 0,
  warnings 0.
- materialized HTML `check`: 9/9 checks, composition `pass`, errors 0, warnings 0.
- composition 기준 `properCrossings=0`, `ambiguousCorridors=0`,
  `labelRouteClearanceIssues=0`, `desktopReadabilityIssues=0`, `maxBends=2`다.
  따라서 선택한 3열·공통 경계·상태 card 밀도는 orientation 목적에 충분하다.
  receipt의 browser visual check는 `not_run_by_drift_sync`로 남겨 두었으므로,
  이 결과를 브라우저의 주관적 perceptual review 완료로 확대하지 않는다.
- 최종 source refinement drift-sync는 `status=updated`로 검증된 HTML/receipt를
  설치했다. source
  input은 10,916 bytes, SHA-256
  `233c5d8304d682fac5c5b161490f57f65c8451682c6052e02dc668a60d6a617d`, HTML은
  727,638 bytes, SHA-256
  `30ea5244ad9e78ddcd5512d97adb793d22f8f3856a9e01b1917021aca87aeaf2`다.
- 두 번째 `--artifact deterministic-reading` 실행은
  `status=unchanged`, `meaningful_change=false`,
  `preserved_last_good=true`였다. 기존 remote 지도의 기본 무인자 실행도
  `status=unchanged`, `preserved_last_good=true`로 유지됐다.
- 잘못된 Archify root를 주입한 fail-closed cycle은 exit 1과
  `preserved_last_good=true`를 반환했고, HTML/receipt 두 fingerprint가 그대로
  유지됐다.
- 근거로 선택한 공통·사주·자미두수·점성학 targeted test 43개가 모두 통과했다.

이 결과는 읽기용 architecture orientation layer를 재현·유지할 근거는
제공하지만, 세 분야의 source authority나 제품 runtime readiness를 새로
확정하지 않는다.
