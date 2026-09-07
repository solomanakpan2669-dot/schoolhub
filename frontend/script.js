const API_URL = "https://schoolcentral.onrender.com/api";

let allStudents = [];
let allTeachers = [];
let allClasses = [];

let editingStudentId = null;
let editingTeacherId = null;
let editingClassId = null;

// ======================================================
// HELPERS
// ======================================================

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function getJSON(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

function showMessage(message) {
    alert(message);
}

// ======================================================
// DASHBOARD COUNTERS
// ======================================================

function updateDashboardCounts() {
    const studentCount = getElement("studentCount");
    const teacherCount = getElement("teacherCount");
    const classCount = getElement("classCount");

    if (studentCount) {
        studentCount.textContent = allStudents.length;
    }

    if (teacherCount) {
        teacherCount.textContent = allTeachers.length;
    }

    if (classCount) {
        classCount.textContent = allClasses.length;
    }
}

// ======================================================
// STUDENTS
// ======================================================

async function loadStudents() {
    try {
        const data = await getJSON(`${API_URL}/students`);

        allStudents = Array.isArray(data)
            ? data
            : data.students || [];

        displayStudents(allStudents);
        updateDashboardCounts();

    } catch (error) {
        console.error("Error loading students:", error);

        allStudents = [];
        displayStudents([]);
        updateDashboardCounts();
    }
}

function displayStudents(students) {
    const table = getElement("studentsTable");

    if (!table) return;

    if (students.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No students found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = students.map(student => `
        <tr>
            <td>${escapeHTML(student.id)}</td>
            <td>${escapeHTML(student.name)}</td>
            <td>${escapeHTML(student.age)}</td>
            <td>${escapeHTML(student.className)}</td>
            <td>
                <button onclick="viewStudent(${student.id})">
                    View
                </button>

                <button onclick="editStudent(${student.id})">
                    Edit
                </button>

                <button onclick="deleteStudent(${student.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function searchStudents() {
    const input = getElement("studentSearch");

    if (!input) return;

    const search = input.value.toLowerCase().trim();

    const filtered = allStudents.filter(student =>
        String(student.name)
            .toLowerCase()
            .includes(search) ||

        String(student.className)
            .toLowerCase()
            .includes(search) ||

        String(student.id)
            .includes(search)
    );

    displayStudents(filtered);
}

async function saveStudent(event) {
    event.preventDefault();

    const name = getElement("studentName")?.value.trim();
    const age = getElement("studentAge")?.value;
    const className = getElement("studentClass")?.value.trim();

    if (!name || !age || !className) {
        showMessage("Please fill all student fields.");
        return;
    }

    try {
        const student = {
            name,
            age: Number(age),
            className
        };

        if (editingStudentId) {
            await getJSON(
                `${API_URL}/students/${editingStudentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(student)
                }
            );

            showMessage("Student updated successfully.");

        } else {
            await getJSON(
                `${API_URL}/students`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(student)
                }
            );

            showMessage("Student added successfully.");
        }

        editingStudentId = null;

        closeModal("studentModal");

        getElement("studentForm")?.reset();

        await loadStudents();

    } catch (error) {
        console.error("Error saving student:", error);

        showMessage("Could not save student.");
    }
}

function editStudent(id) {
    const student = allStudents.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) return;

    editingStudentId = student.id;

    const nameInput = getElement("studentName");
    const ageInput = getElement("studentAge");
    const classInput = getElement("studentClass");

    if (nameInput) {
        nameInput.value = student.name;
    }

    if (ageInput) {
        ageInput.value = student.age;
    }

    if (classInput) {
        classInput.value = student.className;
    }

    openModal("studentModal");
}

async function deleteStudent(id) {
    const student = allStudents.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) return;

    if (!confirm(`Delete ${student.name}?`)) {
        return;
    }

    try {
        await getJSON(
            `${API_URL}/students/${id}`,
            {
                method: "DELETE"
            }
        );

        await loadStudents();

        showMessage("Student deleted successfully.");

    } catch (error) {
        console.error("Error deleting student:", error);

        showMessage("Could not delete student.");
    }
}

