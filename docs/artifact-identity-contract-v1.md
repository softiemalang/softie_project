# Versioned artifact identity contract v1

이 계약은 사주, 자미두수, tri-system readiness artifact의 provenance identity를 domain payload와 분리한다. 계산·규칙·claim·readiness·activation 의미는 이 계약의 대상이 아니다.

## 필드 의미

각 artifact의 `artifactIdentity`는 다음을 고정한다.

- `generation.baseHead`: materializer가 입력 저장소 상태를 읽은 기준 commit. artifact가 포함된 commit과 같을 필요가 없다.
- `inputs[*].path` / `byteSha256`: materializer가 실제로 읽은 저장소 입력의 repository-relative path와 실제 파일 bytes hash.
- `artifactPayloadSha256`: `artifactIdentity`를 제거한 전체 artifact payload의 canonical JSON + LF hash. identity marker 자체의 순환을 피한다.
- `contractVersion`: 이 identity contract의 버전.
- `materializer.path` / `materializer.version`: artifact를 만든 코드 identity.
- `generation.includedCommit`: 생성 시점에는 알 수 없으므로 반드시 `null`이며, 나중에 artifact를 포함한 commit을 요구하지 않는다.

현재 checkout HEAD는 freshness 판정 대상이 아니다. checker는 baseHead 형식, 입력 bytes, payload identity, contract/materializer identity를 검사한다. 따라서 artifact를 커밋해 HEAD가 바뀌는 것은 stale 사유가 아니다. 입력 파일·계약·materializer가 바뀌면 재-materialization 또는 명시적 migration이 필요하고 checker가 불일치를 보고한다.

## Migration scope

기존 saju/tri-system artifact에는 위 marker만 추가하고 기존 domain fields, verdict, counts, 기존 `contentSha256` 및 기존 hash scope를 재계산 의미 없이 보존한다. `basisHead`/`head`의 기존 값은 historical domain marker로 남기되, freshness의 source of truth는 `artifactIdentity.generation.baseHead`이다. ziwei baseline도 동일 marker를 사용하며 verdict와 조사 내용은 유지한다.
