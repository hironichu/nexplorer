#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::PathBuf;

#[tauri::command]
fn rename_dir(path: &str, rename: &str) -> Option<String> {
  let mut path = PathBuf::from(path);
  path.push(rename);
  let path = path.to_str().unwrap();

  match std::fs::rename(path, path) {
    Ok(_) => Some(rename.clone().to_owned()),
    Err(e) => Some(e.to_string()),
  }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![rename_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