// ======================================================
// TEACHERS
// ======================================================

async function loadTeachers() {
    try {
        const data = await getJSON(`${API_URL}/teachers`);

        allTeachers = Array.isArray(data)
            ? data
            : data.teachers || [];

        displayTeachers(allTeachers);
        updateDashboardCounts();

    } catch (error) {
        console.error("Error loading teachers:", error);

        allTeachers = [];
        displayTeachers([]);
        updateDashboardCounts();
    }
}

function displayTeachers(teachers) {
    const table = getElement("teachersTable");

    if (!table) return;

    if (teachers.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No teachers found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = teachers.map(teacher => `
        <tr>
            <td>${escapeHTML(teacher.id)}</td>
            <td>${escapeHTML(teacher.name)}</td>
            <td>${escapeHTML(teacher.age)}</td>
            <td>${escapeHTML(teacher.subject)}</td>
            <td>${escapeHTML(teacher.email)}</td>
            <td>
                <button onclick="viewTeacher(${teacher.id})">
                    View
                </button>

                <button onclick="editTeacher(${teacher.id})">
                    Edit
                </button>

                <button onclick="deleteTeacher(${teacher.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function searchTeachers() {
    const input = getElement("teacherSearch");

    if (!input) return;

    const search = input.value.toLowerCase().trim();

    const filtered = allTeachers.filter(teacher =>
        String(teacher.name)
            .toLowerCase()
            .includes(search) ||

        String(teacher.subject)
            .toLowerCase()
            .includes(search) ||

        String(teacher.email)
            .toLowerCase()
            .includes(search) ||

        String(teacher.id)
            .includes(search)
    );

    displayTeachers(filtered);
}

async function saveTeacher(event) {
    event.preventDefault();

    const name = getElement("teacherName")?.value.trim();
    const age = getElement("teacherAge")?.value;
    const subject = getElement("teacherSubject")?.value.trim();
    const email = getElement("teacherEmail")?.value.trim();

    if (!name || !age || !subject || !email) {
        showMessage("Please fill all teacher fields.");
        return;
    }

    try {
        const teacher = {
            name,
            age: Number(age),
            subject,
            email
        };

        if (editingTeacherId) {
            await getJSON(
                `${API_URL}/teachers/${editingTeacherId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(teacher)
                }
            );

            showMessage("Teacher updated successfully.");

        } else {
            await getJSON(
                `${API_URL}/teachers`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(teacher)
                }
            );

            showMessage("Teacher added successfully.");
        }

        editingTeacherId = null;

        closeModal("teacherModal");

        getElement("teacherForm")?.reset();

        await loadTeachers();

    } catch (error) {
        console.error("Error saving teacher:", error);

        showMessage("Could not save teacher.");
    }
}

function editTeacher(id) {
    const teacher = allTeachers.find(
        item => Number(item.id) === Number(id)
    );

    if (!teacher) return;

    editingTeacherId = teacher.id;

    const nameInput = getElement("teacherName");
    const ageInput = getElement("teacherAge");
    const subjectInput = getElement("teacherSubject");
    const emailInput = getElement("teacherEmail");

    if (nameInput) {
        nameInput.value = teacher.name;
    }

    if (ageInput) {
        ageInput.value = teacher.age;
    }

    if (subjectInput) {
        subjectInput.value = teacher.subject;
    }

    if (emailInput) {
        emailInput.value = teacher.email;
    }

    openModal("teacherModal");
}

async function deleteTeacher(id) {
    const teacher = allTeachers.find(
        item => Number(item.id) === Number(id)
    );

    if (!teacher) return;

    if (!confirm(`Delete ${teacher.name}?`)) {
        return;
    }

    try {
        await getJSON(
            `${API_URL}/teachers/${id}`,
            {
                method: "DELETE"
            }
        );

        await loadTeachers();

        showMessage("Teacher deleted successfully.");

    } catch (error) {
        console.error("Error deleting teacher:", error);

        showMessage("Could not delete teacher.");
    }
}

