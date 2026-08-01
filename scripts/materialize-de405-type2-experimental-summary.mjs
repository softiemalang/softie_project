#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const parity = await read('artifacts/de405-type2-experimental-evaluator-parity.jsonl.summary.json')
const unique = await read('artifacts/de405-type2-experimental-unique-instance-parity.jsonl.summary.json')
const shadow = await read('artifacts/de405-type2-experimental-shadow-impact.jsonl.summary.json')
const summary = { schemaVersion: 1, recordType: 'de405_type2_experimental_official_order_summary', evaluator: { production: 'project_owned_type2_chbint_recurrence_v1', experimental: 'de405_type2_experimental_official_chbint_order_v1', official: 'CSPICE_N0067:spke02_->chbint_' }, phase154: parity, uniqueCorpus: unique, shadowImpact: shadow, protectedBehavior: { productionEvaluatorChanged: false, canonicalSelectionChanged: false, toleranceContractsChanged: false, defaultRoutingChanged: false, globalCompilerPolicyChanged: false, productionEffect: 'none' }, aggregateHash: createHash('sha256').update(JSON.stringify({ parity, unique, shadow })).digest('hex') }
await writeFile(resolve(root, process.argv[2] || 'artifacts/de405-type2-experimental-official-order-summary.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(JSON.stringify({ output: process.argv[2] || 'artifacts/de405-type2-experimental-official-order-summary.json', aggregateHash: summary.aggregateHash }, null, 2))
