import { readFile } from 'node:fs/promises'

const readiness = await readFile('src/astrology/verifiedAstrologyReadiness.js', 'utf8')
for (const token of ['availableForInterpretation: false', "integrationStatus: 'not_connected'", "serviceEligibility: 'blocked'", "activation_requires_user_approval"]) {
  if (!readiness.includes(token)) throw new Error(`readiness: missing boundary token ${token}`)
}
const adapter = await readFile('src/astrology/verifiedAstrologyAdapter.js', 'utf8')
for (const token of ['availableForInterpretation: false', "integrationStatus: 'not_connected'", "serviceEligibility: 'blocked'", "verified_adapter_not_activated"]) {
  if (!adapter.includes(token)) throw new Error(`adapter: missing boundary token ${token}`)
}
console.log('readiness/adapter boundary valid')
