import { execFileSync } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=dirname(fileURLToPath(import.meta.url));const out=resolve(root,'build/de405-binary64-composition-probe');await mkdir(dirname(out),{recursive:true});const flags=['-std=c11','-O2','-Wall','-Wextra','-Werror',resolve(root,'src/de405_binary64_composition_probe.c'),'-lm','-o',out];execFileSync(process.env.CC||'cc',flags,{stdio:'inherit'});const h=createHash('sha256').update(await readFile(out)).digest('hex');await writeFile(resolve(root,'build/runner-build.json'),JSON.stringify({compiler:process.env.CC||'cc',flags,binarySha256:h,sizeofDouble:8,dbMantDig:53,fltRadix:2,rounding:'FE_TONEAREST'},null,2)+'\n');console.log(JSON.stringify({binary:out,binarySha256:h},null,2))
