// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod db;

fn main() {
    let _conn = db::init_db().expect("Failed to initialize the database");
    my_nades_lib::run()
}
