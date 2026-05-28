/**
 * Canonical type subset ported from uclaw ui/src/lib/types.ts.
 *
 * Strategy: uclaw's lib/types.ts is ~1 600 LOC (full app-wide type registry).
 * We port only the symbols needed by the chat-agent feature and its composer
 * chips. Additional symbols can be added here as feature parity expands.
 *
 * Ported symbols
 * ──────────────
 *  - ProactiveLearningEvent  (agent-atoms.ts dedup target; chips Task 7)
 *  - InvocableSkill          (composer `/`-autocomplete; chips Task 7)
 *  - WorkspaceFileMatch      (composer `@`-autocomplete; chips Task 7)
 */

// ─── Proactive Learning ─────────────────────────────────────────────────────

/** Proactive learning event from agent */
export interface ProactiveLearningEvent {
  scenario: "conversation_learning" | "skill_extraction" | "multimodal_context";
  items_extracted: number;
  categories: string[];
  timestamp: string;
  summary: string;
  /** Session ID that sourced the extraction context. Used by AgentMessages
   *  to scope the chip to that session. May be null for legacy events. */
  sessionId?: string | null;
}

// ─── Composer autocomplete types ─────────────────────────────────────────────

/** Composer `/`-autocomplete row. Mirrors the `InvocableSkill` payload
 *  from PR #120's `list_invocable_skills` IPC. `lifecycle` is only set
 *  for learned skills; the frontend uses it to flag draft / deprecated
 *  rows with a subdued style. */
export interface InvocableSkill {
  name: string;
  description: string;
  provenance: 'static' | 'borrowed' | 'learned';
  lifecycle?: 'draft' | 'promoted' | 'deprecated';
}

/** Composer `@`-autocomplete row. Returned by
 *  `search_workspace_files_for_mention`. The popup renders `name` on
 *  top, `relative_path` underneath; on select it inserts a file_path
 *  chip carrying `absolutePath` so the agent loop's path-policy and
 *  attach-as-context can do their work. */
export interface WorkspaceFileMatch {
  name: string;
  absolutePath: string;
  relativePath: string;
  /** Lowercased extension without the dot (e.g. "tsx"), or "" for files
   *  without one. Drives the icon hint in the popup. */
  extension: string;
}
