
const express = require("express");
const router = express.Router();
const db = require("../database/database");

db.exec(`
CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schoolId INTEGER NOT NULL DEFAULT 1,
    classId INTEGER NOT NULL,
    day TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher TEXT,
    room TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);



function ensureTimetableColumns() {
    const columns = db.prepare(`
        PRAGMA table_info(timetable)
    `).all();

    const names = columns.map(column => column.name);

    const additions = [
        ["schoolId", "INTEGER NOT NULL DEFAULT 1"],
        ["classId", "INTEGER NOT NULL DEFAULT 1"],
        ["day", "TEXT NOT NULL DEFAULT 'Monday'"],
        ["startTime", "TEXT NOT NULL DEFAULT '08:00'"],
        ["endTime", "TEXT NOT NULL DEFAULT '09:00'"],
        ["subject", "TEXT NOT NULL DEFAULT 'Subject'"],
        ["teacher", "TEXT"],
        ["room", "TEXT"],
        ["createdAt", "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"]
    ];

    for (const [name, definition] of additions) {
        if (!names.includes(name)) {
            db.exec(
                `ALTER TABLE timetable ADD COLUMN ${name} ${definition}`
            );
            console.log("Added timetable column:", name);
        }
    }
}

ensureTimetableColumns();

router.get("/", (req, res) => {
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS timetable (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schoolId INTEGER NOT NULL DEFAULT 1,
                classId INTEGER NOT NULL,
                day TEXT NOT NULL,
                startTime TEXT NOT NULL,
                endTime TEXT NOT NULL,
                subject TEXT NOT NULL,
                teacher TEXT,
                room TEXT,
                createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const rows = db.prepare(`
            SELECT
                timetable.id,
                timetable.schoolId,
                timetable.classId,
                timetable.day,
                timetable.startTime,
                timetable.endTime,
                timetable.subject,
                timetable.teacher,
                timetable.room
            FROM timetable
            WHERE timetable.schoolId = 1
            ORDER BY
                timetable.classId,
                timetable.startTime
        `).all();

        res.json(rows);

    } catch (error) {
        console.error("TIMETABLE LIST ERROR:", error);

        res.status(500).json({
            message: "Failed to load timetable",
            error: error.message
        });
    }
});

router.get("/class/:classId", (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT
                timetable.*,
                classes.name AS className
            FROM timetable
            LEFT JOIN classes
                ON classes.id = timetable.classId
            WHERE timetable.classId = ?
            AND timetable.schoolId = 1
            ORDER BY
                CASE timetable.day
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    ELSE 6
                END,
                timetable.startTime
        `).all(Number(req.params.classId));

        res.json({
            timetable: rows
        });
    } catch (error) {
        console.error("TIMETABLE GET ERROR:", error);
        res.status(500).json({
            message: "Failed to load timetable"
        });
    }
});

router.post("/", (req, res) => {
    try {
        const classId = Number(req.body.classId);
        const day = String(req.body.day || "").trim();
        const startTime = String(req.body.startTime || "").trim();
        const endTime = String(req.body.endTime || "").trim();
        const subject = String(req.body.subject || "").trim();
        const teacher = String(req.body.teacher || "").trim();
        const room = String(req.body.room || "").trim();

        if (
            !classId ||
            !day ||
            !startTime ||
            !endTime ||
            !subject
        ) {
            return res.status(400).json({
                message: "Class, day, time and subject are required."
            });
        }

        const classItem = db.prepare(`
            SELECT id, name
            FROM classes
            WHERE id = ?
            LIMIT 1
        `).get(classId);

        if (!classItem) {
            return res.status(404).json({
                message: "Class not found."
            });
        }

        const result = db.prepare(`
            INSERT INTO timetable
            (
                schoolId,
                classId,
                className,
                day,
                time,
                startTime,
                endTime,
                subject,
                teacher,
                room
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            1,
            classId,
            classItem.name,
            day,
            startTime + " - " + endTime,
            startTime,
            endTime,
            subject,
            teacher,
            room
        );

        console.log("TIMETABLE SAVED:", {
            id: result.lastInsertRowid,
            classId,
            className: classItem.name,
            day,
            startTime,
            endTime,
            subject
        });

        res.status(201).json({
            message: "Timetable lesson saved successfully.",
            id: result.lastInsertRowid
        });

    } catch (error) {
        console.error("TIMETABLE SAVE ERROR:", error);

        res.status(500).json({
            message: "Failed to save timetable lesson.",
            error: error.message
        });
    }
});

router.delete("/:id", (req, res) => {
    try {
        const result = db.prepare(`
            DELETE FROM timetable
            WHERE id = ?
            AND schoolId = 1
        `).run(Number(req.params.id));

        res.json({
            message: result.changes
                ? "Timetable deleted successfully"
                : "Timetable entry not found"
        });
    } catch (error) {
        console.error("TIMETABLE DELETE ERROR:", error);
        res.status(500).json({
            message: "Failed to delete timetable"
        });
    }
});

module.exports = router;
