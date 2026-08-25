const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder('utf-8', { fatal: true })

export const X32_READ_ONLY_SCHEMA_VERSION = 'x32-read-only-mixing-diagnostic-v1'
export const X32_OSC_PORT = 10023

export const X32_MIXER_MODELS = Object.freeze([
  'X32',
  'X32C',
  'X32P',
  'X32RACK',
  'X32CORE',
  'M32',
  'M32C',
  'M32R',
])

export const READ_ONLY_CHANNEL_FIELDS = Object.freeze([
  'name',
  'mixFader',
  'mixOn',
  'preampTrim',
  'eqOn',
])

export const FORBIDDEN_X32_OPERATIONS = Object.freeze([
  'write_any_parameter',
  'scene_recall_or_store',
  'snippet_or_preset_recall_or_store',
  'phantom_power',
  'preamp_gain_change',
  'preamp_trim_change',
  'fader_change',
  'eq_change',
  'mute_change',
  'routing_or_insert_change',
  'xremote_or_subscription_lifecycle',
])

const IDENTITY_DEFINITIONS = Object.freeze({
  info: Object.freeze({
    address: '/info',
    responseTypeTags: 'ssss',
    sourceStatus: 'EXPLICIT',
  }),
  xinfo: Object.freeze({
    address: '/xinfo',
    responseTypeTags: 'ssss',
    sourceStatus: 'EXPLICIT',
  }),
  status: Object.freeze({
    address: '/status',
    responseTypeTags: 'sss',
    sourceStatus: 'EXPLICIT',
  }),
})

const CHANNEL_FIELD_DEFINITIONS = Object.freeze({
  name: Object.freeze({
    suffix: '/config/name',
    responseTypeTags: 's',
    sourcePattern: '/ch/[01...32]/config/name',
    sourceStatus: 'EXPLICIT',
  }),
  mixFader: Object.freeze({
    suffix: '/mix/fader',
    responseTypeTags: 'f',
    sourcePattern: '/ch/[01...32]/mix/fader',
    sourceStatus: 'EXPLICIT',
  }),
  mixOn: Object.freeze({
    suffix: '/mix/on',
    responseTypeTags: 'i',
    sourcePattern: '/ch/[01...32]/mix/on',
    sourceStatus: 'EXPLICIT',
  }),
  preampTrim: Object.freeze({
    suffix: '/preamp/trim',
    responseTypeTags: 'f',
    sourcePattern: '/ch/[01...32]/preamp/trim',
    sourceStatus: 'EXPLICIT',
  }),
  eqOn: Object.freeze({
    suffix: '/eq/on',
    responseTypeTags: 'i',
    sourcePattern: '/ch/[01...32]/eq/on',
    sourceStatus: 'EXPLICIT',
  }),
})

const METER_DEFINITION = Object.freeze({
  meterId: 6,
  requestAddress: '/meters',
  replyAddress: '/meters/6',
  requestTypeTags: 'siii',
  responseTypeTags: 'b',
  valueCount: 4,
  sourcePattern: '/meters/6',
  sourceStatus: 'EXPLICIT',
})

function fail(message) {
  throw new Error(message)
}

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function isValidIpv4(ip) {
  if (typeof ip !== 'string' || ip.length === 0 || ip.trim() !== ip) return false
  const octets = ip.split('.')
  return octets.length === 4 && octets.every(octet => {
    if (!/^\d{1,3}$/.test(octet)) return false
    if (octet.length > 1 && octet.startsWith('0')) return false
    const value = Number(octet)
    return value >= 0 && value <= 255
  })
}

export function validateX32ConnectionInput(connection) {
  if (!isObject(connection)) fail('connection must be an object')
  if (!isValidIpv4(connection.ip)) fail('connection.ip must be an IPv4 address')
  if (!X32_MIXER_MODELS.includes(connection.model)) {
    fail(`connection.model must be one of: ${X32_MIXER_MODELS.join(', ')}`)
  }
  if (typeof connection.firmware !== 'string' || connection.firmware.length === 0 || /\s/.test(connection.firmware)) {
    fail('connection.firmware must be a non-empty, whitespace-free version string')
  }
  return Object.freeze({
    ip: connection.ip,
    model: connection.model,
    firmware: connection.firmware,
  })
}

function channelAddress(channel, suffix) {
  const value = Number(channel)
  if (!Number.isInteger(value) || value < 1 || value > 32) fail('channel must be an integer from 1 to 32')
  return `/ch/${String(value).padStart(2, '0')}${suffix}`
}

