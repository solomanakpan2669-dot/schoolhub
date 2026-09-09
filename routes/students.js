const express = require("express");
const db = require("../database/database");

const router = express.Router();

function getSchoolId() {
    return 1;
}

// ======================================================
// GET ALL STUDENTS
// ======================================================

router.get("/", (req, res) => {
    try {
        const schoolId = 1;


        const students = db.prepare(`
            SELECT id, name, age, className, photo
            FROM students
            WHERE schoolId = ?
            ORDER BY id DESC
        `).all(schoolId);

        res.json(students);

    } catch (error) {
        console.error("GET STUDENTS ERROR:", error);

        res.status(500).json({
            error: "Failed to load students",
            details: error.message
        });
    }
});

// ======================================================
// GET ONE STUDENT
// ======================================================

router.get("/:id", (req, res) => {
    try {
        const schoolId = 1;
        const studentId = Number(req.params.id);


        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Invalid student ID"
            });
        }

        const student = db.prepare(`
            SELECT id, name, age, className, photo
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        if (!student) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        res.json(student);

    } catch (error) {
        console.error("GET STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to load student",
            details: error.message
        });
    }
});

// ======================================================
// ADD STUDENT
// ======================================================

router.post("/", (req, res) => {
    try {
        const schoolId = 1;


        const name = String(req.body?.name || "").trim();
        const age = Number(req.body?.age);
        const className = String(req.body?.className || "").trim();

        if (!name || !className || !Number.isFinite(age)) {
            return res.status(400).json({
                error: "Name, age and class are required"
            });
        }

        if (age <= 0) {
            return res.status(400).json({
                error: "Age must be greater than 0"
            });
        }

        const result = db.prepare(`
            INSERT INTO students
            (schoolId, name, age, className)
            VALUES (?, ?, ?, ?)
        `).run(
            schoolId,
            name,
            age,
            className
        );

        const student = db.prepare(`
            SELECT id, name, age, className, photo
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(
            result.lastInsertRowid,
            schoolId
        );

        res.status(201).json({
            message: "Student added successfully",
            student
        });

    } catch (error) {
        console.error("ADD STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to add student",
            details: error.message
        });
    }
});

// ======================================================
// UPDATE STUDENT
// ======================================================

router.put("/:id", (req, res) => {
    try {
        const schoolId = 1;
        const studentId = Number(req.params.id);


        const name = String(req.body?.name || "").trim();
        const age = Number(req.body?.age);
        const className = String(req.body?.className || "").trim();

        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Invalid student ID"
            });
        }

        if (!name || !className || !Number.isFinite(age)) {
            return res.status(400).json({
                error: "Name, age and class are required"
            });
        }

        const existing = db.prepare(`
            SELECT id
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        if (!existing) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            UPDATE students
            SET name = ?, age = ?, className = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            name,
            age,
            className,
            studentId,
            schoolId
        );

        const student = db.prepare(`
            SELECT id, name, age, className, photo
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        res.json({
            message: "Student updated successfully",
            student
        });

    } catch (error) {
        console.error("UPDATE STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to update student",
            details: error.message
        });
    }
});

// ======================================================
// UPLOAD STUDENT PHOTO
// ======================================================

router.put("/:id/photo", (req, res) => {
    try {
        const schoolId = 1;
        const studentId = Number(req.params.id);


        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Invalid student ID"
            });
        }

        const photo = String(req.body?.photo || "").trim();

        if (!photo) {
            return res.status(400).json({
                error: "Photo is required"
            });
        }

        if (!photo.startsWith("data:image/")) {
            return res.status(400).json({
                error: "Invalid image format"
            });
        }

        if (photo.length > 3000000) {
            return res.status(400).json({
                error: "Photo is too large"
            });
        }

        const existing = db.prepare(`
            SELECT id
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        if (!existing) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            UPDATE students
            SET photo = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            photo,
            studentId,
            schoolId
        );

        // IMPORTANT:
        // Return the updated student so the frontend
        // can safely access result.student.photo.

        const student = db.prepare(`
            SELECT id, name, age, className, photo
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        res.json({
            message: "Student photo updated successfully",
            student
        });

    } catch (error) {
        console.error("UPLOAD STUDENT PHOTO ERROR:", error);

        res.status(500).json({
            error: "Failed to upload student photo",
            details: error.message
        });
    }
});

// ======================================================
// REMOVE STUDENT PHOTO
// ======================================================

router.delete("/:id/photo", (req, res) => {
    try {
        const schoolId = 1;
        const studentId = Number(req.params.id);


        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Invalid student ID"
            });
        }

        const existing = db.prepare(`
            SELECT id
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        if (!existing) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            UPDATE students
            SET photo = NULL
            WHERE id = ?
            AND schoolId = ?
        `).run(studentId, schoolId);

        const student = db.prepare(`
            SELECT id, name, age, className, photo
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        res.json({
            message: "Student photo removed successfully",
            student
        });

    } catch (error) {
        console.error("REMOVE STUDENT PHOTO ERROR:", error);

        res.status(500).json({
            error: "Failed to remove student photo",
            details: error.message
        });
    }
});

// ======================================================
// DELETE STUDENT
// ======================================================

router.delete("/:id", (req, res) => {
    try {
        const schoolId = 1;
        const studentId = Number(req.params.id);


        if (!Number.isInteger(studentId)) {
            return res.status(400).json({
                error: "Invalid student ID"
            });
        }

        const existing = db.prepare(`
            SELECT id
            FROM students
            WHERE id = ?
            AND schoolId = ?
        `).get(studentId, schoolId);

        if (!existing) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            DELETE FROM students
            WHERE id = ?
            AND schoolId = ?
        `).run(studentId, schoolId);

        res.json({
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("DELETE STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to delete student",
            details: error.message
        });
    }
});

module.exports = router;
