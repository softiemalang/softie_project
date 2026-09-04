# Senior-reviewer Luna → deterministic Git Gate 운영 계약 v1

상태: 수동 실행 전용. 이 문서는 `softie_project`의 기존 작업 흐름에
change-gate 출고 단계를 최소한으로 기록한다. 기존 Luna 책임 구조, Profiles,
routing/registry, Native Codex, production activation, 그리고 작업자의
권한을 변경하지 않는다.

## 운영 순서

1. 작업자는 실제 변경과 테스트를 완료하고, 원본 checkout의 HEAD와 dirty
   상태를 기록한다. 기존 dirty/unrelated 변경은 scope에 포함하지 않는다.
2. `change-gate-review-packet`이 requirements, 외부 patch, test report,
   scope-preservation을 `change-review-packet-v1`로 고정한다. packet의
   candidate path와 patch path는 정확히 일치해야 한다.
3. `hermes-quality-reviewer`가 기존 `senior-reviewer` Luna OAuth 경로로
   immutable packet snapshot을 single-attempt 입력으로 소비한다. reviewer는
   terminal, filesystem, Git을 사용하지 않으며 `quality-review-result-v1`의
   `PASS` / `FAIL` / `ESCALATE`와 `approved_scope`만 반환한다.
4. strict validator를 통과한 Luna `PASS` handoff만
   `change-gate-git prepare`에 전달한다. `approved_scope`는 candidate path
   set과 정확히 같아야 하며, 별도 authorization 단계나 모델 실행 단계는
   없다.
5. `change-gate-git validate` 후 `execute --execute --push`를 실행한다.
   Gate는 disposable clone에서 승인 patch만 3-way 없이 적용하고, 승인
   경로만 `git add -- <approved paths>`로 stage한 뒤 commit하고 non-force
   push한다.
6. push 후 commit SHA, remote ref SHA, remote의 full SHA를 직접 비교한다.
   세 값이 일치하고 source checkout의 HEAD/dirty fingerprint가 준비 시점과
   같을 때만 출고를 완료로 기록한다.

## 데이터·범위 경계

- Luna 입력은 `public`, `synthetic_benchmark`, `deidentified` packet만
  허용한다. confidential/private diff, credential, remote secret은
  provider로 보내지 않는다.
- source checkout, `.git`, unrelated dirty/untracked 파일은 reviewer와
  Git execution clone의 승인 범위에 포함하지 않는다. 원본 checkout은
  deterministic gate가 수정하지 않는다.
- reviewer의 `PASS`는 품질 검수 결과이며 production readiness, release
  approval, main worker 지정이 아니다.

## Fail-closed 반환

source HEAD/status, patch hash, scope, remote URL 또는 remote-before SHA가
변경되거나, patch 적용 충돌·예상 밖 파일·commit/push 오류·full-SHA parity
불일치가 발생하면 즉시 `STOP|<code>`로 반환한다. conflict 해결, scope 확대,
reset, rebase, force-push, retry, fallback으로 진행하지 않는다.

## 출고 증적

완료 보고에는 다음만 기록한다.

- Luna handoff의 schema, model, verdict, approved scope
- validator와 Git Gate의 실제 결과
- commit SHA와 remote full SHA equality
- source HEAD/dirty 보존 여부와 변경 파일 목록
- private/confidential data 미전송 여부
