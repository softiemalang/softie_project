import { prepareInterpretationData } from '../src/interpretationPrep/prepare.js'
import { buildInterpretationPrompt } from '../src/interpretationPrep/promptAdapter.js'
import { BENCHMARK_CASES, QUALITY_RUBRIC } from './fixtures/interpretation/benchmarkCases.js'
import fs from 'node:fs'
import path from 'node:path'

export function generatePromptBenchmarkReport() {
  const results = BENCHMARK_CASES.map((c) => {
    const prep = prepareInterpretationData(c.input)
    const pkg = buildInterpretationPrompt(prep.interpretationContext, {
      topicId: c.topicId,
      question: c.question,
    })

    return {
      id: c.id,
      title: c.title,
      confidence: pkg.contextPayload.calculationConfidence.stateContract.confidence,
      topicLabel: pkg.interpretationTask.topicLabel,
      promptPackage: pkg,
      rubric: QUALITY_RUBRIC,
      maxScore: 12,
    }
  })

  const reportPath = path.resolve(process.cwd(), 'test/fixtures/interpretation/baselinePromptReport.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8')
  return { results, reportPath }
}

if (process.argv[1] && process.argv[1].endsWith('interpretationPromptBenchmark.js')) {
  console.log('================================================================')
  console.log('    ✨ INTERPRETATION PROMPT BENCHMARK REPORT GENERATOR (12pt MAX)')
  console.log('================================================================\n')

  const { results, reportPath } = generatePromptBenchmarkReport()

  results.forEach((r) => {
    console.log(`[CASE ID]: ${r.id}`)
    console.log(`[CASE TITLE]: ${r.title}`)
    console.log(`[CONFIDENCE]: ${r.confidence}`)
    console.log(`[TOPIC]: ${r.topicLabel}`)
    console.log('[QUALITY RUBRIC CHECKLIST (12pt MAX)]:')
    r.rubric.forEach((item) => console.log(`  - ${item.criterion} (${item.scale})`))
    console.log('----------------------------------------------------------------\n')
  })

  console.log(`✅ Baseline prompt benchmark report saved to: ${reportPath}`)
}
