#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const responsePath = process.argv[2]
if (!responsePath) throw new Error('usage: node scripts/check-astrology-jplephem-preview-v1.mjs RESPONSE.json')

const python = process.env.ASTROLOGY_PYTHON || 'python3'
const result = execFileSync(python, [resolve('api/astrology.py'), '--check', resolve(responsePath)], { encoding: 'utf8' })
process.stdout.write(result)
