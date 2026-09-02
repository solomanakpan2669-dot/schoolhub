// ============================================================
// SCHOOL MANAGEMENT SYSTEM - FRONTEND
// ============================================================

// IMPORTANT:
// This must point to the ONLINE Render backend.
// Do NOT use http://localhost:3000/api here.
const API_URL = "https://schoolhub-2-a874.onrender.com/api";


// ============================================================
// ADD STUDENT
// ============================================================

async function addStudent(event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const age = document.getElementById("studentAge").value;
    const className = document.getElementById("studentClass").value.trim();

    if (!name || !age || !className) {
        alert("Please fill in all student information.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/students`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                age: Number(age),
                className: className
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to add student."
            );
        }

        alert("Student added successfully!");

        // Clear the form
        document.getElementById("studentForm").reset();

        // Reload students and update the count
        await loadStudents();

    } catch (error) {
        console.error("Error adding student:", error);

        alert(
            "Could not add the student.\n\n" +
            "Please check your internet connection and try again."
        );
    }
}


// ============================================================
// LOAD STUDENTS
// ============================================================

async function loadStudents() {
    try {
        const response = await fetch(`${API_URL}/students`);

        if (!response.ok) {
            throw new Error("Failed to load students.");
        }

        const data = await response.json();

        const students = data.students || [];

        document.getElementById("studentCount").textContent =
            students.length;

        const studentsDiv = document.getElementById("students");

        studentsDiv.innerHTML = "";

        if (students.length === 0) {
            studentsDiv.innerHTML =
                '<div class="item">No students found.</div>';
            return;
        }

        students.forEach(student => {
            studentsDiv.innerHTML += `
                <div class="item">
                    <strong>${escapeHTML(student.name)}</strong>
                    - Age: ${student.age}
                    - Class: ${escapeHTML(student.className)}
                </div>
            `;
        });

    } catch (error) {
        console.error("Error loading students:", error);

        document.getElementById("students").innerHTML =
            '<div class="item">Unable to load students.</div>';
    }
}


// ============================================================
// LOAD TEACHERS
// ============================================================

async function loadTeachers() {
    try {
        const response = await fetch(`${API_URL}/teachers`);

        if (!response.ok) {
            throw new Error("Failed to load teachers.");
        }

        const data = await response.json();

        const teachers = data.teachers || [];

        document.getElementById("teacherCount").textContent =
            teachers.length;

        const teachersDiv = document.getElementById("teachers");

        teachersDiv.innerHTML = "";

        if (teachers.length === 0) {
            teachersDiv.innerHTML =
                '<div class="item">No teachers found.</div>';
            return;
        }

        teachers.forEach(teacher => {
            teachersDiv.innerHTML += `
                <div class="item">
                    <strong>${escapeHTML(teacher.name)}</strong>
                    - Age: ${teacher.age}
                    - Subject: ${escapeHTML(teacher.subject)}
                </div>
            `;
        });

    } catch (error) {
        console.error("Error loading teachers:", error);

        document.getElementById("teachers").innerHTML =
            '<div class="item">Unable to load teachers.</div>';
    }
}


// ============================================================
// LOAD CLASSES
// ============================================================

async function loadClasses() {
    try {
        const response = await fetch(`${API_URL}/classes`);

        if (!response.ok) {
            throw new Error("Failed to load classes.");
        }

        const data = await response.json();

        const classes = data.classes || [];

        document.getElementById("classCount").textContent =
            classes.length;

        const classesDiv = document.getElementById("classes");

        classesDiv.innerHTML = "";

        if (classes.length === 0) {
            classesDiv.innerHTML =
                '<div class="item">No classes found.</div>';
            return;
        }

        classes.forEach(classItem => {
            classesDiv.innerHTML += `
                <div class="item">
                    <strong>${escapeHTML(classItem.name)}</strong>
                    - Section: ${escapeHTML(classItem.section)}
                </div>
            `;
        });

    } catch (error) {
        console.error("Error loading classes:", error);

        document.getElementById("classes").innerHTML =
            '<div class="item">Unable to load classes.</div>';
    }
}


// ============================================================
// SECURITY HELPER
// Prevent HTML entered as a student's name from becoming HTML.
// ============================================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


// ============================================================
// STARTUP
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // Connect the Add Student form to the backend
    const studentForm = document.getElementById("studentForm");

    if (studentForm) {
        studentForm.addEventListener("submit", addStudent);
    }

    // Automatically load all information when the page opens
    loadStudents();
    loadTeachers();
    loadClasses();

    console.log("School Management System loaded.");
    console.log("API:", API_URL);
});