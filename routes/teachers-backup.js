const express = require("express");
const db = require("../database/database");

const router = express.Router();

/* =========================================================
   GET ALL TEACHERS
========================================================= */

router.get("/", (req, res) => {
    try {
        const teachers = db
            .prepare("SELECT * FROM teachers")
            .all();

        res.json(teachers);

    } catch (error) {
        console.error(
            "GET TEACHERS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to get teachers"
        });
    }
});

/* =========================================================
   GET ONE TEACHER
========================================================= */

router.get("/:id", (req, res) => {
    try {
        const teacher = db
            .prepare(
                "SELECT * FROM teachers WHERE id = ?"
            )
            .get(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        res.json(teacher);

    } catch (error) {
        console.error(
            "GET TEACHER ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to get teacher"
        });
    }
});

/* =========================================================
   ADD TEACHER
========================================================= */

router.post("/", (req, res) => {
    try {
        const body = req.body || {};

        const name = body.name;
        const age = body.age;
        const subject = body.subject;
        const email = body.email;

        if (
            !name ||
            !age ||
            !subject ||
            !email
        ) {
            return res.status(400).json({
                error:
                    "Name, age, subject and email are required"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO teachers
                (name, age, subject, email)
                VALUES (?, ?, ?, ?)
            `)
            .run(
                name,
                age,
                subject,
                email
            );

        const teacher = db
            .prepare(
                "SELECT * FROM teachers WHERE id = ?"
            )
            .get(result.lastInsertRowid);

        res.status(201).json(teacher);

    } catch (error) {
        console.error(
            "ADD TEACHER ERROR:",
            error
        );

        if (
            error.message.includes(
                "UNIQUE constraint failed"
            )
        ) {
            return res.status(409).json({
                error:
                    "A teacher with this email already exists"
            });
        }

        res.status(500).json({
            error: "Failed to add teacher",
            details: error.message
        });
    }
});

/* =========================================================
   EDIT TEACHER
========================================================= */

router.put("/:id", (req, res) => {
    try {
        const id = req.params.id;

        const body = req.body || {};

        const name = body.name;
        const age = body.age;
        const subject = body.subject;
        const email = body.email;

        if (
            !name ||
            !age ||
            !subject ||
            !email
        ) {
            return res.status(400).json({
                error:
                    "Name, age, subject and email are required"
            });
        }

        const existingTeacher = db
            .prepare(
                "SELECT * FROM teachers WHERE id = ?"
            )
            .get(id);

        if (!existingTeacher) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        const emailOwner = db
            .prepare(
                "SELECT * FROM teachers WHERE email = ? AND id != ?"
            )
            .get(email, id);

        if (emailOwner) {
            return res.status(409).json({
                error:
                    "A teacher with this email already exists"
            });
        }

        db.prepare(`
            UPDATE teachers
            SET name = ?,
                age = ?,
                subject = ?,
                email = ?
            WHERE id = ?
        `).run(
            name,
            age,
            subject,
            email,
            id
        );

        const updatedTeacher = db
            .prepare(
                "SELECT * FROM teachers WHERE id = ?"
            )
            .get(id);

        res.json(updatedTeacher);

    } catch (error) {
        console.error(
            "EDIT TEACHER ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to update teacher",
            details: error.message
        });
    }
});

/* =========================================================
   DELETE TEACHER
========================================================= */

router.delete("/:id", (req, res) => {
    try {
        const result = db
            .prepare(
                "DELETE FROM teachers WHERE id = ?"
            )
            .run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Teacher not found"
            });
        }

        res.json({
            message:
                "Teacher deleted successfully"
        });

    } catch (error) {
        console.error(
            "DELETE TEACHER ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to delete teacher"
        });
    }
});

module.exports = router;