const express = require("express");
const db = require("../database/database");

const router = express.Router();

const SCHOOL_ID = 1;

// Create attendance table automatically
db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        schoolId INTEGER NOT NULL DEFAULT 1,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late')),
        UNIQUE(studentId, date)
    )
`).run();

// ======================================================
// GET ATTENDANCE FOR A DATE
// ======================================================

router.get("/", (req, res) => {
    try {
        const date = String(req.query.date || "").trim();

        if (!date) {
            return res.status(400).json({
                error: "Date is required"
            });
        }

        const records = db.prepare(`
            SELECT
                attendance.id,
                attendance.studentId,
                attendance.date,
                attendance.status,
                students.name,
                students.age,
                students.className,
                students.photo
            FROM attendance
            INNER JOIN students
                ON students.id = attendance.studentId
            WHERE attendance.schoolId = ?
            AND attendance.date = ?
            ORDER BY students.name COLLATE NOCASE ASC
        `).all(SCHOOL_ID, date);

        res.json(records);

    } catch (error) {
        console.error("GET ATTENDANCE ERROR:", error);

        res.status(500).json({
            error: "Failed to load attendance",
            details: error.message
        });
    }
});


// ======================================================
// GET MONTHLY ATTENDANCE
// ======================================================

router.get("/monthly", (req, res) => {
    try {
        const month = String(req.query.month || "").trim();

        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({
                error: "Month must be in YYYY-MM format"
            });
        }

        const records = db.prepare(`
            SELECT
                students.id AS studentId,
                students.name,
                students.className,
                students.photo,
                SUM(CASE WHEN attendance.status = 'Present' THEN 1 ELSE 0 END) AS present,
                SUM(CASE WHEN attendance.status = 'Absent' THEN 1 ELSE 0 END) AS absent,
                SUM(CASE WHEN attendance.status = 'Late' THEN 1 ELSE 0 END) AS late,
                COUNT(attendance.id) AS total
            FROM students
            LEFT JOIN attendance
                ON attendance.studentId = students.id
                AND attendance.schoolId = ?
                AND substr(attendance.date, 1, 7) = ?
            WHERE students.schoolId = ?
            GROUP BY
                students.id,
                students.name,
                students.className,
                students.photo
            ORDER BY students.name COLLATE NOCASE ASC
        `).all(SCHOOL_ID, month, SCHOOL_ID);

        const result = records.map(student => {
            const total = Number(student.total) || 0;
            const present = Number(student.present) || 0;

            return {
                ...student,
                present: Number(student.present) || 0,
                absent: Number(student.absent) || 0,
                late: Number(student.late) || 0,
                total,
                percentage: total
                    ? Math.round((present / total) * 100)
                    : 0
            };
        });

        res.json(result);

    } catch (error) {
        console.error("MONTHLY ATTENDANCE ERROR:", error);

        res.status(500).json({
            error: "Failed to load monthly attendance",
            details: error.message
        });
    }
});

// ======================================================
// SAVE / UPDATE ATTENDANCE
// ======================================================

router.post("/", (req, res) => {
    try {
        const date = String(req.body?.date || "").trim();
        const records = Array.isArray(req.body?.records)
            ? req.body.records
            : [];

        if (!date) {
            return res.status(400).json({
                error: "Date is required"
            });
        }

        if (!records.length) {
            return res.status(400).json({
                error: "Attendance records are required"
            });
        }

        const studentExists = db.prepare(`
            SELECT id
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `);

        const saveAttendance = db.prepare(`
            INSERT INTO attendance
                (studentId, schoolId, date, status)
            VALUES
                (?, ?, ?, ?)
            ON CONFLICT(studentId, date)
            DO UPDATE SET status = excluded.status
        `);

        const saveMany = db.transaction((items) => {
            for (const item of items) {
                const studentId = Number(item.studentId);
                const status = String(item.status || "");

                if (!Number.isInteger(studentId)) {
                    throw new Error("Invalid student ID");
                }

                if (!["Present", "Absent", "Late"].includes(status)) {
                    throw new Error("Invalid attendance status");
                }

                const student = studentExists.get(
                    studentId,
                    SCHOOL_ID
                );

                if (!student) {
                    throw new Error(
                        `Student ${studentId} was not found`
                    );
                }

                saveAttendance.run(
                    studentId,
                    SCHOOL_ID,
                    date,
                    status
                );
            }
        });

        saveMany(records);

        const saved = db.prepare(`
            SELECT
                attendance.studentId,
                attendance.date,
                attendance.status,
                students.name,
                students.className,
                students.photo
            FROM attendance
            INNER JOIN students
                ON students.id = attendance.studentId
            WHERE attendance.schoolId = ?
            AND attendance.date = ?
            ORDER BY students.name COLLATE NOCASE ASC
        `).all(SCHOOL_ID, date);

        res.json({
            message: "Attendance saved successfully",
            records: saved
        });

    } catch (error) {
        console.error("SAVE ATTENDANCE ERROR:", error);

        res.status(500).json({
            error: "Failed to save attendance",
            details: error.message
        });
    }
});

module.exports = router;
