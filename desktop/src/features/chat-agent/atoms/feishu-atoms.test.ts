import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  feishuConnectedAtom,
  feishuDefaultNotifyModeAtom,
  feishuBotStatesAtom,
  feishuAnyConnectedAtom,
  feishuBridgeStateAtom,
  sessionFeishuNotifyModeAtom,
  feishuBindingsAtom,
} from './feishu-atoms'

describe('feishu-atoms', () => {
  beforeEach(() => localStorage.clear())

  it('feishuConnectedAtom defaults to false when no bots connected', () => {
    const store = createStore()
    expect(store.get(feishuConnectedAtom)).toBe(false)
  })

  it('feishuDefaultNotifyModeAtom defaults to auto', () => {
    const store = createStore()
    expect(store.get(feishuDefaultNotifyModeAtom)).toBe('auto')
  })

  it('feishuBotStatesAtom defaults to empty object', () => {
    const store = createStore()
    expect(store.get(feishuBotStatesAtom)).toEqual({})
  })

  it('feishuAnyConnectedAtom reflects bot connection state', () => {
    const store = createStore()
    expect(store.get(feishuAnyConnectedAtom)).toBe(false)

    store.set(feishuBotStatesAtom, {
      bot1: { status: 'connected', botId: 'bot1', activeBindings: 1 },
    })
    expect(store.get(feishuAnyConnectedAtom)).toBe(true)

    store.set(feishuBotStatesAtom, {
      bot1: { status: 'disconnected', botId: 'bot1' },
    })
    expect(store.get(feishuAnyConnectedAtom)).toBe(false)
  })

  it('feishuBridgeStateAtom provides backward compatible state', () => {
    const store = createStore()
    const state = store.get(feishuBridgeStateAtom)
    expect(state).toHaveProperty('status')
    expect(['connected', 'disconnected', 'connecting', 'error']).toContain(state.status)
  })

  it('sessionFeishuNotifyModeAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(sessionFeishuNotifyModeAtom)).toEqual(new Map())
  })

  it('feishuBindingsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(feishuBindingsAtom)).toEqual([])
  })

  it('can set and retrieve feishuDefaultNotifyModeAtom values', () => {
    const store = createStore()
    store.set(feishuDefaultNotifyModeAtom, 'always')
    expect(store.get(feishuDefaultNotifyModeAtom)).toBe('always')

    store.set(feishuDefaultNotifyModeAtom, 'off')
    expect(store.get(feishuDefaultNotifyModeAtom)).toBe('off')
  })
})