function normalizeChannels(channels) {
  if (!Array.isArray(channels)) fail('channels must be an array')
  return [...new Set(channels.map(channel => {
    const value = Number(channel)
    if (!Number.isInteger(value) || value < 1 || value > 32) fail('channels must contain integers from 1 to 32')
    return value
  }))].sort((a, b) => a - b)
}

function normalizeFields(fields) {
  if (!Array.isArray(fields)) fail('fields must be an array')
  const requested = new Set(fields)
  for (const field of requested) {
    if (!Object.hasOwn(CHANNEL_FIELD_DEFINITIONS, field)) fail(`unsupported read-only channel field: ${field}`)
  }
  return READ_ONLY_CHANNEL_FIELDS.filter(field => requested.has(field))
}

function normalizeTimeFactor(timeFactor) {
  const value = Number(timeFactor)
  if (!Number.isInteger(value) || value < 1 || value > 99) fail('meter timeFactor must be an integer from 1 to 99')
  return value
}

function freezeQuery(query) {
  return Object.freeze({
    ...query,
    requestArgs: Object.freeze([...(query.requestArgs || [])]),
  })
}

function identityQuery(name) {
  const definition = IDENTITY_DEFINITIONS[name]
  if (!definition) fail(`unsupported identity query: ${name}`)
  return freezeQuery({
    key: `identity:${name}`,
    kind: 'identity',
    name,
    address: definition.address,
    requestTypeTags: '',
    expectedResponseTypeTags: definition.responseTypeTags,
    sourcePattern: definition.address,
    sourceStatus: definition.sourceStatus,
    stateChanging: false,
  })
}

function channelQuery(channel, field) {
  const definition = CHANNEL_FIELD_DEFINITIONS[field]
  if (!definition) fail(`unsupported read-only channel field: ${field}`)
  const normalizedChannel = Number(channel)
  const address = channelAddress(normalizedChannel, definition.suffix)
  return freezeQuery({
    key: `channel:${String(normalizedChannel).padStart(2, '0')}:${field}`,
    kind: 'channel',
    channel: normalizedChannel,
    field,
    address,
    requestTypeTags: '',
    expectedResponseTypeTags: definition.responseTypeTags,
    sourcePattern: definition.sourcePattern,
    sourceStatus: definition.sourceStatus,
    stateChanging: false,
  })
}

function meterQuery(channel, timeFactor = 99) {
  const normalizedChannel = Number(channel)
  channelAddress(normalizedChannel, '')
  const normalizedTimeFactor = normalizeTimeFactor(timeFactor)
  return freezeQuery({
    key: `channel:${String(normalizedChannel).padStart(2, '0')}:meter6`,
    kind: 'meter',
    channel: normalizedChannel,
    meterId: METER_DEFINITION.meterId,
    address: METER_DEFINITION.requestAddress,
    replyAddress: METER_DEFINITION.replyAddress,
    requestTypeTags: METER_DEFINITION.requestTypeTags,
    requestArgs: [
      METER_DEFINITION.replyAddress,
      normalizedChannel - 1,
      0,
      normalizedTimeFactor,
    ],
    expectedResponseTypeTags: METER_DEFINITION.responseTypeTags,
    sourcePattern: METER_DEFINITION.sourcePattern,
    sourceStatus: METER_DEFINITION.sourceStatus,
    stateChanging: false,
    meterTimeFactor: normalizedTimeFactor,
  })
}

function normalizeReadOnlyQuery(query) {
  if (!isObject(query)) fail('read-only query must be an object')
  if (query.kind === 'identity') return identityQuery(query.name)
  if (query.kind === 'channel') return channelQuery(query.channel, query.field)
  if (query.kind === 'meter') return meterQuery(query.channel, query.meterTimeFactor ?? query.timeFactor ?? 99)
  fail('unsupported read-only query kind')
}

export function createX32ReadOnlyQueryPlan({
  channels = [1],
  fields = READ_ONLY_CHANNEL_FIELDS,
  includeMeters = true,
  meterTimeFactor = 99,
} = {}) {
  const normalizedChannels = normalizeChannels(channels)
  const normalizedFields = normalizeFields(fields)
  const plan = [identityQuery('info'), identityQuery('xinfo'), identityQuery('status')]
  for (const channel of normalizedChannels) {
    for (const field of normalizedFields) plan.push(channelQuery(channel, field))
    if (includeMeters) plan.push(meterQuery(channel, meterTimeFactor))
  }
  return Object.freeze(plan)
}

