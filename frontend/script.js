const API_URL = "/api";

const TOKEN_KEY = "schoolconnect_token";
const SCHOOL_KEY = "schoolconnect_school";

let students = [];
let teachers = [];
let classes = [];

let editingStudentId = null;
let editingTeacherId = null;
let editingClassId = null;

/* =========================================================
   AUTHENTICATION
========================================================= */

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}


function updateSchoolNameDisplay() {
    const school = getSchool();
    const display = document.getElementById("schoolNameDisplay");

    if (display) {
        display.textContent = school && school.name
            ? "🏫 " + school.name
            : "🏫 SchoolConnect";
    }
}

function getSchool() {
    try {
        return JSON.parse(
            localStorage.getItem(SCHOOL_KEY) || "null"
        );
    } catch {
        return null;
    }
}

function isLoggedIn() {
    return Boolean(getToken());
}

function getAuthHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token
            ? {
                Authorization: "Bearer " + token
            }
            : {})
    };
}

function saveLogin(data) {
    localStorage.setItem(
        TOKEN_KEY,
        data.token
    );

    localStorage.setItem(
        SCHOOL_KEY,
        JSON.stringify(data.school)
    );
}

function logoutSchool() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SCHOOL_KEY);

    window.location.reload();
}

/* =========================================================
   API HELPER
========================================================= */

async function getJSON(url, options = {}) {
    const response = await fetch(url, {
        ...options,

        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SCHOOL_KEY);

        alert("Your school login is required.");

        window.location.reload();

        throw new Error(
            "Authentication required"
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            `Server returned HTTP ${response.status}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `Request failed: ${response.status}`
        );
    }

    return data;
}

/* =========================================================
   LOGIN
========================================================= */

async function loginSchool(event) {
    if (event) {
        event.preventDefault();
    }

    const codeInput =
        document.getElementById(
            "schoolCode"
        );

    const passwordInput =
        document.getElementById(
            "schoolPassword"
        );

    if (!codeInput || !passwordInput) {
        alert(
            "Login form fields were not found."
        );

        return false;
    }

    const code =
        codeInput.value.trim();

    const password =
        passwordInput.value;

    if (!code || !password) {
        alert(
            "Please enter your school code and password."
        );

        return false;
    }

    const loginButton =
        document.querySelector(
            "#schoolLoginForm button[type='submit']"
        );

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent =
            "Logging in...";
    }

    try {
        const response = await fetch(
            `${API_URL}/schools/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    code,
                    password
                })
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Login failed"
            );
        }

        saveLogin(result);

        alert(
            `Welcome to ${result.school.name}!`
        );

        window.location.reload();

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to login."
        );

        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent =
                "🔐 Login";
        }
    }

    return false;
}

/* =========================================================
   REGISTER SCHOOL
========================================================= */

async function registerSchool(event) {
    if (event) {
        event.preventDefault();
    }

    const nameInput =
        document.getElementById("registerSchoolName");

    const passwordInput =
        document.getElementById("registerSchoolPassword");

    if (!nameInput || !passwordInput) {
        alert("Registration form fields were not found.");
        return false;
    }

    const name =
        nameInput.value.trim();

    const password =
        passwordInput.value;

    if (!name || !password) {
        alert("Please enter your school name and password.");
        return false;
    }

    const registerButton =
        document.querySelector(
            "#schoolRegisterForm button[type='submit']"
        );

    if (registerButton) {
        registerButton.disabled = true;
        registerButton.textContent = "Registering...";
    }

    try {

        const response = await fetch(
            `${API_URL}/schools/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    password
                })
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Registration failed"
            );
        }

        saveLogin(result);

        alert(
            `School registered successfully!\n\nSchool Name: ${result.school.name}\nSchool Code: ${result.school.code}\n\nPlease save your School Code.`
        );

        window.location.reload();

    } catch (error) {

        console.error(
            "REGISTRATION ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to register school."
        );

        if (registerButton) {
            registerButton.disabled = false;
            registerButton.textContent =
                "🏫 Register School";
        }
    }

    return false;
}

/* =========================================================
   SCHOOL NAME
========================================================= */

function displaySchoolName() {
    const school = getSchool();

    document
        .querySelectorAll(
            "[data-school-name]"
        )
        .forEach(element => {
            element.textContent =
                school?.name ||
                "SchoolConnect";
        });
}

/* =========================================================
   STUDENTS
========================================================= */

async function loadStudents() {
    try {
        const data =
            await getJSON(
                `${API_URL}/students`
            );

        students =
            Array.isArray(data)
                ? data
                : data.students || [];

        renderStudents();
        updateStudentCount();

    } catch (error) {
        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );

        const table =
            document.getElementById(
                "studentsTable"
            );

        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load students.
                    </td>
                </tr>
            `;
        }
    }
}

