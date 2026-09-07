const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const studentsRouter = require("./routes/students");
const teachersRouter = require("./routes/teachers");
const classesRouter = require("./routes/classes");

app.use(cors());
app.use(express.json());

app.use("/api/students", studentsRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/classes", classesRouter);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
