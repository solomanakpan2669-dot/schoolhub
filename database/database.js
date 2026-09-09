const Database = require("better-sqlite3");

const db = new Database("database/school.db");

db.pragma("journal_mode = WAL");

// ======================================================
// HELPERS
// ======================================================

function hasColumn(table, column) {
    return db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some(row => row.name === column);
}

function addColumn(table, column, definition) {
    if (!hasColumn(table, column)) {
        db.prepare(
            `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
        ).run();

        console.log(`Added ${table}.${column}`);
    }
}

// ======================================================
// STUDENTS TABLE
// ======================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        className TEXT NOT NULL
    )
`).run();

// Add columns required by the current API
addColumn("students", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("students", "photo", "TEXT");

// ======================================================
// TEACHERS TABLE
// ======================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        subject TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )
`).run();

// Add columns required by the current API
addColumn("teachers", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("teachers", "photo", "TEXT");

// ======================================================
// CLASSES TABLE
// ======================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        section TEXT NOT NULL
    )
`).run();

// Add columns required by the current API
addColumn("classes", "teacher", "TEXT NOT NULL DEFAULT ''");
addColumn("classes", "room", "TEXT NOT NULL DEFAULT ''");

// ======================================================
// MAKE SURE EXISTING DATA BELONGS TO SCHOOL 1
// ======================================================

db.prepare(`
    UPDATE students
    SET schoolId = 1
    WHERE schoolId IS NULL
`).run();

db.prepare(`
    UPDATE teachers
    SET schoolId = 1
    WHERE schoolId IS NULL
`).run();

// ======================================================
// SCHOOLS TABLE
// ======================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL DEFAULT ''
    )
`).run();

db.prepare(`
    INSERT OR IGNORE INTO schools
    (id, name, code, password)
    VALUES
    (1, 'SchoolConnect', 'DEFAULT-SCHOOL', '')
`).run();

console.log("======================================");
console.log("SchoolConnect database ready!");
console.log("Existing data has been preserved.");
console.log("Students, teachers and classes are persistent.");
console.log("======================================");

module.exports = db;
