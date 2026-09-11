/**
 * Western Astrology source/lineage-bounded grammar v0.
 *
 * This module consumes an existing Rule Core chart.  It does not calculate a
 * chart, translate a source into personal meaning, merge traditions, or
 * activate interpretation.  A result is executable only inside the named
 * source and only when the source-defined input conditions are present.
 */

export const ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_SCHEMA = 'astrology-source-bounded-grammar-v0'
export const ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_VERSION = '0.1.0'
export const PTOLEMY_LINEAGE_ID = 'western-hellenistic-ptolemaic'
export const PTOLEMY_SOURCE_ID = 'western-source-ptolemy-tetrabiblos'

export const SOURCE_RULE_STATUSES = Object.freeze([
  'adopted_source_bounded',
  'context_bound_candidate',
  'unresolved',
  'unsupported',
])

export const SOURCE_EXECUTION_STATUSES = Object.freeze([
  'executable_from_rule_core_fact',
  'blocked_missing_fact',
  'not_executable_by_contract',
  'unresolved_source_condition',
  'unsupported_source_scope',
  'conflict_preserved',
])

export const SOURCE_RESULT_STATUSES = Object.freeze([
  'available',
  'blocked',
  'unresolved',
  'unsupported',
  'conflict',
])

export const PTOLEMY_CLASSICAL_BODIES = Object.freeze([
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
])

export const WESTERN_SOURCE_PROFILES = Object.freeze([
  {
    sourceId: PTOLEMY_SOURCE_ID,
    lineageId: PTOLEMY_LINEAGE_ID,
    tradition: 'hellenistic',
    era: '2nd-century-ce',
    work: 'Tetrabiblos',
    author: 'Claudius Ptolemy',
    sourceForm: 'catalog-linked-web-transcription',
    identity: {
      catalogUri: 'https://catalog.perseus.org/catalog/urn%3Acts%3AgreekLit%3Atlg0363.tlg007.opp-eng1',
      catalogLocator: 'URN:cts:greekLit:tlg0363.tlg007.opp-eng1',
      textUri: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/1b%2A.html',
      edition: 'Loeb Classical Library 435, 1940, F. E. Robbins editor and translator',
      byteSha256: null,
      lineageStatus: 'PARTIAL',
      independenceStatus: 'RELATED',
      semanticAuthority: 'bounded_source_text_only',
    },
    admission: {
      status: 'source_text_bounded',
      directTextInspected: true,
      historicalEditionAuthorityPromoted: false,
      localByteWitness: false,
    },
    scope: {
      classicalBodies: PTOLEMY_CLASSICAL_BODIES,
      outerPlanets: 'unsupported_in_selected_source_scope',
      personalMeaning: 'forbidden',
      crossLineageMerge: 'forbidden',
    },
  },
  {
    sourceId: 'western-source-lilly-christian-astrology',
    lineageId: 'western-early-modern-lilly',
    tradition: 'early_modern_traditional',
    era: '1647',
    work: 'Christian Astrology',
    author: 'William Lilly',
    sourceForm: 'catalog_record_only',
    identity: {
      catalogUri: 'https://wellcomecollection.org/works/s7z7c46y',
      catalogLocator: 'Wellcome Collection record s7z7c46y',
      textUri: 'https://iiif.wellcomecollection.org/pdf/b16684602',
      edition: 'London: T. Brudenell for J. Partridge and H. Blunden, 1647',
      byteSha256: null,
      lineageStatus: 'PARTIAL',
      independenceStatus: 'UNRESOLVED',
      semanticAuthority: 'not_admitted_without_page_witness',
    },
    admission: {
      status: 'candidate_unreviewed_page_witness',
      directTextInspected: false,
      historicalEditionAuthorityPromoted: false,
      localByteWitness: false,
    },
    scope: {
      classicalBodies: 'not_admitted',
      outerPlanets: 'not_admitted',
      personalMeaning: 'forbidden',
      crossLineageMerge: 'forbidden',
    },
  },
])

const PTOLEMY_TEXT_URI = WESTERN_SOURCE_PROFILES[0].identity.textUri
const forbiddenExtensions = Object.freeze([
  'personal_trait_or_personality_claim',
  'personal_gender_or_identity_claim',
  'good_bad_or_fortune_outcome',
  'prediction_or_event_claim',
  'modern_psychological_synthesis',
  'outer_planet_meaning',
  'cross_lineage_rule_merge',
  'modern_orb_inference_when_source_requires_exact_relation',
])

