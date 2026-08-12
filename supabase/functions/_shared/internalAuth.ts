import { corsHeaders } from './cors.ts'

function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left)
  const rightBytes = new TextEncoder().encode(right)
  if (leftBytes.length !== rightBytes.length) return false

  let difference = 0
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index]
  }
  return difference === 0
}

export function requireInternalFunctionSecret(request: Request, secretName: string) {
  const expected = Deno.env.get(secretName)?.trim() || ''
  const supplied = request.headers.get('x-internal-function-secret')?.trim() || ''

  if (!expected) {
    return new Response(JSON.stringify({ error: 'Internal endpoint is not configured' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!supplied || !constantTimeEqual(supplied, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return null
}
