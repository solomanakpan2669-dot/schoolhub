const express = require("express");
const db = require("../database/database");

const router = express.Router();

function getSchoolId(req, res) {
    const schoolId = req.schoolId;

    if (!schoolId) {
        res.status(401).json({
            error: "School login required"
        });
        return null;
    }

    return schoolId;
}

// ============================================================
// GET ALL STUDENTS
// ============================================================

router.get("/", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const students = db
            .prepare(`
                SELECT id, name, age, className, photo
                FROM students
                WHERE schoolId = ?
                ORDER BY id DESC
            `)
            .all(schoolId);

        res.json(students);

    } catch (error) {
        console.error("GET STUDENTS ERROR:", error);

        res.status(500).json({
            error: "Failed to get students"
        });
    }
});

// ============================================================
// GET ONE STUDENT
// ============================================================

router.get("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const student = db
            .prepare(`
                SELECT id, name, age, className, photo
                FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .get(req.params.id, schoolId);

        if (!student) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        res.json(student);

    } catch (error) {
        console.error("GET STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to get student"
        });
    }
});

// ============================================================
// ADD STUDENT
// ============================================================

router.post("/", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const body = req.body || {};

        const name = body.name;
        const age = body.age;
        const className = body.className;

        if (!name || !age || !className) {
            return res.status(400).json({
                error: "Name, age and class are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO students
                (schoolId, name, age, className)
                VALUES (?, ?, ?, ?)
            `)
            .run(
                schoolId,
                name,
                age,
                className
            );

        const student = db
            .prepare(`
                SELECT id, name, age, className, photo
                FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                result.lastInsertRowid,
                schoolId
            );

        res.status(201).json(student);

    } catch (error) {
        console.error("ADD STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to add student",
            details: error.message
        });
    }
});

// ============================================================
// UPDATE STUDENT
// ============================================================

router.put("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const body = req.body || {};

        const name = body.name;
        const age = body.age;
        const className = body.className;

        if (!name || !age || !className) {
            return res.status(400).json({
                error: "Name, age and class are required"
            });
        }

        const existingStudent = db
            .prepare(`
                SELECT id
                FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                req.params.id,
                schoolId
            );

        if (!existingStudent) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            UPDATE students
            SET name = ?,
                age = ?,
                className = ?
            WHERE id = ? AND schoolId = ?
        `).run(
            name,
            age,
            className,
            req.params.id,
            schoolId
        );

        const updatedStudent = db
            .prepare(`
                SELECT id, name, age, className, photo
                FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                req.params.id,
                schoolId
            );

        res.json(updatedStudent);

    } catch (error) {
        console.error("UPDATE STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to update student",
            details: error.message
        });
    }
});

// ============================================================
// UPLOAD / SAVE STUDENT PHOTO
// ============================================================

router.put("/:id/photo", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const photo = req.body && req.body.photo;

        if (!photo || typeof photo !== "string") {
            return res.status(400).json({
                error: "Photo is required"
            });
        }

        // Only accept image data URLs.
        if (!photo.startsWith("data:image/")) {
            return res.status(400).json({
                error: "Invalid image format"
            });
        }

        // Keep database records reasonably sized.
        if (photo.length > 3000000) {
            return res.status(413).json({
                error: "Photo is too large. Please choose a smaller photo."
            });
        }

        const student = db
            .prepare(`
                SELECT id
                FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .get(req.params.id, schoolId);

        if (!student) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            UPDATE students
            SET photo = ?
            WHERE id = ? AND schoolId = ?
        `).run(
            photo,
            req.params.id,
            schoolId
        );

        const updatedStudent = db
            .prepare(`
                SELECT id, name, age, className, photo
                FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                req.params.id,
                schoolId
            );

        res.json({
            message: "Student photo saved successfully",
            student: updatedStudent
        });

    } catch (error) {
        console.error("SAVE STUDENT PHOTO ERROR:", error);

        res.status(500).json({
            error: "Failed to save student photo",
            details: error.message
        });
    }
});

// ============================================================
// REMOVE STUDENT PHOTO
// ============================================================

router.delete("/:id/photo", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const result = db
            .prepare(`
                UPDATE students
                SET photo = NULL
                WHERE id = ? AND schoolId = ?
            `)
            .run(
                req.params.id,
                schoolId
            );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        res.json({
            message: "Student photo removed successfully"
        });

    } catch (error) {
        console.error("REMOVE STUDENT PHOTO ERROR:", error);

        res.status(500).json({
            error: "Failed to remove student photo"
        });
    }
});

// ============================================================
// DELETE STUDENT
// ============================================================

router.delete("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const result = db
            .prepare(`
                DELETE FROM students
                WHERE id = ? AND schoolId = ?
            `)
            .run(
                req.params.id,
                schoolId
            );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        res.json({
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("DELETE STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to delete student"
        });
    }
});

module.exports = router;
