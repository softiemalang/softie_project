# Artifact identity migration evidence v1

기준 checkout HEAD는 `d40f0fe167a020a6c6f576ac45bd180c2989da55`이고 `origin/main`과의 관계는 `0/0`으로 확인했다. 기존 artifact의 고정 HEAD는 saju/tri-system에서 `acb1af9f7ad393cea23d8d9949660c9bcfe37beb`, 현재 미커밋 ziwei baseline은 `d40f0fe...`였다.

## 원인과 해결

기존 checker는 materializer가 기록한 `head`/`basisHead`를 현재 `git rev-parse HEAD`와 동일해야 하는 freshness 조건으로 사용했다. artifact를 포함한 commit은 materialization 이후에 생기므로, artifact를 커밋하는 정상 작업이 artifact 자신을 stale로 만들었다. 새 checker는 현재 HEAD를 보고용 값으로만 출력하고, `artifactIdentity.generation.baseHead`와 실제 `inputs[*].byteSha256`, `artifactPayloadSha256`, contract/materializer version을 검증한다. `includedCommit=null`은 생성 시점 미지 값을 명시하며 later commit을 요구하지 않는다.

tri-system positive evidence는 `generationBaseHead=acb1af9...`, `currentHead=d40f0fe...`, `errors=[]`로 통과한다. 이는 기존 HEAD mismatch가 현재 HEAD 차이만으로 발생하지 않음을 재현한다.

## Migration boundary

saju provenance/readiness/acceptance는 HEAD `acb1af9...`의 기존 domain payload를 유지하고 identity marker만 추가했다. 기존 content/hash 값은 각각 provenance `aebffb...` / `2aa720...`, readiness `e47f0b...` / `ee19d9...`, acceptance `d6540b...` / `18903f...`로 보존된다. tri-system inventory도 기존 verdict·system status·gap payload를 유지하고 marker만 추가했다. ziwei baseline의 `ziwei_readiness_baseline_partial_unverified`, 11 layers, 12 evidence와 source/circular-validation 경계는 유지된다.

## Negative evidence

`test/artifactIdentityContract.test.js`는 generation base 누락/위조, input hash mismatch, contract/materializer version mismatch, 다른 artifact identity 재사용, included commit 요구 재도입, payload identity mismatch, 그리고 현재 HEAD와 독립적인 실제 input 변경을 모두 fail-closed로 검출한다. 계산·규칙·claim·readiness·activation 값은 fixture에서 변경하지 않는다.
