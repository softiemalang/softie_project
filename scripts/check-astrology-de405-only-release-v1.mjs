#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const CONTRACT_PATH = join(ROOT, 'api/provider/de405-only-release-contract-v1.json')
const NOTICE_PATH = join(ROOT, 'api/provider/NOTICE.md')
const BSP_PATH = join(ROOT, 'api/provider/de405.bsp')
const EXPECTED_CONTRACT_SHA256 = 'd1d8c2907358f9c7bd0c4d3f306b85d5fd9cae48a4249d8fd7b4f4a941ea29a7'
const EXPECTED_NOTICE_SHA256 = 'b9f19cbceebb8ab4f42e48f08542d15f01b0118d71740d816753a89ea3086d5a'
const EXPECTED_BSP_SHA256 = '30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89'
const EXPECTED_BSP_BYTES = 10898432
const EXPECTED_PROVIDER = Object.freeze({
  id: 'jplephem-2.24-direct-spk',
  jplephemVersion: '2.24',
  numpyVersion: '2.5.3',
  pythonVersion: '3.14.7',
  implementation: 'direct_spk',
  cspiceIncluded: false,
  spiceToolkitIncluded: false,
})

async function sha256File(path) {
  const hash = createHash('sha256')
  const bytes = await readFile(path)
  hash.update(bytes)
  return { bytes: bytes.length, sha256: hash.digest('hex') }
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export async function checkDe405OnlyRelease({ root = ROOT } = {}) {
  const contractPath = join(root, 'api/provider/de405-only-release-contract-v1.json')
  const noticePath = join(root, 'api/provider/NOTICE.md')
  const bspPath = join(root, 'api/provider/de405.bsp')
  const errors = []
  let contract = null
  let notice = ''

  try {
    contract = JSON.parse(await readFile(contractPath, 'utf8'))
  } catch (error) {
    errors.push(`release_contract_unreadable:${error.code || error.name}`)
  }
  try {
    notice = await readFile(noticePath, 'utf8')
  } catch (error) {
    errors.push(`notice_unreadable:${error.code || error.name}`)
  }

  let bspIdentity = null
  try {
    bspIdentity = await sha256File(bspPath)
  } catch (error) {
    errors.push(`de405_unreadable:${error.code || error.name}`)
  }

  if (contract) {
    const contractFile = await sha256File(contractPath)
    if (contractFile.sha256 !== EXPECTED_CONTRACT_SHA256) errors.push('release_contract_sha256_mismatch')
    if (contract.schemaVersion !== 'astrology-de405-only-release-contract-v1') errors.push('release_contract_schema_mismatch')
    if (contract.contractVersion !== '1.0.0') errors.push('release_contract_version_mismatch')
    if (contract.scope !== 'cspice_free_function_bundle_with_unmodified_de405_kernel') errors.push('release_scope_mismatch')
    if (contract.publicReleaseAllowed !== true || contract.releaseStatus !== 'allowed_for_unmodified_naif_kernel_scope') errors.push('public_release_gate_not_open_for_declared_scope')
    if (!same(contract.provider, EXPECTED_PROVIDER)) errors.push('provider_identity_mismatch')
    if (!same(contract.source, {
      sourceUrl: 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp',
      sha256: EXPECTED_BSP_SHA256,
      bytes: EXPECTED_BSP_BYTES,
      identity: 'unmodified_official_naif_de405_bsp',
      embeddedCommentsRetained: true,
      coverage: { startEt: '-1.5778799588160586e+09', endEt: '1.5778800641839132e+09' },
    })) errors.push('source_identity_mismatch')
    if (!same(contract.notice, {
      path: 'api/provider/NOTICE.md',
      sha256: EXPECTED_NOTICE_SHA256,
      bytes: 3781,
      containsNaifSourceAndCredit: true,
      containsDependencyLicenseSummary: true,
    })) errors.push('notice_identity_mismatch')
    if (contract.basis?.naifKernelRedistribution?.status !== 'permitted_when_unmodified' || contract.basis?.naifKernelRedistribution?.scopeMatch !== true) errors.push('naif_kernel_basis_mismatch')
    if (contract.basis?.cspiceToolkitRedistribution?.status !== 'not_applicable' || contract.basis?.cspiceDerivedExportDesignation?.status !== 'not_in_scope') errors.push('cspice_scope_boundary_mismatch')
    if (contract.boundaries?.onlyUnmodifiedDe405Kernel !== true || contract.boundaries?.noCspiceProductionDependency !== true || contract.boundaries?.noRuntimeProviderDownload !== true || contract.boundaries?.interpretationActivation !== false) errors.push('release_boundary_mismatch')
  }
  if (notice) {
    const noticeIdentity = await sha256File(noticePath)
    if (noticeIdentity.sha256 !== EXPECTED_NOTICE_SHA256 || noticeIdentity.bytes !== 3781) errors.push('notice_sha256_or_size_mismatch')
    for (const marker of ['de405.bsp', EXPECTED_BSP_SHA256, 'unmodified', 'NAIF rules', 'jplephem 2.24', 'NumPy 2.5.3', 'does not include CSPICE']) if (!notice.includes(marker)) errors.push(`notice_marker_missing:${marker}`)
  }
  if (bspIdentity && (bspIdentity.sha256 !== EXPECTED_BSP_SHA256 || bspIdentity.bytes !== EXPECTED_BSP_BYTES)) errors.push('de405_identity_mismatch')

  try {
    const providerFiles = (await readdir(join(root, 'api/provider'))).sort()
    for (const file of providerFiles) if (/\.(?:a|so|dylib|dll|elf)$/i.test(file) || /cspice|toolkit/i.test(file)) errors.push(`cspice_or_toolkit_asset_present:${file}`)
  } catch (error) {
    errors.push(`provider_directory_unreadable:${error.code || error.name}`)
  }

  return { status: errors.length ? 'fail' : 'pass', errors: [...new Set(errors)], contract }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    const result = await checkDe405OnlyRelease()
    console.log(JSON.stringify(result, null, 2))
    if (result.status !== 'pass') process.exitCode = 1
  } catch (error) {
    console.error(`DE405-only release check failed: ${error.message}`)
    process.exitCode = 1
  }
}
