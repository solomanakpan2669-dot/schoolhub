const express = require("express");
const router = express.Router();

const db = require("../database/database");


/* =========================================================
   GET ALL CLASSES
========================================================= */

router.get("/", (req, res) => {

    try {

        const classes = db.prepare(`
            SELECT
                id,
                name,
                teacher,
                room
            FROM classes
            ORDER BY id ASC
        `).all();

        res.json(classes);

    } catch (error) {

        console.error(
            "GET CLASSES ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to get classes",
            details: error.message
        });
    }
});


/* =========================================================
   GET ONE CLASS
========================================================= */

router.get("/:id", (req, res) => {

    try {

        const classItem = db.prepare(`
            SELECT
                id,
                name,
                teacher,
                room
            FROM classes
            WHERE id = ?
        `).get(req.params.id);

        if (!classItem) {

            return res.status(404).json({
                error: "Class not found"
            });
        }

        res.json(classItem);

    } catch (error) {

        console.error(
            "GET CLASS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to get class",
            details: error.message
        });
    }
});


/* =========================================================
   GET STUDENTS IN A CLASS
========================================================= */

router.get("/:id/students", (req, res) => {

    try {

        const classItem = db.prepare(`
            SELECT
                id,
                name,
                teacher,
                room
            FROM classes
            WHERE id = ?
        `).get(req.params.id);

        if (!classItem) {

            return res.status(404).json({
                error: "Class not found"
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
            WHERE LOWER(TRIM(className))
                = LOWER(TRIM(?))
            ORDER BY name ASC
        `).all(classItem.name);

        res.json({
            class: classItem,
            students: students
        });

    } catch (error) {

        console.error(
            "GET CLASS STUDENTS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to get class students",
            details: error.message
        });
    }
});


/* =========================================================
   CREATE CLASS
========================================================= */

router.post("/", (req, res) => {

    try {

        const body = req.body || {};

        const name =
            String(body.name || "").trim();

        const teacher =
            String(body.teacher || "").trim();

        const room =
            String(body.room || "").trim();


        if (!name) {

            return res.status(400).json({
                error: "Class name is required"
            });
        }


        const existingClass = db.prepare(`
            SELECT id
            FROM classes
            WHERE LOWER(TRIM(name))
                = LOWER(TRIM(?))
        `).get(name);


        if (existingClass) {

            return res.status(409).json({
                error:
                    "This class already exists"
            });
        }


        const section =
            String(req.body?.section || name || "General").trim();

        const result = db.prepare(`
            INSERT INTO classes
            (
                name,
                teacher,
                room,
                section
            )
            VALUES (?, ?, ?, ?)
        `).run(
            name,
            teacher,
            room,
            section
        );


        const newClass = db.prepare(`
            SELECT
                id,
                name,
                teacher,
                room
            FROM classes
            WHERE id = ?
        `).get(
            result.lastInsertRowid
        );


        res.status(201).json(
            newClass
        );

    } catch (error) {

        console.error(
            "CREATE CLASS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to add class",
            details: error.message
        });
    }
});


/* =========================================================
   UPDATE CLASS
========================================================= */

router.put("/:id", (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const body =
            req.body || {};

        const name =
            String(body.name || "").trim();

        const teacher =
            String(body.teacher || "").trim();

        const room =
            String(body.room || "").trim();


        if (!name) {

            return res.status(400).json({
                error: "Class name is required"
            });
        }


        const existingClass = db.prepare(`
            SELECT id
            FROM classes
            WHERE id = ?
        `).get(id);


        if (!existingClass) {

            return res.status(404).json({
                error: "Class not found"
            });
        }


        const duplicate = db.prepare(`
            SELECT id
            FROM classes
            WHERE LOWER(TRIM(name))
                = LOWER(TRIM(?))
            AND id != ?
        `).get(
            name,
            id
        );


        if (duplicate) {

            return res.status(409).json({
                error:
                    "Another class already has this name"
            });
        }


        db.prepare(`
            UPDATE classes
            SET
                name = ?,
                teacher = ?,
                room = ?
            WHERE id = ?
        `).run(
            name,
            teacher,
            room,
            id
        );


        const updatedClass = db.prepare(`
            SELECT
                id,
                name,
                teacher,
                room
            FROM classes
            WHERE id = ?
        `).get(id);


        res.json(
            updatedClass
        );

    } catch (error) {

        console.error(
            "UPDATE CLASS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to update class",
            details: error.message
        });
    }
});


/* =========================================================
   DELETE CLASS
========================================================= */

router.delete("/:id", (req, res) => {

    try {

        const result = db.prepare(`
            DELETE FROM classes
            WHERE id = ?
        `).run(
            req.params.id
        );


        if (result.changes === 0) {

            return res.status(404).json({
                error: "Class not found"
            });
        }


        res.json({
            success: true,
            message:
                "Class deleted successfully"
        });

    } catch (error) {

        console.error(
            "DELETE CLASS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to delete class",
            details: error.message
        });
    }
});


module.exports = router;
