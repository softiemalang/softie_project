import dgram from 'node:dgram'

import {
  X32_OSC_PORT,
  collectX32ReadOnlyState,
  encodeX32ReadOnlyQuery,
  validateX32ConnectionInput,
} from './x32ReadOnlyDiagnostic.js'

function validateTimeout(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
    throw new Error('timeoutMs must be an integer from 1 to 30000')
  }
  return timeoutMs
}

export function createX32ReadOnlyUdpRequest({ timeoutMs = 1000, dgramApi = dgram } = {}) {
  const timeout = validateTimeout(timeoutMs)
  if (!dgramApi || typeof dgramApi.createSocket !== 'function') throw new Error('dgramApi.createSocket is required')

  return async function request({ connection, descriptor }) {
    const expected = validateX32ConnectionInput(connection)
    const packet = encodeX32ReadOnlyQuery(descriptor)
    return new Promise((resolve, reject) => {
      const socket = dgramApi.createSocket('udp4')
      let settled = false
      let timer = null
      const finish = (error, value) => {
        if (settled) return
        settled = true
        if (timer) clearTimeout(timer)
        try {
          socket.close()
        } catch {
          // A socket can fail before bind; the original transport error is more useful.
        }
        if (error) reject(error)
        else resolve(value)
      }

      socket.on('error', error => finish(error))
      socket.on('message', (message, remote) => {
        if (remote.address !== expected.ip || remote.port !== X32_OSC_PORT) return
        finish(null, new Uint8Array(message.buffer, message.byteOffset, message.byteLength))
      })
      timer = setTimeout(() => finish(new Error(`X32 read-only request timed out after ${timeout}ms`)), timeout)
      socket.bind(0, () => {
        socket.send(packet, 0, packet.length, X32_OSC_PORT, expected.ip, error => {
          if (error) finish(error)
        })
      })
    })
  }
}

export async function collectX32ReadOnlyStateOverUdp(options = {}) {
  const { timeoutMs = 1000, ...collectionOptions } = options
  const request = createX32ReadOnlyUdpRequest({ timeoutMs })
  return collectX32ReadOnlyState({ ...collectionOptions, request })
}
