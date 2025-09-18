use std::sync::{Arc, Mutex};

use rusqlite::{Connection, Result};

pub struct Repository {
    conn: Arc<Mutex<Connection>>,
}

impl Repository {
    pub fn new() -> Result<Self> {
        let conn = init_db()?;
        Ok(Repository { conn: Arc::new(Mutex::new(conn)) })
    }

    pub fn list_maps(&self) -> Result<Vec<(i32, String, String)>> {
        let con = self.conn.lock().unwrap();
        let mut stmt = con.prepare("SELECT id, name, image_path FROM maps")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;

        let mut maps = Vec::new();
        for map in rows {
            maps.push(map?);
        }
        print!("{:#?}", maps);
        Ok(maps)
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


