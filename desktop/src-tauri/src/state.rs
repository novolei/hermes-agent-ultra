//! Shared application state. Holds Arc handles to services.
//! (Hermes core services are added in Plan 2.)

use crate::services::app_service::AppService;

#[derive(Clone, Default)]
pub struct AppState {
    pub app: AppService,
}
