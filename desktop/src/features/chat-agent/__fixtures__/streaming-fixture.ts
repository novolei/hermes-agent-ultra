/**
 * Agent streaming state fixtures for testing agent components
 * Provides reusable AgentStreamState fixtures with various streaming stages
 */

import type { AgentStreamState } from '../atoms/agent-atoms'

// ─────────────────────────────────────────────────────────
// AgentStreamState Fixtures
// ─────────────────────────────────────────────────────────

/**
 * Initial empty streaming state — before any content begins
 */
export const emptyStreaming: AgentStreamState = {
  running: true,
  content: '',
  reasoning: undefined,
  toolActivities: [],
  teammates: [],
  startedAt: Date.now(),
}

/**
 * Partial streaming state — mid-stream with some content and tool activity
 */
export const partialStreaming: AgentStreamState = {
  running: true,
  content: 'I\'m analyzing your request and will help you set up the environment...',
  reasoning: 'The user wants to set up a development environment. I should first check their current system setup.',
  toolActivities: [
    {
      toolUseId: 'tool-stream-001',
      toolName: 'bash',
      input: { command: 'uname -a' },
      intent: 'check-system',
      displayName: 'System Check',
      done: false,
    },
  ],
  teammates: [],
  inputTokens: 350,
  outputTokens: 45,
  model: 'claude-opus',
  startedAt: Date.now() - 2000,
}

/**
 * Streaming with active teammate — showing parallel execution
 */
export const streamingWithTeammate: AgentStreamState = {
  running: true,
  content: 'Team member 1 is analyzing the codebase...',
  toolActivities: [],
  teammates: [
    {
      taskId: 'task-001',
      toolUseId: 'teammate-001',
      description: 'Analyze code quality',
      taskType: 'analysis',
      index: 0,
      status: 'running',
      progressDescription: 'Scanning 45 files...',
      currentToolName: 'bash',
      currentToolElapsedSeconds: 3.5,
      currentToolUseId: 'tool-analyze-001',
      toolHistory: ['bash', 'file-read'],
      startedAt: Date.now() - 3500,
    },
  ],
  model: 'claude-opus',
  startedAt: Date.now() - 5000,
}

/**
 * Streaming with retry in progress — showing recovery mechanics
 */
export const streamingWithRetry: AgentStreamState = {
  running: true,
  content: 'Retrying the failed operation...',
  toolActivities: [
    {
      toolUseId: 'tool-retry-001',
      toolName: 'bash',
      input: { command: 'npm install' },
      displayName: 'npm install',
      done: false,
    },
  ],
  teammates: [],
  retrying: {
    currentAttempt: 2,
    maxAttempts: 3,
    history: [
      {
        attempt: 1,
        reason: 'Network timeout',
        errorMessage: 'ETIMEDOUT: connection timed out',
        timestamp: Date.now() - 8000,
        delaySeconds: 2,
        environment: {
          runtime: 'Node.js',
          platform: 'macOS',
          model: 'claude-opus',
        },
      },
    ],
    failed: false,
  },
  model: 'claude-opus',
  startedAt: Date.now() - 10000,
}

/**
 * Completed streaming state — finished with full content
 */
export const completedStreaming: AgentStreamState = {
  running: false,
  content: 'I\'ve successfully set up your development environment. Here\'s what was installed:\n\n1. Node.js v18.0.0\n2. npm v9.0.0\n3. TypeScript v5.0.0\n\nYour environment is ready for development!',
  reasoning: 'The setup was successful. All required tools are installed and configured properly.',
  toolActivities: [
    {
      toolUseId: 'tool-complete-001',
      toolName: 'bash',
      input: { command: 'npm install -g typescript' },
      intent: 'setup',
      displayName: 'Install TypeScript',
      done: true,
      result: 'Successfully installed TypeScript v5.0.0',
      elapsedSeconds: 4.2,
    },
    {
      toolUseId: 'tool-complete-002',
      toolName: 'bash',
      input: { command: 'node --version' },
      intent: 'verify',
      displayName: 'Verify Node.js',
      done: true,
      result: 'v18.0.0',
      elapsedSeconds: 0.3,
    },
  ],
  teammates: [],
  inputTokens: 1200,
  outputTokens: 380,
  cacheReadTokens: 100,
  cacheCreationTokens: 50,
  costUsd: 0.018,
  model: 'claude-opus',
  startedAt: Date.now() - 12000,
}

