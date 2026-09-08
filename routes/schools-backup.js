const express = require("express");
const db = require("../database/database");

const router = express.Router();

// ======================================================
// REGISTER SCHOOL
// ======================================================

router.post("/register", (req, res) => {
    try {
        const { name, code, password } = req.body || {};

        if (!name || !code || !password) {
            return res.status(400).json({
                error: "School name, code and password are required"
            });
        }

        const schoolName = String(name).trim();
        const schoolCode = String(code).trim().toUpperCase();
        const schoolPassword = String(password);

        const existingSchool = db
            .prepare("SELECT id FROM schools WHERE code = ?")
            .get(schoolCode);

        if (existingSchool) {
            return res.status(409).json({
                error: "A school with this code already exists"
            });
        }

        const result = db
            .prepare(`
                INSERT INTO schools (name, code, password)
                VALUES (?, ?, ?)
            `)
            .run(
                schoolName,
                schoolCode,
                schoolPassword
            );

        res.status(201).json({
            message: "School registered successfully",
            school: {
                id: result.lastInsertRowid,
                name: schoolName,
                code: schoolCode
            }
        });

    } catch (error) {
        console.error("REGISTER SCHOOL ERROR:", error);

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
        const { code, password } = req.body || {};

        if (!code || !password) {
            return res.status(400).json({
                error: "School code and password are required"
            });
        }

        const schoolCode = String(code).trim().toUpperCase();

        const school = db
            .prepare(`
                SELECT id, name, code, password
                FROM schools
                WHERE code = ?
            `)
            .get(schoolCode);

        if (!school || school.password !== String(password)) {
            return res.status(401).json({
                error: "Invalid school code or password"
            });
        }

        res.json({
            message: "Login successful",
            school: {
                id: school.id,
                name: school.name,
                code: school.code
            }
        });

    } catch (error) {
        console.error("LOGIN SCHOOL ERROR:", error);

        res.status(500).json({
            error: "Failed to login",
            details: error.message
        });
    }
});

module.exports = router;
