import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const toPosix = value => value.split(sep).join('/')

async function walk(directory, rootDirectory, excludedDirectory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolutePath = join(directory, entry.name)
    const relativePath = toPosix(relative(rootDirectory, absolutePath))
    if (entry.isDirectory()) {
      if (relativePath === excludedDirectory || relativePath.startsWith(`${excludedDirectory}/`)) continue
      files.push(...await walk(absolutePath, rootDirectory, excludedDirectory))
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(relativePath)
    }
  }
  return files
}

export async function discoverDefaultTestFiles({ rootDirectory = 'test', excludedDirectory = 'de405-artifacts' } = {}) {
  const files = (await walk(rootDirectory, rootDirectory, excludedDirectory)).sort((a, b) => a.localeCompare(b))
  if (files.length === 0) throw new Error(`no default test files found under ${rootDirectory}`)
  return files
}

export async function discoverArtifactTestFiles({ rootDirectory = 'test', artifactDirectory = 'de405-artifacts' } = {}) {
  const files = (await walk(join(rootDirectory, artifactDirectory), join(rootDirectory, artifactDirectory), '__no_exclusion__'))
    .map(file => `${artifactDirectory}/${file}`)
    .sort((a, b) => a.localeCompare(b))
  if (files.length === 0) throw new Error(`no artifact test files found under ${join(rootDirectory, artifactDirectory)}`)
  return files
}
