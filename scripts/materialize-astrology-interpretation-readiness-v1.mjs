#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildAstrologyInterpretationContext } from '../src/astrology/interpretationConsumer.js'
import { evaluateAstrologyInterpretationReadiness, astrologyInterpretationReadinessContentSha256 } from '../src/astrology/interpretationReadiness.js'
import { packetContentSha256 } from '../src/astrology/interpretationPacket.js'
import { interpretationContextContentSha256 } from '../src/astrology/interpretationConsumer.js'

const packetEvidence = JSON.parse(await readFile(resolve(process.env.INTERPRETATION_PACKET_INPUT || 'artifacts/astrology-interpretation-packet-v1/complete.json'), 'utf8'))
const packet = packetEvidence.packet
const make = value => {
  const context = buildAstrologyInterpretationContext(value)
  return evaluateAstrologyInterpretationReadiness({ packet: value, context })
}
const complete = make(packet)
const mutate = (mutation, { preserveHash = false } = {}) => {
  const value = structuredClone(packet)
  mutation(value)
  if (!preserveHash) value.packetContentSha256 = packetContentSha256(value)
  return make(value)
}
const mutateContext = mutation => {
  const context = structuredClone(buildAstrologyInterpretationContext(packet))
  mutation(context)
  context.contextContentSha256 = interpretationContextContentSha256(context)
  return evaluateAstrologyInterpretationReadiness({ packet, context })
}
const cases = {
  complete,
  wrongSchemaVersion: mutate(value => { value.packetVersion = '9.9.9' }),
  packetContextHashMismatch: mutate(value => { value.packetContentSha256 = '0'.repeat(64) }, { preserveHash: true }),
  provenanceTampered: mutate(value => { value.identities.ruleChartSha256 = '1'.repeat(64) }),
  sourceRefsTampered: mutate(value => { value.provenance.sourceRefs = value.provenance.sourceRefs.filter(ref => ref !== 'rawChart') }),
  claimCountTampered: mutate(value => { value.verifiedBodies.pop() }),
  vocabularyTampered: mutate(value => { value.claimVocabulary.allowed[0].claimType = 'unregistered_claim' }),
  epistemicBoundaryMixed: mutate(value => { value.verifiedBodies[0].motion.epistemic = 'observed_or_calculated' }),
  activationInjected: mutate(value => { value.activation.availableForInterpretation = true; value.activation.integrationStatus = 'connected' }),
  placidusContamination: mutate(value => { value.wholeSignHouses.value.houseSystem = 'placidus' }),
  simulationContamination: mutate(value => { value.simulation = true }),
  frozenSpeedContamination: mutate(value => { value.speedModel = 'frozen' }),
  legacyPrepContamination: mutate(value => { value.legacyPrep = { status: 'available' } }),
  userDeliveryClaim: mutateContext(value => { value.consumer.externalLlm = true }),
  productionClaim: mutateContext(value => { value.consumer.productionConnection = true }),
}
const output = {
  schemaVersion: 'astrology-interpretation-readiness-evidence-v1',
  inputPacket: { schemaVersion: packet?.schemaVersion || null, packetContentSha256: packet?.packetContentSha256 || null },
  readiness: complete,
  cases,
  readinessContentSha256: astrologyInterpretationReadinessContentSha256(complete),
}
const outputDir = resolve(process.env.INTERPRETATION_READINESS_OUTPUT_DIR || 'artifacts/astrology-interpretation-readiness-v1')
await mkdir(outputDir, { recursive: true })
const outputPath = resolve(outputDir, 'complete.json')
const outputText = `${JSON.stringify(output, null, 2)}\n`
await writeFile(outputPath, outputText)
console.log(JSON.stringify({ output: outputPath, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), readinessContentSha256: output.readinessContentSha256, packetContentSha256: packet?.packetContentSha256 || null }, null, 2))
