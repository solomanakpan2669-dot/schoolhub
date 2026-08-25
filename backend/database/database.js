const Database = require("better-sqlite3");

const db = new Database("database/school.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        className TEXT NOT NULL
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        subject TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        section TEXT NOT NULL
    )
`).run();

console.log("Database connected successfully!");

module.exports = db;