// ======================================================
// CLASSES
// ======================================================

async function loadClasses() {
    try {
        const data = await getJSON(`${API_URL}/classes`);

        allClasses = Array.isArray(data)
            ? data
            : data.classes || [];

        displayClasses(allClasses);
        updateDashboardCounts();

    } catch (error) {
        console.error("Error loading classes:", error);

        allClasses = [];
        displayClasses([]);
        updateDashboardCounts();
    }
}

function displayClasses(classes) {
    const table = getElement("classesTable");

    if (!table) return;

    if (classes.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No classes found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = classes.map(classItem => `
        <tr>
            <td>${escapeHTML(classItem.id)}</td>

            <td>
                ${escapeHTML(
                    classItem.name ||
                    classItem.className ||
                    ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    classItem.teacher ||
                    classItem.classTeacher ||
                    ""
                )}
            </td>

            <td>
                ${escapeHTML(
                    classItem.room ||
                    classItem.classRoom ||
                    ""
                )}
            </td>

            <td>
                <button onclick="viewClass(${classItem.id})">
                    View
                </button>

                <button onclick="editClass(${classItem.id})">
                    Edit
                </button>

                <button onclick="deleteClass(${classItem.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function searchClasses() {
    const input = getElement("classSearch");

    if (!input) return;

    const search = input.value.toLowerCase().trim();

    const filtered = allClasses.filter(classItem =>
        String(
            classItem.name ||
            classItem.className ||
            ""
        )
        .toLowerCase()
        .includes(search)
    );

    displayClasses(filtered);
}

async function saveClass(event) {
    event.preventDefault();

    const name = getElement("className")?.value.trim();
    const teacher = getElement("classTeacher")?.value.trim();
    const room = getElement("classRoom")?.value.trim();

    if (!name || !teacher || !room) {
        showMessage("Please fill all class fields.");
        return;
    }

    try {
        const classData = {
            name,
            teacher,
            room
        };

        if (editingClassId) {
            await getJSON(
                `${API_URL}/classes/${editingClassId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(classData)
                }
            );

            showMessage("Class updated successfully.");

        } else {
            await getJSON(
                `${API_URL}/classes`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(classData)
                }
            );

            showMessage("Class added successfully.");
        }

        editingClassId = null;

        closeModal("classModal");

        getElement("classForm")?.reset();

        await loadClasses();

    } catch (error) {
        console.error("Error saving class:", error);

        showMessage("Could not save class.");
    }
}

function editClass(id) {
    const classItem = allClasses.find(
        item => Number(item.id) === Number(id)
    );

    if (!classItem) return;

    editingClassId = classItem.id;

    const nameInput = getElement("className");
    const teacherInput = getElement("classTeacher");
    const roomInput = getElement("classRoom");

    if (nameInput) {
        nameInput.value =
            classItem.name ||
            classItem.className ||
            "";
    }

    if (teacherInput) {
        teacherInput.value =
            classItem.teacher ||
            classItem.classTeacher ||
            "";
    }

    if (roomInput) {
        roomInput.value =
            classItem.room ||
            classItem.classRoom ||
            "";
    }

    openModal("classModal");
}

async function deleteClass(id) {
    if (!confirm("Delete this class?")) {
        return;
    }

    try {
        await getJSON(
            `${API_URL}/classes/${id}`,
            {
                method: "DELETE"
            }
        );

        await loadClasses();

        showMessage("Class deleted successfully.");

    } catch (error) {
        console.error("Error deleting class:", error);

        showMessage("Could not delete class.");
    }
}

// ======================================================
// STUDENT DETAILS
// ======================================================