function renderStudents(list = students) {
    const table =
        document.getElementById(
            "studentsTable"
        );

    if (!table) {
        console.error(
            "studentsTable not found."
        );

        return;
    }

    if (!list || list.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No students found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = list
        .map(student => `
            <tr>
                <td>
                    ${escapeHTML(student.id)}
                </td>

                <td>
                    ${escapeHTML(student.name)}
                </td>

                <td>
                    ${escapeHTML(student.age)}
                </td>

                <td>
                    ${escapeHTML(student.className)}
                </td>

                <td>
                    <button
                        class="edit-btn"
                        onclick="editStudent(${Number(student.id)})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteStudent(${Number(student.id)})"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `)
        .join("");
}

function updateStudentCount() {
    const element =
        document.getElementById(
            "studentCount"
        );

    if (element) {
        element.textContent =
            students.length;
    }
}

/* =========================================================
   ADD STUDENT
========================================================= */

async function addStudent(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const nameInput =
        document.getElementById(
            "studentName"
        );

    const ageInput =
        document.getElementById(
            "studentAge"
        );

    const classInput =
        document.getElementById(
            "studentClass"
        );

    if (
        !nameInput ||
        !ageInput ||
        !classInput
    ) {
        alert(
            "Student form fields were not found."
        );

        return false;
    }

    const name =
        nameInput.value.trim();

    const age =
        ageInput.value;

    const className =
        classInput.value.trim();

    if (!name || !age || !className) {
        alert(
            "Please complete all student fields."
        );

        return false;
    }

    try {
        const isEditing =
            editingStudentId !== null;

        const url =
            isEditing
                ? `${API_URL}/students/${editingStudentId}`
                : `${API_URL}/students`;

        const method =
            isEditing
                ? "PUT"
                : "POST";

        const result =
            await getJSON(
                url,
                {
                    method,

                    body: JSON.stringify({
                        name,
                        age: Number(age),
                        className
                    })
                }
            );

        console.log(
            "STUDENT SAVED:",
            result
        );

        alert(
            isEditing
                ? "Student updated successfully!"
                : "Student added successfully!"
        );

        editingStudentId = null;

        const form =
            document.getElementById(
                "studentForm"
            );

        if (form) {
            form.reset();
        }

        const title =
            document.getElementById(
                "studentModalTitle"
            );

        if (title) {
            title.textContent =
                "Add Student";
        }

        closeModal(
            "studentModal"
        );

        await loadStudents();

    } catch (error) {
        console.error(
            "ADD STUDENT ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to save student."
        );
    }

    return false;
}

/* =========================================================
   STUDENT FORM
========================================================= */

function setupStudentForm() {
    const form =
        document.getElementById(
            "studentForm"
        );

    if (!form) {
        console.error(
            "studentForm not found."
        );

        return;
    }

    form.onsubmit = addStudent;

    console.log(
        "Student form connected successfully."
    );
}

/* =========================================================
   SEARCH STUDENTS
========================================================= */

function searchStudents() {
    const input =
        document.getElementById(
            "studentSearch"
        );

    if (!input) return;

    const search =
        input.value
            .trim()
            .toLowerCase();

    if (!search) {
        renderStudents(students);
        return;
    }

    const filtered =
        students.filter(student => {
            return (
                String(student.name)
                    .toLowerCase()
                    .includes(search) ||

                String(student.className)
                    .toLowerCase()
                    .includes(search)
            );
        });

    renderStudents(filtered);
}

/* =========================================================
   EDIT STUDENT
========================================================= */

function editStudent(id) {
    const student =
        students.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!student) {
        alert(
            "Student not found."
        );

        return;
    }

    editingStudentId =
        Number(student.id);

    document.getElementById(
        "studentName"
    ).value =
        student.name || "";

    document.getElementById(
        "studentAge"
    ).value =
        student.age || "";

    document.getElementById(
        "studentClass"
    ).value =
        student.className || "";

    const title =
        document.getElementById(
            "studentModalTitle"
        );

    if (title) {
        title.textContent =
            "Edit Student";
    }

    openModal(
        "studentModal"
    );
}

