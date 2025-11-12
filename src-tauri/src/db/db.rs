use std::sync::{Arc, Mutex};

use rusqlite::{Connection, Result};

use crate::db::dto::{Map, Shortcut};

pub struct Repository {
    conn: Arc<Mutex<Connection>>,
}

impl Repository {
    pub fn new() -> Result<Self> {
        let conn = init_db()?;
        Ok(Repository { conn: Arc::new(Mutex::new(conn)) })
    }

    pub fn list_maps(&self) -> Result<Vec<Map>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, image_path FROM maps")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;

        let mut maps = Vec::new();
        for row in rows {
            match row {
                Ok((id, name, image_path)) => {
                    maps.push(Map {
                        id,
                        name,
                        image_path,
                    });
                }
                Err(_) => continue,
            }
        }

        Ok(maps)
    }

    pub fn remove_shortcut_reference(&self, map_id: i32, shortcut: &str) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE shortcuts SET shortcut = ?1 WHERE map_id = ?2 AND shortcut = ?3",
            ("", map_id, shortcut),
        )?;
        Ok(())
    }

    pub fn save_shortcut(&self, map_id: i32, description: &str, shortcut: &str) -> Result<i64, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO shortcuts (map_id, description, shortcut) VALUES (?1, ?2, ?3)",
            (map_id, description, shortcut),
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn edit_shortcut(&self, map_id: i32, shortcut_id: i64, description: &str, shortcut: &str) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE shortcuts SET description = ?1, shortcut = ?2 WHERE id = ?3 AND map_id = ?4",
            (description, shortcut, shortcut_id, map_id),
        )?;
        Ok(())
    }

    pub fn list_shortcuts(&self, map_id: i32) -> Result<Vec<Shortcut>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, map_id, description, shortcut FROM shortcuts WHERE map_id = ?1")?;
        let rows = stmt.query_map([map_id], |row| {
            Ok(Shortcut {
                id: row.get(0)?,
                map_id: row.get(1)?,
                description: row.get(2)?,
                shortcut: row.get(3)?,
            })
        })?;

        let mut shortcuts = Vec::new();
        for shortcut in rows {
            shortcuts.push(shortcut?);
        }
        Ok(shortcuts)
    }
}

fn init_db() -> Result<Connection> {
    let conn = Connection::open("app.db")?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_path TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS shortcuts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            map_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            shortcut TEXT NOT NULL,
            FOREIGN KEY (map_id) REFERENCES maps (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS medias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shortcut_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            path TEXT NOT NULL,
            FOREIGN KEY (shortcut_id) REFERENCES shortcuts (id) ON DELETE CASCADE
        );
        "
    )?;

    create_maps(&conn)?;

    Ok(conn)
}

fn create_maps(conn: &Connection) -> Result<(), rusqlite::Error> {
    let maps = [
        ("Mirage", "assets/maps/mirage.png"),
        ("Dust2", "assets/maps/dust2.png"),
        ("Inferno", "assets/maps/inferno.png"),
        ("Nuke", "assets/maps/nuke.png"),
        ("Overpass", "assets/maps/overpass.png"),
        ("Vertigo", "assets/maps/vertigo.png"),
        ("Ancient", "assets/maps/ancient.png"),
        ("Train", "assets/maps/train.png"),
        ("Anubis", "assets/maps/anubis.png")
    ];

    for (name, image_path) in &maps {
        conn.execute(
            "INSERT INTO maps (name, image_path)
             SELECT ?1, ?2
             WHERE NOT EXISTS (SELECT 1 FROM maps WHERE name = ?1)",
            (name, image_path),
        )?;
    }

    Ok(())
}