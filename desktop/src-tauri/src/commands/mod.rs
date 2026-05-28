//! Command modules, one file per domain. Keep commands thin; logic lives in `services`.
//! As domains grow, add `pub mod <domain>;` here and reference fns in `lib.rs`'s
//! `collect_commands!` list — never collapse them into one file.

pub mod agent;
pub mod app;
pub mod session;
