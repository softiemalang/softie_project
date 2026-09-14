# Disposable OpenCode Lab

이 문서는 기존 `softie_project`, Codex Remote SSH, Console 운영환경과 분리한
Galaxy Tab 전용 OpenCode 실험환경의 canonical repository note다. 이 Lab은
disposable execution surface이며, 제품 runtime·기존 remote bridge·Console
credential/state·snapshot/apply 동작의 일부가 아니다.

## Authority and scope

이 문서와 별도 Archify 지도는 orientation과 재현 경계만 설명한다. 완료,
readiness, source authority, 제품 안전성의 판정은 이 문서나 지도에서 승격하지
않고 실제 OpenCode server 응답, 실행 결과, 프로젝트 계약, 테스트를 우선한다.
Lab의 유일한 persistent root는 Galaxy Tab의 다음 경로다.

`/data/data/com.termux/files/home/opencode-lab`

이 경로는 작업 시작 전 존재하지 않았고, 새 root를 mode `0700`으로 만들었다.
기존 `/data/data/com.termux/files/home/codex-remote-development`와 그 아래
`softie_project`는 Lab에 bind하지 않았다. Lab workspace는
`/opencode-lab/workspace`로 보이는 합성 workspace이며 기존 저장소의 clone이나
Mac 파일의 snapshot이 아니다.

## Execution plane

- Native Termux에서는 기존 `proot`와 이미 설치된 Ubuntu rootfs를 runtime base로
  사용한다. `proot-distro` 설치, 기존 rootfs package 설치, 기존 `agy`나 Console
  파일의 사용은 수행하지 않았다.
- Lab payload는 명시적인 Lab root 아래에만 둔다. Node `v24.21.0` Linux arm64
  archive는 공식 Node 배포물의 SHA-256
  `724282c3b43aec998aa9527380465b45d229e021b58035f5f4f63095eabfe5d5`를
  확인한 뒤 `runtime/node`에 설치했다.
- OpenCode는 공식 npm package `@opencode/cli@2.0.3`와
  `@opencode/cli-linux-arm64@2.0.3`를 Lab 안에 `--ignore-scripts`로 설치하고
  arm64 package의 공식 binary를 `app/bin/opencode`로 선택했다. 확인 결과는
  `opencode v2.0.3`이다.
- raw proot 실행은 Lab root와 전용 `guest-root`, `guest-home`, `guest-tmp`,
  `guest-run`, `guest-var-tmp`, `guest-mnt`, `guest-media`만 bind한다. Bun
  runtime compatibility를 위해 `/proc` 전체와 `/dev/null`, `/dev/zero`,
  `/dev/random`, `/dev/urandom`만 명시적으로 bind한다. Mac filesystem,
  Codex checkout, Console archive, credential directory는 bind하지 않는다.
- 최종 확인된 Lab controller와 launcher/config의 SHA-256은 다음과 같다.
  값은 내용이 아니라 설치된 파일의 식별자다.

  - `bin/labctl`: `89429accf4557d240a1761f057cb7fe0696abb00a92952f7342381586e405cbd`
  - `bin/guest-opencode`: `b706870d5a04ab0c376da07bb18612a4083d5402165a28e470506b0040f90a4b`
  - `opencode.json`: `2c9b3791340b824c0c26aec4e7589c68f59a0f2b3e3eda0c901ddfb79fb3fae0`

## Client and server boundary

OpenCode `serve`는 Galaxy Tab loopback `127.0.0.1:4097`에만 listen한다.
Mac Chrome은 기존 SSH host key와 dedicated key를 사용한 명시적 local port
forward `127.0.0.1:18497 -> Tab 127.0.0.1:4097`로 접속했다. 이 SSH channel은
remote shell을 실행하지 않는 `-N` forwarding-only channel이며, Mac에서
OpenCode workspace/tool을 실행하지 않는다.

OpenCode Desktop에도 `Galaxy Tab OpenCode Lab`이라는 별도 server entry를
등록해 `v2.0.3 · opencode`가 표시되는 것을 확인했다. 실제 task smoke는
Desktop이 기존 local/remote project를 잘못 선택하지 않도록 Chrome Web client의
Lab workspace에서 수행했다. 따라서 Desktop entry는 `pilot` 관찰 결과이고,
Chrome Web session은 `verified` 실행 결과다.

## Lab-local configuration and privacy boundary

`bin/guest-opencode`는 `HOME=/root`, `XDG_CONFIG_HOME=/opencode-lab/config`,
`XDG_DATA_HOME=/opencode-lab/data`, `XDG_CACHE_HOME=/opencode-lab/cache`,
`NPM_CONFIG_CACHE=/opencode-lab/cache/npm`, `OPENCODE_CONFIG=/opencode-lab/config/opencode.json`,
`OPENCODE_CONFIG_DIR=/opencode-lab/config/custom`으로 Lab 전용 namespace를
만든다. auto-update, default plugin, LSP download, Claude Code integration,
auto-share는 끈다. `opencode-lab-v1` marker와 path-overlap guard도 controller가
확인한다.

