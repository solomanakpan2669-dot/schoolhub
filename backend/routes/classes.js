const express = require("express");
const db = require("../database/database");

const router = express.Router();

// Get all classes
router.get("/", (req, res) => {
    const schoolId = Number(req.schoolId || 1);

    const classes = db.prepare(`
        SELECT *
        FROM classes
        WHERE schoolId = ?
        ORDER BY id ASC
    `).all(schoolId);

    const getStudents = db.prepare(`
        SELECT *
        FROM students
        WHERE schoolId = ?
        AND LOWER(TRIM(className)) = LOWER(TRIM(?))
        ORDER BY name ASC
    `);

    const classesWithStudents = classes.map(classItem => ({
        ...classItem,
        students: getStudents.all(
            schoolId,
            classItem.name
        )
    }));

    res.json({
        classes: classesWithStudents
    });
});

// Get one class
router.get("/:id", (req, res) => {
    const classItem = db.prepare(
        "SELECT * FROM classes WHERE id = ?"
    ).get(req.params.id);

    if (!classItem) {
        return res.status(404).json({
            message: "Class not found"
        });
    }

    res.json({
        class: classItem
    });
});

// Add a class
router.post("/", (req, res) => {
    const { name, section } = req.body;

    const result = db.prepare(`
        INSERT INTO classes (name, section)
        VALUES (?, ?)
    `).run(name, section);

    const newClass = db.prepare(
        "SELECT * FROM classes WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json({
        message: "Class added successfully",
        class: newClass
    });
});

// Update a class
router.put("/:id", (req, res) => {
    const { name, section } = req.body;

    const result = db.prepare(`
        UPDATE classes
        SET name = ?, section = ?
        WHERE id = ?
    `).run(name, section, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Class not found"
        });
    }

    const updatedClass = db.prepare(
        "SELECT * FROM classes WHERE id = ?"
    ).get(req.params.id);

    res.json({
        message: "Class updated successfully",
        class: updatedClass
    });
});

// Delete a class
router.delete("/:id", (req, res) => {
    const result = db.prepare(
        "DELETE FROM classes WHERE id = ?"
    ).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Class not found"
        });
    }

    res.json({
        message: "Class deleted successfully"
    });
});

module.exports = router;