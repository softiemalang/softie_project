const result = document.querySelector('#result')
const button = document.querySelector('#run-probe')

async function sha256Hex(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function fetchArtifact(url) {
  const response = await fetch(url, { cache: 'default' })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  const buffer = await response.arrayBuffer()
  return {
    url: response.url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    cacheControl: response.headers.get('cache-control'),
    bytes: buffer.byteLength,
    sha256: await sha256Hex(buffer),
    buffer,
  }
}

async function runProbe() {
  button.disabled = true
  result.textContent = 'Loading…'
  try {
    const [wasm, planetShape, moonShape] = await Promise.all([
      fetchArtifact('/probe/asset-probe.wasm'),
      fetchArtifact('/probe/sepl-shape.bin'),
      fetchArtifact('/probe/semo-shape.bin'),
    ])
    const instance = await WebAssembly.instantiate(wasm.buffer, {})
    const calculation = instance.instance.exports.astro_asset_probe(19, 23)
    result.textContent = JSON.stringify({
      kind: 'license-neutral-transport-only',
      calculation,
      artifacts: [wasm, planetShape, moonShape].map(({ buffer, ...item }) => item),
    }, null, 2)
  } catch (error) {
    result.textContent = JSON.stringify({
      kind: 'probe-failure',
      message: error instanceof Error ? error.message : String(error),
    }, null, 2)
  } finally {
    button.disabled = false
  }
}

button.addEventListener('click', runProbe)
runProbe()
