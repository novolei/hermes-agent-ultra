# OpenHuman P2a/P2b Surface Matrix

| Surface | Command/API | Primary code paths | Test coverage |
|---|---|---|---|
| Triage learning loop | `/triage feedback`, `/triage status`, `/triage eval` | `TriggerTriageLearningState`, `triage_learning_bias`, `append_triage_learning_feedback`, `handle_trigger_triage_command` | `p2_trigger_triage_feedback_persists_bias_and_influences_scoring` |
| Subconscious guard packs | `/subconscious profile`, `/subconscious run --dry-run` | `SubconsciousProfile`, `subconscious_guard_allows`, `handle_subconscious_command` | `p2_subconscious_profile_dry_run_blocks_high_risk_tasks` |
| Integration remediation | `/integrations repair` | `render_integrations_repair_steps`, `handle_integrations_command` | `p2_integrations_snapshot_and_repair_commands_work` |
| Integration snapshot export | `/integrations snapshot` | `integrations_snapshot_path`, `handle_integrations_command` | `p2_integrations_snapshot_and_repair_commands_work` |
| Boot threshold profiles | `/boot profile ...` + `/boot` | `BootProfile`, `boot_profile_overall`, `handle_boot_command`, `render_boot_readiness_report` | compile + command handler coverage in `--lib` suite |
| Walkthrough telemetry + insights | `/walkthrough insights` | `walkthrough_events_path`, `append_walkthrough_event`, `load_walkthrough_events`, `render_walkthrough_insights`, `handle_walkthrough_command` | `p2_walkthrough_insights_persists_events` |
| Compression recommendation | `/compress rules recommend` | `recommend_compression_policy_for_app`, `render_compression_recommendation` | `p2_compress_rules_autotune_apply_updates_runtime_env` |
| Compression autotune apply | `/compress rules autotune apply` | `resolve_compression_plane_path`, `handle_compress_rules_command` | `p2_compress_rules_autotune_apply_updates_runtime_env` |
| OAuth gate manifest overrides | env + auth/integration gate | `OAuthRuntimeGateManifest`, `load_oauth_runtime_gate_manifest`, `oauth_runtime_gate_for_provider` | `p2_oauth_runtime_gate_manifest_override_is_honored` |

