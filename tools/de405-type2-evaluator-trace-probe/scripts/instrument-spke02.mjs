import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export const SOURCE_HASHES = Object.freeze({
  spke02: 'e6d934db2793c3cf10b590743db6609a089383551881c5add229eb585ea0472b',
  chbint: '0d37a160f6e5cf2542b21653631650df5db581f18e2d8012786d072ac77e99ca'
})

const sha256 = text => createHash('sha256').update(text).digest('hex')

function patchOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1
  if (count !== 1) throw new Error(`instrumentation anchor ${label} count=${count}`)
  return source.replace(needle, replacement)
}

export async function instrument({ cspiceRoot, outputDir }) {
  const sourceRoot = resolve(cspiceRoot, 'src/cspice')
  const originals = {
    spke02: resolve(sourceRoot, 'spke02.c'),
    chbint: resolve(sourceRoot, 'chbint.c')
  }
  const source = {}
  for (const [name, path] of Object.entries(originals)) {
    source[name] = await readFile(path, 'utf8')
    const actual = sha256(source[name])
    if (actual !== SOURCE_HASHES[name]) throw new Error(`unexpected ${name} source SHA-256: ${actual}`)
  }

  let spke02 = source.spke02.replaceAll('spke02_', 'de405_spke02_trace_').replaceAll('chbint_', 'de405_chbint_trace_')
  spke02 = patchOnce(spke02, '/*     SPICELIB functions */', '/*     SPICELIB functions */\n    extern void de405_trace_component_begin(int, integer, integer, doublereal *);', 'spke02 declarations')
  spke02 = patchOnce(spke02, '\tde405_chbint_trace_(', '\tde405_trace_component_begin((int)i__ - 1, cofloc - 1, ncof, record);\n\tde405_chbint_trace_(', 'spke02 component callback')

  let chbint = source.chbint.replace('int chbint_', 'int de405_chbint_trace_')
  chbint = patchOnce(chbint, '#include "f2c.h"', '#include "f2c.h"\n\nextern void de405_trace_normalized_time(doublereal, doublereal);\nextern void de405_trace_iteration(integer, doublereal, doublereal, doublereal, doublereal, doublereal, doublereal, doublereal);\nextern void de405_trace_polynomial_result(doublereal, doublereal);\nextern void de405_trace_velocity_scaled(doublereal, doublereal);', 'chbint declarations')
  chbint = patchOnce(chbint, '    s2 = s * 2.;', '    s2 = s * 2.;\n    de405_trace_normalized_time(s, s2);', 'normalized time callback')
  chbint = patchOnce(chbint, 'dw[0] = w[1] * 2. + dw[1] * s2 - dw[2];', 'dw[0] = w[1] * 2. + dw[1] * s2 - dw[2];\n\tde405_trace_iteration(j, cp[j - 1], w[0], w[1], w[2], dw[0], dw[1], dw[2]);', 'official recurrence callback')
  chbint = patchOnce(chbint, '    *dpdx = w[0] + s * dw[0] - dw[1];', '    *dpdx = w[0] + s * dw[0] - dw[1];\n    de405_trace_polynomial_result(*p, *dpdx);', 'official polynomial callback')
  chbint = patchOnce(chbint, '    *dpdx /= x2s[1];', '    *dpdx /= x2s[1];\n    de405_trace_velocity_scaled(*dpdx, x2s[1]);', 'official scaling callback')

  await mkdir(outputDir, { recursive: true })
  const paths = { spke02: resolve(outputDir, 'spke02.instrumented.c'), chbint: resolve(outputDir, 'chbint.instrumented.c') }
  await writeFile(paths.spke02, spke02)
  await writeFile(paths.chbint, chbint)
  return {
    sourceHashes: SOURCE_HASHES,
    sourcePaths: originals,
    instrumentedPaths: paths,
    patcher: 'tools/de405-type2-evaluator-trace-probe/scripts/instrument-spke02.mjs'
  }
}
