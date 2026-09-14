# Archify architecture orientation layer

이 파일은 현재 `softie_project` revision을 근거로 한 repository-local
architecture orientation layer다. [Archify upstream](https://github.com/tt-a1i/archify)의
stable `v2.16.0` (`c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de`)에 pin하고
`architecture` schema와 `showcase` 검증만 사용한다. 이 layer는 새 대화나
worker가 구조를 빠르게 읽는 용도이며, 프로젝트 dependency, runtime hook, CI,
credential, operating state, snapshot boundary, apply 동작은 추가하거나
변경하지 않는다.

산출물은 각 지도별 source/HTML/receipt와 drift-sync 실행기다.

- `docs/architecture/archify/codex-remote-workflow.architecture.json`: source specification
- `docs/architecture/archify/codex-remote-workflow.html`: Archify self-contained delivery
- `docs/architecture/archify/codex-remote-workflow.receipt.json`: tool/spec/artifact/검증 receipt
- `docs/architecture/archify/deterministic-reading.architecture.json`: source specification
- `docs/architecture/archify/deterministic-reading.html`: Archify self-contained delivery
- `docs/architecture/archify/deterministic-reading.receipt.json`: tool/spec/artifact/검증 receipt
- `docs/architecture/archify/opencode-lab.architecture.json`: disposable Lab source specification
- `docs/architecture/archify/opencode-lab.html`: disposable Lab self-contained delivery
- `docs/architecture/archify/opencode-lab.receipt.json`: disposable Lab tool/spec/artifact/검증 receipt
- `tools/archify-drift-sync.mjs`: stable artifact의 최소 drift-sync 실행기

## 사실성 경계

다이어그램의 repository evidence는 현재 Git revision
`9759c2213a62edacbff1eee908f52a5fac9ba714`에 고정되어 있다. 각 component에는
현재 `AGENTS.md`, remote 계약 문서, remote workflow 구현, 또는 delegated-worker
계약의 repository-relative locator만 넣었다.

`Console delegated lane`은 `external` component로 표시했다. 이 checkout에는
Console 구현 파일이나 connector가 없으므로, 다이어그램은 현재 repository가
확인하는 “delegated output은 advisory이고 parent-owned”라는 계약만 표현한다.
Console이 이 bridge를 직접 호출한다거나 Mac shell 권한을 가진다는 관계는
주장하지 않는다. 해당 연결선은 transport가 아니라 권한/evidence 경계를
구분하는 dashed 관계다.

### 상태 표기

source JSON의 component `tag`와 `Status key` card는 orientation을 위한 표시일
뿐이며, 완료·readiness·authority 판정의 권위가 아니다. `verified`는 현재
코드와 canonical contract/test locator 또는 receipt 범위에서 구현·검증 근거가
확인된다는 뜻이고, 그 자체로 전체 workflow나 제품 동작의 완료를 뜻하지
않는다. `pilot`은 이 지도에서만 확인되는 orientation 또는 외부 표현이고,
`blocked`는 해당 관계를 뒷받침하는 repository 근거가 없어 주장하지 않는다는
뜻이다. `Mac-only`는 Mac coordinator/host 실행 경계이며 결과 상태가 아니다.

현재 표기는 Mac source와 restricted bridge를 `Mac-only`, 고정 명령 lane과
metadata admission·snapshot/allowlist·Tab baseline·Tab execution·verification·
safe-apply를 `verified`, Console delegated lane을 `blocked`, product runtime을
`pilot`으로 표시한다. Console lane은 advisory contract만 남아 있고 in-repo
구현/connector가 없으므로 직접 bridge 관계를 표시하지 않는다. product runtime은
이 orientation layer가 제품 동작을 검증하지 않고 경계만 보여준다는 의미로
`pilot`이다. 이 상태 표시는 기존 source/receipt 구조와 drift-sync 판정을
대체하지 않으며, 코드·테스트·canonical contract가 계속 권위 있는 근거다.

현재 코드에서 확인한 핵심 구조는 다음과 같다.

- Mac checkout이 source of truth이자 유일 coordinator다. Codex Desktop lane은
  `npm run remote:metadata -> remote:refresh -> remote:setup/status -> work ->
  remote:verify -> remote:apply` 순서를 사용한다.
- bridge의 공개 작업은 `metadata`, `refresh`, `setup`, `status`, `verify`,
  `apply`뿐이다. Tab worker는 local checkout 안에서만 work/test/build/dev
  server를 수행하며 Mac-wide SSH/shell, credential, operating state에 접근하지
  않는다.
- metadata는 repository-relative sanitized manifest이고, refresh는 동일 source
  fingerprint admission을 요구한다. refresh/verify는 active development-console
  snapshot exclusion boundary를 재사용한다.
- portable snapshot allowlist는 다음 정확히 8개다.

  1. `.github/workflows/astrology-jplephem-equivalence-v1.yml`
  2. `.github/workflows/de405-legacy-native-matrix.yml`
  3. `.github/workflows/de405-linux-architecture-evidence.yml`
  4. `.github/workflows/de405-linux-producer-v0.yml`
  5. `api/provider/asia-seoul.tzif`
  6. `src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js`
  7. `src/interpretationPrep/sajuLineageReadingGrammar.js`
  8. `src/scheduler/assets/scheduler-atmosphere-v4.jpg`

- Tab snapshot은 remote가 없는 독립 local-Git baseline으로 설치된다. verify는
  committed target delta, `npm run test:source-local`, `npm run build`, loopback
  dev-server smoke를 요구한다.
- apply는 source/target attestation과 Mac base를 다시 확인하고 검증된 path만
  쓴다. source drift, dirty overlap, target drift, base mismatch, protected path,
  conflict는 fail-closed다.

주요 locator는 specification에 직접 들어 있고, 원문은 다음에서 확인할 수
있다.

- `AGENTS.md:12-18, 20-35, 61-67`
- `docs/development/codex-remote-interface.md:3-22`
- `docs/development/codex-remote-workflow.md:3-19, 21-79`
- `tools/sanitized-repository-metadata.mjs:9-21`
- `tools/codex-remote-workflow.mjs:39-55, 111-122, 275-295, 807-890, 943-980, 1116-1205, 1259-1308`
- `test/codexRemoteWorkflowInterface.test.js:38-86`
- `test/sanitizedRepositoryMetadata.test.js:19-30, 45-124, 126-147`
- `docs/subagent-evidence-contract-v0.md:131-171`

## 재현 명령

Archify는 repository dependency로 설치하지 않는다. 아래처럼 임시 checkout에
고정 revision을 준비하고, npm cache와 `node_modules`도 임시 경로에 둔다.

```text
ARCHIFY_TMP=$(mktemp -d /private/tmp/archify-pilot.XXXXXX)
git clone https://github.com/tt-a1i/archify.git "$ARCHIFY_TMP"
git -C "$ARCHIFY_TMP" checkout c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de
ARCHIFY_ROOT="$ARCHIFY_TMP/archify"
env NPM_CONFIG_CACHE="$ARCHIFY_TMP/npm-cache" npm --prefix "$ARCHIFY_ROOT" ci --ignore-scripts --no-audit --no-fund
REPO_ROOT=$(git rev-parse --show-toplevel)
node "$ARCHIFY_ROOT/bin/archify.mjs" doctor
ARCHIFY_ROOT="$ARCHIFY_ROOT" node "$REPO_ROOT/tools/archify-drift-sync.mjs"
```

`package.json`에 Archify script나 dependency를 추가하지 않았으므로, 위 명령은
기존 product install/runtime과 독립적이다. drift-sync는 source JSON의
canonical semantic hash(키 순서와 JSON whitespace는 무시)를 비교한다. 실제
architecture 내용, evidence revision, stable pin, 또는 last-good integrity가
달라질 때만 후보를 만들고, `validate -> deliver(temporary) -> check`를 모두
통과한 뒤 HTML과 receipt를 교체한다. 실패하면 기존 HTML과 receipt를 그대로
보존한다. source JSON 자체를 자동으로 재작성하거나 bridge/runtime을 호출하지
않는다.

## stable 승격과 실제 갱신 cycle 결과

- Archify stable `2.16.0`, upstream revision
  `c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de`로 재생성했다. stable schema에
  없는 source metadata `provider`와 `link_mode`만 제거했으며, architecture
  관계·source locator·권위 경계는 유지했다.
- `validate --quality showcase`: 9/9 checks passed, composition pass, errors 0,
  warnings 0.
- delivered HTML의 정적 `check`: 9/9 checks passed, errors 0, warnings 0.
- specification: 10,684 bytes,
  `1a42a650f456e9518bdfff1303613e0402f7093cac0e73f315cccfc8c451c7ad`.
- delivered HTML: 727,753 bytes,
  `51ccd19a88a955a02678490f27627b97c8d3a95c2bba7da3af2d48376657cc8a`.
- repository source evidence: 29 references, current revision과 일치.
- stable promotion cycle: `status=updated`, reasons는 `meaningful_architecture_change`
  와 `archify_pin_changed`였다.
- 상태 tag/status key 추가 cycle: `status=updated`, reason은
  `meaningful_architecture_change`였고 위 source/HTML hash로 교체했다. 다음
  실행은 `status=unchanged`, `meaningful_change=false`,
  `preserved_last_good=true`였다.
- positive drift cycle: 임시 subtitle 변경에서 `status=updated`,
  `meaningful_change=true`를 확인했고, 원복 후 artifact hash가 stable baseline으로
  돌아왔다.
- failure cycle: 임시 invalid schema에서 exit 1, `archify_validate_failed`,
  `preserved_last_good=true`를 확인했다. HTML/receipt는 변경되지 않았다.
- repeat cycle: `status=unchanged`, `meaningful_change=false`,
  `preserved_last_good=true`로 확인했다.
- 선택적 Chrome visual-check는 Chrome DevTools SIGABRT로 완료되지 않아 browser
  perceptual review는 `not_completed`다. 정적 schema/render/composition 검증만
  완료된 것으로 기록한다.

## 유지 판단

이 저장소에서는 유지할 가치가 있다. 현재 remote workflow의 두 work lane,
Mac-only coordinator, restricted bridge, snapshot/allowlist, verification,
fail-closed apply와 disposable OpenCode Lab의 실행·격리·자원 전환 경계를
각각 source-evidence-linked artifact로 재생성할 수 있고, 실제 stable delivery와
drift no-op 검증도 완료되었다. 유지 범위는 각 지도별 세 산출물, drift-sync
실행기, 관련 orientation 문서의 갱신으로 제한한다. Archify를 package dependency, runtime, CI, daemon, 또는
새 remote infrastructure로 승격하는 것은 이 파일럿의 재현성이나 현재 계약에
필요하지 않으므로 하지 않는다.
