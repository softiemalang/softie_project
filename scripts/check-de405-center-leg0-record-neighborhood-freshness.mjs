#!/usr/bin/env node
import { fresh } from './lib/de405-center-leg0-record-neighborhood.mjs'
const result = await fresh()
console.log(`DE405 center leg-0 record-neighborhood freshness: ${result.status}`)
if (result.error) console.error(result.error)
if (result.status !== 'fresh') process.exitCode = result.status === 'invalid' ? 3 : 1
