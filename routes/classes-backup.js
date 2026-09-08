const express = require("express");
const db = require("../database/database");

const router = express.Router();

router.get("/", (req, res) => {
    try {
        const classes = db.prepare("SELECT * FROM classes").all();
        res.json(classes);
    } catch (error) {
        console.error("GET CLASSES ERROR:", error);
        res.status(500).json({ error: "Failed to get classes" });
    }
});

router.get("/:id", (req, res) => {
    try {
        const classItem = db.prepare("SELECT * FROM classes WHERE id = ?").get(req.params.id);

        if (!classItem) {
            return res.status(404).json({ error: "Class not found" });
        }

        res.json(classItem);
    } catch (error) {
        console.error("GET CLASS ERROR:", error);
        res.status(500).json({ error: "Failed to get class" });
    }
});

router.post("/", (req, res) => {
    try {
        const { name, teacher, room } = req.body || {};

        if (!name || !teacher || !room) {
            return res.status(400).json({
                error: "Class name, teacher and room are required"
            });
        }

        const result = db.prepare(
            "INSERT INTO classes (name, teacher, room) VALUES (?, ?, ?)"
        ).run(name, teacher, room);

        const classItem = db.prepare(
            "SELECT * FROM classes WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json(classItem);
    } catch (error) {
        console.error("ADD CLASS ERROR:", error);
        res.status(500).json({
            error: "Failed to add class",
            details: error.message
        });
    }
});

router.put("/:id", (req, res) => {
    try {
        const id = req.params.id;
        const { name, teacher, room } = req.body || {};

        if (!name || !teacher || !room) {
            return res.status(400).json({
                error: "Class name, teacher and room are required"
            });
        }

        const existingClass = db.prepare(
            "SELECT * FROM classes WHERE id = ?"
        ).get(id);

        if (!existingClass) {
            return res.status(404).json({
                error: "Class not found"
            });
        }

        db.prepare(
            "UPDATE classes SET name = ?, teacher = ?, room = ? WHERE id = ?"
        ).run(name, teacher, room, id);

        const updatedClass = db.prepare(
            "SELECT * FROM classes WHERE id = ?"
        ).get(id);

        res.json(updatedClass);
    } catch (error) {
        console.error("EDIT CLASS ERROR:", error);
        res.status(500).json({
            error: "Failed to update class",
            details: error.message
        });
    }
});

router.delete("/:id", (req, res) => {
    try {
        const result = db.prepare(
            "DELETE FROM classes WHERE id = ?"
        ).run(req.params.id);

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
