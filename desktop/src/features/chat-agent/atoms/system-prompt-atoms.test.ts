import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  promptConfigAtom,
  selectedPromptIdAtom,
  promptListAtom,
  defaultPromptIdAtom,
  selectedPromptAtom,
  resolvedSystemMessageAtom,
  resolveSystemMessage,
} from './system-prompt-atoms'

describe('system-prompt-atoms', () => {
  beforeEach(() => localStorage.clear())

  it('promptConfigAtom returns a config object on first read', () => {
    const store = createStore()
    const cfg = store.get(promptConfigAtom)
    expect(cfg).toBeDefined()
    expect(cfg.prompts).toBeDefined()
    expect(Array.isArray(cfg.prompts)).toBe(true)
  })

  it('selectedPromptIdAtom has a deterministic default (BUILTIN_DEFAULT_ID)', () => {
    const store = createStore()
    const v = store.get(selectedPromptIdAtom)
    expect(v).toBe('builtin-default')
  })

  it('promptListAtom derives prompts from promptConfigAtom', () => {
    const store = createStore()
    const list = store.get(promptListAtom)
    const config = store.get(promptConfigAtom)
    expect(list).toEqual(config.prompts)
  })

  it('defaultPromptIdAtom derives defaultPromptId from promptConfigAtom', () => {
    const store = createStore()
    const defaultId = store.get(defaultPromptIdAtom)
    const config = store.get(promptConfigAtom)
    expect(defaultId).toBe(config.defaultPromptId)
  })

  it('selectedPromptAtom finds the prompt matching selectedPromptIdAtom', () => {
    const store = createStore()
    const selected = store.get(selectedPromptAtom)
    expect(selected).toBeDefined()
    expect(selected?.id).toBe('builtin-default')
  })

  it('resolvedSystemMessageAtom includes the prompt content', () => {
    const store = createStore()
    const message = store.get(resolvedSystemMessageAtom)
    expect(message).toBeDefined()
    expect(message).toContain('helpful assistant')
  })

  it('resolveSystemMessage returns undefined for non-existent promptId', () => {
    const config = store.get(promptConfigAtom)
    const result = resolveSystemMessage('non-existent-id', config, 'testUser')
    expect(result).toBeUndefined()
  })

  it('resolveSystemMessage appends datetime and username when configured', () => {
    const store = createStore()
    const config = store.get(promptConfigAtom)
    const result = resolveSystemMessage('builtin-default', config, 'TestUser')
    expect(result).toBeDefined()
    expect(result).toContain('TestUser')
    expect(result).toContain('当前时间')
  })
})

const store = createStore()
