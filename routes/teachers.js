const express = require("express");
const crypto = require("crypto");

const db = require("../database/database");
const { createToken } = require("../middleware/auth");

const router = express.Router();

const SCHOOL_ID = 1;

/* =========================================================
   PASSWORD HELPERS
========================================================= */

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
    if (!storedPassword) {
        return false;
    }

    /*
     * New secure password format
     */
    if (storedPassword.startsWith("scrypt:")) {
        const parts = storedPassword.split(":");

        if (parts.length !== 3) {
            return false;
        }

        const salt = parts[1];
        const storedHash = parts[2];

        const hash = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        const a = Buffer.from(hash, "hex");
        const b = Buffer.from(storedHash, "hex");

        if (a.length !== b.length) {
            return false;
        }

        return crypto.timingSafeEqual(a, b);
    }

    /*
     * Compatibility with an older plain-text password.
     * This allows an existing teacher password to continue
     * working if one was previously stored that way.
     */
    return storedPassword === password;
}

/* =========================================================
   GET SCHOOL ID
========================================================= */

function getSchoolId() {
    return SCHOOL_ID;
}

/* =========================================================
   BUILD TEACHER RESULT
========================================================= */

function buildTeacherResult(teacher) {
    let assignedClass = null;

    if (teacher.assignedClassId) {
        assignedClass = db.prepare(`
            SELECT
                id,
                name,
                section,
                teacher,
                room
            FROM classes
            WHERE id = ?
            AND schoolId = ?
        `).get(
            teacher.assignedClassId,
            teacher.schoolId
        );
    }

    return {
        id: teacher.id,
        name: teacher.name,
        age: teacher.age,
        subject: teacher.subject,
        email: teacher.email,
        photo: teacher.photo || null,
        schoolId: teacher.schoolId,
        assignedClassId:
            teacher.assignedClassId || null,
        assignedClassName:
            assignedClass?.name || null,
        assignedClass:
            assignedClass || null
    };
}

/* =========================================================
   TEACHER LOGIN
   IMPORTANT:
   This must come before /:id
========================================================= */

router.post("/login", (req, res) => {
    try {
        const email = String(
            req.body?.email || ""
        )
            .trim()
            .toLowerCase();

        const password = String(
            req.body?.password || ""
        );

        if (!email || !password) {
            return res.status(400).json({
                message:
                    "Email and password are required"
            });
        }

        const teacher = db.prepare(`
            SELECT *
            FROM teachers
            WHERE LOWER(email) = ?
        `).get(email);

        if (!teacher) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        if (!teacher.password) {
            return res.status(401).json({
                message:
                    "This teacher does not have a password yet. Ask the school administrator to set one."
            });
        }

        const passwordCorrect =
            verifyPassword(
                password,
                teacher.password
            );

        if (!passwordCorrect) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        const token = createToken(
            teacher.schoolId || SCHOOL_ID,
            {
                role: "teacher",
                teacherId: teacher.id
            }
        );

        const teacherResult =
            buildTeacherResult(
                teacher
            );

        res.json({
            message:
                "Teacher login successful",
            token,
            teacher:
                teacherResult
        });

    } catch (error) {
        console.error(
            "TEACHER LOGIN ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to login teacher",
            error:
                error.message
        });
    }
});

/* =========================================================
   GET ALL TEACHERS
========================================================= */

router.get("/", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const teachers = db.prepare(`
            SELECT
                id,
                name,
                age,
                subject,
                email,
                photo,
                schoolId,
                assignedClassId
            FROM teachers
            WHERE schoolId = ?
            ORDER BY name COLLATE NOCASE ASC
        `).all(schoolId);

        const result =
            teachers.map(
                buildTeacherResult
            );

        res.json(result);

    } catch (error) {
        console.error(
            "GET TEACHERS ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to load teachers",
            error:
                error.message
        });
    }
});

/* =========================================================
   GET ONE TEACHER
========================================================= */

router.get("/:id", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const teacher = db.prepare(`
            SELECT
                id,
                name,
                age,
                subject,
                email,
                photo,
                schoolId,
                assignedClassId
            FROM teachers
            WHERE id = ?
            AND schoolId = ?
        `).get(
            req.params.id,
            schoolId
        );

        if (!teacher) {
            return res.status(404).json({
                message:
                    "Teacher not found"
            });
        }

        res.json({
            teacher:
                buildTeacherResult(
                    teacher
                )
        });

    } catch (error) {
        console.error(
            "GET TEACHER ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to load teacher",
            error:
                error.message
        });
    }
});

