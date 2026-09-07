const express = require("express");
const cors = require("cors");

const studentsRouter = require("./routes/students");
const teachersRouter = require("./routes/teachers");
const classesRouter = require("./routes/classes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "School Management System API is running!"
    });
});

app.use("/api/students", studentsRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/classes", classesRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});