/* =========================================================
   DELETE STUDENT
========================================================= */

async function deleteStudent(id) {
    if (!confirm(
        "Delete this student?"
    )) {
        return;
    }

    try {
        await getJSON(
            `${API_URL}/students/${id}`,
            {
                method: "DELETE"
            }
        );

        alert(
            "Student deleted successfully!"
        );

        await loadStudents();

    } catch (error) {
        console.error(
            "DELETE STUDENT ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to delete student."
        );
    }
}

/* =========================================================
   TEACHERS
========================================================= */

async function loadTeachers() {
    try {
        const data =
            await getJSON(
                `${API_URL}/teachers`
            );

        teachers =
            Array.isArray(data)
                ? data
                : data.teachers || [];

        renderTeachers();
        updateTeacherCount();

    } catch (error) {
        console.error(
            "LOAD TEACHERS ERROR:",
            error
        );
    }
}

function renderTeachers(list = teachers) {
    const table =
        document.getElementById(
            "teachersTable"
        );

    if (!table) return;

    if (!list.length) {
        table.innerHTML = `
            <tr>
                <td colspan="6">
                    No teachers found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = list
        .map(teacher => `
            <tr>
                <td>
                    ${escapeHTML(teacher.id)}
                </td>

                <td>
                    ${escapeHTML(teacher.name)}
                </td>

                <td>
                    ${escapeHTML(teacher.age)}
                </td>

                <td>
                    ${escapeHTML(teacher.subject)}
                </td>

                <td>
                    ${escapeHTML(teacher.email)}
                </td>

                <td>
                    <button
                        class="edit-btn"
                        onclick="editTeacher(${Number(teacher.id)})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTeacher(${Number(teacher.id)})"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `)
        .join("");
}

function updateTeacherCount() {
    const element =
        document.getElementById(
            "teacherCount"
        );

    if (element) {
        element.textContent =
            teachers.length;
    }
}

function searchTeachers() {
    const input =
        document.getElementById(
            "teacherSearch"
        );

    if (!input) return;

    const search =
        input.value
            .trim()
            .toLowerCase();

    const filtered =
        teachers.filter(teacher =>
            String(teacher.name)
                .toLowerCase()
                .includes(search) ||

            String(teacher.subject)
                .toLowerCase()
                .includes(search)
        );

    renderTeachers(
        search ? filtered : teachers
    );
}

function editTeacher(id) {
    const teacher =
        teachers.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!teacher) {
        alert(
            "Teacher not found."
        );

        return;
    }

    editingTeacherId =
        Number(teacher.id);

    document.getElementById(
        "teacherName"
    ).value =
        teacher.name || "";

    document.getElementById(
        "teacherAge"
    ).value =
        teacher.age || "";

    document.getElementById(
        "teacherSubject"
    ).value =
        teacher.subject || "";

    document.getElementById(
        "teacherEmail"
    ).value =
        teacher.email || "";

    const title =
        document.getElementById(
            "teacherModalTitle"
        );

    if (title) {
        title.textContent =
            "Edit Teacher";
    }

    openModal(
        "teacherModal"
    );
}

async function saveTeacher(event) {
    event.preventDefault();

    const name =
        document.getElementById(
            "teacherName"
        ).value.trim();

    const age =
        document.getElementById(
            "teacherAge"
        ).value;

    const subject =
        document.getElementById(
            "teacherSubject"
        ).value.trim();

    const email =
        document.getElementById(
            "teacherEmail"
        ).value.trim();

    if (!name || !age || !subject || !email) {
        alert(
            "Please complete all teacher fields."
        );

        return false;
    }

    try {
        const isEditing =
            editingTeacherId !== null;

        const url =
            isEditing
                ? `${API_URL}/teachers/${editingTeacherId}`
                : `${API_URL}/teachers`;

        await getJSON(
            url,
            {
                method:
                    isEditing
                        ? "PUT"
                        : "POST",

                body: JSON.stringify({
                    name,
                    age: Number(age),
                    subject,
                    email
                })
            }
        );

        alert(
            isEditing
                ? "Teacher updated successfully!"
                : "Teacher added successfully!"
        );

        editingTeacherId = null;

        document
            .getElementById(
                "teacherForm"
            )
            .reset();

        const title =
            document.getElementById(
                "teacherModalTitle"
            );

        if (title) {
            title.textContent =
                "Add Teacher";
        }

        closeModal(
            "teacherModal"
        );

        await loadTeachers();

    } catch (error) {
        console.error(
            "SAVE TEACHER ERROR:",
            error
        );

        alert(error.message);
    }

    return false;
}

async function deleteTeacher(id) {
    if (!confirm(
        "Delete this teacher?"
    )) {
        return;
    }

    try {
        await getJSON(
            `${API_URL}/teachers/${id}`,
            {
                method: "DELETE"
            }
        );

        alert(
            "Teacher deleted successfully!"
        );

        await loadTeachers();

    } catch (error) {
        console.error(
            "DELETE TEACHER ERROR:",
            error
        );

        alert(error.message);
    }
}

/* =========================================================
   CLASSES
========================================================= */

async function loadClasses() {
    try {
        const data =
            await getJSON(
                `${API_URL}/classes`
            );

        classes =
            Array.isArray(data)
                ? data
                : data.classes || [];

        renderClasses();
        updateClassCount();

    } catch (error) {
        console.error(
            "LOAD CLASSES ERROR:",
            error
        );
    }
}

function renderClasses(list = classes) {
    const table =
        document.getElementById(
            "classesTable"
        );

    if (!table) return;

    if (!list.length) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No classes found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = list
        .map(classItem => `
            <tr>
                <td>
                    ${escapeHTML(classItem.id)}
                </td>

                <td>
                    ${escapeHTML(classItem.name)}
                </td>

                <td>
                    ${escapeHTML(classItem.teacher)}
                </td>

                <td>
                    ${escapeHTML(classItem.room)}
                </td>

                <td>
                    <button
                        class="edit-btn"
                        onclick="editClass(${Number(classItem.id)})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteClass(${Number(classItem.id)})"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `)
        .join("");
}

function updateClassCount() {
    const element =
        document.getElementById(
            "classCount"
        );

    if (element) {
        element.textContent =
            classes.length;
    }
}

function searchClasses() {
    const input =
        document.getElementById(
            "classSearch"
        );

    if (!input) return;

    const search =
        input.value
            .trim()
            .toLowerCase();

    const filtered =
        classes.filter(classItem =>
            String(classItem.name)
                .toLowerCase()
                .includes(search) ||

            String(classItem.teacher)
                .toLowerCase()
                .includes(search) ||

            String(classItem.room)
                .toLowerCase()
                .includes(search)
        );

    renderClasses(
        search ? filtered : classes
    );
}

function editClass(id) {
    const classItem =
        classes.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!classItem) {
        alert(
            "Class not found."
        );

        return;
    }

    editingClassId =
        Number(classItem.id);

    document.getElementById(
        "className"
    ).value =
        classItem.name || "";

    document.getElementById(
        "classTeacher"
    ).value =
        classItem.teacher || "";

    document.getElementById(
        "classRoom"
    ).value =
        classItem.room || "";

    const title =
        document.getElementById(
            "classModalTitle"
        );

    if (title) {
        title.textContent =
            "Edit Class";
    }

    openModal(
        "classModal"
    );
}

async function saveClass(event) {
    event.preventDefault();

    const name =
        document.getElementById(
            "className"
        ).value.trim();

    const teacher =
        document.getElementById(
            "classTeacher"
        ).value.trim();

    const room =
        document.getElementById(
            "classRoom"
        ).value.trim();

    if (!name || !teacher || !room) {
        alert(
            "Please complete all class fields."
        );

        return false;
    }

    try {
        const isEditing =
            editingClassId !== null;

        const url =
            isEditing
                ? `${API_URL}/classes/${editingClassId}`
                : `${API_URL}/classes`;

        await getJSON(
            url,
            {
                method:
                    isEditing
                        ? "PUT"
                        : "POST",

                body: JSON.stringify({
                    name,
                    teacher,
                    room
                })
            }
        );

        alert(
            isEditing
                ? "Class updated successfully!"
                : "Class added successfully!"
        );

        editingClassId = null;

        document
            .getElementById(
                "classForm"
            )
            .reset();

        const title =
            document.getElementById(
                "classModalTitle"
            );

        if (title) {
            title.textContent =
                "Add Class";
        }

        closeModal(
            "classModal"
        );

        await loadClasses();

    } catch (error) {
        console.error(
            "SAVE CLASS ERROR:",
            error
        );

        alert(error.message);
    }

    return false;
}

async function deleteClass(id) {
    if (!confirm(
        "Delete this class?"
    )) {
        return;
    }

    try {
        await getJSON(
            `${API_URL}/classes/${id}`,
            {
                method: "DELETE"
            }
        );

        alert(
            "Class deleted successfully!"
        );

        await loadClasses();

    } catch (error) {
        console.error(
            "DELETE CLASS ERROR:",
            error
        );

        alert(error.message);
    }
}

/* =========================================================
   MODALS
========================================================= */

function openModal(modalId) {
    const modal =
        document.getElementById(
            modalId
        );

    if (!modal) {
        console.error(
            "Modal not found:",
            modalId
        );

        return;
    }

    modal.style.display = "flex";
    modal.classList.add("active");
}

function closeModal(modalId) {
    const modal =
        document.getElementById(
            modalId
        );

    if (!modal) return;

    modal.style.display = "none";
    modal.classList.remove("active");
}

/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionName, button) {
    document
        .querySelectorAll(".section")
        .forEach(section => {
            section.classList.remove(
                "active"
            );

            section.style.display =
                "none";
        });

    const section =
        document.getElementById(
            sectionName
        );

    if (section) {
        section.classList.add(
            "active"
        );

        section.style.display =
            "block";
    }

    document
        .querySelectorAll(
            ".tab-button, .nav-btn"
        )
        .forEach(btn => {
            btn.classList.remove(
                "active"
            );
        });

    if (button) {
        button.classList.add(
            "active"
        );
    }

    if (
        sectionName === "students"
    ) {
        loadStudents();
    }

    if (
        sectionName === "teachers"
    ) {
        loadTeachers();
    }

    if (
        sectionName === "classes"
    ) {
        loadClasses();
    }
}

/* =========================================================
   FORM SETUP
========================================================= */

function setupLoginForm() {
    const form =
        document.getElementById(
            "schoolLoginForm"
        );

    if (!form) return;

    form.onsubmit =
        loginSchool;
}

function setupRegisterForm() {
    const form =
        document.getElementById(
            "schoolRegisterForm"
        );

    if (!form) return;

    form.onsubmit =
        registerSchool;
}

function setupStudentForm() {
    const form =
        document.getElementById(
            "studentForm"
        );

    if (!form) return;

    form.onsubmit =
        addStudent;

    console.log(
        "Student form connected successfully."
    );
}

function setupTeacherForm() {
    const form =
        document.getElementById(
            "teacherForm"
        );

    if (!form) return;

    form.onsubmit =
        saveTeacher;
}

function setupClassForm() {
    const form =
        document.getElementById(
            "classForm"
        );

    if (!form) return;

    form.onsubmit =
        saveClass;
}

function setupLogoutButton() {
    document
        .querySelectorAll(
            "[data-logout]"
        )
        .forEach(button => {
            button.onclick =
                logoutSchool;
        });
}

function setupOutsideModalClick() {
    document.addEventListener(
        "click",
        function(event) {
            if (
                event.target.classList.contains(
                    "modal"
                )
            ) {
                closeModal(
                    event.target.id
                );
            }
        }
    );
}

/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

/* =========================================================
   APPLICATION SETUP
========================================================= */

async function setupApplication() {
    if (!isLoggedIn()) {
        return;
    }

    displaySchoolName();

    setupStudentForm();
    setupTeacherForm();
    setupClassForm();

    await Promise.all([
        loadStudents(),
        loadTeachers(),
        loadClasses()
    ]);

    console.log(
        "SchoolConnect application loaded."
    );
}

/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "SchoolConnect JavaScript loaded."
        );

        console.log(
            "loginSchool:",
            typeof loginSchool
        );

        console.log(
            "addStudent:",
            typeof addStudent
        );

        setupLoginForm();
        setupRegisterForm();
        setupLogoutButton();
        setupOutsideModalClick();

        await setupApplication();
    }
);

/* =========================================================
   GLOBAL FUNCTIONS FOR HTML
========================================================= */

window.loginSchool =
    loginSchool;

window.registerSchool =
    registerSchool;

window.logoutSchool =
    logoutSchool;

window.loadStudents =
    loadStudents;

window.loadTeachers =
    loadTeachers;

window.loadClasses =
    loadClasses;

window.addStudent =
    addStudent;

window.deleteStudent =
    deleteStudent;

window.editStudent =
    editStudent;

window.searchStudents =
    searchStudents;

window.deleteTeacher =
    deleteTeacher;

window.editTeacher =
    editTeacher;

window.searchTeachers =
    searchTeachers;

window.deleteClass =
    deleteClass;

window.editClass =
    editClass;

window.searchClasses =
    searchClasses;

window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.showSection =
    showSection;

console.log(
    "GLOBAL FUNCTIONS LOADED"
);

console.log(
    "showSection:",
    typeof window.showSection
);

console.log(
    "openModal:",
    typeof window.openModal
);

console.log(
    "addStudent:",
    typeof window.addStudent
);


/* =========================================================
   STUDENT PROFILE + PHOTO UPLOAD
========================================================= */

function getStudentPhoto(studentId) {
    return localStorage.getItem(
        "student_photo_" + Number(studentId)
    );
}

function getStudentAvatar(name, studentId) {
    const photo = getStudentPhoto(studentId);

    if (photo) {
        return `
            <img
                class="student-avatar student-photo"
                src="${photo}"
                alt="${escapeHTML(name)}"
            >
        `;
    }

    const firstLetter =
        String(name || "Student")
            .trim()
            .charAt(0)
            .toUpperCase() || "S";

    return `
        <div
            class="student-avatar"
            title="${escapeHTML(name)}"
        >
            ${escapeHTML(firstLetter)}
        </div>
    `;
}

function renderStudents(list = students) {
    const table =
        document.getElementById("studentsTable");

    if (!table) {
        console.error("studentsTable not found.");
        return;
    }

    if (!list || list.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No students found.
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = list.map(student => `
        <tr>
            <td>
                ${escapeHTML(student.id)}
            </td>

            <td>
                <div class="student-name-cell">

                    ${getStudentAvatar(
                        student.name,
                        student.id
                    )}

                    <div>
                        <strong>
                            ${escapeHTML(student.name)}
                        </strong>

                        <small>
                            Student
                        </small>
                    </div>

                </div>
            </td>

            <td>
                ${escapeHTML(student.age)}
            </td>

            <td>
                ${escapeHTML(student.className)}
            </td>

            <td>

                <button
                    class="view-btn"
                    onclick="viewStudent(${Number(student.id)})"
                >
                    👁 View
                </button>

                <button
                    class="edit-btn"
                    onclick="editStudent(${Number(student.id)})"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteStudent(${Number(student.id)})"
                >
                    Delete
                </button>

            </td>
        </tr>
    `).join("");
}

function viewStudent(id) {
    const student =
        students.find(
            item =>
                Number(item.id) === Number(id)
        );

    if (!student) {
        alert("Student not found.");
        return;
    }

    const modal =
        document.getElementById(
            "studentProfileModal"
        );

    if (!modal) {
        console.error(
            "studentProfileModal not found."
        );
        return;
    }

    const photo =
        getStudentPhoto(student.id);

    const avatar =
        document.getElementById(
            "profileStudentAvatar"
        );

    const name =
        document.getElementById(
            "profileStudentName"
        );

    const age =
        document.getElementById(
            "profileStudentAge"
        );

    const className =
        document.getElementById(
            "profileStudentClass"
        );

    if (avatar) {

        if (photo) {

            avatar.innerHTML = `
                <img
                    src="${photo}"
                    alt="${escapeHTML(student.name)}"
                >
            `;

        } else {

            avatar.textContent =
                String(student.name || "Student")
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "S";
        }
    }

    if (name) {
        name.textContent =
            student.name || "Unknown Student";
    }

    if (age) {
        age.textContent =
            student.age || "-";
    }

    if (className) {
        className.textContent =
            student.className || "-";
    }

    const photoInput =
        document.getElementById(
            "studentPhotoUpload"
        );

    if (photoInput) {
        photoInput.value = "";
        photoInput.dataset.studentId =
            student.id;
    }

    const uploadButton =
        document.getElementById(
            "uploadStudentPhotoButton"
        );

    if (uploadButton) {
        uploadButton.dataset.studentId =
            student.id;
    }

    openModal("studentProfileModal");
}

function uploadStudentPhoto() {

    const input =
        document.getElementById(
            "studentPhotoUpload"
        );

    if (!input || !input.files.length) {
        alert(
            "Please choose a student photo first."
        );
        return;
    }

    const studentId =
        input.dataset.studentId;

    if (!studentId) {
        alert(
            "Student was not selected."
        );
        return;
    }

    const file = input.files[0];

    if (!file.type.startsWith("image/")) {
        alert(
            "Please select an image file."
        );
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert(
            "Please choose a photo smaller than 5MB."
        );
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {

        localStorage.setItem(
            "student_photo_" + Number(studentId),
            event.target.result
        );

        alert(
            "Student photo uploaded successfully!"
        );

        const student =
            students.find(
                item =>
                    Number(item.id) ===
                    Number(studentId)
            );

        if (student) {

            const avatar =
                document.getElementById(
                    "profileStudentAvatar"
                );

            if (avatar) {
                avatar.innerHTML = `
                    <img
                        src="${event.target.result}"
                        alt="${escapeHTML(student.name)}"
                    >
                `;
            }
        }

        renderStudents();
    };

    reader.onerror = function() {
        alert(
            "Unable to read the selected photo."
        );
    };

    reader.readAsDataURL(file);
}

function removeStudentPhoto(id) {

    localStorage.removeItem(
        "student_photo_" + Number(id)
    );

    const student =
        students.find(
            item =>
                Number(item.id) === Number(id)
        );

    if (student) {

        const avatar =
            document.getElementById(
                "profileStudentAvatar"
            );

        if (avatar) {

            const firstLetter =
                String(student.name || "Student")
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "S";

            avatar.innerHTML = "";
            avatar.textContent =
                firstLetter;
        }
    }

    renderStudents();

    alert(
        "Student photo removed."
    );
}

window.viewStudent = viewStudent;
window.uploadStudentPhoto = uploadStudentPhoto;
window.removeStudentPhoto = removeStudentPhoto;

console.log(
    "Student photo upload system loaded."
);


/* ============================================================
   SHARED STUDENT PHOTOS
   Photos are stored on the SchoolConnect server so every
   phone, tablet and computer sees the same student photo.
   ============================================================ */

async function uploadStudentPhoto() {
    const input = document.getElementById("studentPhotoUpload");

    if (!input || !input.files || !input.files[0]) {
        return;
    }

    if (!window.currentProfileStudent) {
        alert("Please open a student profile first.");
        input.value = "";
        return;
    }

    const file = input.files[0];

    if (!file.type.startsWith("image/")) {
        alert("Please choose an image.");
        input.value = "";
        return;
    }

    try {
        const photo = await compressStudentPhoto(file);

        const response = await fetch(
            `${API_URL}/students/${window.currentProfileStudent.id}/photo`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`
                },
                body: JSON.stringify({
                    photo: photo
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to upload photo");
        }

        // Update the local student object with the server photo.
        const index = students.findIndex(
            student => Number(student.id) === Number(window.currentProfileStudent.id)
        );

        if (index !== -1) {
            students[index].photo = data.student.photo;
            window.currentProfileStudent = students[index];
        }

        renderStudents();
        viewStudent(window.currentProfileStudent.id);

        alert("Student photo uploaded successfully.");

    } catch (error) {
        console.error("PHOTO UPLOAD ERROR:", error);
        alert(error.message || "Failed to upload student photo.");
    }

    input.value = "";
}