function concatBytes(...parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0)
  const output = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.length
  }
  return output
}

function encodeOscString(value) {
  if (typeof value !== 'string' || value.includes('\0')) fail('OSC strings must be NUL-free strings')
  const raw = textEncoder.encode(value)
  const withTerminator = new Uint8Array(raw.length + 1)
  withTerminator.set(raw)
  const paddedLength = (withTerminator.length + 3) & ~3
  return new Uint8Array(concatBytes(withTerminator, new Uint8Array(paddedLength - withTerminator.length)))
}

function encodeInt32(value) {
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) fail('OSC int32 argument is out of range')
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setInt32(0, value, false)
  return bytes
}

function encodeFloat32(value) {
  if (!Number.isFinite(value)) fail('OSC float32 argument must be finite')
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setFloat32(0, value, false)
  return bytes
}

function encodeOscMessage(address, typeTags, args) {
  if (!address.startsWith('/')) fail('OSC address must start with /')
  if (typeTags.length !== args.length) fail('OSC type-tag and argument counts differ')
  const encoded = [encodeOscString(address), encodeOscString(`,${typeTags}`)]
  for (let index = 0; index < typeTags.length; index += 1) {
    const tag = typeTags[index]
    const argument = args[index]
    if (tag === 'i') encoded.push(encodeInt32(argument))
    else if (tag === 'f') encoded.push(encodeFloat32(argument))
    else if (tag === 's') encoded.push(encodeOscString(argument))
    else fail(`unsupported OSC request type tag: ${tag}`)
  }
  return concatBytes(...encoded)
}

export function encodeX32ReadOnlyQuery(query) {
  const normalized = normalizeReadOnlyQuery(query)
  return encodeOscMessage(normalized.address, normalized.requestTypeTags, normalized.requestArgs || [])
}

function asBytes(input) {
  if (input instanceof Uint8Array) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  fail('OSC packet must be a Uint8Array, ArrayBuffer, or typed-array view')
}

function readOscString(bytes, start) {
  let end = start
  while (end < bytes.length && bytes[end] !== 0) end += 1
  if (end >= bytes.length) fail('unterminated OSC string')
  const paddedEnd = (end + 4) & ~3
  if (paddedEnd > bytes.length) fail('OSC string padding exceeds packet')
  for (let index = end + 1; index < paddedEnd; index += 1) {
    if (bytes[index] !== 0) fail('OSC string padding contains non-zero bytes')
  }
  let value
  try {
    value = textDecoder.decode(bytes.subarray(start, end))
  } catch {
    fail('OSC string is not valid UTF-8')
  }
  return { value, nextOffset: paddedEnd }
}

function readInt32(bytes, offset) {
  if (offset + 4 > bytes.length) fail('truncated OSC int32')
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(offset, false)
}

function readFloat32(bytes, offset) {
  if (offset + 4 > bytes.length) fail('truncated OSC float32')
  const value = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat32(offset, false)
  if (!Number.isFinite(value)) fail('OSC float32 is not finite')
  return value
}

function readBlob(bytes, offset) {
  const length = readInt32(bytes, offset)
  if (length < 0) fail('OSC blob length is negative')
  const start = offset + 4
  const end = start + length
  const paddedEnd = (end + 3) & ~3
  if (paddedEnd > bytes.length) fail('OSC blob exceeds packet')
  for (let index = end; index < paddedEnd; index += 1) {
    if (bytes[index] !== 0) fail('OSC blob padding contains non-zero bytes')
  }
  return { value: new Uint8Array(bytes.slice(start, end)), nextOffset: paddedEnd }
}

