import test from 'node:test'
import assert from 'node:assert/strict'
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve('.')
const sourceToolDir = join(root, 'tools/de405-cspice-runner')

async function createToolkitRoot(parent, name) {
  const toolkitRoot = join(parent, name)
  await mkdir(join(toolkitRoot, 'include'), { recursive: true })
  await mkdir(join(toolkitRoot, 'lib'), { recursive: true })
  await Promise.all([
    writeFile(join(toolkitRoot, 'include/SpiceUsr.h'), ''),
    writeFile(join(toolkitRoot, 'lib/cspice.a'), ''),
    writeFile(join(toolkitRoot, 'lib/csupport.a'), '')
  ])
  return toolkitRoot
}

async function createFakeCompiler(parent) {
  const compiler = join(parent, 'fake-cc.mjs')
  await writeFile(compiler, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
const outputIndex = process.argv.indexOf('-o')
if (outputIndex < 0) process.exit(2)
writeFileSync(process.argv[outputIndex + 1], 'fake runner\\n')
`)
  await chmod(compiler, 0o755)
  return compiler
}

async function runBuild(toolDir, configuredDir, compiler) {
  return spawnSync(process.execPath, [join(toolDir, 'build.mjs')], {
    cwd: toolDir,
    env: { ...process.env, CSPICE_DIR: configuredDir, CC: compiler },
    encoding: 'utf8'
  })
}

async function copyBuildTool(parent) {
  const toolDir = join(parent, 'de405-cspice-runner')
  await mkdir(join(toolDir, 'src'), { recursive: true })
  await cp(join(sourceToolDir, 'build.mjs'), join(toolDir, 'build.mjs'))
  await cp(join(sourceToolDir, 'src/de405_canonical_v2.c'), join(toolDir, 'src/de405_canonical_v2.c'))
  return toolDir
}

test('CSPICE build resolves direct and N0067 parent layouts without native compilation', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'de405-cspice-build-path-'))
  try {
    const toolDir = await copyBuildTool(tempRoot)
    const compiler = await createFakeCompiler(tempRoot)
    const directRoot = await createToolkitRoot(tempRoot, 'direct-root')
    const parentRoot = join(tempRoot, 'distribution-parent')
    const nestedRoot = await createToolkitRoot(parentRoot, 'N0067')

    const direct = await runBuild(toolDir, directRoot, compiler)
    assert.equal(direct.status, 0, direct.stderr)
    const directMetadata = JSON.parse(await readFile(join(toolDir, 'build/runner-build.json'), 'utf8'))
    assert.ok(directMetadata.buildFlags.includes(`-I${directRoot}/include`))

    const nested = await runBuild(toolDir, parentRoot, compiler)
    assert.equal(nested.status, 0, nested.stderr)
    const nestedMetadata = JSON.parse(await readFile(join(toolDir, 'build/runner-build.json'), 'utf8'))
    assert.ok(nestedMetadata.buildFlags.includes(`-I${nestedRoot}/include`))

    const bothRoot = await createToolkitRoot(tempRoot, 'both-root')
    await createToolkitRoot(bothRoot, 'N0067')
    const priority = await runBuild(toolDir, bothRoot, compiler)
    assert.equal(priority.status, 0, priority.stderr)
    const priorityMetadata = JSON.parse(await readFile(join(toolDir, 'build/runner-build.json'), 'utf8'))
    assert.ok(priorityMetadata.buildFlags.includes(`-I${bothRoot}/include`))
    assert.ok(!priorityMetadata.buildFlags.includes(`-I${join(bothRoot, 'N0067')}/include`))

    const invalid = await runBuild(toolDir, join(tempRoot, 'missing-root'), compiler)
    assert.notEqual(invalid.status, 0)
    assert.match(invalid.stderr, /ENOENT|no such file or directory/i)
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})