/* =========================================================
   ADD TEACHER
========================================================= */

router.post("/", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const name = String(
            req.body?.name || ""
        ).trim();

        const age = Number(
            req.body?.age
        );

        const subject = String(
            req.body?.subject || ""
        ).trim();

        const email = String(
            req.body?.email || ""
        )
            .trim()
            .toLowerCase();

        const password = String(
            req.body?.password || ""
        );

        const assignedClassId =
            req.body?.assignedClassId
                ? Number(
                      req.body.assignedClassId
                  )
                : null;

        if (
            !name ||
            !Number.isFinite(age) ||
            !subject ||
            !email
        ) {
            return res.status(400).json({
                message:
                    "Name, age, subject and email are required"
            });
        }

        if (password && password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters"
            });
        }

        const existingTeacher =
            db.prepare(`
                SELECT id
                FROM teachers
                WHERE schoolId = ?
                AND LOWER(email) = ?
            `).get(
                schoolId,
                email
            );

        if (existingTeacher) {
            return res.status(409).json({
                message:
                    "A teacher with this email already exists"
            });
        }

        if (assignedClassId) {
            const classItem =
                db.prepare(`
                    SELECT id
                    FROM classes
                    WHERE id = ?
                    AND schoolId = ?
                `).get(
                    assignedClassId,
                    schoolId
                );

            if (!classItem) {
                return res.status(400).json({
                    message:
                        "Selected class does not exist"
                });
            }

            const classTeacher =
                db.prepare(`
                    SELECT id, name
                    FROM teachers
                    WHERE schoolId = ?
                    AND assignedClassId = ?
                `).get(
                    schoolId,
                    assignedClassId
                );

            if (classTeacher) {
                return res.status(409).json({
                    message:
                        `This class is already assigned to ${classTeacher.name}`
                });
            }
        }

        const storedPassword =
            password
                ? hashPassword(password)
                : "";

        const result = db.prepare(`
            INSERT INTO teachers
                (
                    name,
                    age,
                    subject,
                    email,
                    password,
                    schoolId,
                    assignedClassId
                )
            VALUES
                (?, ?, ?, ?, ?, ?, ?)
        `).run(
            name,
            age,
            subject,
            email,
            storedPassword,
            schoolId,
            assignedClassId
        );

        const teacher =
            db.prepare(`
                SELECT
                    id,
                    name,
                    age,
                    subject,
                    email,
                    photo,
                    schoolId,
                    assignedClassId
                FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `).get(
                result.lastInsertRowid,
                schoolId
            );

        res.status(201).json({
            message:
                "Teacher added successfully",
            teacher:
                buildTeacherResult(
                    teacher
                )
        });

    } catch (error) {
        console.error(
            "ADD TEACHER ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to add teacher",
            error:
                error.message
        });
    }
});

/* =========================================================
   UPDATE TEACHER
========================================================= */

