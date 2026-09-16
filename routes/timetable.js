const express = require("express");
const router = express.Router();

const db = require("../database/database");


/* GET TIMETABLE */

router.get("/", (req, res) => {

    try {

        const timetable = db.prepare(`
            SELECT
                id,
                day,
                className,
                subject,
                teacher,
                time
            FROM timetable
            WHERE schoolId = ?
            ORDER BY
                CASE day
                    WHEN 'Monday' THEN 1
                    WHEN 'Tuesday' THEN 2
                    WHEN 'Wednesday' THEN 3
                    WHEN 'Thursday' THEN 4
                    WHEN 'Friday' THEN 5
                    ELSE 6
                END,
                time
        `).all(1);

        res.json(timetable);

    } catch (error) {

        console.error(
            "GET TIMETABLE ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to load timetable"
        });
    }
});


/* CREATE TIMETABLE ENTRY */

router.post("/", (req, res) => {

    try {

        const {
            day,
            className,
            subject,
            teacher,
            time
        } = req.body;

        if (
            !day ||
            !className ||
            !subject ||
            !teacher ||
            !time
        ) {

            return res.status(400).json({
                error: "All timetable fields are required"
            });
        }

        const result = db.prepare(`
            INSERT INTO timetable
            (
                day,
                className,
                subject,
                teacher,
                time,
                schoolId
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            day,
            className,
            subject,
            teacher,
            time,
            1
        );

        res.json({
            success: true,
            id: result.lastInsertRowid
        });

    } catch (error) {

        console.error(
            "CREATE TIMETABLE ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to create timetable entry"
        });
    }
});


/* DELETE TIMETABLE ENTRY */

router.put("/:id", (req, res) => {
    try {

        const {
            day,
            className,
            subject,
            teacher,
            time
        } = req.body;

        if (!day || !className || !subject || !teacher || !time) {
            return res.status(400).json({
                error: "All timetable fields are required"
            });
        }

        db.prepare(`
            UPDATE timetable
            SET
                day = ?,
                className = ?,
                subject = ?,
                teacher = ?,
                time = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            day,
            className,
            subject,
            teacher,
            time,
            req.params.id,
            1
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "UPDATE TIMETABLE ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to update timetable"
        });
    }
});

router.delete("/:id", (req, res) => {

    try {

        db.prepare(`
            DELETE FROM timetable
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
            "DELETE TIMETABLE ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to delete timetable entry"
        });
    }
});


module.exports = router;
