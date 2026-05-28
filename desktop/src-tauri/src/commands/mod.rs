//! Command modules, one file per domain. Keep commands thin; logic lives in `services`.
//! As domains grow, add `pub mod <domain>;` here and reference fns in `lib.rs`'s
//! `generate_handler!` list — never collapse them into one file.

pub mod app;
