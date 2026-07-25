/**
 * transformationResolver.js
 *
 * 자미두수 4대 사화(四化) 산출 독립 모듈
 */

import {
  TRANSFORMATION_RULESET,
  YEAR_STEM_TRANSFORMATIONS,
  TRANSFORMATION_LABELS,
} from './transformationRules.js'

export function resolveFourTransformations(birthYearStem) {
  const stemMap = YEAR_STEM_TRANSFORMATIONS[birthYearStem] || YEAR_STEM_TRANSFORMATIONS['甲']

  const transformations = [
    {
      starId: stemMap.lu,
      type: TRANSFORMATION_LABELS.lu.type,
      name: TRANSFORMATION_LABELS.lu.name,
      description: TRANSFORMATION_LABELS.lu.description,
      source: 'birthYearStem',
      ruleSetVersion: TRANSFORMATION_RULESET.version,
    },
    {
      starId: stemMap.quan,
      type: TRANSFORMATION_LABELS.quan.type,
      name: TRANSFORMATION_LABELS.quan.name,
      description: TRANSFORMATION_LABELS.quan.description,
      source: 'birthYearStem',
      ruleSetVersion: TRANSFORMATION_RULESET.version,
    },
    {
      starId: stemMap.ke,
      type: TRANSFORMATION_LABELS.ke.type,
      name: TRANSFORMATION_LABELS.ke.name,
      description: TRANSFORMATION_LABELS.ke.description,
      source: 'birthYearStem',
      ruleSetVersion: TRANSFORMATION_RULESET.version,
    },
    {
      starId: stemMap.ji,
      type: TRANSFORMATION_LABELS.ji.type,
      name: TRANSFORMATION_LABELS.ji.name,
      description: TRANSFORMATION_LABELS.ji.description,
      source: 'birthYearStem',
      ruleSetVersion: TRANSFORMATION_RULESET.version,
    },
  ]

  return {
    transformations,
    transformationMeta: {
      ruleSetVersion: TRANSFORMATION_RULESET.version,
      birthYearStem,
    },
  }
}
