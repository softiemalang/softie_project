#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { deriveAstrologyRuleChart } from '../src/astrology/astrologyRuleCore.js'
import {
  canonicalSha256,
  createVerifiedAstrologyAdapterContext,
  VERIFIED_ASTROLOGY_ADAPTER_VERSION,
} from '../src/astrology/verifiedAstrologyAdapter.js'

export async function materializeVerifiedAstrologyDryRun({ evidencePath = 'test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json' } = {}) {
  const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))
  const rawChart = evidence.rawChart.value
  const ruleChart = deriveAstrologyRuleChart(rawChart)
  const rawChartHash = canonicalSha256(rawChart)
  const ruleChartHash = canonicalSha256(ruleChart)
  const provenance = {
    rawChartSha256: rawChartHash,
    ruleChartSha256: ruleChartHash,
    goldenEvidence: 'test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json',
    rawEvidenceSha256: '0236f31d83a98110dca217a1215378d2de7bd2e502a5eee673ba1877d0304d71',
    ruleEvidenceSha256: 'dcccdcef89549c6b5374abe8b3a78ba58c7fd2bd99cb3bf70631c599ff9e1e2f',
  }
  const adapter = createVerifiedAstrologyAdapterContext({
    rawChart, ruleChart, rawChartHash, ruleChartHash, provenance,
    inputCompleteness: { time: 'complete', location: 'complete', evidence: 'complete' },
  })
  if (!adapter.calculationContext) throw new Error(`verified adapter blocked: ${adapter.status.reason}`)

  const payload = {
    schemaVersion: 'astrology-verified-adapter-dry-run-evidence-v1',
    adapterVersion: VERIFIED_ASTROLOGY_ADAPTER_VERSION,
    input: { rawChartHash, ruleChartHash, goldenEvidence: provenance.goldenEvidence },
    chartSystem: adapter.calculationContext.chartSystem,
    bodies: adapter.calculationContext.bodies.map(({ id, longitudeDegrees, movingFrameSpeedDegreesPerDay, motion }) => ({ id, longitudeDegrees, movingFrameSpeedDegreesPerDay, motion })),
    angles: adapter.calculationContext.angles,
    houses: { availability: adapter.calculationContext.houses.availability, houseSystem: adapter.calculationContext.houses.houseSystem, placements: adapter.calculationContext.houses.placements },
    aspects: adapter.calculationContext.aspects,
    distribution: adapter.calculationContext.distribution,
    compatibility: { decision: 'compatible_additively_only', matrix: 'docs/astrology/verified-adapter-compatibility-matrix.json' },
    simulationContamination: false,
    service: adapter.status,
  }
  const outputSha256 = canonicalSha256(payload)
  return { ...payload, outputSha256 }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDir = 'artifacts'
  const jsonPath = join(outputDir, 'astrology-verified-adapter-dry-run-v1.json')
  const markdownPath = join(outputDir, 'astrology-verified-adapter-dry-run-v1.md')
  const output = await materializeVerifiedAstrologyDryRun()
  await mkdir(outputDir, { recursive: true })
  await writeFile(jsonPath, `${JSON.stringify(output, null, 2)}\n`)
  await writeFile(markdownPath, `# Verified Astrology Adapter v1 dry-run\n\n- Raw SHA-256: \`${output.input.rawChartHash}\`\n- Rule Core SHA-256: \`${output.input.ruleChartHash}\`\n- Output SHA-256: \`${output.outputSha256}\`\n- Bodies: 10; angles: ASC/MC\n- Chart system: tropical, geocentric, geometric, mean ecliptic/equinox-of-date, Whole Sign, DE405 canonical-v2\n- Simulation contamination: false\n- Service activation: blocked (` + output.service.reason + `)\n`)
  console.log(JSON.stringify({ jsonPath, markdownPath, outputSha256: output.outputSha256 }, null, 2))
}
