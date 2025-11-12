use std::sync::Arc;

use tauri::State;

use crate::db::{db::Repository, dto::{Map, Shortcut}};

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
        .invoke_handler(tauri::generate_handler![
            get_maps,
            save_shortcut,
            log_message,
            list_shortcuts_by_map
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn log_message(message: String) {
    println!("Log from frontend: {}", message);
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_maps(app_state: State<Arc<AppState>>) -> Vec<Map> {
    app_state.repo.list_maps().unwrap_or_default()
}

#[tauri::command]
fn save_shortcut(app_state: State<Arc<AppState>>, map_id: i32, shortcut: String, description: String, id: Option<i64>) -> Result<i64, String> {

    println!("removing existing shortcut reference if any");
    if let Err(e) = app_state.repo.remove_shortcut_reference(map_id, &shortcut) {
        println!("Error deleting existing shortcut: {}", e);
    }

    print!("Saving shortcut: map_id={}, shortcut='{}', description='{}', id={:?}\n", map_id, shortcut, description, id);
    match id {
        Some(shortcut_id) => {
            if let Err(e) = app_state.repo.edit_shortcut(map_id, shortcut_id, &description, &shortcut) {
                return Err(format!("Error editing shortcut: {}", e));
            }
            Ok(shortcut_id)
        }
        None => app_state.repo.save_shortcut(map_id, &description, &shortcut)
            .map_err(|e| format!("Error saving shortcut: {}", e)),
    }
}

#[tauri::command]
fn list_shortcuts_by_map(app_state: State<Arc<AppState>>, map_id: i32) -> Result<Vec<Shortcut>, String> {
    app_state.repo.list_shortcuts(map_id)
        .map_err(|e| format!("Error listing shortcuts: {}", e))
}