import { buildArtifact } from './materialize-ziwei-life-body-palace-ruler-source-evidence-v0.mjs'
import { checkArtifact } from './check-ziwei-life-body-palace-ruler-source-evidence-v0.mjs'

const mutations = [
  ['tampered_pdf_hash', artifact => { artifact.sourceWitnesses[0].pdf.sha256 = '0'.repeat(64) }],
  ['deleted_nanyang_ruler_locator', artifact => { artifact.locatorInventory.editions.find(edition => edition.editionId === 'nanyangtang').locators = artifact.locatorInventory.editions.find(edition => edition.editionId === 'nanyangtang').locators.filter(locator => locator.pdfPage !== 159) }],
  ['promoted_nanyang_surface_alias', artifact => { artifact.normalizedRules.nanyangRulers.shenZhu.aliasPolicy['火鈴星'].canonicalStarId = 'huoxing' }],
  ['invented_production_ruler', artifact => { artifact.comparison.rulers.production.rows[0].productionStatus = 'implemented'; artifact.comparison.rulers.production.rows[0].match = true }],
  ['non_exhaustive_life_body', artifact => { artifact.comparison.lifeBody.rows.pop(); artifact.comparison.lifeBody.inputCount = 143 }],
  ['promoted_readiness', artifact => { artifact.boundaries.stableClaimCount = 144; artifact.boundaries.readiness = 'ready' }],
  ['substituted_basis_head', artifact => { artifact.basisHead = artifact.artifactIdentity.generation.baseHead = artifact.deterministicContract.basisHead = 'cb9334d33a9e9eacfc15b508f019a9c8bdec3a56' }],
]

const artifact = await buildArtifact()
const findings = []
for (const [id, mutate] of mutations) {
  const candidate = structuredClone(artifact)
  mutate(candidate)
  const errors = await checkArtifact(candidate)
  if (!errors.length) findings.push({ id, error: 'mutation_not_rejected' })
}

console.log(JSON.stringify({ pass: findings.length === 0, mutationCount: mutations.length, findings }, null, 2))
if (findings.length) process.exitCode = 1