Lab config의 기본 model은
`opencode/muse-spark-1.3-contributor-free`이고 session smoke에서는
`Muse Spark 1.3 Free · Xhigh`가 실제 선택·표시됐다. provider metadata에는
Lab-local `public` endpoint가 표시됐으며 Mac credential이나 기존 Console API
credential을 복사하지 않았다. Lab 안에 user auth file을 만들거나 저장하지
않았다. Spark Free/Contributor endpoint에 개인·실서비스·credential data를
보내지 않고 synthetic prompt만 사용한다. 이 모델의 공식 안내에는 free
contributor prompt/completion이 향후 Meta model training에 사용될 수 있다고
되어 있으므로 이 경계는 필수다.

`opencode.json`은 default deny를 바탕으로 external directory, task, credential
유사 파일, `.ssh`를 거부한다. 읽기와 edit는 Lab workspace 내부만 대상으로
허용하고, bash는 기본 `ask`이며 smoke에 필요한 `pwd`, 목록, synthetic `printf`
등만 명시적으로 허용한다. `ssh`, `scp`, `sftp`, `proot-distro`, `termux-*`,
`git push`, `git commit`, destructive `rm`은 deny다. 이 permission layer는
기존 repository `opencode.json`을 변경하거나 대체하지 않는다.

## Lifecycle and resource handoff

`bin/labctl` public operations are `install`, `start`, `stop`, `restart`,
`status`, `health`, and Lab-scoped `exec`. `start`는 server PID/process-group을
Lab 전용 state에 기록하고 authenticated `/api/health`를 확인한다. `stop`은
그 process-group만 종료하며 wrapper만 남기지 않도록 child proot까지 종료한다.
State와 server password는 Lab root의 mode `0600` 파일이며 기존 credential/state와
공유하지 않는다.

메인 SSH 작업이 필요하면 다음처럼 Lab workload만 멈춘다.

`labctl stop -> status=stopped -> main SSH work -> labctl start -> health`

이 순서는 Tab의 기존 SSH daemon이나 Codex Remote checkout을 중지하지 않고
OpenCode server/workspace/tool 자원만 반환·재점유한다. Lab을 stop한 상태가
기본 종료 상태다.

## Verified smoke evidence

실제 task prompt와 tool smoke는 Tab server를 SSH tunnel 뒤에서 Chrome Web UI로
조작했다. 보조적인 health/session/file/lifecycle 확인에는 제한된 SSH/API
read-only observation을 사용했으며, Mac에서 workspace나 tool process를 직접
실행하지 않았다.

1. `/api/health`가 `{"healthy":true,"version":"2.0.3"}`를 반환했다.
2. Chrome Web client에서 `/opencode-lab/workspace`를 선택하고
   `OPENCODE_LAB_UI_OK confirmation request` session을 만들었다. session metadata는 model id
   `muse-spark-1.3-contributor-free`, provider `opencode`, variant `xhigh`,
   directory `/opencode-lab/workspace`였다.
3. Chrome prompt `Reply with exactly OPENCODE_LAB_UI_OK and do not use tools.`에
   대해 UI가 `OPENCODE_LAB_UI_OK`를 반환했다. 화면과 API metadata 모두
   `Muse Spark 1.3 Free · Xhigh`를 표시했다.
4. 같은 Web session에 synthetic shell/file prompt를 보내 shell 한 번으로
   `ui-shell-smoke.txt`를 만들고 file tool로 읽었다. 화면에 `Used 2 셸, 읽기`와
   `OPENCODE_LAB_UI_SHELL_OK`가 표시됐다. Tab에서 파일 mode `0600`, size `25`,
   SHA-256 `0b32982569e006091d8dc0789b51b0bbcd43518ee3502494452026482ec69c8a`를
   재확인했다.
5. `stop` 뒤 Lab process가 없고 `127.0.0.1:4097`이 닫힌 것을 확인했다.
   `start` 뒤 새 PID, authenticated health, 기존 session metadata와
   `ui-shell-smoke.txt`를 재조회했다. Chrome reload 후에도 이전 응답과 workspace가
   보였다.
6. 실행 중·중지 후 모두 기존 `codex-remote-development/softie_project`의
   `git status --short --untracked-files=all`은 비어 있었다. 기존 운영 파일과
   credential 내용은 읽거나 변경하지 않았다.

이 결과에서 `verified`는 위 smoke와 path/config/process 경계가 확인됐다는
뜻이다. 실제 개인 데이터 보호, 모든 future model/tool, production readiness,
Desktop의 모든 project-selection 조합은 이 smoke에서 승격하지 않으며
`pilot` 또는 `blocked`로 별도 표시한다.

## Official references

- [OpenCode server](https://opencode.ai/docs/server/)
- [OpenCode CLI](https://dev.opencode.ai/docs/cli/)
- [OpenCode configuration](https://opencode.ai/docs/config/)
- [OpenCode providers](https://opencode.ai/docs/providers)
- [OpenCode Zen models and terms](https://dev.opencode.ai/docs/zen)
