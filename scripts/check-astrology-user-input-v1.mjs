import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const responsePath = process.argv[2]
if (!responsePath) throw new Error('usage: node scripts/check-astrology-user-input-v1.mjs RESPONSE.json')

const python = process.env.ASTROLOGY_PYTHON || 'python3'
const output = execFileSync(python, [resolve('api/astrology.py'), '--check-user-input', resolve(responsePath)], { encoding: 'utf8' })
process.stdout.write(output)
