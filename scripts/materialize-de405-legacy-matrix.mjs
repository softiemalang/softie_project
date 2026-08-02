import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i + 1]] : []).filter(Boolean))
for (const key of ['input', 'json', 'markdown']) if (!args[key]) throw new Error(`--${key} is required`)
const analysis = JSON.parse(await readFile(resolve(args.input), 'utf8'))
const summary = { schemaVersion: 1, recordType: analysis.recordType, baselineHead: analysis.baselineHead, referenceVariant: analysis.referenceVariant, corpus: analysis.corpus, classification: analysis.classification, qemuComparedAsHistoricalOnly: analysis.qemuComparedAsHistoricalOnly, comparisons: analysis.comparisons }
const markdown = `# DE405 legacy native matrix\n\n- Classification: \`${summary.classification}\`\n- Baseline HEAD: \`${summary.baselineHead}\`\n- Corpus rows/components: ${summary.corpus.rowCount}/${summary.corpus.componentCount}\n- QEMU: historical comparison only; not used by this workflow\n\n${summary.comparisons.map(c => `## ${c.variant}\n\n- Result hashes: ${c.resultHashes.reference} / ${c.resultHashes.variant}\n- Differing rows/components: ${c.differingRows}/${c.differingComponents}\n- First divergence: ${c.firstDivergence ? `${c.firstDivergence.sampleId}, ${c.firstDivergence.stage}, ${c.firstDivergence.component}` : 'none'}\n- ULP max/p50/p95/p99/p999: ${c.ulp.max}/${c.ulp.p50}/${c.ulp.p95}/${c.ulp.p99}/${c.ulp.p999}\n- Absolute max/p50/p95/p99/p999: ${c.absolute.max}/${c.absolute.p50}/${c.absolute.p95}/${c.absolute.p99}/${c.absolute.p999}\n- Control classification: ${c.classification}\n`).join('\n')}`
await writeFile(resolve(args.json), JSON.stringify(summary, null, 2) + '\n')
await writeFile(resolve(args.markdown), markdown)
console.log(JSON.stringify({ json: resolve(args.json), markdown: resolve(args.markdown), byteStable: true }, null, 2))