/* Compress phone photos before sending them to the server. */
function compressStudentPhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            const image = new Image();

            image.onload = function() {
                const maxSize = 800;

                let width = image.width;
                let height = image.height;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round(height * maxSize / width);
                        width = maxSize;
                    } else {
                        width = Math.round(width * maxSize / height);
                        height = maxSize;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL("image/jpeg", 0.78)
                );
            };

            image.onerror = function() {
                reject(new Error("Could not read the selected photo."));
            };

            image.src = event.target.result;
        };

        reader.onerror = function() {
            reject(new Error("Could not read the selected photo."));
        };

        reader.readAsDataURL(file);
    });
}


/* Remove photo from the shared server database. */
async function removeStudentPhoto() {
    if (!window.currentProfileStudent) {
        return;
    }

    const studentId = window.currentProfileStudent.id;

    try {
        const response = await fetch(
            `${API_URL}/students/${studentId}/photo`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to remove photo");
        }

        const index = students.findIndex(
            student => Number(student.id) === Number(studentId)
        );

        if (index !== -1) {
            students[index].photo = null;
            window.currentProfileStudent = students[index];
        }

        renderStudents();
        viewStudent(studentId);

    } catch (error) {
        console.error("REMOVE PHOTO ERROR:", error);
        alert(error.message || "Failed to remove student photo.");
    }
}


