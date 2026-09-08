const express = require("express");
const db = require("../database/database");

const { createToken } = require("../middleware/auth");

const router = express.Router();

// ======================================================
// GENERATE UNIQUE SCHOOL CODE
// ======================================================

function generateSchoolCode(name) {
    const cleanedName = String(name || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    let prefix = cleanedName.substring(0, 3);

    if (prefix.length < 3) {
        prefix = (prefix + "SCH").substring(0, 3);
    }

    let code;

    do {
        const number = Math.floor(10000 + Math.random() * 90000);
        code = `${prefix}-${number}`;

        const existing = db
            .prepare("SELECT id FROM schools WHERE code = ?")
            .get(code);

        if (!existing) {
            return code;
        }

    } while (true);
}

// ======================================================
// REGISTER SCHOOL
// ======================================================

router.post("/register", (req, res) => {
    try {
        const body = req.body || {};

        const name = String(body.name || "").trim();
        const password = String(body.password || "");

        if (!name || !password) {
            return res.status(400).json({
                error: "School name and password are required"
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                error: "School name is too short"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters"
            });
        }

        const code = generateSchoolCode(name);

        const result = db
            .prepare(`
                INSERT INTO schools
                (name, code, password)
                VALUES (?, ?, ?)
            `)
            .run(
                name,
                code,
                password
            );

        const school = db
            .prepare(`
                SELECT id, name, code
                FROM schools
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        const token = createToken(school.id);

        res.status(201).json({
            message: "School registered successfully",
            token,
            school
        });

    } catch (error) {
        console.error(
            "REGISTER SCHOOL ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to register school",
            details: error.message
        });
    }
});

// ======================================================
// LOGIN SCHOOL
// ======================================================

router.post("/login", (req, res) => {
    try {
        const body = req.body || {};

        const code = String(body.code || "")
            .trim()
            .toUpperCase();

        const password = String(
            body.password || ""
        );

        if (!code || !password) {
            return res.status(400).json({
                error: "School code and password are required"
            });
        }

        const school = db
            .prepare(`
                SELECT *
                FROM schools
                WHERE code = ?
            `)
            .get(code);

        if (!school) {
            return res.status(401).json({
                error: "Invalid school code or password"
            });
        }

        if (school.password !== password) {
            return res.status(401).json({
                error: "Invalid school code or password"
            });
        }

        const token = createToken(school.id);

        res.json({
            message: "Login successful",
            token,
            school: {
                id: school.id,
                name: school.name,
                code: school.code
            }
        });

    } catch (error) {
        console.error(
            "SCHOOL LOGIN ERROR:",
            error
        );

        res.status(500).json({
            error: "Failed to login",
            details: error.message
        });
    }
});

module.exports = router;
