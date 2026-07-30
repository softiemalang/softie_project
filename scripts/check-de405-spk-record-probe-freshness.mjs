#!/usr/bin/env node
import { validateProbeFreshness } from './lib/de405-spk-record-probe.mjs'
const result=await validateProbeFreshness(); console.log(`DE405 SPK record probe freshness: ${result.status}`); if(result.error)console.error(result.error); if(result.status!=='fresh')process.exitCode=result.status==='invalid'?3:1