/* ============================================================
   SERVER-BASED STUDENT PROFILE
   ============================================================ */

function viewStudent(id) {
    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) {
        alert("Student not found.");
        return;
    }

    window.currentProfileStudent = student;

    const nameElement = document.getElementById("studentProfileName");
    const ageElement = document.getElementById("studentProfileAge");
    const classElement = document.getElementById("studentProfileClass");
    const avatarElement = document.getElementById("studentProfileAvatar");

    if (nameElement) {
        nameElement.textContent = student.name;
    }

    if (ageElement) {
        ageElement.textContent = student.age;
    }

    if (classElement) {
        classElement.textContent = student.className;
    }

    if (avatarElement) {
        if (student.photo) {
            avatarElement.innerHTML = "";
            avatarElement.style.backgroundImage = `url("${student.photo}")`;
            avatarElement.style.backgroundSize = "cover";
            avatarElement.style.backgroundPosition = "center";
            avatarElement.textContent = "";
        } else {
            avatarElement.style.backgroundImage = "none";
            avatarElement.textContent =
                String(student.name || "?").charAt(0).toUpperCase();
        }
    }

    const modal = document.getElementById("studentProfileModal");

    if (modal) {
        modal.style.display = "flex";
    }
}


/* ============================================================
   SERVER-BASED STUDENT TABLE
   ============================================================ */

