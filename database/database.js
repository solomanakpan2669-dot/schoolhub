const Database = require("better-sqlite3");

const db = new Database("database/school.db");

db.pragma("journal_mode = WAL");

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
// STUDENTS
// ======================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        className TEXT NOT NULL
    )
`).run();

addColumn("students", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("students", "photo", "TEXT");


// ======================================================
// TEACHERS
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

addColumn("teachers", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("teachers", "photo", "TEXT");
addColumn("teachers", "password", "TEXT");

/*
    NEW:
    assignedClassId tells us which class a teacher manages.

    NULL means the teacher has not been assigned to a class yet.
*/
addColumn("teachers", "assignedClassId", "INTEGER");


// ======================================================
// CLASSES
// ======================================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        section TEXT NOT NULL
    )
`).run();

addColumn("classes", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("classes", "teacher", "TEXT NOT NULL DEFAULT ''");
addColumn("classes", "room", "TEXT NOT NULL DEFAULT ''");


// ======================================================
// EXISTING DATA
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

db.prepare(`
    UPDATE classes
    SET schoolId = 1
    WHERE schoolId IS NULL
`).run();


// ======================================================
// SCHOOLS
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
console.log("Teacher class assignment is enabled.");
console.log("Students, teachers and classes are persistent.");
console.log("======================================");


module.exports = db;
/* =========================================================
   ANNOUNCEMENTS
========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        schoolId INTEGER DEFAULT 1
    )
`);


/* =========================================================
   TIMETABLE
========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day TEXT NOT NULL,
        className TEXT NOT NULL,
        subject TEXT NOT NULL,
        teacher TEXT NOT NULL,
        time TEXT NOT NULL,
        schoolId INTEGER DEFAULT 1
    )
`);
