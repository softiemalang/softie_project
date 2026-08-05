import { BASIS_HEAD, buildArtifact, validateObservedHead } from './materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs'
import { checkArtifact } from './check-ziwei-palace-coordinate-semantic-identity-v0.mjs'
import { execFileSync } from 'node:child_process'

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
  const artifact = await buildArtifact({ observedHead: BASIS_HEAD }); mutate(artifact)
  const errors = await checkArtifact(artifact)
  if (!errors.length) findings.push(name)
}
const root = process.cwd()
const runCli = args => execFileSync(process.execPath, ['scripts/materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs', ...args], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
for (const [name, args] of [
  ['missing_observed_head', []],
  ['malformed_observed_head', ['--observed-head', 'not-a-commit']],
  ['unresolved_observed_head', ['--observed-head', '0'.repeat(40)]],
]) {
  try { runCli(args); findings.push(name) } catch { /* expected rejection */ }
}
const repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim()
const rootCommit = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim().split('\n')[0]
try { validateObservedHead({ root: repositoryRoot, observedHead: rootCommit }); findings.push('basis_to_observed_ancestry') } catch { /* expected rejection */ }
try { validateObservedHead({ root: repositoryRoot, observedHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), currentHead: BASIS_HEAD }); findings.push('observed_to_current_ancestry') } catch { /* expected rejection */ }
console.log(JSON.stringify({ pass: findings.length === 0, findings }, null, 2))
if (findings.length) process.exitCode = 1
