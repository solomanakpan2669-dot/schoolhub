const express = require("express");
const db = require("../database/database");

const router = express.Router();


// ===============================
// GET ALL STUDENTS
// ===============================

router.get("/", (req, res) => {
    try {
        const students = db
            .prepare("SELECT * FROM students")
            .all();

        res.json(students);

    } catch (error) {
        console.error("GET STUDENTS ERROR:", error);

        res.status(500).json({
            error: "Failed to get students"
        });
    }
});


// ===============================
// GET ONE STUDENT
// ===============================

router.get("/:id", (req, res) => {
    try {
        const student = db
            .prepare("SELECT * FROM students WHERE id = ?")
            .get(req.params.id);

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


// ===============================
// ADD STUDENT
// ===============================

router.post("/", (req, res) => {
    try {
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
                INSERT INTO students (name, age, className)
                VALUES (?, ?, ?)
            `)
            .run(name, age, className);

        const student = db
            .prepare("SELECT * FROM students WHERE id = ?")
            .get(result.lastInsertRowid);

        res.status(201).json(student);

    } catch (error) {
        console.error("ADD STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to add student",
            details: error.message
        });
    }
});


// ===============================
// UPDATE STUDENT
// ===============================

router.put("/:id", (req, res) => {
    try {
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
            .prepare("SELECT * FROM students WHERE id = ?")
            .get(req.params.id);

        if (!existingStudent) {
            return res.status(404).json({
                error: "Student not found"
            });
        }

        db.prepare(`
            UPDATE students
            SET name = ?, age = ?, className = ?
            WHERE id = ?
        `).run(
            name,
            age,
            className,
            req.params.id
        );

        const updatedStudent = db
            .prepare("SELECT * FROM students WHERE id = ?")
            .get(req.params.id);

        res.json(updatedStudent);

    } catch (error) {
        console.error("UPDATE STUDENT ERROR:", error);

        res.status(500).json({
            error: "Failed to update student",
            details: error.message
        });
    }
});


// ===============================
// DELETE STUDENT
// ===============================

router.delete("/:id", (req, res) => {
    try {
        const result = db
            .prepare("DELETE FROM students WHERE id = ?")
            .run(req.params.id);

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