const express = require("express");
const db = require("../database/database");

const router = express.Router();

const SCHOOL_ID = 1;

// ======================================================
// GET ALL CLASSES
// ======================================================

router.get("/", (req, res) => {
    try {
        const classes = db.prepare(`
            SELECT *
            FROM classes
            WHERE schoolId = ?
            ORDER BY name COLLATE NOCASE ASC
        `).all(SCHOOL_ID);

        const result = classes.map(classItem => {
            const students = db.prepare(`
                SELECT
                    id,
                    name,
                    age,
                    className,
                    photo
                FROM students
                WHERE schoolId = ?
                AND className = ?
                ORDER BY name COLLATE NOCASE ASC
            `).all(SCHOOL_ID, classItem.name);

            return {
                ...classItem,
                students: students,
                studentCount: students.length
            };
        });

        res.json({
            classes: result
        });

    } catch (error) {
        console.error("GET CLASSES ERROR:", error);

        res.status(500).json({
            message: "Failed to load classes",
            error: error.message
        });
    }
});

// ======================================================
// GET ONE CLASS
// ======================================================

router.get("/:id", (req, res) => {
    try {
        const classItem = db.prepare(`
            SELECT *
            FROM classes
            WHERE id = ?
            AND schoolId = ?
        `).get(req.params.id, SCHOOL_ID);

        if (!classItem) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const students = db.prepare(`
            SELECT
                id,
                name,
                age,
                className,
                photo
            FROM students
            WHERE schoolId = ?
            AND className = ?
            ORDER BY name COLLATE NOCASE ASC
        `).all(SCHOOL_ID, classItem.name);

        res.json({
            class: {
                ...classItem,
                students: students,
                studentCount: students.length
            }
        });

    } catch (error) {
        console.error("GET CLASS ERROR:", error);

        res.status(500).json({
            message: "Failed to load class",
            error: error.message
        });
    }
});

// ======================================================
// ADD CLASS
// ======================================================

router.post("/", (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const section = String(req.body?.section || "").trim();
        const teacher = String(req.body?.teacher || "").trim();
        const room = String(req.body?.room || "").trim();

        if (!name) {
            return res.status(400).json({
                message: "Class name is required"
            });
        }

        const existingClass = db.prepare(`
            SELECT id
            FROM classes
            WHERE schoolId = ?
            AND name = ?
        `).get(SCHOOL_ID, name);

        if (existingClass) {
            return res.status(409).json({
                message: "This class already exists"
            });
        }

        const result = db.prepare(`
            INSERT INTO classes
                (name, section, schoolId, teacher, room)
            VALUES
                (?, ?, ?, ?, ?)
        `).run(
            name,
            section,
            SCHOOL_ID,
            teacher,
            room
        );

        const newClass = db.prepare(`
            SELECT *
            FROM classes
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            message: "Class added successfully",
            class: {
                ...newClass,
                students: [],
                studentCount: 0
            }
        });

    } catch (error) {
        console.error("ADD CLASS ERROR:", error);

        res.status(500).json({
            message: "Failed to add class",
            error: error.message
        });
    }
});

// ======================================================
// UPDATE CLASS
// ======================================================

router.put("/:id", (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const section = String(req.body?.section || "").trim();
        const teacher = String(req.body?.teacher || "").trim();
        const room = String(req.body?.room || "").trim();

        if (!name) {
            return res.status(400).json({
                message: "Class name is required"
            });
        }

        const oldClass = db.prepare(`
            SELECT *
            FROM classes
            WHERE id = ?
            AND schoolId = ?
        `).get(req.params.id, SCHOOL_ID);

        if (!oldClass) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        // If the class name changes, update students
        // that were using the old class name.
        const updateStudents = db.prepare(`
            UPDATE students
            SET className = ?
            WHERE schoolId = ?
            AND className = ?
        `);

        const updateClass = db.prepare(`
            UPDATE classes
            SET
                name = ?,
                section = ?,
                teacher = ?,
                room = ?
            WHERE id = ?
            AND schoolId = ?
        `);

        const updateAll = db.transaction(() => {
            updateStudents.run(
                name,
                SCHOOL_ID,
                oldClass.name
            );

            return updateClass.run(
                name,
                section,
                teacher,
                room,
                req.params.id,
                SCHOOL_ID
            );
        });

        const result = updateAll();

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const updatedClass = db.prepare(`
            SELECT *
            FROM classes
            WHERE id = ?
            AND schoolId = ?
        `).get(req.params.id, SCHOOL_ID);

        const students = db.prepare(`
            SELECT
                id,
                name,
                age,
                className,
                photo
            FROM students
            WHERE schoolId = ?
            AND className = ?
            ORDER BY name COLLATE NOCASE ASC
        `).all(SCHOOL_ID, updatedClass.name);

        res.json({
            message: "Class updated successfully",
            class: {
                ...updatedClass,
                students: students,
                studentCount: students.length
            }
        });

    } catch (error) {
        console.error("UPDATE CLASS ERROR:", error);

        res.status(500).json({
            message: "Failed to update class",
            error: error.message
        });
    }
});

// ======================================================
// DELETE CLASS
// ======================================================

router.delete("/:id", (req, res) => {
    try {
        const classItem = db.prepare(`
            SELECT *
            FROM classes
            WHERE id = ?
            AND schoolId = ?
        `).get(req.params.id, SCHOOL_ID);

        if (!classItem) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const students = db.prepare(`
            SELECT COUNT(*) AS count
            FROM students
            WHERE schoolId = ?
            AND className = ?
        `).get(
            SCHOOL_ID,
            classItem.name
        );

        if (Number(students.count) > 0) {
            return res.status(409).json({
                message:
                    "This class has students. Move the students to another class before deleting it."
            });
        }

        const result = db.prepare(`
            DELETE FROM classes
            WHERE id = ?
            AND schoolId = ?
        `).run(
            req.params.id,
            SCHOOL_ID
        );

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        res.json({
            message: "Class deleted successfully"
        });

    } catch (error) {
        console.error("DELETE CLASS ERROR:", error);

        res.status(500).json({
            message: "Failed to delete class",
            error: error.message
        });
    }
});

module.exports = router;