export function decodeX32OscPacket(input) {
  const bytes = asBytes(input)
  const first = readOscString(bytes, 0)
  if (first.value === '#bundle') fail('OSC bundles are not supported by this read-only contract')
  if (!first.value.startsWith('/')) fail('OSC address must start with /')

  let offset = first.nextOffset
  let typeTags = ''
  if (offset < bytes.length) {
    const typeTag = readOscString(bytes, offset)
    offset = typeTag.nextOffset
    if (typeTag.value.length > 0) {
      if (!typeTag.value.startsWith(',')) fail('OSC type-tag string does not start with comma')
      typeTags = typeTag.value.slice(1)
    }
  }

  const argumentsList = []
  for (const tag of typeTags) {
    if (tag === 'i') {
      argumentsList.push(readInt32(bytes, offset))
      offset += 4
    } else if (tag === 'f') {
      argumentsList.push(readFloat32(bytes, offset))
      offset += 4
    } else if (tag === 's') {
      const value = readOscString(bytes, offset)
      argumentsList.push(value.value)
      offset = value.nextOffset
    } else if (tag === 'b') {
      const value = readBlob(bytes, offset)
      argumentsList.push(value.value)
      offset = value.nextOffset
    } else {
      fail(`unsupported OSC type tag: ${tag}`)
    }
  }
  if (offset !== bytes.length) fail('unexpected trailing bytes in OSC packet')
  return Object.freeze({
    address: first.value,
    typeTags,
    arguments: Object.freeze(argumentsList),
    byteLength: bytes.length,
  })
}

function requirePacketShape(packet, expectedAddress, expectedTypeTags) {
  if (packet.address !== expectedAddress) fail(`unexpected OSC reply address: ${packet.address}`)
  if (packet.typeTags !== expectedTypeTags) {
    fail(`unexpected OSC reply type tags for ${expectedAddress}: ${packet.typeTags}`)
  }
  if (packet.arguments.length !== expectedTypeTags.length) fail(`unexpected OSC reply argument count for ${expectedAddress}`)
}

function requireNormalizedFloat(value, label) {
  if (!Number.isFinite(value) || value < 0 || value > 1) fail(`${label} reply is outside the documented direct OSC range 0..1`)
  return value
}

function requireOnOff(value, label) {
  if (!Number.isInteger(value) || (value !== 0 && value !== 1)) fail(`${label} reply is not an OFF/ON int32`)
  return value === 1
}

function parseIdentityReply(query, packet) {
  const definition = IDENTITY_DEFINITIONS[query.name]
  requirePacketShape(packet, definition.address, definition.responseTypeTags)
  if (query.name === 'info') {
    return {
      serverVersion: packet.arguments[0],
      serverName: packet.arguments[1],
      model: packet.arguments[2],
      firmware: packet.arguments[3],
    }
  }
  if (query.name === 'xinfo') {
    return {
      networkAddress: packet.arguments[0],
      networkName: packet.arguments[1],
      model: packet.arguments[2],
      firmware: packet.arguments[3],
    }
  }
  return {
    state: packet.arguments[0],
    ip: packet.arguments[1],
    serverName: packet.arguments[2],
  }
}

function parseChannelReply(query, packet) {
  const definition = CHANNEL_FIELD_DEFINITIONS[query.field]
  requirePacketShape(packet, query.address, definition.responseTypeTags)
  const raw = packet.arguments[0]
  if (query.field === 'name') return { name: raw }
  if (query.field === 'mixFader') return { faderNormalized: requireNormalizedFloat(raw, query.address) }
  if (query.field === 'mixOn') return { mute: !requireOnOff(raw, query.address) }
  if (query.field === 'preampTrim') return { trimNormalized: requireNormalizedFloat(raw, query.address) }
  return { on: requireOnOff(raw, query.address) }
}

function readUint32(bytes, offset, littleEndian) {
  if (offset + 4 > bytes.length) fail('truncated meter blob uint32')
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, littleEndian)
}

function readMeterFloat32(bytes, offset) {
  if (offset + 4 > bytes.length) fail('truncated meter blob float32')
  const value = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat32(offset, true)
  if (!Number.isFinite(value) || value < 0 || value > 8) fail('meter value is outside the documented 0..8 headroom range')
  return value
}

export function decodeX32Meter6Blob(input) {
  const bytes = asBytes(input)
  if (bytes.length < 8) fail('meter 6 blob is shorter than its header')
  const declaredPayloadBytes = readUint32(bytes, 0, false)
  const valueCount = readUint32(bytes, 4, true)
  if (valueCount !== METER_DEFINITION.valueCount) fail(`meter 6 expected ${METER_DEFINITION.valueCount} values, received ${valueCount}`)
  const expectedLength = 8 + valueCount * 4
  if (bytes.length !== expectedLength) fail(`meter 6 blob length does not match its value count: ${bytes.length}`)
  const values = []
  for (let index = 0; index < valueCount; index += 1) values.push(readMeterFloat32(bytes, 8 + index * 4))
  return Object.freeze({
    meterId: METER_DEFINITION.meterId,
    declaredPayloadBytes,
    declaredSizeMatchesPayload: declaredPayloadBytes === bytes.length - 4,
    valueCount,
    levels: Object.freeze({
      preFade: values[0],
      gateGainReduction: values[1],
      dynamicsGainReduction: values[2],
      postFade: values[3],
    }),
  })
}