router.put("/:id", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const name = String(
            req.body?.name || ""
        ).trim();

        const age = Number(
            req.body?.age
        );

        const subject = String(
            req.body?.subject || ""
        ).trim();

        const email = String(
            req.body?.email || ""
        )
            .trim()
            .toLowerCase();

        const password =
            req.body?.password !== undefined
                ? String(
                      req.body.password || ""
                  )
                : null;

        const assignedClassId =
            req.body?.assignedClassId
                ? Number(
                      req.body.assignedClassId
                  )
                : null;

        if (
            !name ||
            !Number.isFinite(age) ||
            !subject ||
            !email
        ) {
            return res.status(400).json({
                message:
                    "Name, age, subject and email are required"
            });
        }

        if (
            password !== null &&
            password !== "" &&
            password.length < 6
        ) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters"
            });
        }

        const existingTeacher =
            db.prepare(`
                SELECT *
                FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `).get(
                req.params.id,
                schoolId
            );

        if (!existingTeacher) {
            return res.status(404).json({
                message:
                    "Teacher not found"
            });
        }

        const duplicateEmail =
            db.prepare(`
                SELECT id
                FROM teachers
                WHERE schoolId = ?
                AND LOWER(email) = ?
                AND id != ?
            `).get(
                schoolId,
                email,
                req.params.id
            );

        if (duplicateEmail) {
            return res.status(409).json({
                message:
                    "Another teacher already uses this email"
            });
        }

        if (assignedClassId) {
            const classItem =
                db.prepare(`
                    SELECT id
                    FROM classes
                    WHERE id = ?
                    AND schoolId = ?
                `).get(
                    assignedClassId,
                    schoolId
                );

            if (!classItem) {
                return res.status(400).json({
                    message:
                        "Selected class does not exist"
                });
            }

            const classTeacher =
                db.prepare(`
                    SELECT id, name
                    FROM teachers
                    WHERE schoolId = ?
                    AND assignedClassId = ?
                    AND id != ?
                `).get(
                    schoolId,
                    assignedClassId,
                    req.params.id
                );

            if (classTeacher) {
                return res.status(409).json({
                    message:
                        `This class is already assigned to ${classTeacher.name}`
                });
            }
        }

        if (
            password !== null &&
            password !== ""
        ) {
            const newPassword =
                hashPassword(password);

            db.prepare(`
                UPDATE teachers
                SET
                    name = ?,
                    age = ?,
                    subject = ?,
                    email = ?,
                    password = ?,
                    assignedClassId = ?
                WHERE id = ?
                AND schoolId = ?
            `).run(
                name,
                age,
                subject,
                email,
                newPassword,
                assignedClassId,
                req.params.id,
                schoolId
            );

        } else {
            db.prepare(`
                UPDATE teachers
                SET
                    name = ?,
                    age = ?,
                    subject = ?,
                    email = ?,
                    assignedClassId = ?
                WHERE id = ?
                AND schoolId = ?
            `).run(
                name,
                age,
                subject,
                email,
                assignedClassId,
                req.params.id,
                schoolId
            );
        }

        const updatedTeacher =
            db.prepare(`
                SELECT
                    id,
                    name,
                    age,
                    subject,
                    email,
                    photo,
                    schoolId,
                    assignedClassId
                FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `).get(
                req.params.id,
                schoolId
            );

        res.json({
            message:
                "Teacher updated successfully",
            teacher:
                buildTeacherResult(
                    updatedTeacher
                )
        });

    } catch (error) {
        console.error(
            "UPDATE TEACHER ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to update teacher",
            error:
                error.message
        });
    }
});

/* =========================================================
   UPLOAD TEACHER PHOTO
========================================================= */

router.put("/:id/photo", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const photo =
            req.body?.photo;

        if (!photo) {
            return res.status(400).json({
                message:
                    "Photo data is required"
            });
        }

        const teacher =
            db.prepare(`
                SELECT id
                FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `).get(
                req.params.id,
                schoolId
            );

        if (!teacher) {
            return res.status(404).json({
                message:
                    "Teacher not found"
            });
        }

        db.prepare(`
            UPDATE teachers
            SET photo = ?
            WHERE id = ?
            AND schoolId = ?
        `).run(
            photo,
            req.params.id,
            schoolId
        );

        res.json({
            message:
                "Teacher photo updated successfully"
        });

    } catch (error) {
        console.error(
            "UPDATE TEACHER PHOTO ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to update teacher photo",
            error:
                error.message
        });
    }
});

/* =========================================================
   DELETE TEACHER PHOTO
========================================================= */

router.delete("/:id/photo", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const teacher =
            db.prepare(`
                SELECT id
                FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `).get(
                req.params.id,
                schoolId
            );

        if (!teacher) {
            return res.status(404).json({
                message:
                    "Teacher not found"
            });
        }

        db.prepare(`
            UPDATE teachers
            SET photo = NULL
            WHERE id = ?
            AND schoolId = ?
        `).run(
            req.params.id,
            schoolId
        );

        res.json({
            message:
                "Teacher photo removed successfully"
        });

    } catch (error) {
        console.error(
            "DELETE TEACHER PHOTO ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to remove teacher photo",
            error:
                error.message
        });
    }
});

/* =========================================================
   DELETE TEACHER
========================================================= */

router.delete("/:id", (req, res) => {
    try {
        const schoolId =
            getSchoolId();

        const teacher =
            db.prepare(`
                SELECT id
                FROM teachers
                WHERE id = ?
                AND schoolId = ?
            `).get(
                req.params.id,
                schoolId
            );

        if (!teacher) {
            return res.status(404).json({
                message:
                    "Teacher not found"
            });
        }

        db.prepare(`
            DELETE FROM teachers
            WHERE id = ?
            AND schoolId = ?
        `).run(
            req.params.id,
            schoolId
        );

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
            message:
                "Failed to delete teacher",
            error:
                error.message
        });
    }
});

module.exports = router;
