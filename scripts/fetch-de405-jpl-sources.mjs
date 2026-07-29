#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const EXPECTED_READER_SHA256 = '18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120'
const EXPECTED_BINARY_SIZE = 55900416
const EXPECTED_BINARY_SHA256 = '7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7'

const READER_URL = 'https://ssd.jpl.nasa.gov/ftp/eph/planets/fortran/testeph.f'
const BINARY_URL = 'https://ssd.jpl.nasa.gov/ftp/eph/planets/Linux/de405/lnxp1600p2200.405'

async function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function downloadFile(url, targetPath, expectedSize, expectedSha256) {
  console.log(`Downloading ${url}...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  if (expectedSize !== null && buffer.length !== expectedSize) {
    throw new Error(`Size mismatch for ${url}: got ${buffer.length}, expected ${expectedSize}`)
  }
  const hash = await sha256Buffer(buffer)
  if (hash !== expectedSha256) {
    throw new Error(`SHA-256 mismatch for ${url}: got ${hash}, expected ${expectedSha256}`)
  }

  const stagingDir = await mkdtemp(join(tmpdir(), '.de405-fetch-staging-'))
  const stagingFile = join(stagingDir, 'download.tmp')
  try {
    await writeFile(stagingFile, buffer)
    await rename(stagingFile, targetPath)
    console.log(`Successfully saved and verified: ${targetPath}`)
  } finally {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).reduce((acc, val, i, arr) => {
      if (val.startsWith('--')) acc.push([val.slice(2), arr[i + 1]])
      return acc
    }, [])
  )

  const targetDir = resolve(args['output-dir'] ?? join(root, 'tools/de405-jpl-reader/fixtures'))
  const readerPath = join(targetDir, 'testeph.f')
  const binaryPath = join(targetDir, 'lnxp1600p2200.405')

  const force = process.argv.includes('--force')

  // Check reader source
  let fetchReader = force
  if (!fetchReader) {
    try {
      const content = await readFile(readerPath)
      const hash = await sha256Buffer(content)
      if (hash === EXPECTED_READER_SHA256) {
        console.log(`Reader source ${readerPath} already present and valid.`)
      } else {
        console.log(`Reader source ${readerPath} hash mismatch, re-fetching...`)
        fetchReader = true
      }
    } catch {
      fetchReader = true
    }
  }

  if (fetchReader) {
    await downloadFile(READER_URL, readerPath, null, EXPECTED_READER_SHA256)
  }

  // Check binary
  let fetchBinary = force
  if (!fetchBinary) {
    try {
      const info = await stat(binaryPath)
      if (info.size === EXPECTED_BINARY_SIZE) {
        const content = await readFile(binaryPath)
        const hash = await sha256Buffer(content)
        if (hash === EXPECTED_BINARY_SHA256) {
          console.log(`JPL binary ${binaryPath} already present and valid.`)
        } else {
          console.log(`JPL binary ${binaryPath} hash mismatch, re-fetching...`)
          fetchBinary = true
        }
      } else {
        console.log(`JPL binary ${binaryPath} size mismatch, re-fetching...`)
        fetchBinary = true
      }
    } catch {
      fetchBinary = true
    }
  }

  if (fetchBinary) {
    await downloadFile(BINARY_URL, binaryPath, EXPECTED_BINARY_SIZE, EXPECTED_BINARY_SHA256)
  }

  console.log('JPL sources verified successfully.')
}

main().catch((err) => {
  console.error(`Fetch sources failed: ${err.message}`)
  process.exitCode = 1
})
