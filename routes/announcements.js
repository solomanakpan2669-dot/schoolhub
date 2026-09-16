const express = require("express");
const router = express.Router();

const db = require("../database/database");


/* =========================================================
   GET ANNOUNCEMENTS
========================================================= */

router.get("/", (req, res) => {

    try {

        const className = req.query.className;

        let announcements;

        if (className) {

            announcements = db.prepare(`
                SELECT
                    id,
                    title,
                    message,
                    date,
                    className
                FROM announcements
                WHERE schoolId = ?
                AND className = ?
                ORDER BY id DESC
            `).all(1, className);

        } else {

            announcements = db.prepare(`
                SELECT
                    id,
                    title,
                    message,
                    date,
                    className
                FROM announcements
                WHERE schoolId = ?
                ORDER BY id DESC
            `).all(1);

        }

        res.json(announcements);

    } catch (error) {

        console.error(
            "GET ANNOUNCEMENTS ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to load announcements"
        });
    }
});


/* =========================================================
   CREATE ANNOUNCEMENT
========================================================= */

router.post("/", (req, res) => {

    try {

        const {
            title,
            message,
            date,
            className
        } = req.body;

        if (
            !title ||
            !message ||
            !date ||
            !className
        ) {

            return res.status(400).json({
                error:
                    "Title, message, date and class are required"
            });
        }

        const result = db.prepare(`
            INSERT INTO announcements
            (
                title,
                message,
                date,
                className,
                schoolId
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            title,
            message,
            date,
            className,
            1
        );

        res.json({
            success: true,
            id: result.lastInsertRowid
        });

    } catch (error) {

        console.error(
            "CREATE ANNOUNCEMENT ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to create announcement"
        });
    }
});


/* =========================================================
   DELETE ANNOUNCEMENT
========================================================= */

router.delete("/:id", (req, res) => {

    try {

        db.prepare(`
            DELETE FROM announcements
            WHERE id = ?
            AND schoolId = ?
        `).run(
            req.params.id,
            1
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "DELETE ANNOUNCEMENT ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to delete announcement"
        });
    }
});


module.exports = router;
