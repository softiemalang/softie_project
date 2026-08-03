#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildAstrologyInterpretationContext, interpretationContextContentSha256 } from '../src/astrology/interpretationConsumer.js'

const inputPath = resolve(process.env.INTERPRETATION_PACKET_INPUT || 'artifacts/astrology-interpretation-packet-v1/complete.json')
const evidence = JSON.parse(await readFile(inputPath, 'utf8'))
const packet = evidence.packet
const context = buildAstrologyInterpretationContext(packet)
const mutate = (fn) => {
  const value = structuredClone(packet)
  fn(value)
  return buildAstrologyInterpretationContext(value)
}
const cases = {
  complete: context,
  wrongVersion: mutate(value => { value.packetVersion = '9.9.9' }),
  activationPromoted: mutate(value => { value.activation.availableForInterpretation = true }),
  forbiddenClaim: mutate(value => { value.verifiedBodies[0].forbidden = { claimType: 'psychological_diagnosis', value: 'x', sourceRefs: ['ruleChart.bodies.sun.motionState'], epistemic: 'deterministically_derived' } }),
  missingClaimSourceRefs: mutate(value => { delete value.verifiedBodies[0].longitudeDegrees.sourceRefs }),
  mixedEpistemicBoundary: mutate(value => { value.verifiedBodies[0].motion.epistemic = 'observed_or_calculated' }),
  placidusContamination: mutate(value => { value.wholeSignHouses.value.houseSystem = 'placidus' }),
  simulationContamination: mutate(value => { value.simulation = true }),
  frozenSpeedContamination: mutate(value => { value.speedModel = 'frozen' }),
  legacyPrepContamination: mutate(value => { value.legacyPrep = { status: 'available' } }),
  packetContentHashMismatch: mutate(value => { value.packetContentSha256 = '0'.repeat(64) }),
  provenanceMismatch: mutate(value => { value.identities.ruleChartSha256 = '1'.repeat(64) }),
  packetVocabularyMismatch: mutate(value => { value.claimVocabulary.allowed[0].claimType = 'unregistered_claim' }),
}
const output = {
  schemaVersion: 'astrology-interpretation-context-evidence-v1',
  inputPacket: { schemaVersion: packet?.schemaVersion || null, packetVersion: packet?.packetVersion || null, packetContentSha256: packet?.packetContentSha256 || null },
  context,
  cases,
  contextContentSha256: interpretationContextContentSha256(context),
}
const outputDir = resolve(process.env.INTERPRETATION_CONTEXT_OUTPUT_DIR || 'artifacts/astrology-interpretation-context-v1')
await mkdir(outputDir, { recursive: true })
const outputPath = resolve(outputDir, 'complete.json')
const outputText = `${JSON.stringify(output, null, 2)}\n`
await writeFile(outputPath, outputText)
console.log(JSON.stringify({ output: outputPath, artifactByteSha256: createHash('sha256').update(outputText).digest('hex'), contextContentSha256: output.contextContentSha256, packetContentSha256: output.inputPacket.packetContentSha256 }, null, 2))
