import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FORBIDDEN_X32_OPERATIONS,
  READ_ONLY_CHANNEL_FIELDS,
  collectX32ReadOnlyState,
  createX32ReadOnlyQueryPlan,
  decodeX32Meter6Blob,
  decodeX32OscPacket,
  encodeX32ReadOnlyQuery,
  parseX32ReadOnlyReply,
  toX32Hex,
  validateX32ConnectionInput,
} from '../src/music/x32ReadOnlyDiagnostic.js'
import {
  X32_READ_ONLY_FIXTURE_CONNECTION,
  X32_READ_ONLY_FIXTURE_REPLIES,
  hexToBytes,
} from './fixtures/x32ReadOnlyDiagnosticFixture.js'

function fixtureRequest() {
  const seen = []
  const request = async ({ descriptor, packet }) => {
    seen.push({ descriptor, packet: toX32Hex(packet) })
    const reply = X32_READ_ONLY_FIXTURE_REPLIES[descriptor.key]
    assert.ok(reply, `missing deterministic fixture reply for ${descriptor.key}`)
    return hexToBytes(reply)
  }
  return { request, seen }
}

test('read-only query plan contains only explicit identity, channel Get, and meter requests', () => {
  const plan = createX32ReadOnlyQueryPlan({ channels: [1], includeMeters: true })
  assert.deepEqual(plan.map(query => query.address), [
    '/info',
    '/xinfo',
    '/status',
    '/ch/01/config/name',
    '/ch/01/mix/fader',
    '/ch/01/mix/on',
    '/ch/01/preamp/trim',
    '/ch/01/eq/on',
    '/meters',
  ])
  assert.ok(plan.every(query => query.stateChanging === false && query.sourceStatus === 'EXPLICIT'))
  assert.deepEqual(FORBIDDEN_X32_OPERATIONS.includes('scene_recall_or_store'), true)
  assert.deepEqual(READ_ONLY_CHANNEL_FIELDS, ['name', 'mixFader', 'mixOn', 'preampTrim', 'eqOn'])
  assert.throws(() => createX32ReadOnlyQueryPlan({ channels: [1], fields: ['/-stat/aes50/state'] }), /unsupported read-only channel field/)
})

test('documented /info query encodes deterministically and no raw write address is accepted', () => {
  const packet = encodeX32ReadOnlyQuery({ kind: 'identity', name: 'info' })
  assert.equal(toX32Hex(packet), '2f696e666f0000002c000000')
  assert.throws(() => encodeX32ReadOnlyQuery({ kind: 'identity', name: 'xremote' }), /unsupported identity query/)
  assert.throws(() => encodeX32ReadOnlyQuery({ kind: 'channel', channel: 1, field: 'faderWrite' }), /unsupported read-only channel field/)
})

test('OSC decoder rejects malformed packets and unsupported bundles', () => {
  assert.throws(() => decodeX32OscPacket(hexToBytes('2f696e666f')), /unterminated OSC string/)
  assert.throws(() => decodeX32OscPacket(hexToBytes('2362756e646c650000')), /bundles are not supported/)
  assert.throws(() => decodeX32OscPacket(hexToBytes('2f696e666f0000002c78000000')), /unsupported OSC type tag/)
})

test('meter 6 fixture preserves the mixed-endian header and little-endian native floats', () => {
  const query = createX32ReadOnlyQueryPlan({ channels: [1], fields: [], includeMeters: true }).at(-1)
  const parsed = parseX32ReadOnlyReply(query, hexToBytes(X32_READ_ONLY_FIXTURE_REPLIES['channel:01:meter6']))
  assert.ok(Math.abs(parsed.value.meter.levels.preFade - 0.1) < 1e-7)
  assert.equal(parsed.value.meter.levels.gateGainReduction, 0.25)
  assert.equal(parsed.value.meter.levels.dynamicsGainReduction, 0)
  assert.equal(parsed.value.meter.levels.postFade, 0.75)
  assert.equal(parsed.value.meter.declaredPayloadBytes, 20)
  assert.equal(parsed.value.meter.declaredSizeMatchesPayload, true)
  assert.throws(() => decodeX32Meter6Blob(new Uint8Array(8)), /expected 4 values/)
})

test('fixture collection is deterministic and returns raw normalized values without writing', async () => {
  const firstTransport = fixtureRequest()
  const secondTransport = fixtureRequest()
  const options = {
    connection: X32_READ_ONLY_FIXTURE_CONNECTION,
    channels: [1],
    observedAt: '2026-08-25T00:00:00.000Z',
  }
  const first = await collectX32ReadOnlyState({ ...options, request: firstTransport.request })
  const second = await collectX32ReadOnlyState({ ...options, request: secondTransport.request })
  assert.deepEqual(first, second)
  assert.equal(first.status, 'read_only_observed')
  assert.equal(first.identity.status, 'verified')
  assert.equal(first.requestPolicy.writesPermitted, false)
  assert.equal(first.requestPolicy.stateChangingPacketsSent, 0)
  assert.equal(first.channels[0].name, 'Lead Vox')
  assert.equal(first.channels[0].mix.faderNormalized, 0.5)
  assert.equal(first.channels[0].mix.mute, false)
  assert.equal(first.channels[0].preamp.trimNormalized, 0.75)
  assert.equal(first.channels[0].eq.on, true)
  assert.equal(first.channels[0].meter.levels.postFade, 0.75)
  assert.ok(first.diagnostics.some(item => item.code === 'pre_fade_signal_observed'))
  assert.ok(first.diagnostics.some(item => item.code === 'post_fade_signal_observed'))
  assert.ok(firstTransport.seen.every(({ descriptor }) => descriptor.stateChanging === false))
  assert.ok(firstTransport.seen.every(({ descriptor }) => !['/xremote', '/renew', '/subscribe', '/formatsubscribe', '/batchsubscribe'].includes(descriptor.address)))
})

test('identity mismatch fails closed before any channel state is queried', async () => {
  const seen = []
  const request = async ({ descriptor, packet }) => {
    seen.push({ descriptor, packet: toX32Hex(packet) })
    if (descriptor.key === 'identity:info') {
      return hexToBytes(X32_READ_ONLY_FIXTURE_REPLIES['identity:info'].replace('58333200', '4d333200'))
    }
    return hexToBytes(X32_READ_ONLY_FIXTURE_REPLIES[descriptor.key])
  }
  const result = await collectX32ReadOnlyState({
    connection: X32_READ_ONLY_FIXTURE_CONNECTION,
    channels: [1],
    request,
  })
  assert.equal(result.status, 'blocked')
  assert.ok(result.blockers.some(blocker => blocker.code === 'identity_info_model_mismatch'))
  assert.deepEqual(seen.map(item => item.descriptor.kind), ['identity', 'identity', 'identity'])
  assert.equal(result.channels[0].status, 'not_queried_identity_blocked')
})

test('connection input requires exact IP, model, and firmware fields', () => {
  assert.deepEqual(validateX32ConnectionInput(X32_READ_ONLY_FIXTURE_CONNECTION), X32_READ_ONLY_FIXTURE_CONNECTION)
  assert.throws(() => validateX32ConnectionInput({ ...X32_READ_ONLY_FIXTURE_CONNECTION, ip: 'x32.local' }), /IPv4/)
  assert.throws(() => validateX32ConnectionInput({ ...X32_READ_ONLY_FIXTURE_CONNECTION, model: 'X32-UNKNOWN' }), /connection.model/)
  assert.throws(() => validateX32ConnectionInput({ ...X32_READ_ONLY_FIXTURE_CONNECTION, firmware: '' }), /firmware/)
})
