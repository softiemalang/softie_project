import assert from 'node:assert/strict'
import test from 'node:test'
import { navigate } from '../src/lib/router.js'

function installBrowser({ startViewTransition, reducedMotion = false } = {}) {
  const previousWindow = globalThis.window
  const previousDocument = globalThis.document
  const previousPopStateEvent = globalThis.PopStateEvent
  const dispatchedEvents = []
  const pushedPaths = []
  const location = {
    pathname: '/scheduler',
    search: '',
  }
  const fakeWindow = {
    location,
    history: {
      pushState(_state, _title, path) {
        const nextUrl = new URL(path, 'https://softie.test')
        location.pathname = nextUrl.pathname
        location.search = nextUrl.search
        pushedPaths.push(path)
      },
    },
    matchMedia: () => ({ matches: reducedMotion }),
    dispatchEvent(event) {
      dispatchedEvents.push(event)
      return true
    },
  }

  globalThis.window = fakeWindow
  globalThis.document = startViewTransition === undefined
    ? {}
    : { startViewTransition }
  globalThis.PopStateEvent = class FakePopStateEvent {
    constructor(type) {
      this.type = type
    }
  }

  return {
    location,
    dispatchedEvents,
    pushedPaths,
    restore() {
      if (previousWindow === undefined) delete globalThis.window
      else globalThis.window = previousWindow
      if (previousDocument === undefined) delete globalThis.document
      else globalThis.document = previousDocument
      if (previousPopStateEvent === undefined) delete globalThis.PopStateEvent
      else globalThis.PopStateEvent = previousPopStateEvent
    },
  }
}

function createTransition() {
  let skipCount = 0
  return {
    get skipCount() {
      return skipCount
    },
    skipTransition() {
      skipCount += 1
    },
    updateCallbackDone: Promise.resolve(),
    ready: Promise.resolve(),
    finished: Promise.resolve(),
  }
}

test('targeted navigation commits synchronously inside a supported View Transition', () => {
  const transitions = []
  const browser = installBrowser({
    startViewTransition(updateCallback) {
      updateCallback()
      const transition = createTransition()
      transitions.push(transition)
      return transition
    },
  })

  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })

    assert.equal(browser.location.pathname, '/scheduler/reservation-1')
    assert.deepEqual(browser.pushedPaths, ['/scheduler/reservation-1'])
    assert.equal(browser.dispatchedEvents.length, 1)
    assert.equal(browser.dispatchedEvents[0].type, 'popstate')
    assert.equal(transitions.length, 1)
  } finally {
    browser.restore()
  }
})

test('navigation falls back to the existing route update when View Transition is unavailable or fails', () => {
  const unsupportedBrowser = installBrowser()
  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })
    assert.equal(unsupportedBrowser.location.pathname, '/scheduler/reservation-1')
    assert.deepEqual(unsupportedBrowser.pushedPaths, ['/scheduler/reservation-1'])
  } finally {
    unsupportedBrowser.restore()
  }

  let startAttempts = 0
  const failedBrowser = installBrowser({
    startViewTransition() {
      startAttempts += 1
      throw new Error('synthetic transition failure')
    },
  })
  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })
    assert.equal(startAttempts, 1)
    assert.equal(failedBrowser.location.pathname, '/scheduler/reservation-1')
    assert.deepEqual(failedBrowser.pushedPaths, ['/scheduler/reservation-1'])
  } finally {
    failedBrowser.restore()
  }
})

test('a rejected update callback promise still falls back to the existing route update', async () => {
  const browser = installBrowser({
    startViewTransition() {
      return {
        updateCallbackDone: Promise.reject(new Error('synthetic update failure')),
        ready: Promise.resolve(),
        finished: Promise.resolve(),
      }
    },
  })

  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })
    await Promise.resolve()
    await Promise.resolve()

    assert.equal(browser.location.pathname, '/scheduler/reservation-1')
    assert.deepEqual(browser.pushedPaths, ['/scheduler/reservation-1'])
  } finally {
    browser.restore()
  }
})

test('a stale rejected update callback cannot undo a newer navigation', async () => {
  let startAttempts = 0
  let rejectFirstUpdate
  const browser = installBrowser({
    startViewTransition(updateCallback) {
      startAttempts += 1
      if (startAttempts === 1) {
        return {
          skipTransition() {},
          updateCallbackDone: new Promise((_resolve, reject) => {
            rejectFirstUpdate = reject
          }),
          ready: Promise.resolve(),
          finished: Promise.resolve(),
        }
      }

      updateCallback()
      return createTransition()
    },
  })

  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })
    navigate('/scheduler?date=2026-08-10', { viewTransition: true })
    rejectFirstUpdate(new Error('stale update failure'))
    await Promise.resolve()
    await Promise.resolve()

    assert.equal(browser.location.pathname, '/scheduler')
    assert.equal(browser.location.search, '?date=2026-08-10')
    assert.deepEqual(browser.pushedPaths, ['/scheduler?date=2026-08-10'])
  } finally {
    browser.restore()
  }
})

test('reduced motion keeps navigation immediate and skips the View Transition API', () => {
  let startAttempts = 0
  const browser = installBrowser({
    reducedMotion: true,
    startViewTransition() {
      startAttempts += 1
      throw new Error('should not start')
    },
  })

  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })
    assert.equal(startAttempts, 0)
    assert.equal(browser.location.pathname, '/scheduler/reservation-1')
    assert.deepEqual(browser.pushedPaths, ['/scheduler/reservation-1'])
  } finally {
    browser.restore()
  }
})

test('same-path and non-opt-in navigation remain free of View Transition work', () => {
  let startAttempts = 0
  const browser = installBrowser({
    startViewTransition(updateCallback) {
      startAttempts += 1
      updateCallback()
      return createTransition()
    },
  })

  try {
    navigate('/scheduler')
    navigate('/scheduler/reservation-1')

    assert.equal(startAttempts, 0)
    assert.equal(browser.location.pathname, '/scheduler/reservation-1')
    assert.deepEqual(browser.pushedPaths, ['/scheduler/reservation-1'])
  } finally {
    browser.restore()
  }
})

test('a re-entry skips an active transition before applying the next route immediately', () => {
  const transitions = []
  const browser = installBrowser({
    startViewTransition(updateCallback) {
      updateCallback()
      const transition = createTransition()
      transitions.push(transition)
      return transition
    },
  })

  try {
    navigate('/scheduler/reservation-1', { viewTransition: true })
    navigate('/scheduler?date=2026-08-10', { viewTransition: true })

    assert.equal(browser.location.pathname, '/scheduler')
    assert.equal(browser.location.search, '?date=2026-08-10')
    assert.equal(transitions[0].skipCount, 1)
    assert.equal(transitions.length, 2)
  } finally {
    browser.restore()
  }
})