/**
 * Streaming with error state — showing error handling
 */
export const streamingWithError: AgentStreamState = {
  running: false,
  content: 'I encountered an error while trying to complete your request.',
  toolActivities: [
    {
      toolUseId: 'tool-error-001',
      toolName: 'bash',
      input: { command: 'git clone https://example.com/repo.git' },
      intent: 'clone',
      displayName: 'Clone Repository',
      done: true,
      isError: true,
      result: 'fatal: Could not read Password for \'https://example.com\': No such device or address',
      elapsedSeconds: 2.1,
    },
  ],
  teammates: [],
  model: 'claude-opus',
  startedAt: Date.now() - 5000,
}

/**
 * Streaming with background tool activity
 */
export const streamingWithBackgroundTool: AgentStreamState = {
  running: false,
  content: 'I\'ve started a long-running process in the background.',
  toolActivities: [
    {
      toolUseId: 'tool-bg-001',
      toolName: 'bash',
      input: { command: 'npm run build' },
      displayName: 'Build Project',
      done: true,
      isBackground: true,
      result: 'Build process started in background (PID: 12345)',
      elapsedSeconds: 0.5,
    },
  ],
  teammates: [],
  model: 'claude-opus',
  startedAt: Date.now() - 3000,
}

/**
 * Streaming with live output — showing real-time tool output
 */
export const streamingWithLiveOutput: AgentStreamState = {
  running: true,
  content: 'Running tests...',
  toolActivities: [
    {
      toolUseId: 'tool-live-001',
      toolName: 'bash',
      input: { command: 'npm test -- --watch' },
      displayName: 'Run Tests',
      done: false,
      liveOutput: {
        segments: [
          { stream: 'stdout', text: 'PASS src/auth.test.ts\n' },
          { stream: 'stdout', text: '  ✓ should authenticate user (45ms)\n' },
          { stream: 'stdout', text: '  ✓ should reject invalid credentials (12ms)\n' },
          { stream: 'stderr', text: 'Warning: deprecation notice for dependency X\n' },
        ],
        bytes: 256,
        droppedHead: false,
      },
    },
  ],
  teammates: [],
  model: 'claude-opus',
  startedAt: Date.now() - 8000,
}

/**
 * Streaming with usage and compacting state
 */
export const streamingWithCompacting: AgentStreamState = {
  running: false,
  content: 'Completed the task and compacted the conversation history.',
  isCompacting: true,
  compactInFlight: false,
  toolActivities: [],
  teammates: [],
  inputTokens: 2500,
  outputTokens: 650,
  skillsTokens: 300,
  model: 'claude-opus',
  startedAt: Date.now() - 25000,
}

/**
 * Streaming with thinking/reasoning content
 */
export const streamingWithThinking: AgentStreamState = {
  running: false,
  content: 'Based on my analysis, I recommend using a microservices architecture for better scalability.',
  reasoning: 'The application requirements indicate high traffic expectations and multiple independent features. Breaking this into microservices will allow for independent scaling, deployment, and team management. This approach provides flexibility while maintaining clear service boundaries.',
  toolActivities: [
    {
      toolUseId: 'tool-think-001',
      toolName: 'file-read',
      input: { path: 'architecture.md' },
      displayName: 'Review Architecture Docs',
      done: true,
      result: 'Successfully reviewed current architecture documentation',
      elapsedSeconds: 1.2,
    },
  ],
  teammates: [],
  model: 'claude-opus',
  startedAt: Date.now() - 15000,
}

/**
 * Streaming truncated due to token limit
 */
export const streamingTruncated: AgentStreamState = {
  running: false,
  content: 'Here are the key points:\n1. First point\n2. Second point\n3. Third point\n... (truncated due to context window limit)',
  truncated: true,
  toolActivities: [],
  teammates: [],
  inputTokens: 4000,
  outputTokens: 128,
  contextWindow: 4096,
  model: 'claude-opus',
  startedAt: Date.now() - 6000,
}
