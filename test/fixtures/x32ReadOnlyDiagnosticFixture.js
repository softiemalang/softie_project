export const X32_READ_ONLY_FIXTURE_CONNECTION = Object.freeze({
  ip: '192.168.10.42',
  model: 'X32',
  firmware: '4.06',
})

export const X32_READ_ONLY_FIXTURE_REPLIES = Object.freeze({
  'identity:info': '2f696e666f0000002c7373737300000056342e30360000006f73632d736572766572000058333200342e303600000000',
  'identity:xinfo': '2f78696e666f00002c737373730000003139322e3136382e31302e34320000005833322d3031000058333200342e303600000000',
  'identity:status': '2f737461747573002c7373730000000061637469766500003139322e3136382e31302e34320000006f73632d7365727665720000',
  'channel:01:name': '2f63682f30312f636f6e6669672f6e616d6500002c7300004c65616420566f7800000000',
  'channel:01:mixFader': '2f63682f30312f6d69782f6661646572000000002c6600003f000000',
  'channel:01:mixOn': '2f63682f30312f6d69782f6f6e0000002c69000000000001',
  'channel:01:preampTrim': '2f63682f30312f707265616d702f7472696d00002c6600003f400000',
  'channel:01:eqOn': '2f63682f30312f65712f6f6e000000002c69000000000001',
  'channel:01:meter6': '2f6d65746572732f360000002c620000000000180000001404000000cdcccc3d0000803e000000000000403f',
})

export function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})*$/i.test(hex)) throw new Error('fixture hex must contain complete bytes')
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  return bytes
}
