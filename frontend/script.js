const API_URL = "http://localhost:3000/api";

async function loadStudents() {
    try {
        const response = await fetch(`${API_URL}/students`);
        const data = await response.json();

        document.getElementById("studentCount").textContent =
            data.students.length;

        const studentsDiv = document.getElementById("students");
        studentsDiv.innerHTML = "";

        data.students.forEach(student => {
            studentsDiv.innerHTML += `
                <div class="item">
                    <strong>${student.name}</strong>
                    - Age: ${student.age}
                    - Class: ${student.className}
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading students:", error);
    }
}

async function loadTeachers() {
    try {
        const response = await fetch(`${API_URL}/teachers`);
        const data = await response.json();

        document.getElementById("teacherCount").textContent =
            data.teachers.length;

        const teachersDiv = document.getElementById("teachers");
        teachersDiv.innerHTML = "";

        data.teachers.forEach(teacher => {
            teachersDiv.innerHTML += `
                <div class="item">
                    <strong>${teacher.name}</strong>
                    - Age: ${teacher.age}
                    - Subject: ${teacher.subject}
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading teachers:", error);
    }
}

async function loadClasses() {
    try {
        const response = await fetch(`${API_URL}/classes`);
        const data = await response.json();

        document.getElementById("classCount").textContent =
            data.classes.length;

        const classesDiv = document.getElementById("classes");
        classesDiv.innerHTML = "";

        data.classes.forEach(classItem => {
            classesDiv.innerHTML += `
                <div class="item">
                    <strong>${classItem.name}</strong>
                    - Section: ${classItem.section}
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading classes:", error);
    }
}
