/**
 * Tool activity fixtures for testing agent tool execution
 * Provides reusable ToolActivity and ChatToolActivity fixtures with various states
 */

import type { ToolActivity, LiveOutput } from '../atoms/agent-atoms'
import type { ChatToolActivity } from '../lib/chat-types'

// ─────────────────────────────────────────────────────────
// ToolActivity Fixtures (Real-time streaming state)
// ─────────────────────────────────────────────────────────

/**
 * Pending tool use — started but no result yet
 */
export const pendingToolUse: ToolActivity = {
  toolUseId: 'tool-pending-001',
  toolName: 'bash',
  input: { command: 'npm test' },
  intent: 'test-verification',
  displayName: 'Run Tests',
  done: false,
}

/**
 * Completed tool use — started and returned successful result
 */
export const completedToolUse: ToolActivity = {
  toolUseId: 'tool-completed-001',
  toolName: 'bash',
  input: { command: 'npm test' },
  intent: 'test-verification',
  displayName: 'Run Tests',
  result: 'PASS: All 45 tests passed in 3.2s',
  done: true,
  elapsedSeconds: 3.2,
}

/**
 * Errored tool use — started and returned an error
 */
export const erroredToolUse: ToolActivity = {
  toolUseId: 'tool-error-001',
  toolName: 'bash',
  input: { command: 'git clone https://invalid.url/repo.git' },
  intent: 'clone-repo',
  displayName: 'Clone Repository',
  result: 'fatal: unable to access \'https://invalid.url/repo.git\': Could not resolve host: invalid.url',
  isError: true,
  done: true,
  elapsedSeconds: 2.1,
}

/**
 * Tool use with live output streaming
 */
export const toolWithLiveOutput: ToolActivity = {
  toolUseId: 'tool-live-001',
  toolName: 'bash',
  input: { command: 'npm run build' },
  intent: 'build-project',
  displayName: 'Build Project',
  done: false,
  liveOutput: {
    segments: [
      { stream: 'stdout', text: '[1/3] Compiling TypeScript...\n' },
      { stream: 'stdout', text: 'Successfully compiled 142 files\n' },
      { stream: 'stdout', text: '[2/3] Bundling...\n' },
      { stream: 'stderr', text: 'Warning: Large chunk detected (chunk-abc.js: 512KB)\n' },
    ],
    bytes: 512,
    droppedHead: false,
  },
}

/**
 * Tool use with large live output that exceeded buffer
 */
export const toolWithDroppedOutput: ToolActivity = {
  toolUseId: 'tool-dropped-001',
  toolName: 'bash',
  input: { command: 'cat large-log-file.txt' },
  intent: 'view-logs',
  displayName: 'View Log File',
  done: true,
  liveOutput: {
    segments: [
      { stream: 'stdout', text: '...(earlier output dropped - buffer exceeded)...\n' },
      { stream: 'stdout', text: 'Error occurred at 2024-01-15 14:32:45\n' },
      { stream: 'stdout', text: 'Stack trace: ...\n' },
    ],
    bytes: 262144, // 256KB limit
    droppedHead: true,
  },
  result: 'Successfully displayed log file (truncated)',
  elapsedSeconds: 1.5,
}

/**
 * Tool use with task ID (for task-based execution)
 */
export const toolWithTaskId: ToolActivity = {
  toolUseId: 'tool-task-001',
  toolName: 'bash',
  input: { command: 'npm run deploy' },
  intent: 'deploy',
  displayName: 'Deploy Application',
  taskId: 'task-deploy-prod-001',
  done: false,
}

/**
 * Tool use with parent tool use ID (nested/dependent tools)
 */
export const toolWithParent: ToolActivity = {
  toolUseId: 'tool-child-001',
  toolName: 'file-write',
  input: { path: 'src/config.json', content: '{"apiUrl": "..."}' },
  intent: 'write-config',
  displayName: 'Write Config File',
  parentToolUseId: 'tool-setup-001',
  done: true,
  result: 'Successfully wrote config file',
  elapsedSeconds: 0.3,
}

/**
 * Background tool use — running in parallel without blocking UI
 */
export const backgroundToolUse: ToolActivity = {
  toolUseId: 'tool-bg-001',
  toolName: 'bash',
  input: { command: 'npm run watch' },
  intent: 'continuous-build',
  displayName: 'Watch for Changes',
  isBackground: true,
  done: false,
}

/**
 * Tool use with image attachments (e.g., from screenshot/OCR tools)
 */
export const toolWithImageAttachments: ToolActivity = {
  toolUseId: 'tool-img-001',
  toolName: 'bash',
  input: { command: 'screenshot /tmp/screenshot.png' },
  intent: 'capture-screen',
  displayName: 'Capture Screenshot',
  done: true,
  result: 'Screenshot saved successfully',
  elapsedSeconds: 0.8,
  imageAttachments: [
    {
      filename: 'screenshot-001.png',
      localPath: '/tmp/screenshot-001.png',
      mediaType: 'image/png',
    },
  ],
}

