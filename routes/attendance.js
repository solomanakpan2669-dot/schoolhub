const express = require("express");
const db = require("../database/database");
const {
    requireAuth,
    requireTeacher
} = require("../middleware/auth");
function requireAttendanceAuth(req, res, next) {

    const header =
        req.headers.authorization || "";

    /*
     * If a real login token exists,
     * use the normal authentication.
     */
    if (header.startsWith("Bearer ")) {
        return requireAuth(req, res, next);
    }

    /*
     * Temporary attendance mode while
     * frontend login is disabled.
     *
     * Teacher ID 4 = mrs Okediji
     * School ID 1
     */
    req.schoolId = 1;
    req.role = "teacher";
    req.teacherId = 4;

    next();
}

const router = express.Router();

const SCHOOL_ID = 1;

/* =========================================================
   CREATE ATTENDANCE TABLE
========================================================= */

db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER NOT NULL,
        schoolId INTEGER NOT NULL DEFAULT 1,
        date TEXT NOT NULL,
        status TEXT NOT NULL
            CHECK(status IN ('Present', 'Absent', 'Late')),
        UNIQUE(studentId, date)
    )
`).run();

/* =========================================================
   GET TEACHER ASSIGNED CLASS
========================================================= */

function getTeacherClass(teacherId, schoolId) {
    return db.prepare(`
        SELECT
            t.id AS teacherId,
            t.name AS teacherName,
            t.assignedClassId,
            c.id AS classId,
            c.name AS className,
            c.section,
            c.room
        FROM teachers t
        LEFT JOIN classes c
            ON c.id = t.assignedClassId
            AND c.schoolId = t.schoolId
        WHERE t.id = ?
        AND t.schoolId = ?
        LIMIT 1
    `).get(teacherId, schoolId);
}

/* =========================================================
   CHECK WHETHER STUDENT BELONGS TO TEACHER CLASS
========================================================= */

function teacherOwnsStudent(
    teacherId,
    schoolId,
    studentId
) {
    const teacher = getTeacherClass(
        teacherId,
        schoolId
    );

    if (!teacher || !teacher.classId) {
        return false;
    }

    const student = db.prepare(`
        SELECT id
        FROM students
        WHERE id = ?
        AND schoolId = ?
        AND LOWER(TRIM(className)) =
            LOWER(TRIM(?))
        LIMIT 1
    `).get(
        studentId,
        schoolId,
        teacher.className
    );

    return !!student;
}

/* =========================================================
   GET ATTENDANCE BY DATE
========================================================= */

router.get(
    "/",
    requireAttendanceAuth,
    (req, res) => {

        try {
            const {
                date
            } = req.query;

            if (!date) {
                return res.status(400).json({
                    error:
                        "Attendance date is required"
                });
            }

            let records;

            /* -------------------------------------------------
               TEACHER
            ------------------------------------------------- */

            if (req.role === "teacher") {

                const teacher =
                    getTeacherClass(
                        req.teacherId,
                        req.schoolId
                    );

                if (
                    !teacher ||
                    !teacher.classId ||
                    !teacher.className
                ) {
                    return res.status(400).json({
                        error:
                            "You do not have an assigned class"
                    });
                }

                records = db.prepare(`
                    SELECT
                        attendance.id,
                        attendance.studentId,
                        attendance.date,
                        attendance.status,

                        students.name,
                        students.age,
                        students.className,
                        students.photo

                    FROM students

                    LEFT JOIN attendance
                        ON attendance.studentId =
                           students.id

                        AND attendance.schoolId =
                            students.schoolId

                        AND attendance.date = ?

                    WHERE students.schoolId = ?

                    AND LOWER(TRIM(students.className)) =
                        LOWER(TRIM(?))

                    ORDER BY students.name COLLATE NOCASE
                `).all(
                    date,
                    req.schoolId,
                    teacher.className
                );

            }

            /* -------------------------------------------------
               SCHOOL ADMIN
            ------------------------------------------------- */

            else {

                records = db.prepare(`
                    SELECT
                        attendance.id,
                        attendance.studentId,
                        attendance.date,
                        attendance.status,

                        students.name,
                        students.age,
                        students.className,
                        students.photo

                    FROM students

                    LEFT JOIN attendance
                        ON attendance.studentId =
                           students.id

                        AND attendance.schoolId =
                            students.schoolId

                        AND attendance.date = ?

                    WHERE students.schoolId = ?

                    ORDER BY students.name COLLATE NOCASE
                `).all(
                    date,
                    req.schoolId || SCHOOL_ID
                );
            }

            return res.json(records);

        } catch (error) {

            console.error(
                "GET ATTENDANCE ERROR:",
                error
            );

            return res.status(500).json({
                error:
                    "Failed to load attendance"
            });
        }
    }
);

/* =========================================================
   MONTHLY ATTENDANCE
========================================================= */

router.get(
    "/monthly",
    requireAttendanceAuth,
    (req, res) => {

        try {

            const {
                month
            } = req.query;

            if (!month) {
                return res.status(400).json({
                    error:
                        "Month is required. Use YYYY-MM."
                });
            }

            if (
                !/^\d{4}-\d{2}$/.test(month)
            ) {
                return res.status(400).json({
                    error:
                        "Invalid month format. Use YYYY-MM."
                });
            }

            let records;

            /* -------------------------------------------------
               TEACHER MONTHLY ATTENDANCE
            ------------------------------------------------- */

            if (req.role === "teacher") {

                const teacher =
                    getTeacherClass(
                        req.teacherId,
                        req.schoolId
                    );

                if (
                    !teacher ||
                    !teacher.classId ||
                    !teacher.className
                ) {
                    return res.status(400).json({
                        error:
                            "You do not have an assigned class"
                    });
                }

                records = db.prepare(`
                    SELECT
                        students.id AS studentId,
                        students.name,
                        students.age,
                        students.className,

                        COUNT(
                            CASE
                                WHEN attendance.status =
                                    'Present'
                                THEN 1
                            END
                        ) AS present,

                        COUNT(
                            CASE
                                WHEN attendance.status =
                                    'Absent'
                                THEN 1
                            END
                        ) AS absent,

                        COUNT(
                            CASE
                                WHEN attendance.status =
                                    'Late'
                                THEN 1
                            END
                        ) AS late,

                        COUNT(
                            attendance.id
                        ) AS total

                    FROM students

                    LEFT JOIN attendance
                        ON attendance.studentId =
                           students.id

                        AND attendance.schoolId =
                            students.schoolId

                        AND substr(
                            attendance.date,
                            1,
                            7
                        ) = ?

                    WHERE students.schoolId = ?

                    AND LOWER(TRIM(students.className)) =
                        LOWER(TRIM(?))

                    GROUP BY
                        students.id

                    ORDER BY
                        students.name COLLATE NOCASE
                `).all(
                    month,
                    req.schoolId,
                    teacher.className
                );

            }

            /* -------------------------------------------------
               SCHOOL MONTHLY ATTENDANCE
            ------------------------------------------------- */

            else {

                records = db.prepare(`
                    SELECT
                        students.id AS studentId,
                        students.name,
                        students.age,
                        students.className,

                        COUNT(
                            CASE
                                WHEN attendance.status =
                                    'Present'
                                THEN 1
                            END
                        ) AS present,

                        COUNT(
                            CASE
                                WHEN attendance.status =
                                    'Absent'
                                THEN 1
                            END
                        ) AS absent,

                        COUNT(
                            CASE
                                WHEN attendance.status =
                                    'Late'
                                THEN 1
                            END
                        ) AS late,

                        COUNT(
                            attendance.id
                        ) AS total

                    FROM students

                    LEFT JOIN attendance
                        ON attendance.studentId =
                           students.id

                        AND attendance.schoolId =
                            students.schoolId

                        AND substr(
                            attendance.date,
                            1,
                            7
                        ) = ?

                    WHERE students.schoolId = ?

                    GROUP BY
                        students.id

                    ORDER BY
                        students.name COLLATE NOCASE
                `).all(
                    month,
                    req.schoolId || SCHOOL_ID
                );
            }

            /* -------------------------------------------------
               CALCULATE PERCENTAGE
            ------------------------------------------------- */

            records = records.map(
                record => {

                    const total =
                        Number(record.total) || 0;

                    const present =
                        Number(record.present) || 0;

                    const percentage =
                        total > 0
                            ? Math.round(
                                (present / total) * 100
                            )
                            : 0;

                    return {
                        ...record,
                        present:
                            Number(record.present) || 0,
                        absent:
                            Number(record.absent) || 0,
                        late:
                            Number(record.late) || 0,
                        total,
                        percentage
                    };
                }
            );

            return res.json(records);

        } catch (error) {

            console.error(
                "MONTHLY ATTENDANCE ERROR:",
                error
            );

            return res.status(500).json({
                error:
                    "Failed to load monthly attendance"
            });
        }
    }
);

/* =========================================================
   SAVE ATTENDANCE
========================================================= */

router.post(
    "/",
    requireAttendanceAuth,
    (req, res) => {

        try {

            const {
                date,
                records
            } = req.body;

            if (!date) {
                return res.status(400).json({
                    error:
                        "Attendance date is required"
                });
            }

            if (!Array.isArray(records)) {
                return res.status(400).json({
                    error:
                        "Attendance records must be an array"
                });
            }

            /* -------------------------------------------------
               GET TEACHER CLASS
            ------------------------------------------------- */

            let teacher = null;

            if (req.role === "teacher") {

                teacher =
                    getTeacherClass(
                        req.teacherId,
                        req.schoolId
                    );

                if (
                    !teacher ||
                    !teacher.classId ||
                    !teacher.className
                ) {
                    return res.status(400).json({
                        error:
                            "You do not have an assigned class"
                    });
                }
            }

            /* -------------------------------------------------
               PREPARE QUERIES
            ------------------------------------------------- */

            const findStudent =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        className
                    FROM students
                    WHERE id = ?
                    AND schoolId = ?
                    LIMIT 1
                `);

            const saveRecord =
                db.prepare(`
                    INSERT INTO attendance (
                        studentId,
                        schoolId,
                        date,
                        status
                    )
                    VALUES (?, ?, ?, ?)

                    ON CONFLICT(
                        studentId,
                        date
                    )

                    DO UPDATE SET
                        status = excluded.status
                `);

            /* -------------------------------------------------
               TRANSACTION
            ------------------------------------------------- */

            const saveAll =
                db.transaction(
                    attendanceRecords => {

                        for (
                            const record
                            of attendanceRecords
                        ) {

                            const studentId =
                                Number(
                                    record.studentId
                                );

                            const status =
                                record.status;

                            if (!studentId) {
                                throw new Error(
                                    "Invalid student ID"
                                );
                            }

                            if (
                                ![
                                    "Present",
                                    "Absent",
                                    "Late"
                                ].includes(status)
                            ) {
                                throw new Error(
                                    `Invalid attendance status for student ${studentId}`
                                );
                            }

                            const student =
                                findStudent.get(
                                    studentId,
                                    req.schoolId
                                );

                            if (!student) {
                                throw new Error(
                                    `Student ${studentId} does not belong to this school`
                                );
                            }

                            /* ---------------------------------
                               TEACHER SECURITY CHECK
                            --------------------------------- */

                            if (
                                req.role === "teacher"
                            ) {

                                const belongsToClass =
                                    teacher &&
                                    teacher.className &&
                                    String(
                                        student.className
                                    )
                                    .trim()
                                    .toLowerCase() ===
                                    String(
                                        teacher.className
                                    )
                                    .trim()
                                    .toLowerCase();

                                if (
                                    !belongsToClass
                                ) {
                                    throw new Error(
                                        `You cannot mark attendance for ${student.name}`
                                    );
                                }
                            }

                            saveRecord.run(
                                studentId,
                                req.schoolId,
                                date,
                                status
                            );
                        }
                    }
                );

            try {

                saveAll(records);

            } catch (error) {

                return res.status(403).json({
                    error:
                        error.message
                });
            }

            /* -------------------------------------------------
               RETURN SAVED ATTENDANCE
            ------------------------------------------------- */

            let saved;

            if (req.role === "teacher") {

                saved = db.prepare(`
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
                        ON students.id =
                           attendance.studentId

                    WHERE attendance.schoolId = ?

                    AND attendance.date = ?

                    AND LOWER(TRIM(students.className)) =
                        LOWER(TRIM(?))

                    ORDER BY
                        students.name COLLATE NOCASE
                `).all(
                    req.schoolId,
                    date,
                    teacher.className
                );

            } else {

                saved = db.prepare(`
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
                        ON students.id =
                           attendance.studentId

                    WHERE attendance.schoolId = ?

                    AND attendance.date = ?

                    ORDER BY
                        students.name COLLATE NOCASE
                `).all(
                    req.schoolId,
                    date
                );
            }

            return res.json({
                message:
                    "Attendance saved successfully",
                records: saved
            });

        } catch (error) {

            console.error(
                "SAVE ATTENDANCE ERROR:",
                error
            );

            return res.status(500).json({
                error:
                    "Failed to save attendance"
            });
        }
    }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
