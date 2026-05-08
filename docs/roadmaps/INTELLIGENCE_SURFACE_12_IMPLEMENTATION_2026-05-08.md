# Intelligence Surface 12 Implementation (2026-05-08)

This tranche closes twelve concrete runtime/UX/safety deltas with Rust-native implementation.

## Scope

1. Add `/context` slash surface (`status|breakdown|compress`).
2. Add `/recap` slash surface for deterministic session recap.
3. Upgrade `/branch` to persist real branch checkpoint snapshots.
4. Add global `--ignore-user-config` flag.
5. Add global `--ignore-rules` flag.
6. Add MCP server capability flag `supports_parallel_tool_calls`.
7. Upgrade `/reload` to perform real dotenv+config rehydrate.
8. Harden dangerous command detection patterns (deny/confirm layers).
9. Add hook context spill-to-disk for oversized hook payloads.
10. Add compaction-time secret redaction in summarization serialization.
11. Implement real `/copy` clipboard behavior with safe fallback.
12. Stabilize TUI status ticker width rendering with width-aware fitting.

## Implementation Notes

- CLI flags are wired in parser + startup env bootstrap and enforced in config loader.
- MCP parallel capability is surfaced in:
  - `config.yaml` (`mcp_servers[*].supports_parallel_tool_calls`)
  - `mcp_servers.json`
  - `/mcp` and `hermes mcp list/test` output.
- Hook spill artifacts are written under `<HERMES_HOME>/hooks/spills/`.
- Compaction redaction strips common credential tokens before summary prompts.

## Validation Plan

- `cargo test -p hermes-config`
- `cargo test -p hermes-tools approval::tests`
- `cargo test -p hermes-cli commands::tests`
- `cargo test -p hermes-agent compression`
- `cargo check --workspace`
- interactive smoke:
  - `/context status`
  - `/recap`
  - `/copy`
  - `/reload`
  - `/mcp`

