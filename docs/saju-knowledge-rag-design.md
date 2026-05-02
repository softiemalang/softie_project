# Saju Knowledge RAG Design

## Goal

- 사주 해석 기준을 위한 knowledge retrieval layer를 추가한다.
- 기존 사주 엔진은 계속 deterministic calculation source of truth로 유지한다.
- Vertex AI Search는 우리 지식 문서에서 해석 기준을 retrieval하는 용도로만 사용한다.
- LLM은 computedData와 retrieved criteria를 바탕으로 따뜻한 한국어 조언을 구성하는 역할만 맡는다.
- 반복적으로 유효한 retrieval pattern은 나중에 DB rule과 서버 코드로 옮긴다.

## Role Separation

### Existing Saju Engine

- natal snapshot과 daily snapshot을 계산한다.
- pillars, signals, branch relations, section priority 같은 deterministic signals를 만든다.

### Current generate-fortune-report

- 현재 compact computed data를 바탕으로 final v1.3 report를 생성한다.
- 이 단계에서는 수정하지 않는다.

### Future RAG Layer

- computedData, tags, question을 입력으로 받는다.
- retrieval query를 만든다.
- 관련 criteria를 retrieve한다.
- query, retrieved chunks, final output을 모두 로그로 남긴다.

### Future Internal Rules Engine

- 축적된 run logs와 feedback을 바탕으로 반복 패턴을 rule로 추출한다.
- 충분히 검증된 패턴은 retrieval 없이 DB rule 기반으로 대체한다.

## 5-Stage Roadmap

1. Knowledge document design
2. Retrieval experiment logging
3. Feedback and pattern classification
4. DB rule extraction
5. Optional integration into generate-fortune-report after usefulness is proven

## Recommended GCS Knowledge Bundle Structure

```text
saju-knowledge-bundle/
  00_global_interpretation_policy.txt
  01_daily_work_rules.txt
  02_daily_money_rules.txt
  03_daily_relationship_rules.txt
  04_daily_love_rules.txt
  05_daily_health_rules.txt
  06_daily_mind_rules.txt
  07_day_master_strength_rules.txt
  08_elements_balance_rules.txt
  09_ten_gods_daily_rules.txt
  10_branch_relations_daily_rules.txt
  11_period_context_rules.txt
  12_personal_profile_rules.txt
  13_forbidden_expression_rules.txt
```

## Recommended Document Template

각 knowledge document는 아래 구조를 따른다.

- Title
- Tags
- When to use
- Signals
- Interpretation rule
- Avoid
- Recommended tone
- Output usage
- Example phrases
- Bad examples

## What To Log

- `profile_id`
- `target_date`
- `source`
- `computed_data`
- `extracted_tags`
- `retrieval_queries`
- `retrieved_chunks`
- `final_answer`
- `model_name`
- `warning`
- `status`
- `feedback`

## Safety Principles

- No deterministic predictions
- No guaranteed romance or money claims
- No fear-based language
- No mystical exaggeration
- Warm, practical, grounded advice
- Existing saju engine remains the calculation source of truth
- Retrieved criteria must not override calculated pillars or snapshots

## Future Integration Path

- 실험이 충분히 유효하다고 판단되면, 이후 `generate-fortune-report`가 선택적으로 `retrievedKnowledgeContext`를 받을 수 있다.
- 그 전까지는 현재 v1.3 report schema를 유지한다.

Current schema to preserve:

- `headline`
- `basis`
- `summary`
- `sections.work`
- `sections.money`
- `sections.relationships`
- `sections.love`
- `sections.health`
- `sections.mind`
- `cautions`
- `action_tip`
