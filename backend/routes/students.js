const express = require("express");
const db = require("../database/database");

const router = express.Router();

// Get all students
router.get("/", (req, res) => {
    const students = db.prepare("SELECT * FROM students").all();

    res.json({
        students: students
    });
});
// Get one student by ID
router.get("/:id", (req, res) => {
    const student = db.prepare(
        "SELECT * FROM students WHERE id = ?"
    ).get(req.params.id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    res.json({
        student: student
    });
});
// Add a new student
router.post("/", (req, res) => {
    const { name, age, className } = req.body;

    const result = db.prepare(`
        INSERT INTO students (name, age, className)
        VALUES (?, ?, ?)
    `).run(name, age, className);

    const newStudent = db.prepare(`
        SELECT * FROM students WHERE id = ?
    `).get(result.lastInsertRowid);

     res.status(201).json({
        message: "Student added successfully",
        student: newStudent
    });
});
// Update a student
router.put("/:id", (req, res) => {
    const { name, age, className } = req.body;
    const id = req.params.id;

    const result = db.prepare(`
        UPDATE students
        SET name = ?, age = ?, className = ?
        WHERE id = ?
    `).run(name, age, className, id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    const updatedStudent = db.prepare(
        "SELECT * FROM students WHERE id = ?"
    ).get(id);

    res.json({
        message: "Student updated successfully",
        student: updatedStudent
    });
});

// Delete a student
router.delete("/:id", (req, res) => {
    const id = req.params.id;

    const result = db.prepare(
        "DELETE FROM students WHERE id = ?"
    ).run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Student not found"
        });
    }

    res.json({
        message: "Student deleted successfully"
    });
});
module.exports = router;

