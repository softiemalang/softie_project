# Saju P1: bounded secondary/modern source review

이번 단계는 종료된 classical executable temperament 경로를 다시 열지 않고, 공개된 2차·현대 명리 자료에서 현재 엔진 값으로 닫히는 계산 predicate만 조사했다. 세 후보를 검토했고, 하나만 **P1 admission candidate**로 남겼다. 이는 엔진에 등록한 rule이나 사용자 해석이 아니다.

## Admission candidate

`간여지동` 설명을 다룬 [천명선생의 공개 페이지](https://insight6348.tistory.com/365)는 간여지동의 해석 포인트로 강한 주관성·집중력·고집과 융통성 부족 가능성을 제시하고, 갑인·을묘·병오·정사·무진·무술·기미·기축·경신·신유·임자·계해의 12개 일주를 명시한다. 페이지의 저자·게시일·직접 읽은 행 범위·retrieved-byte SHA는 [source-evidence.json](../artifacts/saju-p1-secondary-modern-v0/source-evidence.json)에 분리 기록했다.

그 범위를 그대로 좁혀 다음 enum predicate만 닫혔다.

```text
/raw/pillars/day/referenceValue ∈ {
  갑인, 을묘, 병오, 정사, 무진, 무술, 기미, 기축,
  경신, 신유, 임자, 계해
}
```

`/raw/pillars/day/status`가 `calculated`이고 후보가 하나일 때만 평가하며, 불확실하거나 복수 후보이면 unresolved로 남긴다. 기존 회귀 fixture의 일주는 `계사`라서 이 predicate는 `not_matched`다. 이 평가는 fixture에 대한 계산 적용 상태이며 개인 claim이 아니다.

## Excluded candidates

- [사주데이의 정인 용어 페이지](https://sajuday.kr/%EC%9A%A9%EC%96%B4/%EC%A0%95%EC%9D%B8)는 정인이 강하면 차분·학구적·정직하다고 설명하지만, 8글자 count가 `tenGods.visible`인지 `tenGods.hidden`인지, `강한`의 cutoff가 무엇인지 정의하지 않는다. 정인격이라는 별도 월지 분기도 있어 predicate가 닫히지 않는다.
- [시니컬킴의 일간 설명 페이지](https://cynicalkim.com/saju/ilgan-personality/)는 일간 한 글자만으로 성격을 결론내릴 수 없다고 명시하고, 계절·뿌리·주변 오행·관계와 함께 보라고 한다. 따라서 `dayMaster.stem` 단독 rule로 admission하지 않았다.

두 후보의 source provenance, school/practice, rule scope와 제외 사유는 search record에 각각 분리했다. 서로 다른 lens 비교, 점수·순위·승자, historical authority, personal validity, readiness, activation은 만들거나 갱신하지 않았다.

최종 상태는 `P1_admission_candidate_only`이며, `registeredRules=[]`, `executablePredicate=null`, 사용자 claim·reflection·adapter·UI는 없다. 상세 판정과 계산 snapshot은 [search-record.json](../artifacts/saju-p1-secondary-modern-v0/search-record.json)에, source 관찰은 [source-evidence.json](../artifacts/saju-p1-secondary-modern-v0/source-evidence.json)에 있다.
