#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, symlinkSync, statSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RUNNER_BIN = resolve(__dirname, 'build/de405-jpl-canonical-v2-runner')

function run() {
  const args = process.argv.slice(2)
  let binaryPath = null
  let expectedSha256 = null

  // Find --binary and optional --expected-binary-sha256
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--binary') {
      binaryPath = args[i + 1]
    }
    if (args[i] === '--expected-binary-sha256') {
      expectedSha256 = args[i + 1]
    }
  }

  // Create a temp dir
  let tempDir = mkdtempSync(join(tmpdir(), 'jpl-runner-'))
  let absBinaryPath = null
  
  try {
    if (binaryPath) {
      absBinaryPath = resolve(binaryPath)
      
      try {
        statSync(absBinaryPath)
      } catch (err) {
        console.error(`FATAL: JPL binary not found at ${absBinaryPath}`)
        process.exit(1)
      }

      if (expectedSha256) {
        const content = readFileSync(absBinaryPath)
        const actualSha256 = createHash('sha256').update(content).digest('hex')
        if (actualSha256 !== expectedSha256) {
          console.error(`FATAL: JPL binary SHA-256 mismatch. Expected ${expectedSha256}, got ${actualSha256}`)
          process.exit(1)
        }
      }

      // Create JPLEPH symlink in temp directory
      symlinkSync(absBinaryPath, join(tempDir, 'JPLEPH'))
      
      // Update args to use JPLEPH as the binary name for the underlying runner
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--binary') {
          args[i + 1] = 'JPLEPH'
        }
      }
    }

    // Filter out --expected-binary-sha256 before passing to underlying runner
    const filteredArgs = []
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--expected-binary-sha256') {
        i++ // skip the value too
        continue
      }
      filteredArgs.push(args[i])
    }

    // Intercept metadata call to inject actual opened path
    const isMetadataCall = filteredArgs.includes('--metadata')

    const result = spawnSync(RUNNER_BIN, filteredArgs, {
      cwd: tempDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      encoding: 'utf8'
    })

    if (result.error) {
      console.error(`Execution failed: ${result.error.message}`)
      process.exit(1)
    }

    if (result.stdout) {
      if (isMetadataCall) {
        try {
          const meta = JSON.parse(result.stdout)
          if (absBinaryPath) {
             meta.runtimeAdapter = {
               type: "jpleph-path-adapter",
               implementation: "run.mjs unique tempdir symlink",
               calculationChanges: "none",
               filesystemChanges: true,
               shellInvocation: false,
               cleanupPolicy: "finally-rmSync",
               concurrencyModel: "unique-temp-dir-per-execution",
               openedEphemerisPath: absBinaryPath
             }
          }
          process.stdout.write(JSON.stringify(meta) + '\n')
        } catch (e) {
          process.stdout.write(result.stdout)
        }
      } else {
        process.stdout.write(result.stdout)
      }
    }

    if (result.stderr) {
      process.stderr.write(result.stderr)
    }

    if (result.status !== null) {
      process.exit(result.status)
    } else {
      process.exit(1)
    }
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch (err) {
      // ignore cleanup errors
    }
  }
}

run()
