const express = require("express");
const cors = require("cors");
const path = require("path");

const studentsRouter = require("./routes/students");
const teachersRouter = require("./routes/teachers");
const classesRouter = require("./routes/classes");
const schoolsRouter = require("./routes/schools");

const { requireAuth } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "4mb" }));

// ======================================================
// SCHOOL ACCOUNT ROUTES
// ======================================================

app.use("/api/schools", schoolsRouter);

// ======================================================
// PROTECTED SCHOOL DATA ROUTES
// ======================================================

app.use(
    "/api/students",
    requireAuth,
    studentsRouter
);

app.use(
    "/api/teachers",
    requireAuth,
    teachersRouter
);

app.use(
    "/api/classes",
    requireAuth,
    classesRouter
);

// ======================================================
// FRONTEND
// ======================================================

app.use(
    express.static(
        path.join(__dirname, "frontend")
    )
);

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "frontend",
            "index.html"
        )
    );
});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
    console.log(
        `SchoolConnect server running on port ${PORT}`
    );
});
