import { useCallback, useEffect, useRef, useState } from 'react'
import {
  disconnectGoogleCalendar,
  isGoogleConnected,
  verifyGoogleConnection,
} from './googleApi'

export function useGoogleConnection(userId) {
  const [googleConnected, setGoogleConnected] = useState(() => isGoogleConnected())
  const [googleConnectionState, setGoogleConnectionState] = useState('checking')
  const verificationSequenceRef = useRef(0)

  const markGoogleDisconnected = useCallback(() => {
    verificationSequenceRef.current += 1
    disconnectGoogleCalendar()
    setGoogleConnected(false)
    setGoogleConnectionState('disconnected')
  }, [])

  const refreshGoogleConnection = useCallback(async () => {
    const sequence = verificationSequenceRef.current + 1
    verificationSequenceRef.current = sequence

    if (!userId) {
      disconnectGoogleCalendar()
      setGoogleConnected(false)
      setGoogleConnectionState('disconnected')
      return { connected: false, reason: 'signed_out' }
    }

    setGoogleConnected(false)
    setGoogleConnectionState('checking')

    try {
      const status = await verifyGoogleConnection(userId)
      if (verificationSequenceRef.current !== sequence) return status

      setGoogleConnected(status.connected)
      setGoogleConnectionState(status.connected ? 'connected' : 'disconnected')
      return status
    } catch (error) {
      if (verificationSequenceRef.current === sequence) {
        console.error('[google] Connection verification failed:', error)
        setGoogleConnected(false)
        setGoogleConnectionState('error')
      }
      throw error
    }
  }, [userId])

  useEffect(() => {
    refreshGoogleConnection().catch(() => {})
    return () => {
      verificationSequenceRef.current += 1
    }
  }, [refreshGoogleConnection])

  return {
    googleConnected,
    googleConnectionState,
    markGoogleDisconnected,
    refreshGoogleConnection,
  }
}
