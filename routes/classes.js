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

// GET ALL CLASSES FOR LOGGED-IN SCHOOL
router.get("/", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const classes = db
            .prepare(`
                SELECT id, name, teacher, room
                FROM classes
                WHERE schoolId = ?
                ORDER BY id DESC
            `)
            .all(schoolId);

        res.json(classes);

    } catch (error) {
        console.error("GET CLASSES ERROR:", error);

        res.status(500).json({
            error: "Failed to get classes"
        });
    }
});

// GET ONE CLASS
router.get("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const classItem = db
            .prepare(`
                SELECT id, name, teacher, room
                FROM classes
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                req.params.id,
                schoolId
            );

        if (!classItem) {
            return res.status(404).json({
                error: "Class not found"
            });
        }

        res.json(classItem);

    } catch (error) {
        console.error("GET CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to get class"
        });
    }
});

// ADD CLASS
router.post("/", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const body = req.body || {};

        const name = body.name;
        const teacher = body.teacher;
        const room = body.room;

        if (!name || !teacher || !room) {
            return res.status(400).json({
                error: "Class name, teacher and room are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO classes
                (schoolId, name, teacher, room)
                VALUES (?, ?, ?, ?)
            `)
            .run(
                schoolId,
                name,
                teacher,
                room
            );

        const classItem = db
            .prepare(`
                SELECT id, name, teacher, room
                FROM classes
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                result.lastInsertRowid,
                schoolId
            );

        res.status(201).json(classItem);

    } catch (error) {
        console.error("ADD CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to add class",
            details: error.message
        });
    }
});

// UPDATE CLASS
router.put("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const id = req.params.id;
        const body = req.body || {};

        const name = body.name;
        const teacher = body.teacher;
        const room = body.room;

        if (!name || !teacher || !room) {
            return res.status(400).json({
                error: "Class name, teacher and room are required"
            });
        }

        const existingClass = db
            .prepare(`
                SELECT id
                FROM classes
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                id,
                schoolId
            );

        if (!existingClass) {
            return res.status(404).json({
                error: "Class not found"
            });
        }

        db.prepare(`
            UPDATE classes
            SET name = ?,
                teacher = ?,
                room = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            name,
            teacher,
            room,
            id,
            schoolId
        );

        const updatedClass = db
            .prepare(`
                SELECT id, name, teacher, room
                FROM classes
                WHERE id = ? AND schoolId = ?
            `)
            .get(
                id,
                schoolId
            );

        res.json(updatedClass);

    } catch (error) {
        console.error("UPDATE CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to update class",
            details: error.message
        });
    }
});

// DELETE CLASS
router.delete("/:id", (req, res) => {
    try {
        const schoolId = getSchoolId(req, res);
        if (!schoolId) return;

        const result = db
            .prepare(`
                DELETE FROM classes
                WHERE id = ? AND schoolId = ?
            `)
            .run(
                req.params.id,
                schoolId
            );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Class not found"
            });
        }

        res.json({
            message: "Class deleted successfully"
        });

    } catch (error) {
        console.error("DELETE CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to delete class"
        });
    }
});

module.exports = router;
