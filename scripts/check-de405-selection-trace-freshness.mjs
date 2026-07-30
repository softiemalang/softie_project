#!/usr/bin/env node
import { validateSelectionTraceFreshness } from './lib/de405-selection-trace.mjs'

const result = await validateSelectionTraceFreshness()
console.log(`DE405 selection trace freshness: ${result.status}`)
if (result.error) console.error(result.error)
if (result.status !== 'fresh') process.exitCode = result.status === 'invalid' ? 3 : 1
