import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  channelsAtom,
  channelsLoadedAtom,
  conversationsAtom,
  currentConversationIdAtom,
  currentMessagesAtom,
  streamingStatesAtom,
  streamingConversationIdsAtom,
  streamingAtom,
  streamingContentAtom,
  streamingReasoningAtom,
  streamingModelAtom,
  streamingToolActivitiesAtom,
  selectedModelAtom,
  currentConversationAtom,
  contextLengthAtom,
  parallelModeAtom,
  thinkingEnabledAtom,
  contextDividersAtom,
  pendingAttachmentsAtom,
  hasMoreMessagesAtom,
  INITIAL_MESSAGE_LIMIT,
  chatStreamErrorsAtom,
  currentChatErrorAtom,
  conversationDraftsAtom,
  currentConversationDraftAtom,
  chatPendingMessageAtom,
  chatMessageRefreshAtom,
  pendingAgentRecommendationAtom,
  conversationModelsAtom,
  conversationContextLengthAtom,
  conversationThinkingEnabledAtom,
  conversationParallelModeAtom,
  thinkingExpandedAtom,
  CONTEXT_LENGTH_OPTIONS,
} from './chat-atoms'

describe('chat-atoms', () => {
  it('channelsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(channelsAtom)).toEqual([])
  })

  it('channelsLoadedAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(channelsLoadedAtom)).toBe(false)
  })

  it('conversationsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(conversationsAtom)).toEqual([])
  })

  it('currentConversationIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(currentConversationIdAtom)).toBeNull()
  })

  it('currentMessagesAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(currentMessagesAtom)).toEqual([])
  })

  it('streamingStatesAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(streamingStatesAtom)).toEqual(new Map())
  })

  it('streamingConversationIdsAtom defaults to empty Set', () => {
    const store = createStore()
    expect(store.get(streamingConversationIdsAtom)).toEqual(new Set())
  })

  it('streamingAtom defaults to false when no current conversation', () => {
    const store = createStore()
    expect(store.get(streamingAtom)).toBe(false)
  })

  it('streamingContentAtom defaults to empty string when no current conversation', () => {
    const store = createStore()
    expect(store.get(streamingContentAtom)).toBe('')
  })

  it('streamingReasoningAtom defaults to empty string when no current conversation', () => {
    const store = createStore()
    expect(store.get(streamingReasoningAtom)).toBe('')
  })

  it('streamingModelAtom defaults to null when no current conversation', () => {
    const store = createStore()
    expect(store.get(streamingModelAtom)).toBeNull()
  })

  it('streamingToolActivitiesAtom defaults to empty array when no current conversation', () => {
    const store = createStore()
    expect(store.get(streamingToolActivitiesAtom)).toEqual([])
  })

  it('selectedModelAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(selectedModelAtom)).toBeNull()
  })

  it('currentConversationAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(currentConversationAtom)).toBeNull()
  })

  it('contextLengthAtom defaults to infinite', () => {
    const store = createStore()
    expect(store.get(contextLengthAtom)).toBe('infinite')
  })

  it('parallelModeAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(parallelModeAtom)).toBe(false)
  })

  it('thinkingEnabledAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(thinkingEnabledAtom)).toBe(false)
  })

  it('contextDividersAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(contextDividersAtom)).toEqual([])
  })

  it('pendingAttachmentsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(pendingAttachmentsAtom)).toEqual([])
  })

  it('hasMoreMessagesAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(hasMoreMessagesAtom)).toBe(false)
  })

  it('INITIAL_MESSAGE_LIMIT is 10', () => {
    expect(INITIAL_MESSAGE_LIMIT).toBe(10)
  })

  it('chatStreamErrorsAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(chatStreamErrorsAtom)).toEqual(new Map())
  })

  it('currentChatErrorAtom defaults to null when no current conversation', () => {
    const store = createStore()
    expect(store.get(currentChatErrorAtom)).toBeNull()
  })

  it('conversationDraftsAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(conversationDraftsAtom)).toEqual(new Map())
  })

  it('currentConversationDraftAtom defaults to empty string when no current conversation', () => {
    const store = createStore()
    expect(store.get(currentConversationDraftAtom)).toBe('')
  })

  it('chatPendingMessageAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(chatPendingMessageAtom)).toBeNull()
  })

  it('chatMessageRefreshAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(chatMessageRefreshAtom)).toEqual(new Map())
  })

  it('pendingAgentRecommendationAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(pendingAgentRecommendationAtom)).toBeNull()
  })

  it('conversationModelsAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(conversationModelsAtom)).toEqual(new Map())
  })

  it('conversationContextLengthAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(conversationContextLengthAtom)).toEqual(new Map())
  })

  it('conversationThinkingEnabledAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(conversationThinkingEnabledAtom)).toEqual(new Map())
  })

  it('conversationParallelModeAtom defaults to empty Map', () => {
    const store = createStore()
    expect(store.get(conversationParallelModeAtom)).toEqual(new Map())
  })

  it('thinkingExpandedAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(thinkingExpandedAtom)).toBe(false)
  })

  it('CONTEXT_LENGTH_OPTIONS includes infinite', () => {
    expect(CONTEXT_LENGTH_OPTIONS).toContain('infinite')
    expect(CONTEXT_LENGTH_OPTIONS.length).toBeGreaterThan(0)
  })

  it('CONTEXT_LENGTH_OPTIONS contains all expected numeric values', () => {
    expect(CONTEXT_LENGTH_OPTIONS).toContain(0)
    expect(CONTEXT_LENGTH_OPTIONS).toContain(5)
    expect(CONTEXT_LENGTH_OPTIONS).toContain(10)
    expect(CONTEXT_LENGTH_OPTIONS).toContain(15)
    expect(CONTEXT_LENGTH_OPTIONS).toContain(20)
  })

  it('currentConversationDraftAtom is writable and trims empty strings', () => {
    const store = createStore()
    store.set(currentConversationIdAtom, 'conv-1')
    store.set(currentConversationDraftAtom, 'hello world')
    expect(store.get(currentConversationDraftAtom)).toBe('hello world')
    // Setting whitespace-only draft removes the entry
    store.set(currentConversationDraftAtom, '   ')
    expect(store.get(currentConversationDraftAtom)).toBe('')
  })
})
