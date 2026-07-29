import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
export async function sha256(file) { return createHash('sha256').update(await readFile(file)).digest('hex') }
export function sha256Bytes(bytes) { return createHash('sha256').update(bytes).digest('hex') }