function parseMeterReply(query, packet) {
  requirePacketShape(packet, query.replyAddress, METER_DEFINITION.responseTypeTags)
  return { meter: decodeX32Meter6Blob(packet.arguments[0]) }
}

export function parseX32ReadOnlyReply(query, input) {
  const normalized = normalizeReadOnlyQuery(query)
  const packet = decodeX32OscPacket(input)
  let value
  if (normalized.kind === 'identity') value = parseIdentityReply(normalized, packet)
  else if (normalized.kind === 'channel') value = parseChannelReply(normalized, packet)
  else value = parseMeterReply(normalized, packet)
  return Object.freeze({
    key: normalized.key,
    kind: normalized.kind,
    address: packet.address,
    typeTags: packet.typeTags,
    value: Object.freeze(value),
  })
}

export function verifyX32Identity(connection, identity) {
  const expected = validateX32ConnectionInput(connection)
  const blockers = []
  const observations = identity || {}
  for (const name of ['info', 'xinfo']) {
    const value = observations[name]
    if (!value) {
      blockers.push({ code: `identity_${name}_missing`, reason: `/${name} reply was not observed` })
      continue
    }
    if (value.model !== expected.model) {
      blockers.push({ code: `identity_${name}_model_mismatch`, expected: expected.model, observed: value.model })
    }
    if (value.firmware !== expected.firmware) {
      blockers.push({ code: `identity_${name}_firmware_mismatch`, expected: expected.firmware, observed: value.firmware })
    }
  }
  if (!observations.status) {
    blockers.push({ code: 'identity_status_missing', reason: '/status reply was not observed' })
  } else if (observations.status.ip !== expected.ip) {
    blockers.push({ code: 'identity_status_ip_mismatch', expected: expected.ip, observed: observations.status.ip })
  }
  return Object.freeze({
    status: blockers.length === 0 ? 'verified' : 'blocked',
    expected,
    blockers: Object.freeze(blockers),
  })
}

function channelState(channel) {
  return {
    channel,
    status: 'pending',
    name: null,
    mix: { faderNormalized: null, mute: null },
    preamp: { trimNormalized: null },
    eq: { on: null },
    meter: null,
  }
}

function applyChannelValue(state, parsed) {
  if (parsed.name !== undefined) state.name = parsed.name
  if (parsed.faderNormalized !== undefined) state.mix.faderNormalized = parsed.faderNormalized
  if (parsed.mute !== undefined) state.mix.mute = parsed.mute
  if (parsed.trimNormalized !== undefined) state.preamp.trimNormalized = parsed.trimNormalized
  if (parsed.on !== undefined) state.eq.on = parsed.on
  if (parsed.meter !== undefined) state.meter = parsed.meter
}

export function diagnoseX32ChannelState(state) {
  const findings = []
  if (state?.mix?.mute === true) {
    findings.push({
      code: 'channel_muted_observed',
      severity: 'attention',
      status: 'attention',
      channel: state.channel,
      conclusion: 'The channel mute state was observed as ON; no change was attempted.',
    })
  } else if (state?.mix?.mute === false) {
    findings.push({
      code: 'channel_unmuted_observed',
      severity: 'info',
      status: 'pass',
      channel: state.channel,
    })
  }
  const levels = state?.meter?.levels
  if (levels) {
    const preFadeSignal = levels.preFade > 0
    const postFadeSignal = levels.postFade > 0
    findings.push({
      code: preFadeSignal ? 'pre_fade_signal_observed' : 'no_pre_fade_signal_in_snapshot',
      severity: preFadeSignal ? 'info' : 'attention',
      status: preFadeSignal ? 'pass' : 'attention',
      channel: state.channel,
      value: levels.preFade,
      observationOnly: true,
    })
    findings.push({
      code: postFadeSignal ? 'post_fade_signal_observed' : 'no_post_fade_signal_in_snapshot',
      severity: postFadeSignal ? 'info' : 'attention',
      status: postFadeSignal ? 'pass' : 'attention',
      channel: state.channel,
      value: levels.postFade,
      observationOnly: true,
    })
    if (preFadeSignal && !postFadeSignal) {
      findings.push({
        code: 'post_fade_signal_absent_while_pre_fade_present',
        severity: 'attention',
        status: 'attention',
        channel: state.channel,
        conclusion: 'A single read-only snapshot shows a pre-fade/post-fade difference; it does not identify the cause.',
        observationOnly: true,
      })
    }
  }
  return Object.freeze(findings.map(finding => Object.freeze(finding)))
}

