import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { checkDe405OnlyRelease } from '../scripts/check-astrology-de405-only-release-v1.mjs'

const ROOT = resolve('.')
const PROVIDER = resolve('api/provider')
const REQUEST = JSON.parse(await readFile('test/fixtures/astrology/jplephem-preview-request-v1.json', 'utf8'))
const PYTHON = process.env.ASTROLOGY_PYTHON || 'python3'
const PYTHON_READY = spawnSync(PYTHON, ['-c', 'import jplephem, numpy'], { encoding: 'utf8' }).status === 0

async function copyReleaseFiles(root) {
  const provider = join(root, 'api/provider')
  await mkdir(provider, { recursive: true })
  for (const name of ['de405-only-release-contract-v1.json', 'NOTICE.md', 'de405.bsp']) await copyFile(join(PROVIDER, name), join(provider, name))
}

test('DE405-only release contract is source-bounded and CSPICE-free', async () => {
  const result = await checkDe405OnlyRelease()
  assert.deepEqual(result.errors, [])
  assert.equal(result.status, 'pass')
  assert.equal(result.contract.publicReleaseAllowed, true)
  assert.equal(result.contract.source.identity, 'unmodified_official_naif_de405_bsp')
  assert.equal(result.contract.provider.cspiceIncluded, false)
  assert.equal(result.contract.provider.spiceToolkitIncluded, false)
  assert.deepEqual(result.contract.runtimeCompatibility.python, {
    implementation: 'cpython',
    versionSeries: '3.14.x',
    abiTag: 'cpython-314',
    referenceVersion: '3.14.7',
    exactVersionEqualityRequired: false,
  })
  assert.deepEqual(result.contract.runtimeCompatibility.dependencies, { jplephem: '2.24', numpy: '2.5.3' })
  assert.equal((await stat(join(PROVIDER, 'de405.bsp'))).size, 10898432)
})

test('DE405-only release checker fails closed for contract, notice, BSP, and forbidden provider mutations', async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-de405-release-contract-'))
  try {
    await copyReleaseFiles(root)
    const contractPath = join(root, 'api/provider/de405-only-release-contract-v1.json')
    const contract = JSON.parse(await readFile(contractPath, 'utf8'))
    contract.publicReleaseAllowed = false
    await writeFile(contractPath, JSON.stringify(contract, null, 2) + '\n')
    let result = await checkDe405OnlyRelease({ root })
    assert.equal(result.status, 'fail')
    assert.ok(result.errors.includes('release_contract_sha256_mismatch'))

    await copyFile(join(PROVIDER, 'de405-only-release-contract-v1.json'), contractPath)
    await rm(join(root, 'api/provider/NOTICE.md'))
    result = await checkDe405OnlyRelease({ root })
    assert.equal(result.status, 'fail')
    assert.ok(result.errors.some(error => error.startsWith('notice_unreadable:')))

    await copyFile(join(PROVIDER, 'NOTICE.md'), join(root, 'api/provider/NOTICE.md'))
    await rm(join(root, 'api/provider/de405.bsp'))
    result = await checkDe405OnlyRelease({ root })
    assert.equal(result.status, 'fail')
    assert.ok(result.errors.some(error => error.startsWith('de405_unreadable:')))

    await copyFile(join(PROVIDER, 'de405.bsp'), join(root, 'api/provider/de405.bsp'))
    await writeFile(join(root, 'api/provider/cspice.a'), 'forbidden provider')
    result = await checkDe405OnlyRelease({ root })
    assert.equal(result.status, 'fail')
    assert.ok(result.errors.includes('cspice_or_toolkit_asset_present:cspice.a'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('preview producer rejects a missing or tampered DE405 release contract before FACT generation', { skip: !PYTHON_READY }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'astrology-de405-preview-contract-'))
  try {
    const missing = spawnSync(PYTHON, ['-c', `import importlib.util,json; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.RELEASE_CONTRACT_PATH=Path(${JSON.stringify(join(root, 'missing.json'))}); m.build_preview(json.loads(${JSON.stringify(JSON.stringify(REQUEST))}))`], { cwd: ROOT, encoding: 'utf8' })
    assert.notEqual(missing.status, 0)
    assert.match(missing.stderr, /de405_release_contract_missing/)

    await mkdir(join(root, 'api/provider'), { recursive: true })
    const contractPath = join(root, 'api/provider/de405-only-release-contract-v1.json')
    await copyFile(join(PROVIDER, 'de405-only-release-contract-v1.json'), contractPath)
    const contract = JSON.parse(await readFile(contractPath, 'utf8'))
    contract.publicReleaseAllowed = false
    await writeFile(contractPath, JSON.stringify(contract, null, 2) + '\n')
    const tampered = spawnSync(PYTHON, ['-c', `import importlib.util,json; from pathlib import Path; s=importlib.util.spec_from_file_location("a", "api/astrology.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.RELEASE_CONTRACT_PATH=Path(${JSON.stringify(contractPath)}); m.build_preview(json.loads(${JSON.stringify(JSON.stringify(REQUEST))}))`], { cwd: ROOT, encoding: 'utf8' })
    assert.notEqual(tampered.status, 0)
    assert.match(tampered.stderr, /de405_release_contract_sha_mismatch/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
