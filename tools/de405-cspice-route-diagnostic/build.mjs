import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const cspice = resolve(process.env.CSPICE_DIR || '/Users/softie/.local/share/softie-de405/cspice/N0067')
const sourceRoot = resolve(cspice, 'src/cspice')
const build = resolve(root, 'build')
const instrumented = resolve(build, 'instrumented-source')
const compiler = process.env.CC || 'cc'
const files = ['spkgeo.c', 'spkpvn.c', 'spkr02.c', 'spke02.c']
const routeFiles = ['spkez_c.c', 'spkez.c', 'spkgeo.c', 'spkbsr.c', 'spkpvn.c', 'spkr02.c', 'spke02.c', 'chbint.c']

await rm(build, { recursive: true, force: true })
await mkdir(instrumented, { recursive: true })
for (const file of files) await cp(resolve(sourceRoot, file), resolve(instrumented, file))

{
  const path = resolve(instrumented, 'spkgeo.c')
  let text = await readFile(path, 'utf8')
  text = text.replaceAll('vaddg_(', 'de405_diag_vaddg_(').replaceAll('vsubg_(', 'de405_diag_vsubg_(')
    .replaceAll('moved_(', 'de405_diag_moved_(').replaceAll('mxv_(', 'de405_diag_mxv_(').replaceAll('mxvg_(', 'de405_diag_mxvg_(')
  text = text.replace('#include "f2c.h"', '#include "f2c.h"\nextern int de405_diag_vaddg_(doublereal *, doublereal *, integer *, doublereal *);\nextern int de405_diag_vsubg_(doublereal *, doublereal *, integer *, doublereal *);\nextern int de405_diag_moved_(doublereal *, integer *, doublereal *);\nextern int de405_diag_mxv_(doublereal *, doublereal *, doublereal *);\nextern int de405_diag_mxvg_(doublereal *, doublereal *, integer *, integer *, doublereal *);')
  await writeFile(path, text)
}

const replacements = [
  ['spkpvn.c', '    dafus_(descr, &c__2, &c__6, dc, ic);', '    dafus_(descr, &c__2, &c__6, dc, ic);\n    de405_diag_segment(*et, ic, *ref);'],
  ['spkr02.c', '    recno = min(recno,nrec);', '    recno = min(recno,nrec);\n    de405_diag_record(*et, recno, recsiz, begin);'],
  ['spke02.c', '    integer cofloc;', '    integer cofloc;\n    extern void de405_diag_evaluator(doublereal, doublereal *, integer, doublereal *);'],
  ['spke02.c', '    return 0;\n} /* spke02_ */', '    de405_diag_evaluator(*et, record, ncof, xyzdot);\n    return 0;\n} /* spke02_ */']
]
for (const [file, from, to] of replacements) {
  const path = resolve(instrumented, file)
  let text = await readFile(path, 'utf8')
  if (!text.includes(from)) throw new Error(`instrumentation anchor missing: ${file}`)
  text = text.replace(from, to)
  if (file !== 'spke02.c') text = text.replace('#include "f2c.h"', '#include "f2c.h"\nextern void de405_diag_segment(doublereal, integer *, integer);\nextern void de405_diag_record(doublereal, integer, integer, integer);')
  await writeFile(path, text)
}

const source = resolve(root, 'src/de405_cspice_route_diagnostic.c')
const diag = resolve(root, 'src/de405_cspice_route_events.c')
const out = resolve(build, 'de405-cspice-route-diagnostic')
const flags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', `-I${resolve(cspice, 'include')}`, `-I${resolve(cspice, 'include')}`, source, diag,
  ...files.map(file => resolve(instrumented, file)), resolve(cspice, 'lib/cspice.a'), resolve(cspice, 'lib/csupport.a'), '-lm', '-o', out]
execFileSync(compiler, flags, { stdio: 'inherit' })
const hashes = {}
for (const file of files) hashes[file] = createHash('sha256').update(await readFile(resolve(sourceRoot, file))).digest('hex')
const routeSourceHashes = {}
for (const file of routeFiles) routeSourceHashes[file] = createHash('sha256').update(await readFile(resolve(sourceRoot, file))).digest('hex')
const binarySha256 = createHash('sha256').update(await readFile(out)).digest('hex')
const canonicalFlags = ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', '-I<CSPICE_N0067/include>', ...files.map(file => `<instrumented-source>/${file}`), ...files.map(file => `<CSPICE_N0067/src/cspice>/${file}`), '<CSPICE_N0067/lib/cspice.a>', '<CSPICE_N0067/lib/csupport.a>', '-lm', '-o', '<build>/de405-cspice-route-diagnostic']
await writeFile(resolve(build, 'route-build.json'), JSON.stringify({ schemaVersion: 1, toolkitVersion: 'N0067', compiler, flags: canonicalFlags, sourceRoot: 'CSPICE_N0067/src/cspice', routeSourceFiles: routeSourceHashes, instrumentedFiles: hashes, binarySha256 }, null, 2) + '\n')
console.log(JSON.stringify({ binary: out, binarySha256 }, null, 2))
