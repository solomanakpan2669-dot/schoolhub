const crypto = require("crypto");

/* =========================================================
   SCHOOLCONNECT AUTHENTICATION
========================================================= */

const SECRET =
    process.env.AUTH_SECRET ||
    "schoolconnect-development-secret";

/* =========================================================
   CREATE TOKEN
========================================================= */

function createToken(schoolId, options = {}) {
    const payloadData = {
        schoolId: Number(schoolId),
        role: options.role || "school"
    };

    if (options.teacherId) {
        payloadData.teacherId =
            Number(options.teacherId);
    }

    const payload =
        Buffer.from(
            JSON.stringify(payloadData)
        ).toString("base64url");

    const signature =
        crypto
            .createHmac(
                "sha256",
                SECRET
            )
            .update(payload)
            .digest("base64url");

    return `${payload}.${signature}`;
}

/* =========================================================
   VERIFY TOKEN
========================================================= */

function verifyToken(token) {
    try {
        if (!token) {
            return null;
        }

        const parts =
            token.split(".");

        if (parts.length !== 2) {
            return null;
        }

        const [
            payload,
            signature
        ] = parts;

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    SECRET
                )
                .update(payload)
                .digest("base64url");

        const receivedBuffer =
            Buffer.from(signature);

        const expectedBuffer =
            Buffer.from(
                expectedSignature
            );

        if (
            receivedBuffer.length !==
            expectedBuffer.length
        ) {
            return null;
        }

        if (
            !crypto.timingSafeEqual(
                receivedBuffer,
                expectedBuffer
            )
        ) {
            return null;
        }

        const data =
            JSON.parse(
                Buffer.from(
                    payload,
                    "base64url"
                ).toString()
            );

        if (!data.schoolId) {
            return null;
        }

        /*
         * Old school tokens only contained
         * schoolId. Treat them as school tokens
         * so existing logins continue working.
         */

        const result = {
            schoolId:
                Number(data.schoolId),

            role:
                data.role || "school"
        };

        if (data.teacherId) {
            result.teacherId =
                Number(data.teacherId);
        }

        return result;

    } catch (error) {

        console.error(
            "TOKEN VERIFICATION ERROR:",
            error.message
        );

        return null;
    }
}

/* =========================================================
   REQUIRE AUTHENTICATION
========================================================= */

function requireAuth(
    req,
    res,
    next
) {
    const header =
        req.headers.authorization || "";

    if (
        !header.startsWith(
            "Bearer "
        )
    ) {
        return res.status(401).json({
            error:
                "School or teacher login required"
        });
    }

    const token =
        header.substring(7);

    const auth =
        verifyToken(token);

    if (!auth) {
        return res.status(401).json({
            error:
                "Invalid or expired login"
        });
    }

    req.schoolId =
        auth.schoolId;

    req.role =
        auth.role;

    if (
        auth.role === "teacher" &&
        auth.teacherId
    ) {
        req.teacherId =
            auth.teacherId;
    }

    next();
}

/* =========================================================
   REQUIRE SCHOOL ADMIN
========================================================= */

function requireSchool(
    req,
    res,
    next
) {
    if (
        req.role !== "school"
    ) {
        return res.status(403).json({
            error:
                "School administrator access required"
        });
    }

    next();
}

/* =========================================================
   REQUIRE TEACHER
========================================================= */

function requireTeacher(
    req,
    res,
    next
) {
    if (
        req.role !== "teacher" ||
        !req.teacherId
    ) {
        return res.status(403).json({
            error:
                "Teacher access required"
        });
    }

    next();
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    createToken,
    verifyToken,
    requireAuth,
    requireSchool,
    requireTeacher
};