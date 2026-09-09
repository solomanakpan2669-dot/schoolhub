const Database = require("better-sqlite3");

const db = new Database("database/school.db");

// ======================================================
// SCHOOLS
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`);

// ======================================================
// STUDENTS
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schoolId INTEGER NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        className TEXT NOT NULL,
        FOREIGN KEY (schoolId) REFERENCES schools(id)
    )
`);

// ======================================================
// STUDENT PHOTOS
// ======================================================

try {
    const studentColumns = db.prepare("PRAGMA table_info(students)").all();

    const hasPhotoColumn = studentColumns.some(
        column => column.name === "photo"
    );

    if (!hasPhotoColumn) {
        db.exec(`
            ALTER TABLE students
            ADD COLUMN photo TEXT
        `);

        console.log("Student photo column added successfully.");
    }
} catch (error) {
    console.error("STUDENT PHOTO MIGRATION ERROR:", error);
}


// ======================================================
// TEACHERS
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schoolId INTEGER NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        subject TEXT NOT NULL,
        email TEXT NOT NULL,
        FOREIGN KEY (schoolId) REFERENCES schools(id)
    )
`);

// ======================================================
// CLASSES
// ======================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schoolId INTEGER NOT NULL,
        name TEXT NOT NULL,
        teacher TEXT NOT NULL,
        room TEXT NOT NULL,
        FOREIGN KEY (schoolId) REFERENCES schools(id)
    )
`);

module.exports = db;


// =========================================================
// TEACHER PHOTO MIGRATION
// =========================================================

try {
    const teacherColumns = db.prepare("PRAGMA table_info(teachers)").all();

    const hasPhotoColumn = teacherColumns.some(
        column => column.name === "photo"
    );

    if (!hasPhotoColumn) {
        db.exec(`
            ALTER TABLE teachers
            ADD COLUMN photo TEXT
        `);

        console.log("Teacher photo column added successfully.");
    }
} catch (error) {
    console.error("TEACHER PHOTO MIGRATION ERROR:", error);
}
