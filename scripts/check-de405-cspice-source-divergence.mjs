import { readFile } from 'node:fs/promises'
const path = process.argv[2] || 'docs/de405-cspice-source-divergence.json'; const v = JSON.parse(await readFile(path, 'utf8'))
if (v.schemaVersion !== 1 || v.recordType !== 'de405-cspice-source-divergence-audit' || v.comparison.divergenceCount !== 7 || v.divergences.length !== 7) throw new Error('source divergence audit contract failed')
if (v.sourceRoles.official.aggregateSha256 !== '6a50a493d82786783f468dfde2e904561d2d1cbb27ffed538137be999f18eb93' || v.sourceRoles.local.aggregateSha256 !== 'b5f541391b8750af347af6b5746e800b566826ba114e481e262b9caa8f8af0a8') throw new Error('source aggregate identity mismatch')
const categories = new Set(v.divergences.map(x => x.category)); for (const category of ['platform_specific_preprocessor', 'platform_tailoring_executable_code', 'platform_identity_executable_code', 'package_build_script_variant']) if (!categories.has(category)) throw new Error(`missing divergence category: ${category}`)
if (v.divergences.some(x => x.rawByteEqual || !x.path || !x.official?.sha256 || !x.local?.sha256)) throw new Error('incomplete raw divergence record')
console.log(JSON.stringify({ status: 'pass', divergenceCount: 7, categories: [...categories].sort(), officialAggregateSha256: v.sourceRoles.official.aggregateSha256, localAggregateSha256: v.sourceRoles.local.aggregateSha256 }, null, 2))