const locator = (locatorId, section, printedPages, observation, ruleStatus = 'adopted_source_bounded') => ({
  locatorId,
  sourceId: PTOLEMY_SOURCE_ID,
  lineageId: PTOLEMY_LINEAGE_ID,
  uri: PTOLEMY_TEXT_URI,
  locator: `Tetrabiblos I.${section}; Robbins/Loeb printed ${printedPages}`,
  webLocator: `https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/1b%2A.html#I.${section}`,
  directObservation: observation,
  support: 'DIRECT',
  ruleStatus,
  forbiddenExtensions,
})

export const WESTERN_SOURCE_LOCATORS = Object.freeze([
  locator('ptolemy-I-5-benefic-malefic', '5', 'p39–41', 'The text assigns Moon, Venus, and Jupiter to the beneficent class; Saturn and Mars to the contrary class; Sun and Mercury to a common class whose effects vary with association.'),
  locator('ptolemy-I-6-planet-gender', '6', 'p41–43', 'The text assigns Moon and Venus to the feminine class, Sun/Saturn/Jupiter/Mars to the masculine class, and Mercury to a common class; later conditional modifications are stated separately.'),
  locator('ptolemy-I-11-sign-quadruplicity', '11', 'p65–69', 'The text names Cancer and Capricorn solstitial, Aries and Libra equinoctial, Taurus/Leo/Scorpio/Aquarius solid, and Gemini/Virgo/Sagittarius/Pisces bicorporeal.'),
  locator('ptolemy-I-12-sign-gender', '12', 'p69–71', 'The text describes an alternating masculine/feminine order beginning with Aries, while also recording other methods as separate practices.'),
  locator('ptolemy-I-13-aspect-harmony', '13', 'p73–75', 'The text defines opposition, trine, quartile, and sextile by angular interval and calls trine/sextile harmonious and quartile/opposition disharmonious based on sign kind.'),
  locator('ptolemy-I-17-domicile-houses', '17', 'p79–83', 'The text assigns the seven classical planetary houses: luminaries to Cancer/Leo, Saturn to Capricorn/Aquarius, Jupiter to Sagittarius/Pisces, Mars to Scorpio/Aries, Venus to Libra/Taurus, and Mercury to Gemini/Virgo.'),
  locator('ptolemy-I-23-familiarity-composition', '23', 'p111–113', 'The text describes face, chariot, throne, rejoicing, and alien-region relations as combinations of several prior familiarity relations.'),
  locator('ptolemy-I-24-application-separation', '24', 'p113–117', 'The text defines application/separation conditionally by preceding/following bodies and aspect or bodily conjunction, with latitude required for bodily passages.'),
])

const locatorMap = new Map(WESTERN_SOURCE_LOCATORS.map(item => [item.locatorId, item]))
const sourceMap = new Map(WESTERN_SOURCE_PROFILES.map(item => [item.sourceId, item]))

const signIds = Object.freeze([
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
])

const PTOLEMY_SIGN_GENDER = Object.freeze({
  aries: 'masculine', gemini: 'masculine', leo: 'masculine',
  libra: 'masculine', sagittarius: 'masculine', aquarius: 'masculine',
  taurus: 'feminine', cancer: 'feminine', virgo: 'feminine',
  scorpio: 'feminine', capricorn: 'feminine', pisces: 'feminine',
})

const PTOLEMY_SIGN_QUADRUPLICITY = Object.freeze({
  aries: 'equinoctial', libra: 'equinoctial',
  cancer: 'solstitial', capricorn: 'solstitial',
  taurus: 'solid', leo: 'solid', scorpio: 'solid', aquarius: 'solid',
  gemini: 'bicorporeal', virgo: 'bicorporeal', sagittarius: 'bicorporeal', pisces: 'bicorporeal',
})

const PTOLEMY_DOMICILES = Object.freeze({
  aries: 'mars', taurus: 'venus', gemini: 'mercury', cancer: 'moon',
  leo: 'sun', virgo: 'mercury', libra: 'venus', scorpio: 'mars',
  sagittarius: 'jupiter', capricorn: 'saturn', aquarius: 'saturn', pisces: 'jupiter',
})

const PTOLEMY_PLANET_CLASS = Object.freeze({
  moon: 'beneficent', venus: 'beneficent', jupiter: 'beneficent',
  saturn: 'maleficent', mars: 'maleficent',
  sun: 'common', mercury: 'common',
})

const PTOLEMY_PLANET_GENDER = Object.freeze({
  moon: 'feminine', venus: 'feminine',
  sun: 'masculine', saturn: 'masculine', jupiter: 'masculine', mars: 'masculine',
  mercury: 'common',
})