function hex(input) {
  return [...asBytes(input)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function buildResult(connection, plan, observedAt) {
  const channels = [...new Set(plan.filter(query => query.kind === 'channel' || query.kind === 'meter').map(query => query.channel))]
    .sort((a, b) => a - b)
    .map(channelState)
  return {
    schemaVersion: X32_READ_ONLY_SCHEMA_VERSION,
    mode: 'read_only',
    status: 'pending',
    observedAt: observedAt ?? null,
    connection: { ...connection, oscPort: X32_OSC_PORT },
    requestPolicy: {
      sourceRule: 'explicit_catalog_rows_only',
      writesPermitted: false,
      stateChangingPacketsSent: 0,
      prohibitedOperations: [...FORBIDDEN_X32_OPERATIONS],
      requests: [],
    },
    identity: { status: 'pending', observations: {}, blockers: [] },
    channels,
    observations: [],
    blockers: [],
    diagnostics: [],
  }
}

function findChannel(result, channel) {
  const state = result.channels.find(item => item.channel === channel)
  if (!state) fail(`channel ${channel} is not present in the query plan`)
  return state
}

function addBlocker(result, blocker) {
  result.blockers.push(blocker)
}

export async function collectX32ReadOnlyState({
  connection,
  channels = [1],
  fields = READ_ONLY_CHANNEL_FIELDS,
  includeMeters = true,
  meterTimeFactor = 99,
  observedAt = null,
  request,
} = {}) {
  const expectedConnection = validateX32ConnectionInput(connection)
  if (typeof request !== 'function') fail('request must be an injected read-only transport function')
  const plan = createX32ReadOnlyQueryPlan({ channels, fields, includeMeters, meterTimeFactor })
  const result = buildResult(expectedConnection, plan, observedAt)

  const observe = async query => {
    const packet = encodeX32ReadOnlyQuery(query)
    result.requestPolicy.requests.push({
      key: query.key,
      kind: query.kind,
      address: query.address,
      requestTypeTags: query.requestTypeTags,
      requestHex: hex(packet),
      stateChanging: false,
    })
    try {
      const reply = await request({
        connection: expectedConnection,
        descriptor: query,
        packet: new Uint8Array(packet),
      })
      const parsed = parseX32ReadOnlyReply(query, reply)
      const observation = {
        key: query.key,
        kind: query.kind,
        address: parsed.address,
        typeTags: parsed.typeTags,
        requestHex: hex(packet),
        replyHex: hex(reply),
        value: parsed.value,
        status: 'observed',
      }
      result.observations.push(observation)
      if (query.kind === 'identity') result.identity.observations[query.name] = parsed.value
      else applyChannelValue(findChannel(result, query.channel), parsed.value)
      return true
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      result.observations.push({
        key: query.key,
        kind: query.kind,
        address: query.kind === 'meter' ? query.replyAddress : query.address,
        requestHex: hex(packet),
        replyHex: null,
        status: 'blocked',
        error: reason,
      })
      addBlocker(result, { code: 'read_failed', key: query.key, address: query.address, reason })
      return false
    }
  }

  const identityQueries = plan.filter(query => query.kind === 'identity')
  for (const query of identityQueries) await observe(query)
  const identityVerification = verifyX32Identity(expectedConnection, result.identity.observations)
  result.identity.status = identityVerification.status
  result.identity.blockers = [...identityVerification.blockers]
  if (identityVerification.blockers.length > 0) {
    for (const blocker of identityVerification.blockers) addBlocker(result, blocker)
  }

  if (result.blockers.length === 0) {
    for (const query of plan.filter(item => item.kind !== 'identity')) await observe(query)
  }

  for (const state of result.channels) {
    if (result.identity.status !== 'verified') state.status = 'not_queried_identity_blocked'
    else state.status = result.blockers.some(blocker => blocker.key?.includes(`:${String(state.channel).padStart(2, '0')}:`))
      ? 'partial_or_blocked'
      : 'observed'
    result.diagnostics.push(...diagnoseX32ChannelState(state))
  }
  result.status = result.blockers.length === 0 ? 'read_only_observed' : 'blocked'
  return result
}

export function toX32Hex(input) {
  return hex(input)
}
