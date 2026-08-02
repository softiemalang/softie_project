import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => v.startsWith('--') ? [v.slice(2), a[i + 1]] : []).filter(Boolean))
for (const key of ['raw', 'image-id', 'image-archive-sha256', 'output']) if (!args[key]) throw new Error(`--${key} is required`)
const contract = JSON.parse(await readFile('docs/de405-legacy-alpine-toolchain-contract.json', 'utf8'))
const raw = resolve(args.raw)
const text = async name => (await readFile(resolve(raw, name), 'utf8')).trim()
const packageInfo = await text('package-info.txt')
for (const [name, version] of Object.entries(contract.packages)) {
  if (name === 'nodejs') continue
  if (!packageInfo.split('\n').some(line => line.startsWith(`${name}-${version}`))) throw new Error(`resolved package mismatch: ${name}=${version}`)
}
const packageLines = packageInfo.split('\n').filter(Boolean)
const packageLockSha256 = createHash('sha256').update(packageInfo + '\n').digest('hex')
const binarySha256 = Object.fromEntries((await text('tool-binary-sha256.txt')).split('\n').map(line => line.split(/\s+/, 2)).filter(pair => pair.length === 2).map(([hash, file]) => [file.split('/').at(-1), hash]))
const indexSha256 = (await text('apkindex-sha256.txt')).split('\n').filter(Boolean).map(line => line.split(/\s+/, 1)[0])
const repositories = (await text('repositories.txt')).split('\n').filter(Boolean)
const installedDbSha256 = (await text('installed-db-sha256.txt')).split(/\s+/, 1)[0]
const filesystemSha256 = await text('filesystem-sha256.txt')
const nodejs = packageLines.find(line => line.startsWith('nodejs-'))?.split(/\s+/, 1)[0]?.slice('nodejs-'.length)
if (!nodejs) throw new Error('resolved nodejs package missing')
const lock = {
  schemaVersion: 1,
  recordType: 'de405_alpine_toolchain_lock',
  fixture: false,
  architecture: contract.architecture,
  image: { baseReference: contract.image.reference, platform: contract.image.platform, id: args['image-id'], archiveSha256: args['image-archive-sha256'] },
  repositories,
  apkIndexSha256: indexSha256,
  installedDatabaseSha256: installedDbSha256,
  packageLockSha256,
  packages: { ...contract.packages, nodejs },
  packageInfo: packageLines,
  binarySha256: { ...binarySha256, muslLoader: binarySha256['ld-musl-x86_64.so.1'], node: binarySha256.node, ar: binarySha256.ar, ld: binarySha256.ld },
  filesystemSha256,
  retentionDays: 14
}
await writeFile(resolve(args.output), JSON.stringify(lock, null, 2) + '\n')
console.log(JSON.stringify({ status: 'pass', image: lock.image, packages: lock.packages, packageLockSha256 }, null, 2))
