import { loadDocuments, validatePayload } from './check-ziwei-four-transformations-source-evidence-v0.mjs'

const base = loadDocuments()
const cases = [
  ['missing sourceRef', documents => { documents.occurrences.sourceOccurrences[0].sourceRefs = [] }, 'sourceRef missing'],
  ['raw transcription mutation', documents => { documents.occurrences.sourceOccurrences.find(row => row.edition === 'nanbei_shanren' && row.stem === '甲').rawTarget = '天機' }, 'alias raw/normalized mismatch'],
  ['blocked cell promoted', documents => { const row = documents.occurrences.sourceOccurrences.find(item => item.edition === 'ming_nanyangtang' && item.stem === '乙' && item.transformation === 'hua_lu'); row.rawTarget = '天機'; row.normalizedStarId = 'tianji' }, 'blocked source cell has output'],
  ['column permutation', documents => { documents.validation.columnOrder.nanbei.normalizedComparisonOrder = ['hua_quan', 'hua_lu', 'hua_ke', 'hua_ji'] }, 'Nanbei column order validation missing'],
  ['payload verdict mutation', documents => { documents.complete.verdict = 'complete_ziwei_four_transformations_evidence_without_promotion' }, 'overall verdict not blocked as required'],
]

const results = []
for (const [name, mutate, expected] of cases) {
  const documents = structuredClone(base)
  mutate(documents)
  const errors = validatePayload(documents)
  if (!errors.some(error => error.includes(expected))) throw new Error(`negative mutation escaped:${name}:${expected}`)
  results.push({ name, rejected: true })
}

console.log(JSON.stringify({ schema: 'ziwei-four-transformations-source-evidence-v0', passed: true, cases: results }, null, 2))
