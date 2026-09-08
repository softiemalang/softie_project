import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = process.cwd()
const read = path => readFileSync(join(root, path), 'utf8')

const app = read('src/App.jsx')
const home = read('src/pages/HomePage.jsx')
const band = read('src/pages/BandPage.jsx')
const evaluations = read('src/saju/SajuEvaluationPage.jsx')
const api = read('src/saju/api.js')
const reportGenerator = read('src/saju/interpreter/reportGenerator.js')
const reportEdge = read('supabase/functions/generate-fortune-report/index.ts')
const oauth = read('supabase/functions/_shared/googleOAuth.ts')
const config = read('supabase/config.toml')

test('Softie Fortune 전용 runtime surface와 profile endpoint는 제거되고 canonical entry는 유지된다', () => {
  assert.equal(existsSync(join(root, 'src/saju/SoftieFortunePage.jsx')), false)
  assert.equal(existsSync(join(root, 'supabase/functions/get-softie-saju-profile/index.ts')), false)

  for (const [name, source] of Object.entries({ app, home, band, evaluations, api, oauth, config })) {
    assert.doesNotMatch(source, /SoftieFortunePage|\/softie-fortune|get-softie-saju-profile|getSoftieSajuProfile|SOFTIE FORTUNE/, name)
  }

  assert.match(app, /pathname\.startsWith\('\/interpretation-prep'\)/)
  assert.match(home, /path: '\/interpretation-prep'/)
  assert.match(band, /navigate\('\/interpretation-prep'\)/)
  assert.match(evaluations, /navigate\('\/interpretation-prep'\)/)
})

test('공유 report/history/API/Edge와 외부 Softie reference 계약은 보존된다', () => {
  for (const marker of [
    'getNatalSnapshot',
    'getFortuneReport',
    'getPublicFortuneReport',
    'getPublicFortuneHistory',
    'requestLlmReport',
  ]) assert.match(api, new RegExp(marker), marker)

  assert.match(reportGenerator, /requestLlmReport/)
  assert.match(reportGenerator, /saveFortuneReport/)
  assert.match(reportEdge, /softiePersonalRag/)
  assert.match(reportEdge, /Deno\.serve/)

  assert.equal(existsSync(join(root, 'src/saju/personal/softiePersonalReference.js')), true)
  assert.equal(existsSync(join(root, 'references/softie-fortune/softie-report-style-reference-current.txt')), true)
  assert.match(app, /pathname\.startsWith\('\/fortune'\)/)
  assert.match(app, /buttonPath="\/interpretation-prep"/)
})
