// Ported verbatim from uclaw ui/src/lib/types.ts (LearningListFacetsInput, FacetDto, and related types)

// ─── Learning / openhuman facets (Sprint 1.10 + Sprint 2.2) ─────────────

/** Filter input for `memory_learning_list_facets`. Both filters are
 *  optional — pass `undefined` to return all facets. */
export interface LearningListFacetsInput {
  /** "identity" / "style" / "tooling" / "veto" / "goal" / "channel". */
  class?: string;
  /** "active" / "provisional" / "candidate" / "forgotten". */
  state?: string;
}

/** Camel-case wire shape returned by `memory_learning_list_facets`.
 *  Mirrors Rust's `FacetDto` (snake → camel via serde rename_all). */
export interface FacetDto {
  facetId: string;
  class: string;
  name: string;
  value: string;
  state: string;
  stability: number;
  evidenceCount: number;
  lastSeenAtMs: number;
}

/** Input for `memory_learning_rebuild_now`. */
export interface LearningRebuildNowInput {
  /** Reserved for future per-space scoping; currently ignored
   *  (facet store is global). */
  spaceId?: string;
}

/** Input for `memory_learning_dismiss_facet`. Marks a facet as
 *  "forgotten" (state flip, not deletion) so the next rebuild can
 *  resurface it if new evidence accumulates. */
export interface LearningDismissFacetInput {
  facetId: string;
}

/** Result of `memory_learning_dismiss_facet`. */
export interface LearningDismissOutcome {
  facet_id: string;
  rows_updated: number;
  new_state: string;
}

/** Sprint 2.3 — input for `memory_learning_promote_facet`. Soft
 *  override that lifts a facet to `active` so the next prompt build
 *  includes it; the next stability rebuild may demote again if
 *  evidence is too weak. */
export interface LearningPromoteFacetInput {
  facetId: string;
}

/** Sprint 2.3 — input for `memory_learning_demote_facet`. Knock an
 *  active facet down to `provisional` so it stops appearing in the
 *  system prompt without forgetting it. */
export interface LearningDemoteFacetInput {
  facetId: string;
}

/** Sprint 2.3 — shared outcome shape for promote / demote. Mirrors
 *  the existing dismiss outcome. */
export interface LearningSetStateOutcome {
  facet_id: string;
  rows_updated: number;
  new_state: string;
}
