const express = require("express");
const cors = require("cors");
const db = require("./database/database");
const app = express();
app.use(cors());
const PORT = 3000;

const studentsRouter = require("./routes/students");
const teachersRouter = require("./routes/teachers");
const classesRouter = require("./routes/classes");
// This must come before the routes
app.use(express.json());

app.use("/api/students", studentsRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/classes", classesRouter);
app.get("/", (req, res) => {
    res.json({
        message: "School Management System API is running!"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});