const Database = require("better-sqlite3");

const db = new Database("database/school.db");

db.pragma("journal_mode = WAL");

function hasColumn(table, column) {
    const sql = "PRAGMA table_info(" + table + ")";
    return db
        .prepare(sql)
        .all()
        .some(function (row) {
            return row.name === column;
        });
}

function addColumn(table, column, definition) {
    if (!hasColumn(table, column)) {
        const sql =
            "ALTER TABLE " +
            table +
            " ADD COLUMN " +
            column +
            " " +
            definition;

        db.prepare(sql).run();
    }
}

/* =========================
   STUDENTS
   ========================= */

db.prepare(
    "CREATE TABLE IF NOT EXISTS students (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    "name TEXT NOT NULL, " +
    "age INTEGER NOT NULL, " +
    "className TEXT NOT NULL" +
    ")"
).run();

addColumn("students", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("students", "photo", "TEXT");

/* =========================
   TEACHERS
   ========================= */

db.prepare(
    "CREATE TABLE IF NOT EXISTS teachers (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    "name TEXT NOT NULL, " +
    "age INTEGER NOT NULL, " +
    "subject TEXT NOT NULL, " +
    "email TEXT NOT NULL UNIQUE" +
    ")"
).run();

addColumn("teachers", "schoolId", "INTEGER NOT NULL DEFAULT 1");
addColumn("teachers", "photo", "TEXT");

/* =========================
   CLASSES
   ========================= */

db.prepare(
    "CREATE TABLE IF NOT EXISTS classes (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    "name TEXT NOT NULL, " +
    "section TEXT NOT NULL" +
    ")"
).run();

addColumn("classes", "teacher", "TEXT NOT NULL DEFAULT ''");
addColumn("classes", "room", "TEXT NOT NULL DEFAULT ''");
addColumn("classes", "schoolId", "INTEGER NOT NULL DEFAULT 1");

/* =========================
   SCHOOLS
   ========================= */

db.prepare(
    "CREATE TABLE IF NOT EXISTS schools (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
    "name TEXT NOT NULL, " +
    "code TEXT NOT NULL UNIQUE, " +
    "password TEXT NOT NULL DEFAULT ''" +
    ")"
).run();

db.prepare(
    "INSERT OR IGNORE INTO schools " +
    "(id, name, code, password) " +
    "VALUES (1, 'SchoolConnect', 'DEFAULT-SCHOOL', '')"
).run();

/* =========================
   EXISTING DATA
   ========================= */

db.prepare(
    "UPDATE students SET schoolId = 1 WHERE schoolId IS NULL"
).run();

db.prepare(
    "UPDATE teachers SET schoolId = 1 WHERE schoolId IS NULL"
).run();

db.prepare(
    "UPDATE classes SET schoolId = 1 WHERE schoolId IS NULL"
).run();

console.log("Database connected successfully!");
console.log("SchoolConnect database ready!");

module.exports = db;