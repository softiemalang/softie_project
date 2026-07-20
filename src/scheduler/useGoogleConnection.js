import { useCallback, useEffect, useRef, useState } from 'react'
import {
  disconnectGoogleCalendar,
  isGoogleConnected,
  verifyGoogleConnection,
} from './googleApi'

export function useGoogleConnection(userId) {
  const [googleConnected, setGoogleConnected] = useState(() => isGoogleConnected())
  const [googleConnectionState, setGoogleConnectionState] = useState('checking')
  const [googleConnectionReason, setGoogleConnectionReason] = useState(null)
  const verificationSequenceRef = useRef(0)

  const markGoogleDisconnected = useCallback((reason = 'reconnect_required') => {
    verificationSequenceRef.current += 1
    disconnectGoogleCalendar()
    setGoogleConnected(false)
    setGoogleConnectionState('disconnected')
    setGoogleConnectionReason(reason)
  }, [])

  const refreshGoogleConnection = useCallback(async () => {
    const sequence = verificationSequenceRef.current + 1
    verificationSequenceRef.current = sequence

    if (!userId) {
      disconnectGoogleCalendar()
      setGoogleConnected(false)
      setGoogleConnectionState('disconnected')
      setGoogleConnectionReason('signed_out')
      return { connected: false, reason: 'signed_out' }
    }

    setGoogleConnected(false)
    setGoogleConnectionState('checking')

    try {
      const status = await verifyGoogleConnection(userId)
      if (verificationSequenceRef.current !== sequence) return status

      setGoogleConnected(status.connected)
      setGoogleConnectionState(status.connected ? 'connected' : 'disconnected')
      setGoogleConnectionReason(status.connected ? null : status.reason)
      return status
    } catch (error) {
      if (verificationSequenceRef.current === sequence) {
        console.error('[google] Connection verification failed:', error)
        setGoogleConnected(false)
        setGoogleConnectionState('error')
        setGoogleConnectionReason('verification_failed')
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
    googleConnectionReason,
    markGoogleDisconnected,
    refreshGoogleConnection,
  }
}
