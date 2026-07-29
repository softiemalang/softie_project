import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
test('fake runner exposes explicit test-only version metadata',()=>{const r=spawnSync(process.execPath,['test/helpers/fake-de405-cspice-runner.mjs','--version'],{encoding:'utf8'}); assert.equal(r.status,0); const v=JSON.parse(r.stdout); assert.equal(v.cspiceToolkitVersion,'N0067'); assert.equal(v.testOnly,true)})