const SOURCE_ASPECTS = Object.freeze({
  sextile: { sourceTerm: 'sextile', exactAngleDegrees: 60, harmony: 'harmonious', signKind: 'same' },
  trine: { sourceTerm: 'trine', exactAngleDegrees: 120, harmony: 'harmonious', signKind: 'same' },
  square: { sourceTerm: 'quartile', exactAngleDegrees: 90, harmony: 'disharmonious', signKind: 'opposite' },
  opposition: { sourceTerm: 'opposition', exactAngleDegrees: 180, harmony: 'disharmonious', signKind: 'opposite' },
})

export const WESTERN_SOURCE_RULES = Object.freeze([
  {
    ruleId: 'rule.ptolemy.sign-quadruplicity.v0', kind: 'structural', status: 'adopted_source_bounded', locatorId: 'ptolemy-I-11-sign-quadruplicity',
    requiredFacts: ['ruleChart.metadata.zodiac', 'ruleChart.*.signId'], output: 'source sign class: solstitial/equinoctial/solid/bicorporeal',
    exceptions: ['only tropical sign identifiers are admitted', 'no modern cardinal/fixed/mutable synonym is emitted'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.sign-gender-alternating.v0', kind: 'structural', status: 'adopted_source_bounded', locatorId: 'ptolemy-I-12-sign-gender',
    requiredFacts: ['ruleChart.metadata.zodiac', 'ruleChart.*.signId'], output: 'source sign kind: masculine or feminine under the Aries-start alternating method',
    exceptions: ['horizon/quadrant and rising-sign variants are not silently selected'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.domicile-map.v0', kind: 'structural', status: 'adopted_source_bounded', locatorId: 'ptolemy-I-17-domicile-houses',
    requiredFacts: ['ruleChart.metadata.zodiac', 'ruleChart.*.signId'], output: 'source domicile relation to one of the seven classical bodies',
    exceptions: ['outer bodies have no output', 'exaltation, triplicity, terms, and face are not inferred'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.planet-class.v0', kind: 'semantic_lexicon', status: 'adopted_source_bounded', locatorId: 'ptolemy-I-5-benefic-malefic',
    requiredFacts: ['ruleChart.bodies[*].id'], output: 'source label: beneficent, maleficent, or common',
    exceptions: ['Sun/Mercury association-dependent modification is not composed without a source-complete association predicate'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.planet-gender.v0', kind: 'semantic_lexicon', status: 'adopted_source_bounded', locatorId: 'ptolemy-I-6-planet-gender',
    requiredFacts: ['ruleChart.bodies[*].id'], output: 'source label: masculine, feminine, or common',
    exceptions: ['morning/evening and horizon modifications are preserved as unresolved prerequisites'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.aspect-harmony-exact.v0', kind: 'source_local_composition', status: 'adopted_source_bounded', locatorId: 'ptolemy-I-13-aspect-harmony',
    requiredFacts: ['ruleChart.aspects[*].pointA', 'ruleChart.aspects[*].pointB', 'ruleChart.aspects[*].angularDistanceDegrees', 'source sign-gender results'], output: 'source aspect term and harmonious/disharmonious label only for an exact source interval',
    exceptions: ['modern orb-only matches remain unresolved', 'conjunction is not admitted by this locator'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.familiarity-throne-composition.v0', kind: 'source_local_composition', status: 'unresolved', locatorId: 'ptolemy-I-23-familiarity-composition',
    requiredFacts: ['domicile', 'exaltation', 'triplicity', 'terms', 'face', 'sect', 'source priority'], output: 'not emitted; source-local composition prerequisite incomplete',
    exceptions: ['no completion from modern dignity tables'], forbiddenExtensions,
  },
  {
    ruleId: 'rule.ptolemy.application-separation.v0', kind: 'source_local_composition', status: 'unresolved', locatorId: 'ptolemy-I-24-application-separation',
    requiredFacts: ['exact motion relation', 'aspect or bodily conjunction', 'latitude for bodily passage', 'source threshold for near interval'], output: 'not emitted; source-local relation is incomplete in current Base',
    exceptions: ['Rule Core phase is not silently relabeled as Ptolemaic application'], forbiddenExtensions,
  },
])

export const WESTERN_CONTEXT_BOUND_CANDIDATES = Object.freeze([
  {
    candidateId: 'candidate.ptolemy.planet-sect-modification.v0',
    sourceId: PTOLEMY_SOURCE_ID,
    locatorId: 'ptolemy-I-6-planet-gender',
    status: 'context_bound_candidate',
    missing: ['morning/evening or oriental/occidental classification', 'horizon/quadrant method selection'],
    reason: 'The text gives multiple conditional methods; current Base does not carry a source-selected method and complete prerequisites.',
  },
  {
    candidateId: 'candidate.ptolemy.sign-commanding-obeying.v0',
    sourceId: PTOLEMY_SOURCE_ID,
    locatorId: 'ptolemy-I-13-aspect-harmony',
    status: 'context_bound_candidate',
    missing: ['source-specific hemisphere/equal-ascension input and method', 'no modern equivalent admitted'],
    reason: 'The relation is explicit but not needed for the adopted v0 surface and has additional astronomical conditions.',
  },
  {
    candidateId: 'candidate.ptolemy.familiarity-composition.v0',
    sourceId: PTOLEMY_SOURCE_ID,
    lineageId: PTOLEMY_LINEAGE_ID,
    locatorId: 'ptolemy-I-23-familiarity-composition',
    status: 'context_bound_candidate',
    missing: ['complete prior familiarity inputs', 'source-specific dignity and condition inputs', 'closed precedence among face/chariot/throne/rejoicing/alien-region relations'],
    reason: 'The locator names a composition of prior relations, but the current Rule Core does not carry every source-defined prerequisite or precedence rule.',
  },
  {
    candidateId: 'candidate.ptolemy.application-separation.v0',
    sourceId: PTOLEMY_SOURCE_ID,
    lineageId: PTOLEMY_LINEAGE_ID,
    locatorId: 'ptolemy-I-24-application-separation',
    status: 'context_bound_candidate',
    missing: ['source-selected motion ordering', 'latitude/bodily-passage prerequisite', 'near-aspect threshold and exception policy'],
    reason: 'The direct locator is retained, but an exact source-local predicate cannot be executed from the current FACT and Rule Core contract.',
  },
  {
    candidateId: 'candidate.lilly.primary-text-lineage.v0',
    sourceId: 'western-source-lilly-christian-astrology',
    lineageId: 'western-early-modern-lilly',
    locatorId: 'wellcome-s7z7c46y-whole-item',
    status: 'context_bound_candidate',
    missing: ['page-specific original witness inspection', 'stable page/section locator for a closed rule', 'lineage-local prerequisite and exception inventory'],
    reason: 'The Wellcome record closes the 1647 work identity and digitized item boundary, but no Lilly rule is admitted from a catalog/PDF identity alone.',
  },
])

export const WESTERN_UNSUPPORTED_FRONTIER = Object.freeze([
  {
    featureId: 'western.outer_planet_semantics',
    status: 'unsupported',
    reason: 'The selected classical source scope contains only the seven classical bodies; Uranus, Neptune, and Pluto are not assigned a source-bounded meaning here.',
  },
  {
    featureId: 'western.modern_psychological_astrology',
    status: 'unsupported',
    reason: 'No modern psychological source lineage was admitted in this v0 investigation.',
  },
  {
    featureId: 'western.cross_lineage_synthesis',
    status: 'blocked',
    reason: 'Different eras and traditions must remain separate until an explicit source-local or separately authorized composition contract exists.',
  },
])

const clone = value => structuredClone(value)
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value)
const unique = values => [...new Set(values)]
const has = (value, key) => isObject(value) && Object.hasOwn(value, key)

function sourceRef(locatorId) {
  const item = locatorMap.get(locatorId)
  if (!item) throw new Error(`unknown Western source locator: ${locatorId}`)
  return {
    sourceId: item.sourceId,
    lineageId: item.lineageId,
    locatorId: item.locatorId,
    uri: item.uri,
    locator: item.locator,
    webLocator: item.webLocator,
    support: item.support,
  }
}

function resultBase({ resultId, ruleId, locatorId, kind, requiredFactRefs, sourceOutput }) {
  const rule = WESTERN_SOURCE_RULES.find(item => item.ruleId === ruleId)
  return {
    resultId,
    ruleId,
    lineageId: PTOLEMY_LINEAGE_ID,
    sourceId: PTOLEMY_SOURCE_ID,
    kind,
    ruleStatus: rule?.status || 'unresolved',
    requiredFactRefs: [...requiredFactRefs],
    sourceRefs: [sourceRef(locatorId)],
    output: sourceOutput,
    forbiddenExtensions: [...forbiddenExtensions],
    provenance: {
      sourceIdentity: WESTERN_SOURCE_PROFILES[0].identity,
      sourceRuleLocatorId: locatorId,
      sourceAuthority: 'bounded_source_text_only',
    },
  }
}

function available(base, output) {
  return { ...base, resultStatus: 'available', executionStatus: 'executable_from_rule_core_fact', output }
}

function blocked(base, reason, output = null) {
  return { ...base, resultStatus: 'blocked', executionStatus: 'blocked_missing_fact', reason, output }
}

function unresolved(base, reason, executionStatus = 'unresolved_source_condition') {
  return { ...base, resultStatus: 'unresolved', executionStatus, reason, output: null }
}

function unsupported(base, reason) {
  return { ...base, resultStatus: 'unsupported', executionStatus: 'unsupported_source_scope', reason, output: null }
}

function conflict(base, reason, output = null) {
  return { ...base, resultStatus: 'conflict', executionStatus: 'conflict_preserved', reason, output }
}

function placementId(placement, fallback) {
  return typeof placement?.id === 'string' && placement.id.length > 0 ? placement.id : fallback
}

function allPlacements(ruleChart) {
  const bodies = Array.isArray(ruleChart?.bodies) ? ruleChart.bodies : []
  const angles = Object.values(ruleChart?.angles || {}).filter(isObject)
  return [...bodies, ...angles]
}

function exactAspectDefinition(aspect) {
  const definition = SOURCE_ASPECTS[aspect?.aspectId]
  if (!definition || !isFiniteNumber(aspect?.angularDistanceDegrees)) return null
  return Math.abs(aspect.angularDistanceDegrees - definition.exactAngleDegrees) <= 1e-9 ? definition : null
}

function summarize(results) {
  return results.reduce((counts, result) => {
    const key = result?.resultStatus
    if (Object.hasOwn(counts, key)) counts[key] += 1
    return counts
  }, { available: 0, blocked: 0, unresolved: 0, unsupported: 0, conflict: 0 })
}

function sourceBoundedRuleInventory() {
  return WESTERN_SOURCE_RULES.map(rule => ({
    ruleId: rule.ruleId,
    kind: rule.kind,
    status: rule.status,
    sourceId: PTOLEMY_SOURCE_ID,
    lineageId: PTOLEMY_LINEAGE_ID,
    locatorId: rule.locatorId,
  }))
}

function derivePlacementResults(ruleChart) {
  const results = []
  for (const placement of allPlacements(ruleChart)) {
    const id = placementId(placement, 'unknown')
    const sign = placement?.signId
    const refs = [`ruleChart.${placement?.id ? (placement.id === 'ascendant' || placement.id === 'midheaven' ? `angles.${id}` : `bodies.${id}`) : 'unknown'}.signId`]
    const quadruplicityBase = resultBase({
      resultId: `structural.ptolemy.sign-quadruplicity.${id}`,
      ruleId: 'rule.ptolemy.sign-quadruplicity.v0',
      locatorId: 'ptolemy-I-11-sign-quadruplicity',
      kind: 'structural_result',
      requiredFactRefs: refs,
      sourceOutput: null,
    })
    const genderBase = resultBase({
      resultId: `structural.ptolemy.sign-gender.${id}`,
      ruleId: 'rule.ptolemy.sign-gender-alternating.v0',
      locatorId: 'ptolemy-I-12-sign-gender',
      kind: 'structural_result',
      requiredFactRefs: refs,
      sourceOutput: null,
    })
    const domicileBase = resultBase({
      resultId: `structural.ptolemy.domicile.${id}`,
      ruleId: 'rule.ptolemy.domicile-map.v0',
      locatorId: 'ptolemy-I-17-domicile-houses',
      kind: 'structural_result',
      requiredFactRefs: refs,
      sourceOutput: null,
    })
    if (placement?.availability !== 'available' || typeof sign !== 'string') {
      results.push(blocked(quadruplicityBase, 'sign_fact_missing'))
      results.push(blocked(genderBase, 'sign_fact_missing'))
      results.push(blocked(domicileBase, 'sign_fact_missing'))
      continue
    }
    if (!has(PTOLEMY_SIGN_QUADRUPLICITY, sign)) {
      results.push(blocked(quadruplicityBase, 'unknown_sign_identifier'))
      results.push(blocked(genderBase, 'unknown_sign_identifier'))
      results.push(blocked(domicileBase, 'unknown_sign_identifier'))
      continue
    }
    results.push(available(quadruplicityBase, { subjectId: id, signId: sign, sourceTerm: PTOLEMY_SIGN_QUADRUPLICITY[sign], method: 'ptolemy_source_sign_classification' }))
    results.push(available(genderBase, { subjectId: id, signId: sign, sourceTerm: PTOLEMY_SIGN_GENDER[sign], method: 'ptolemy_alternating_aries_start' }))
    results.push(available(domicileBase, { subjectId: id, signId: sign, domicileBodyId: PTOLEMY_DOMICILES[sign], classicalScope: true }))
  }
  return results
}

function derivePlanetSemanticResults(ruleChart) {
  const results = []
  for (const body of Array.isArray(ruleChart?.bodies) ? ruleChart.bodies : []) {
    const id = body?.id || 'unknown'
    const refs = [`ruleChart.bodies.${id}.id`]
    const classBase = resultBase({
      resultId: `semantic.ptolemy.planet-class.${id}`,
      ruleId: 'rule.ptolemy.planet-class.v0',
      locatorId: 'ptolemy-I-5-benefic-malefic',
      kind: 'semantic_result',
      requiredFactRefs: refs,
      sourceOutput: null,
    })
    const genderBase = resultBase({
      resultId: `semantic.ptolemy.planet-gender.${id}`,
      ruleId: 'rule.ptolemy.planet-gender.v0',
      locatorId: 'ptolemy-I-6-planet-gender',
      kind: 'semantic_result',
      requiredFactRefs: refs,
      sourceOutput: null,
    })
    if (!PTOLEMY_PLANET_CLASS[id]) {
      results.push(unsupported(classBase, 'body_not_in_ptolemy_classical_scope'))
      results.push(unsupported(genderBase, 'body_not_in_ptolemy_classical_scope'))
      continue
    }
    results.push(available(classBase, { subjectId: id, sourceTerm: PTOLEMY_PLANET_CLASS[id], semanticRole: 'source_class_label_only' }))
    results.push(available(genderBase, { subjectId: id, sourceTerm: PTOLEMY_PLANET_GENDER[id], semanticRole: 'source_class_label_only' }))
  }
  return results
}

function deriveAspectCompositionResults(ruleChart, structuralResults) {
  const results = []
  const signKinds = new Map(
    structuralResults
      .filter(item => item.ruleId === 'rule.ptolemy.sign-gender-alternating.v0' && item.resultStatus === 'available')
      .map(item => [item.output.subjectId, item.output.sourceTerm]),
  )
  for (const aspect of Array.isArray(ruleChart?.aspects) ? ruleChart.aspects : []) {
    const id = aspect?.id || `${aspect?.pointA || 'unknown'}__${aspect?.pointB || 'unknown'}`
    const base = resultBase({
      resultId: `composition.ptolemy.aspect-harmony.${id}`,
      ruleId: 'rule.ptolemy.aspect-harmony-exact.v0',
      locatorId: 'ptolemy-I-13-aspect-harmony',
      kind: 'composition_result',
      requiredFactRefs: [
        `ruleChart.aspects.${id}`,
        `sourceResult.structural.ptolemy.sign-gender.${aspect?.pointA || 'unknown'}`,
        `sourceResult.structural.ptolemy.sign-gender.${aspect?.pointB || 'unknown'}`,
      ],
      sourceOutput: null,
    })
    const definition = SOURCE_ASPECTS[aspect?.aspectId]
    if (!definition) {
      results.push(unsupported(base, 'source_aspect_term_not_defined_by_adopted_locator'))
      continue
    }
    if (!isFiniteNumber(aspect?.angularDistanceDegrees) || Math.abs(aspect.angularDistanceDegrees - definition.exactAngleDegrees) > 1e-9) {
      results.push(unresolved(base, 'source_requires_exact_relation_not_modern_orb_match'))
      continue
    }
    const kindA = signKinds.get(aspect?.pointA)
    const kindB = signKinds.get(aspect?.pointB)
    if (!kindA || !kindB) {
      results.push(blocked(base, 'source_aspect_endpoint_sign_kind_missing'))
      continue
    }
    const actualRelation = kindA === kindB ? 'same' : 'opposite'
    if (actualRelation !== definition.signKind) {
      results.push(conflict(base, 'source_aspect_sign_kind_conflict', { pointA: kindA, pointB: kindB, expected: definition.signKind, actual: actualRelation }))
      continue
    }
    results.push(available(base, {
      pointA: aspect.pointA,
      pointB: aspect.pointB,
      sourceAspectTerm: definition.sourceTerm,
      exactAngleDegrees: definition.exactAngleDegrees,
      signKindRelation: actualRelation,
      sourceSemanticLabel: definition.harmony,
      semanticRole: 'source_local_aspect_classification_only',
    }))
  }
  return results
}

function unresolvedCompositionResults() {
  return WESTERN_SOURCE_RULES
    .filter(rule => rule.status === 'unresolved')
    .map(rule => unresolved(resultBase({
      resultId: `composition.ptolemy.${rule.ruleId.split('.').slice(2, -1).join('-')}`,
      ruleId: rule.ruleId,
      locatorId: rule.locatorId,
      kind: 'composition_result',
      requiredFactRefs: rule.requiredFacts,
      sourceOutput: null,
    }), 'source_prerequisite_gap_is_preserved', 'not_executable_by_contract'))
}

export function deriveAstrologySourceBoundedGrammar({ ruleChart = {}, sourceId = PTOLEMY_SOURCE_ID } = {}) {
  const source = sourceMap.get(sourceId)
  if (!source || sourceId !== PTOLEMY_SOURCE_ID) {
    return {
      schemaVersion: ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_SCHEMA,
      version: ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_VERSION,
      status: 'blocked',
      sourceId: sourceId || null,
      lineageIds: source ? [source.lineageId] : [],
      structuralResults: [],
      semanticResults: [],
      compositionResults: [],
      candidates: clone(WESTERN_CONTEXT_BOUND_CANDIDATES),
      unsupported: clone(WESTERN_UNSUPPORTED_FRONTIER),
      blockedReasons: ['source_lineage_not_adopted_v0'],
    }
  }

  const metadata = ruleChart?.metadata || {}
  const structuralResults = metadata.zodiac === 'tropical'
    ? derivePlacementResults(ruleChart)
    : [blocked(resultBase({
      resultId: 'structural.ptolemy.chart-zodiac',
      ruleId: 'rule.ptolemy.sign-quadruplicity.v0',
      locatorId: 'ptolemy-I-11-sign-quadruplicity',
      kind: 'structural_result',
      requiredFactRefs: ['ruleChart.metadata.zodiac'],
      sourceOutput: null,
    }), 'source_requires_tropical_sign_frame')]
  const semanticResults = derivePlanetSemanticResults(ruleChart)
  const compositionResults = [
    ...deriveAspectCompositionResults(ruleChart, structuralResults),
    ...unresolvedCompositionResults(),
  ]
  const allResults = [...structuralResults, ...semanticResults, ...compositionResults]
  const result = {
    schemaVersion: ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_SCHEMA,
    version: ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_VERSION,
    status: 'source_bounded_results_with_preserved_frontier',
    sourceId: PTOLEMY_SOURCE_ID,
    lineageIds: [PTOLEMY_LINEAGE_ID],
    sourceProfile: clone(source),
    ruleInventory: sourceBoundedRuleInventory(),
    structuralResults,
    semanticResults,
    compositionResults,
    candidates: clone(WESTERN_CONTEXT_BOUND_CANDIDATES),
    unsupported: clone(WESTERN_UNSUPPORTED_FRONTIER),
    summary: {
      structural: summarize(structuralResults),
      semantic: summarize(semanticResults),
      composition: summarize(compositionResults),
      all: summarize(allResults),
    },
    boundary: {
      factsRemainUpstream: true,
      sourceEvidenceRemainsSeparate: true,
      personalInterpretationCreated: false,
      crossLineageComposition: false,
      outerPlanetMeaningCreated: false,
      activationChanged: false,
    },
  }
  return result
}

const forbiddenKeys = new Set([
  'personality', 'psychology', 'trait', 'destiny', 'fate', 'prediction', 'advice',
  'meaning', 'synthesis', 'dominance', 'ranking', 'confidence',
])

function walkKeys(value, path = '$', output = []) {
  if (!isObject(value) && !Array.isArray(value)) return output
  for (const [key, child] of Object.entries(value)) {
    output.push([key, `${path}.${key}`])
    walkKeys(child, `${path}.${key}`, output)
  }
  return output
}

export function validateAstrologySourceBoundedGrammar(result) {
  const errors = []
  if (!isObject(result)) return { valid: false, errors: ['result_not_object'] }
  if (result.schemaVersion !== ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_SCHEMA || result.version !== ASTROLOGY_SOURCE_BOUNDED_GRAMMAR_VERSION) errors.push('schema_or_version_mismatch')
  if (result.sourceId !== PTOLEMY_SOURCE_ID || JSON.stringify(result.lineageIds) !== JSON.stringify([PTOLEMY_LINEAGE_ID])) errors.push('lineage_boundary_mismatch')
  if (result.boundary?.factsRemainUpstream !== true || result.boundary?.sourceEvidenceRemainsSeparate !== true || result.boundary?.personalInterpretationCreated !== false || result.boundary?.crossLineageComposition !== false || result.boundary?.outerPlanetMeaningCreated !== false || result.boundary?.activationChanged !== false) errors.push('boundary_promoted')
  const allResults = [...(result.structuralResults || []), ...(result.semanticResults || []), ...(result.compositionResults || [])]
  const ids = new Set()
  for (const item of allResults) {
    if (!isObject(item)) { errors.push('result_item_not_object'); continue }
    if (ids.has(item.resultId)) errors.push(`result_id_duplicate:${item.resultId}`)
    ids.add(item.resultId)
    if (item.sourceId !== PTOLEMY_SOURCE_ID || item.lineageId !== PTOLEMY_LINEAGE_ID) errors.push(`result_lineage_mismatch:${item.resultId}`)
    if (!SOURCE_RESULT_STATUSES.includes(item.resultStatus)) errors.push(`result_status_invalid:${item.resultId}`)
    if (!SOURCE_EXECUTION_STATUSES.includes(item.executionStatus)) errors.push(`execution_status_invalid:${item.resultId}`)
    if (!Array.isArray(item.sourceRefs) || item.sourceRefs.length !== 1 || item.sourceRefs[0]?.sourceId !== PTOLEMY_SOURCE_ID) errors.push(`source_refs_invalid:${item.resultId}`)
    if (item.resultStatus === 'available' && !isObject(item.output)) errors.push(`available_output_missing:${item.resultId}`)
    if (item.resultStatus !== 'available' && item.resultStatus !== 'conflict' && item.output !== null) errors.push(`non_available_output_present:${item.resultId}`)
    if (Array.isArray(item.output) && item.output.some(value => typeof value === 'string' && /outer|uranus|neptune|pluto/i.test(value))) errors.push(`outer_scope_output:${item.resultId}`)
  }
  if (allResults.some(item => item.resultStatus === 'available' && item.kind === 'semantic_result' && ['uranus', 'neptune', 'pluto'].includes(item.output?.subjectId))) errors.push('outer_planet_semantic_promoted')
  for (const [key] of walkKeys(result)) if (forbiddenKeys.has(key)) errors.push(`forbidden_semantic_key:${key}`)
  if (result.candidates?.some(item => item.status !== 'context_bound_candidate')) errors.push('candidate_promoted')
  if (result.unsupported?.some(item => !['unsupported', 'blocked'].includes(item.status))) errors.push('unsupported_frontier_promoted')
  return { valid: errors.length === 0, errors: unique(errors).sort() }
}

export function getWesternSourceLocator(locatorId) {
  return locatorMap.has(locatorId) ? clone(locatorMap.get(locatorId)) : null
}

export function getWesternSourceLexicon() {
  return [
    { entryId: 'lexicon.ptolemy.planet.beneficent', ruleId: 'rule.ptolemy.planet-class.v0', sourceId: PTOLEMY_SOURCE_ID, lineageId: PTOLEMY_LINEAGE_ID, sourceTerm: 'beneficent', appliesTo: ['moon', 'venus', 'jupiter'], scope: 'source class label only', locatorId: 'ptolemy-I-5-benefic-malefic', forbiddenExtensions: [...forbiddenExtensions] },
    { entryId: 'lexicon.ptolemy.planet.maleficent', ruleId: 'rule.ptolemy.planet-class.v0', sourceId: PTOLEMY_SOURCE_ID, lineageId: PTOLEMY_LINEAGE_ID, sourceTerm: 'maleficent', appliesTo: ['saturn', 'mars'], scope: 'source class label only', locatorId: 'ptolemy-I-5-benefic-malefic', forbiddenExtensions: [...forbiddenExtensions] },
    { entryId: 'lexicon.ptolemy.planet.common', ruleId: 'rule.ptolemy.planet-class.v0', sourceId: PTOLEMY_SOURCE_ID, lineageId: PTOLEMY_LINEAGE_ID, sourceTerm: 'common', appliesTo: ['sun', 'mercury'], scope: 'source class label only; association-dependent modification unresolved', locatorId: 'ptolemy-I-5-benefic-malefic', forbiddenExtensions: [...forbiddenExtensions] },
    { entryId: 'lexicon.ptolemy.aspect.harmonious', ruleId: 'rule.ptolemy.aspect-harmony-exact.v0', sourceId: PTOLEMY_SOURCE_ID, lineageId: PTOLEMY_LINEAGE_ID, sourceTerm: 'harmonious', appliesTo: ['sextile', 'trine'], scope: 'exact source aspect relation only', locatorId: 'ptolemy-I-13-aspect-harmony', forbiddenExtensions: [...forbiddenExtensions] },
    { entryId: 'lexicon.ptolemy.aspect.disharmonious', ruleId: 'rule.ptolemy.aspect-harmony-exact.v0', sourceId: PTOLEMY_SOURCE_ID, lineageId: PTOLEMY_LINEAGE_ID, sourceTerm: 'disharmonious', appliesTo: ['quartile', 'opposition'], scope: 'exact source aspect relation only', locatorId: 'ptolemy-I-13-aspect-harmony', forbiddenExtensions: [...forbiddenExtensions] },
  ].map(clone)
}