/**
 * Tool use with shell ID (for managed shell sessions)
 */
export const toolWithShellId: ToolActivity = {
  toolUseId: 'tool-shell-001',
  toolName: 'bash',
  input: { command: 'ls -la' },
  intent: 'list-directory',
  displayName: 'List Directory',
  shellId: 'shell-session-001',
  done: true,
  result: 'total 48\ndrwxr-xr-x  8 user  staff  256 Jan 15 14:00 .\ndrwxr-xr-x  5 user  staff  160 Jan 15 10:00 ..\n-rw-r--r--  1 user  staff 1024 Jan 15 14:00 file.ts',
  elapsedSeconds: 0.2,
}

/**
 * Long-running tool use with significant elapsed time
 */
export const longRunningToolUse: ToolActivity = {
  toolUseId: 'tool-long-001',
  toolName: 'bash',
  input: { command: 'npm run test -- --coverage' },
  intent: 'test-coverage',
  displayName: 'Run Tests with Coverage',
  done: true,
  result: 'Coverage report: 89.5% lines covered',
  elapsedSeconds: 127.5, // 2+ minutes
}

// ─────────────────────────────────────────────────────────
// ChatToolActivity Fixtures (Persisted message state)
// ─────────────────────────────────────────────────────────

/**
 * Chat tool activity start event
 */
export const chatToolStart: ChatToolActivity = {
  toolCallId: 'chat-tool-start-001',
  type: 'start',
  toolId: 'bash-tool',
  toolName: 'bash',
  status: 'running',
  input: { command: 'npm test' },
}

/**
 * Chat tool activity with successful result
 */
export const chatToolCompleted: ChatToolActivity = {
  toolCallId: 'chat-tool-completed-001',
  type: 'result',
  toolName: 'bash',
  status: 'completed',
  result: 'PASS: 45 tests passed',
  durationMs: 3200,
}

/**
 * Chat tool activity with error result
 */
export const chatToolErrored: ChatToolActivity = {
  toolCallId: 'chat-tool-error-001',
  type: 'result',
  toolName: 'bash',
  status: 'failed',
  result: 'Command failed: npm test exited with code 1',
  isError: true,
  durationMs: 1500,
  error: 'ENOENT: no such file or directory, open \'package.json\'',
}

/**
 * Chat tool activity with live output (streaming in progress)
 */
export const chatToolWithLiveOutput: ChatToolActivity = {
  toolCallId: 'chat-tool-live-001',
  type: 'start',
  toolId: 'bash-tool',
  toolName: 'bash',
  status: 'running',
  input: { command: 'npm run build -- --watch' },
  liveOutput: {
    segments: [
      { stream: 'stdout', text: 'Watching for changes...\n' },
      { stream: 'stdout', text: 'Detected change in src/index.ts\n' },
      { stream: 'stdout', text: 'Compiling...\n' },
      { stream: 'stdout', text: 'Successfully compiled (0.5s)\n' },
    ],
    bytes: 128,
    droppedHead: false,
  },
}

/**
 * Chat tool activity pair — start + result in same sequence
 */
export const chatToolActivityPair: ChatToolActivity[] = [
  {
    toolCallId: 'chat-tool-pair-001',
    type: 'start',
    toolId: 'bash-tool',
    toolName: 'bash',
    status: 'running',
    input: { command: 'echo "Hello World"' },
  },
  {
    toolCallId: 'chat-tool-pair-001',
    type: 'result',
    toolName: 'bash',
    status: 'completed',
    result: 'Hello World',
    durationMs: 145,
  },
]

/**
 * Multiple chat tool activities in sequence
 */
export const multipleToolActivities: ChatToolActivity[] = [
  {
    toolCallId: 'chat-tool-multi-001',
    type: 'start',
    toolId: 'bash-tool',
    toolName: 'bash',
    status: 'running',
    input: { command: 'cd /tmp && mkdir test-dir' },
  },
  {
    toolCallId: 'chat-tool-multi-001',
    type: 'result',
    toolName: 'bash',
    status: 'completed',
    result: 'Directory created',
    durationMs: 234,
  },
  {
    toolCallId: 'chat-tool-multi-002',
    type: 'start',
    toolId: 'file-write-tool',
    toolName: 'file-write',
    status: 'running',
    input: { path: '/tmp/test-dir/test.txt', content: 'test content' },
  },
  {
    toolCallId: 'chat-tool-multi-002',
    type: 'result',
    toolName: 'file-write',
    status: 'completed',
    result: 'File written successfully',
    durationMs: 89,
  },
]
