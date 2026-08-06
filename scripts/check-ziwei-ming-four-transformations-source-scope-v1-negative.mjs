import { loadDocuments, validatePayload } from './check-ziwei-ming-four-transformations-source-scope-v1.mjs'

const base = loadDocuments()
const cases = [
  ['tier removed', documents => { documents.direct.locators[1].tier = null }, 'locator tier missing'],
  ['file identity removed', documents => { delete documents.direct.rawSourceRows[0].sourceRefs[0].fileIdentitySha256 }, 'direct source file identity missing'],
  ['blocked cell promoted', documents => { documents.matrix.cells[0].rawTarget = '天機'; documents.matrix.cells[0].normalizedStarId = 'tianji' }, 'blocked cell promoted'],
  ['unlocated counted as mismatch', documents => { documents.comparison.rows.find(row => !row.comparable).mismatch = true }, 'unlocated comparison row treated as mismatch'],
  ['independent tier claimed', documents => { documents.validation.tierValidation.tierAIndependentAlternateCopyCount = 1 }, 'tier boundary invalid'],
  ['wrong verdict', documents => { documents.complete.verdict = 'complete_ziwei_ming_four_transformations_source_scope_resolved_without_promotion' }, 'verdict must remain blocked'],
]

const results = []
for (const [name, mutate, expected] of cases) {
  const documents = structuredClone(base)
  mutate(documents)
  const errors = validatePayload(documents)
  if (!errors.some(error => error.includes(expected))) throw new Error('negative mutation escaped:' + name + ':' + expected)
  results.push({ name, rejected: true })
}

console.log(JSON.stringify({ schema: 'ziwei-ming-four-transformations-source-scope-v1', passed: true, cases: results }, null, 2))
