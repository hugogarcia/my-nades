use std::sync::Arc;

use tauri::State;

use crate::db::db::Repository;

mod db;

struct AppState {
    pub repo: Repository,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let repo = Repository::new().expect("Failed to initialize database");
    let app_state = AppState { repo };

    tauri::Builder::default()
        .manage(Arc::new(app_state))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_maps])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_maps(app_state: State<Arc<AppState>>) -> Vec<(i32, String, String)> {
    app_state.repo.list_maps().unwrap_or_default()
}