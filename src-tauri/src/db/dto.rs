use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Map {
    pub id: i32,
    pub name: String,
    pub image_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Shortcut {
    pub id: i64,
    pub map_id: i32,
    pub description: String,
    pub shortcut: String,
}