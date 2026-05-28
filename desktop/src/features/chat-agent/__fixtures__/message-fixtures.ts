/**
 * Chat message fixtures for testing chat-agent components
 * Provides reusable ChatMessage and AgentMessage fixtures with various states
 */

import type { ChatMessage } from '../lib/chat-types'
import type { AgentMessage } from '../lib/agent-types'

// ─────────────────────────────────────────────────────────
// ChatMessage Fixtures
// ─────────────────────────────────────────────────────────

export const userTurn: ChatMessage = {
  id: 'msg-user-001',
  role: 'user',
  content: 'Can you help me debug this TypeScript error?',
  createdAt: 1622505600000,
}

export const assistantTurn: ChatMessage = {
  id: 'msg-assistant-001',
  role: 'assistant',
  content: 'I\'d be happy to help with your TypeScript error. Can you share the error message and the code?',
  model: 'claude-opus',
  createdAt: 1622505700000,
}

export const twoTurnConversation: ChatMessage[] = [userTurn, assistantTurn]

export const assistantWithReasoning: ChatMessage = {
  id: 'msg-assistant-reasoning-001',
  role: 'assistant',
  content: 'The issue is that you\'re trying to assign a string to a variable of type number.',
  reasoning: 'I analyzed the error and identified that the root cause is a type mismatch between the assigned value and the declared variable type.',
  model: 'claude-opus',
  createdAt: 1622505800000,
}

export const assistantWithToolActivity: ChatMessage = {
  id: 'msg-assistant-tools-001',
  role: 'assistant',
  content: 'I ran a test to verify the fix works correctly.',
  toolActivities: [
    {
      toolCallId: 'tool-001',
      type: 'start',
      toolName: 'bash',
      toolId: 'bash-tool',
      status: 'running',
      input: { command: 'npm test' },
    },
    {
      toolCallId: 'tool-001',
      type: 'result',
      toolName: 'bash',
      status: 'completed',
      result: 'All tests passed!',
      durationMs: 5000,
    },
  ],
  model: 'claude-opus',
  createdAt: 1622505900000,
}

export const assistantWithAttachments: ChatMessage = {
  id: 'msg-assistant-attachments-001',
  role: 'assistant',
  content: 'I\'ve reviewed your file and found the issue.',
  attachments: [
    {
      filename: 'example.ts',
      localPath: '/tmp/example.ts',
      mediaType: 'text/typescript',
      size: 1024,
    },
  ],
  model: 'claude-opus',
  createdAt: 1622506000000,
}

export const systemMessage: ChatMessage = {
  id: 'msg-system-001',
  role: 'system',
  content: 'You are a helpful TypeScript debugging assistant.',
  createdAt: 1622505500000,
}

export const errorMessage: ChatMessage = {
  id: 'msg-error-001',
  role: 'assistant',
  content: 'I encountered an error while processing your request.',
  error: 'Rate limit exceeded',
  stopped: true,
  createdAt: 1622506100000,
}

// ─────────────────────────────────────────────────────────
// AgentMessage Fixtures
// ─────────────────────────────────────────────────────────

export const agentUserMessage: AgentMessage = {
  id: 'agent-msg-user-001',
  sessionId: 'session-001',
  role: 'user',
  content: 'Create a new feature for user authentication',
  createdAt: 1622505600000,
}

export const agentAssistantMessage: AgentMessage = {
  id: 'agent-msg-assistant-001',
  sessionId: 'session-001',
  role: 'assistant',
  content: 'I\'ll help you create a user authentication feature. Let me start by setting up the project structure.',
  model: 'claude-opus',
  createdAt: 1622505700000,
  durationMs: 2000,
}

export const agentMessageWithUsage: AgentMessage = {
  id: 'agent-msg-usage-001',
  sessionId: 'session-001',
  role: 'assistant',
  content: 'The authentication module is ready.',
  model: 'claude-opus',
  createdAt: 1622505800000,
  durationMs: 8500,
  usage: {
    inputTokens: 1500,
    outputTokens: 800,
    cacheReadTokens: 200,
    cacheCreationTokens: 50,
    costUsd: 0.012,
  },
}

export const agentMessageWithToolActivities: AgentMessage = {
  id: 'agent-msg-tools-001',
  sessionId: 'session-001',
  role: 'assistant',
  content: 'I\'ve executed the necessary commands to set up the authentication feature.',
  toolActivities: [
    {
      toolCallId: 'agent-tool-001',
      type: 'start',
      toolName: 'bash',
      toolId: 'bash-tool',
      status: 'running',
      input: { command: 'mkdir -p src/auth' },
    },
    {
      toolCallId: 'agent-tool-001',
      type: 'result',
      toolName: 'bash',
      status: 'completed',
      result: 'Directory created successfully',
      durationMs: 500,
    },
  ],
  model: 'claude-opus',
  createdAt: 1622505900000,
}

export const agentMessageWithReasoning: AgentMessage = {
  id: 'agent-msg-reasoning-001',
  sessionId: 'session-001',
  role: 'assistant',
  content: 'The implementation follows OAuth 2.0 standards.',
  reasoning: 'I analyzed the authentication requirements and determined that OAuth 2.0 is the best approach for security and user experience. This will integrate well with existing systems and provide a secure, scalable solution.',
  model: 'claude-opus',
  createdAt: 1622506000000,
}

export const agentStatusMessage: AgentMessage = {
  id: 'agent-msg-status-001',
  sessionId: 'session-001',
  role: 'status',
  content: 'Compacting conversation history...',
  createdAt: 1622506100000,
}
