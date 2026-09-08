const crypto = require("crypto");

const SECRET = process.env.AUTH_SECRET || "schoolconnect-development-secret";

function createToken(schoolId) {
    const payload = Buffer.from(
        JSON.stringify({
            schoolId: Number(schoolId)
        })
    ).toString("base64url");

    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
}

function verifyToken(token) {
    try {
        if (!token) return null;

        const parts = token.split(".");

        if (parts.length !== 2) {
            return null;
        }

        const [payload, signature] = parts;

        const expectedSignature = crypto
            .createHmac("sha256", SECRET)
            .update(payload)
            .digest("base64url");

        if (
            !crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            )
        ) {
            return null;
        }

        const data = JSON.parse(
            Buffer.from(payload, "base64url").toString()
        );

        if (!data.schoolId) {
            return null;
        }

        return Number(data.schoolId);

    } catch (error) {
        return null;
    }
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "School login required"
        });
    }

    const token = header.substring(7);
    const schoolId = verifyToken(token);

    if (!schoolId) {
        return res.status(401).json({
            error: "Invalid or expired login"
        });
    }

    req.schoolId = schoolId;

    next();
}

module.exports = {
    createToken,
    verifyToken,
    requireAuth
};
