const db = require("./database");

console.log("Starting SchoolConnect database migration...");

try {
    // Create a default school for the existing data
    let school = db
        .prepare("SELECT * FROM schools WHERE code = ?")
        .get("DEFAULT001");

    if (!school) {
        const result = db
            .prepare(`
                INSERT INTO schools (name, code, password)
                VALUES (?, ?, ?)
            `)
            .run(
                "My School",
                "DEFAULT001",
                "school123"
            );

        school = db
            .prepare("SELECT * FROM schools WHERE id = ?")
            .get(result.lastInsertRowid);

        console.log("Default school created.");
    } else {
        console.log("Default school already exists.");
    }

    const schoolId = school.id;

    // Check and upgrade students table
    const studentColumns = db
        .prepare("PRAGMA table_info(students)")
        .all();

    if (!studentColumns.some(column => column.name === "schoolId")) {
        db.exec(`
            ALTER TABLE students
            ADD COLUMN schoolId INTEGER DEFAULT ${schoolId}
        `);

        console.log("Students table upgraded.");
    }

    // Check and upgrade teachers table
    const teacherColumns = db
        .prepare("PRAGMA table_info(teachers)")
        .all();

    if (!teacherColumns.some(column => column.name === "schoolId")) {
        db.exec(`
            ALTER TABLE teachers
            ADD COLUMN schoolId INTEGER DEFAULT ${schoolId}
        `);

        console.log("Teachers table upgraded.");
    }

    // Check and upgrade classes table
    const classColumns = db
        .prepare("PRAGMA table_info(classes)")
        .all();

    if (!classColumns.some(column => column.name === "schoolId")) {
        db.exec(`
            ALTER TABLE classes
            ADD COLUMN schoolId INTEGER DEFAULT ${schoolId}
        `);

        console.log("Classes table upgraded.");
    }

    console.log("SchoolConnect database migration completed successfully.");
    console.log("Existing data belongs to school:", school.name);
    console.log("School code:", school.code);

} catch (error) {
    console.error("MIGRATION ERROR:", error);
    process.exit(1);
}