function viewStudent(id) {
    const student = allStudents.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) return;

    alert(
        `Student Details\n\n` +
        `ID: ${student.id}\n` +
        `Name: ${student.name}\n` +
        `Age: ${student.age}\n` +
        `Class: ${student.className}`
    );
}

// ======================================================
// TEACHER DETAILS
// ======================================================

function viewTeacher(id) {
    const teacher = allTeachers.find(
        item => Number(item.id) === Number(id)
    );

    if (!teacher) return;

    alert(
        `Teacher Details\n\n` +
        `ID: ${teacher.id}\n` +
        `Name: ${teacher.name}\n` +
        `Age: ${teacher.age}\n` +
        `Subject: ${teacher.subject}\n` +
        `Email: ${teacher.email}`
    );
}

// ======================================================
// CLASS DETAILS
// ======================================================

function viewClass(id) {
    const classItem = allClasses.find(
        item => Number(item.id) === Number(id)
    );

    if (!classItem) return;

    alert(
        `Class Details\n\n` +
        `ID: ${classItem.id}\n` +
        `Class: ${
            classItem.name ||
            classItem.className ||
            ""
        }\n` +
        `Teacher: ${
            classItem.teacher ||
            classItem.classTeacher ||
            ""
        }\n` +
        `Room: ${
            classItem.room ||
            classItem.classRoom ||
            ""
        }`
    );
}

// ======================================================
// MODALS
// ======================================================

function openModal(id) {
    const modal = getElement(id);

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeModal(id) {
    const modal = getElement(id);

    if (modal) {
        modal.style.display = "none";
    }

    if (id === "studentModal") {
        editingStudentId = null;
        getElement("studentForm")?.reset();
    }

    if (id === "teacherModal") {
        editingTeacherId = null;
        getElement("teacherForm")?.reset();
    }

    if (id === "classModal") {
        editingClassId = null;
        getElement("classForm")?.reset();
    }
}

// ======================================================
// TABS / SECTIONS
// ======================================================

function showSection(sectionName) {
    document.querySelectorAll(".section").forEach(section => {
        section.style.display = "none";
    });

    const section = getElement(sectionName);

    if (section) {
        section.style.display = "block";
    }

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });
}

// ======================================================
// FORMS
// ======================================================

function setupStudentForm() {
    const form = getElement("studentForm");

    if (!form) return;

    form.addEventListener("submit", saveStudent);
}

function setupTeacherForm() {
    const form = getElement("teacherForm");

    if (!form) return;

    form.addEventListener("submit", saveTeacher);
}

function setupClassForm() {
    const form = getElement("classForm");

    if (!form) return;

    form.addEventListener("submit", saveClass);
}

// ======================================================
// START APPLICATION
// ======================================================

async function setupApplication() {
    console.log("Starting School Management System...");

    setupStudentForm();
    setupTeacherForm();
    setupClassForm();

    await Promise.all([
        loadStudents(),
        loadTeachers(),
        loadClasses()
    ]);

    updateDashboardCounts();

    console.log(
        "School Management System started successfully."
    );
}

// ======================================================
// START WHEN PAGE LOADS
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    setupApplication
);

// ======================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ======================================================

window.loadStudents = loadStudents;
window.loadTeachers = loadTeachers;
window.loadClasses = loadClasses;

window.saveStudent = saveStudent;
window.saveTeacher = saveTeacher;
window.saveClass = saveClass;

window.editStudent = editStudent;
window.editTeacher = editTeacher;
window.editClass = editClass;

window.deleteStudent = deleteStudent;
window.deleteTeacher = deleteTeacher;
window.deleteClass = deleteClass;

window.viewStudent = viewStudent;
window.viewTeacher = viewTeacher;
window.viewClass = viewClass;

window.searchStudents = searchStudents;
window.searchTeachers = searchTeachers;
window.searchClasses = searchClasses;

window.openModal = openModal;
window.closeModal = closeModal;

window.showSection = showSection;