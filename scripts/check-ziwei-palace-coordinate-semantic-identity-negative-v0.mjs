import { buildArtifact } from './materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs'
import { checkArtifact } from './check-ziwei-palace-coordinate-semantic-identity-v0.mjs'

const cases = [
  ['sourceRef', a => { a.sourceWitnessIndex.sourceRefs[0].page = 99 }],
  ['mapping', a => { a.sourceWitnessIndex.diagram.clockwiseSequence[0] = '丑' }],
  ['direction', a => { a.rows[0].source.direction = 'reverse' }],
  ['candidate', a => { a.candidateMatrix.relationResults.find(x => x.candidateId === 'rotation-06').matchCount = 149 }],
  ['blocker', a => { a.blockerRegistry[0].status = 'resolved' }],
  ['hash', a => { a.sourceWitnessIndex.source.sha256 = '0'.repeat(64) }],
]

const findings = []
for (const [name, mutate] of cases) {
  const artifact = await buildArtifact(); mutate(artifact)
  const errors = await checkArtifact(artifact)
  if (!errors.length) findings.push(name)
}
console.log(JSON.stringify({ pass: findings.length === 0, findings }, null, 2))
if (findings.length) process.exitCode = 1
