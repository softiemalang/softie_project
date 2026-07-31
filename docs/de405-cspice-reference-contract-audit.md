# DE405 CSPICE Direct/Pair Reference Contract Audit

## 조사 목적

36개 edge sample의 direct target→center와 target/center→SSB 요청 계약을 감사했다.

## Direct/Pair request envelope

모든 호출은 spkez_c, binary64 ET bits, J2000, NONE, km 및 km/s 계약을 사용했다.

## Kernel set 및 process 상태

360개의 fresh process run에서 kernel inventory와 query 전후 상태를 기록했다.

## Fresh-process 및 query-order 반복

Sequence A–E를 각각 2회 실행했다.

## Output extraction 및 단위

Native response bits와 JSON round-trip bits를 비교했다.

## Audit pair recomposition

P1–P4 재합성에서 direct mismatch를 확인했다.

## 계약이 동일해도 남은 residual

{"contract_equivalent_direct_pair_residual_persists":36}

## 관측 경계

요청, process, kernel, error, output 계약만 확인했다. CSPICE 내부 segment route, selected record, accumulator 순서는 관측하지 않았다.

selection_unresolved는 1,701이며 tolerance, canonical selection, active transition, scientific approval, production integration은 변경하지 않았다.
