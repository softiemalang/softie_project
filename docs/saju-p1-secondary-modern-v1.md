# Saju P1: 간여지동 secondary rule admission

최종 bounded 판정은 **modern/secondary interpretation rule admission 가능**이다. 등록 대상은 연구용 rule record이며, 엔진 코드·adapter·UI에는 등록하지 않았다.

## 고정한 rule

직접 확인한 [천명선생 공개 페이지](https://insight6348.tistory.com/365)는 간여지동의 일반 해석 포인트를 강한 주관성·집중력·고집, 때로는 융통성 부족으로 설명하고, 다음 12개 일주를 명시한다.

`갑인, 을묘, 병오, 정사, 무진, 무술, 기미, 기축, 경신, 신유, 임자, 계해`

페이지의 넓은 “같은 오행 또는 같은 기운” 설명에서 값을 추가로 추론하지 않고, 위 목록만을 정확한 predicate로 고정했다.

```text
/raw/pillars/day/referenceValue ∈ {
  갑인, 을묘, 병오, 정사, 무진, 무술, 기미, 기축,
  경신, 신유, 임자, 계해
}
```

`/raw/pillars/day/status === calculated`이고 `candidates`가 하나일 때만 평가한다. 그 외에는 `unresolved`로 보존한다. 계절·강약·십신·지지 관계·격국·용신·십이운성·배우자·성별 조건은 추가하지 않는다.

## Scope와 provenance

이 rule은 **natal day pillar에 한정된 현대 한국 일주론·간여지동 관행**이다. 표현은 source가 제시한 성향 가능성의 범위를 넘지 않으며, 진단·고정 정체성·운명·건강·관계·직업 판단으로 확대하지 않는다. 표현은 심리측정 결과가 아니고 personal validity는 `not_established`다. source는 역사적 원전이나 historical authority가 아니다.

현재 내부 회귀 fixture `계사`는 목록 밖이므로 `not_matched`이며, 실제 사용자 계산은 실행하지 않았다. 향후 사용자 결과 ref가 별도로 제공되고 위 guard가 충족될 때만 source-scoped hypothesis 후보를 평가할 준비 상태다.

상세한 12개 매핑, 예외, source byte hash·locator, upstream 상태 보존, Antigravity 호출 경계는 [rule-record.json](../artifacts/saju-p1-secondary-modern-v1/rule-record.json)에 있다. 이전 후보 조사 기록은 [v0 search-record.json](../artifacts/saju-p1-secondary-modern-v0/search-record.json)에 고정 보존했다.

`historicalAuthority`, `personalValidity`, 기존 `readinessStatus=blocked`, `activationStatus=not_activated`는 갱신하지 않았다. 사용자 claim·reflection·비교도 만들지 않았다.
