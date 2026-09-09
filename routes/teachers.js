const express = require("express");
const db = require("../database/database");

const router = express.Router();

function getSchoolId() {
    return 1;
}


// =========================================================
// GET ALL TEACHERS
// =========================================================

router.get("/", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const teachers = db
            .prepare(`
                SELECT id, name, age, subject, email, photo
                FROM teachers
                WHERE schoolId = ?
                ORDER BY id DESC
            `)
            .all(schoolId);

        res.json(teachers);

    } catch (error) {
        console.error("GET TEACHERS ERROR:", error);

        res.status(500).json({
            error: "Failed to get teachers",
            details: error.message
        });
    }
});


// =========================================================
// GET ONE TEACHER
// =========================================================

router.get("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const teacher = db
            .prepare(`
                SELECT id, name, age, subject, email, photo
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(req.params.id, schoolId);

        if (!teacher) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        res.json(teacher);

    } catch (error) {
        console.error("GET TEACHER ERROR:", error);

        res.status(500).json({
            error: "Failed to get teacher",
            details: error.message
        });
    }
});


// =========================================================
// ADD TEACHER
// =========================================================

router.post("/", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const body = req.body || {};

        const name = String(body.name || "").trim();
        const age = Number(body.age);
        const subject = String(body.subject || "").trim();
        const email = String(body.email || "").trim();

        if (!name || !age || !subject || !email) {
            return res.status(400).json({
                error: "Name, age, subject and email are required"
            });
        }

        const emailOwner = db
            .prepare(`
                SELECT id
                FROM teachers
                WHERE email = ?
                AND schoolId = ?
            `)
            .get(email, schoolId);

        if (emailOwner) {
            return res.status(409).json({
                error: "A teacher with this email already exists"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO teachers
                (schoolId, name, age, subject, email)
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(
                schoolId,
                name,
                age,
                subject,
                email
            );

        const teacher = db
            .prepare(`
                SELECT id, name, age, subject, email, photo
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                result.lastInsertRowid,
                schoolId
            );

        res.status(201).json(teacher);

    } catch (error) {
        console.error("ADD TEACHER ERROR:", error);

        res.status(500).json({
            error: "Failed to add teacher",
            details: error.message
        });
    }
});


// =========================================================
// UPDATE TEACHER
// =========================================================

router.put("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const id = req.params.id;
        const body = req.body || {};

        const name = String(body.name || "").trim();
        const age = Number(body.age);
        const subject = String(body.subject || "").trim();
        const email = String(body.email || "").trim();

        if (!name || !age || !subject || !email) {
            return res.status(400).json({
                error: "Name, age, subject and email are required"
            });
        }

        const existingTeacher = db
            .prepare(`
                SELECT id
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(id, schoolId);

        if (!existingTeacher) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        const emailOwner = db
            .prepare(`
                SELECT id
                FROM teachers
                WHERE email = ?
                AND schoolId = ?
                AND id != ?
            `)
            .get(
                email,
                schoolId,
                id
            );

        if (emailOwner) {
            return res.status(409).json({
                error: "A teacher with this email already exists"
            });
        }

        db.prepare(`
            UPDATE teachers
            SET name = ?,
                age = ?,
                subject = ?,
                email = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            name,
            age,
            subject,
            email,
            id,
            schoolId
        );

        const updatedTeacher = db
            .prepare(`
                SELECT id, name, age, subject, email, photo
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(id, schoolId);

        res.json(updatedTeacher);

    } catch (error) {
        console.error("UPDATE TEACHER ERROR:", error);

        res.status(500).json({
            error: "Failed to update teacher",
            details: error.message
        });
    }
});


// =========================================================
// UPLOAD TEACHER PHOTO
// =========================================================

router.put("/:id/photo", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const id = req.params.id;
        const photo = req.body && req.body.photo;

        if (!photo) {
            return res.status(400).json({
                error: "Teacher photo is required"
            });
        }

        if (typeof photo !== "string") {
            return res.status(400).json({
                error: "Invalid teacher photo"
            });
        }

        if (!photo.startsWith("data:image/")) {
            return res.status(400).json({
                error: "Only image photos are allowed"
            });
        }

        if (photo.length > 3000000) {
            return res.status(413).json({
                error: "Teacher photo is too large"
            });
        }

        const teacher = db
            .prepare(`
                SELECT id
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(id, schoolId);

        if (!teacher) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        db.prepare(`
            UPDATE teachers
            SET photo = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            photo,
            id,
            schoolId
        );

        const updatedTeacher = db
            .prepare(`
                SELECT id, name, age, subject, email, photo
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(id, schoolId);

        res.json({
            message: "Teacher photo uploaded successfully",
            teacher: updatedTeacher
        });

    } catch (error) {
        console.error("UPLOAD TEACHER PHOTO ERROR:", error);

        res.status(500).json({
            error: "Failed to upload teacher photo",
            details: error.message
        });
    }
});


// =========================================================
// DELETE TEACHER PHOTO
// =========================================================

router.delete("/:id/photo", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const id = req.params.id;

        const result = db
            .prepare(`
                UPDATE teachers
                SET photo = NULL
                WHERE id = ?
                AND schoolId = ?
            `)
            .run(id, schoolId);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        const teacher = db
            .prepare(`
                SELECT id, name, age, subject, email, photo
                FROM teachers
                WHERE id = ? AND schoolId = ?
            `)
            .get(id, schoolId);

        res.json({
            message: "Teacher photo removed successfully",
            teacher
        });

    } catch (error) {
        console.error("DELETE TEACHER PHOTO ERROR:", error);

        res.status(500).json({
            error: "Failed to remove teacher photo",
            details: error.message
        });
    }
});


// =========================================================
// DELETE TEACHER
// =========================================================

router.delete("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const result = db
            .prepare(`
                DELETE FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `)
            .run(
                req.params.id,
                schoolId
            );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        res.json({
            message: "Teacher deleted successfully"
        });

    } catch (error) {
        console.error("DELETE TEACHER ERROR:", error);

        res.status(500).json({
            error: "Failed to delete teacher",
            details: error.message
        });
    }
});


module.exports = router;
