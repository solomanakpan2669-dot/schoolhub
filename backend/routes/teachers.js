const express = require("express");
const db = require("../database/database");

const router = express.Router();

// Get all teachers
router.get("/", (req, res) => {
    const teachers = db.prepare("SELECT * FROM teachers").all();

    res.json({
        teachers: teachers
    });
});

// Get one teacher by ID
router.get("/:id", (req, res) => {
    const teacher = db.prepare(
        "SELECT * FROM teachers WHERE id = ?"
    ).get(req.params.id);

    if (!teacher) {
        return res.status(404).json({
            message: "Teacher not found"
        });
    }

    res.json({
        teacher: teacher
    });
});

// Add a teacher
router.post("/", (req, res) => {
    const { name, age, subject, email } = req.body;

    const result = db.prepare(`
        INSERT INTO teachers (name, age, subject, email)
        VALUES (?, ?, ?, ?)
    `).run(name, age, subject, email);

    const newTeacher = db.prepare(`
        SELECT * FROM teachers WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
        message: "Teacher added successfully",
        teacher: newTeacher
    });
});

// Update a teacher
router.put("/:id", (req, res) => {
    const { name, age, subject, email } = req.body;

    const result = db.prepare(`
        UPDATE teachers
        SET name = ?, age = ?, subject = ?, email = ?
        WHERE id = ?
    `).run(name, age, subject, email, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Teacher not found"
        });
    }

    const updatedTeacher = db.prepare(`
        SELECT * FROM teachers WHERE id = ?
    `).get(req.params.id);

    res.json({
        message: "Teacher updated successfully",
        teacher: updatedTeacher
    });
});


// Delete a teacher
router.delete("/:id", (req, res) => {
    const result = db.prepare(`
        DELETE FROM teachers
        WHERE id = ?
    `).run(req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Teacher not found"
        });
    }

    res.json({
        message: "Teacher deleted successfully"
    });
});
module.exports = router;