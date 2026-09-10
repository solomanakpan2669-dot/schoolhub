const express = require("express");
const db = require("../database/database");

const router = express.Router();

// Get all classes
router.get("/", (req, res) => {
    try {
        const classes = db.prepare(`
            SELECT id, name, teacher, room
            FROM classes
            ORDER BY id DESC
        `).all();

        res.json(classes);
    } catch (error) {
        console.error("GET CLASSES ERROR:", error);

        res.status(500).json({
            error: "Failed to get classes",
            details: error.message
        });
    }
});

// Get one class
router.get("/:id", (req, res) => {
    try {
        const classItem = db.prepare(`
            SELECT id, name, teacher, room
            FROM classes
            WHERE id = ?
        `).get(req.params.id);

        if (!classItem) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        res.json(classItem);
    } catch (error) {
        console.error("GET CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to get class",
            details: error.message
        });
    }
});

// Add a class
router.post("/", (req, res) => {
    try {
        const {
            name,
            teacher = "",
            room = "",
            section = ""
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Class name is required"
            });
        }

        const result = db.prepare(`
            INSERT INTO classes
            (name, section, teacher, room)
            VALUES (?, ?, ?, ?)
        `).run(
            name.trim(),
            section || "",
            teacher || "",
            room || ""
        );

        const newClass = db.prepare(`
            SELECT id, name, teacher, room
            FROM classes
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            message: "Class added successfully",
            class: newClass
        });
    } catch (error) {
        console.error("SAVE CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to add class",
            details: error.message
        });
    }
});

// Update a class
router.put("/:id", (req, res) => {
    try {
        const {
            name,
            teacher = "",
            room = "",
            section = ""
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Class name is required"
            });
        }

        const result = db.prepare(`
            UPDATE classes
            SET name = ?,
                section = ?,
                teacher = ?,
                room = ?
            WHERE id = ?
        `).run(
            name.trim(),
            section || "",
            teacher || "",
            room || "",
            req.params.id
        );

        if (result.changes === 0) {
            return res.status(404).json({
                message: "Class not found"
            });
        }

        const updatedClass = db.prepare(`
            SELECT id, name, teacher, room
            FROM classes
            WHERE id = ?
        `).get(req.params.id);

        res.json({
            message: "Class updated successfully",
            class: updatedClass
        });
    } catch (error) {
        console.error("UPDATE CLASS ERROR:", error);

        res.status(500).json({
            error: "Failed to update class",
            details: error.message
        });
    }
});

// Delete a class
router.delete("/:id", (req, res) => {
    try {
        const result = db.prepare(`
            DELETE FROM classes
            WHERE id = ?
        `).run(req.params.id);

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
            error: "Failed to delete class",
            details: error.message
        });
    }
});

module.exports = router;