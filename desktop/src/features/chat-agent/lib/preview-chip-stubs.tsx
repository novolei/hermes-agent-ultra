/**
 * Stub implementations of uclaw's @/components/preview/chips/* for the
 * 2b.2.b.1 port. These provide minimum-viable no-op replacements so
 * Message renders plain markdown without inline file-path chips.
 *
 * Real implementations land in Plan 3.5 (App Shell + file preview).
 * The exported surface here mirrors uclaw's signature shape so swapping
 * them for the real components in 3.5 requires zero changes in Message.
 */

import * as React from 'react'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

// --------------------------------------------------------------------------
// markdownFileChipPlugin — no-op remark plugin
//
// uclaw exports: `const markdownFileChipPlugin: Plugin<[], Root> = ...`
// Stub: returns a transformer that passes the tree through unchanged.
// File-path tokens are rendered as ordinary text/code by react-markdown.
// --------------------------------------------------------------------------
export const markdownFileChipPlugin: Plugin<[], Root> = function plugin() {
  return (tree: Root) => tree
}

// --------------------------------------------------------------------------
// ChipState — mirrors uclaw's type export from FilePathChip.tsx
// --------------------------------------------------------------------------
export type ChipState = 'ok' | 'pending' | 'missing'

// --------------------------------------------------------------------------
// FilePathChipProps — mirrors uclaw's interface export
//
// The real FilePathChip has jotai + Tauri IPC deps we don't bring in yet.
// Stub renders the label as plain inline code (no click, no icon, no
// state colouring). Plan 3.5 swaps in the full chip component.
// --------------------------------------------------------------------------
export interface FilePathChipProps {
  rawPath: string
  label: string
  state: ChipState
  mountId: string
  relPath: string
  absolutePath: string
  sessionId?: string | null
  line?: number
  col?: number
}

export function FilePathChip({ label, line, col }: FilePathChipProps): React.ReactElement {
  return (
    <code className="text-muted-foreground/80 font-mono text-[0.875em]">
      {label}
      {line !== undefined ? `:${line}` : ''}
      {col !== undefined ? `:${col}` : ''}
    </code>
  )
}

// --------------------------------------------------------------------------
// ChipResolutionEntry — mirrors uclaw's type from preview-chip-atoms
// --------------------------------------------------------------------------
export interface ChipResolutionEntry {
  state: ChipState
  mountId: string
  relPath: string
  absolutePath: string
}

const PENDING_ENTRY: ChipResolutionEntry = {
  state: 'pending',
  mountId: '',
  relPath: '',
  absolutePath: '',
}

// --------------------------------------------------------------------------
// useFileChipResolver — mirrors uclaw signature:
//   useFileChipResolver(rawPath: string, sessionId: string | null): ChipResolutionEntry
//
// Stub: always returns a pending entry synchronously (no IPC, no jotai).
// --------------------------------------------------------------------------
export function useFileChipResolver(
  _rawPath: string,
  _sessionId: string | null,
): ChipResolutionEntry {
  return PENDING_ENTRY
}

// --------------------------------------------------------------------------
// useChipCacheInvalidator — mirrors uclaw signature:
//   useChipCacheInvalidator(): void
//
// Stub: no-op (no files_rail:change listener needed before Plan 3.5).
// --------------------------------------------------------------------------
export function useChipCacheInvalidator(): void {
  // no-op stub
}