function renderStudents(list = students) {
    const table = document.getElementById("studentsTable");

    if (!table) return;

    if (!list || list.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No students found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = list.map(student => {
        const initial = String(student.name || "?")
            .charAt(0)
            .toUpperCase();

        const avatar = student.photo
            ? `
                <img
                    src="${student.photo}"
                    alt="${escapeHTML(student.name)}"
                    style="
                        width:42px;
                        height:42px;
                        border-radius:50%;
                        object-fit:cover;
                        vertical-align:middle;
                        margin-right:8px;
                    "
                >
            `
            : `
                <span
                    style="
                        display:inline-flex;
                        width:42px;
                        height:42px;
                        border-radius:50%;
                        align-items:center;
                        justify-content:center;
                        background:#2563eb;
                        color:white;
                        font-weight:bold;
                        vertical-align:middle;
                        margin-right:8px;
                    "
                >${initial}</span>
            `;

        return `
            <tr>
                <td>${student.id}</td>

                <td>
                    ${avatar}
                    <strong>${escapeHTML(student.name)}</strong>
                </td>

                <td>${student.age}</td>

                <td>${escapeHTML(student.className)}</td>

                <td>
                    <button
                        class="primary-button"
                        onclick="viewStudent(${student.id})"
                    >
                        👁 View
                    </button>

                    <button
                        onclick="editStudent(${student.id})"
                    >
                        ✏️ Edit
                    </button>

                    <button
                        onclick="deleteStudent(${student.id})"
                    >
                        🗑 Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}


/* ============================================================
   WHEN PHOTO BUTTON IS CLICKED, OPEN PHONE PHOTO PICKER
   ============================================================ */

function chooseStudentPhoto() {
    const input = document.getElementById("studentPhotoUpload");

    if (input) {
        input.click();
    }
}


/* Make sure the file input sends the selected photo to server. */
document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("studentPhotoUpload");

    if (input) {
        input.addEventListener("change", function() {
            if (this.files && this.files.length > 0) {
                uploadStudentPhoto();
            }
        });
    }
});


document.addEventListener("DOMContentLoaded", () => {
    updateSchoolNameDisplay();
});
