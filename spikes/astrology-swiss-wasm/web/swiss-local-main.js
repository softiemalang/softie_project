const result = document.querySelector('#result')

async function run() {
  try {
    const moduleUrl = new URL('/swiss/swiss-spike.mjs', window.location.origin).href
    const { default: createSwissSpike } = await import(/* @vite-ignore */ moduleUrl)
    const module = await createSwissSpike({
      locateFile(fileName) {
        return `/swiss/${fileName}`
      },
    })
    const call = (name, returnType, argumentTypes = [], args = []) => (
      module.ccall(name, returnType, argumentTypes, args)
    )
    call('astro_spike_init', null, ['string'], ['/ephe'])
    const julianDayUt = call(
      'astro_spike_julday',
      'number',
      ['number', 'number', 'number', 'number'],
      [2000, 1, 1, 12],
    )
    const sun = JSON.parse(call(
      'astro_spike_calculate_body',
      'string',
      ['number', 'number', 'number'],
      [julianDayUt, 0, 258],
    ))
    const houses = JSON.parse(call(
      'astro_spike_calculate_houses',
      'string',
      ['number', 'number', 'number', 'number'],
      [julianDayUt, 37.5665, 126.978, 'P'.charCodeAt(0)],
    ))
    result.textContent = JSON.stringify({
      kind: 'local-only-swiss-feasibility',
      engineVersion: call('astro_spike_version', 'string'),
      julianDayUt,
      sun,
      houses,
    }, null, 2)
  } catch (error) {
    result.textContent = JSON.stringify({
      kind: 'local-swiss-failure',
      message: error instanceof Error ? error.message : String(error),
    }, null, 2)
  }
}

run()
