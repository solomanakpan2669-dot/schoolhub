const API_URL = "/api";

const TOKEN_KEY = "schoolconnect_token";
const SCHOOL_KEY = "schoolconnect_school";

let students = [];
let teachers = [];
let classes = [];

/* =========================================================
   AUTHENTICATION
========================================================= */

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
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

function getAuthHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token
            ? { Authorization: "Bearer " + token }
            : {})
    };
}

function saveLogin(data) {
    localStorage.setItem(TOKEN_KEY, data.token);

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

function isLoggedIn() {
    return Boolean(getToken());
}

function showError(message) {
    alert(message);
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

        throw new Error("Authentication required");
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
        document.getElementById("schoolCode");

    const passwordInput =
        document.getElementById("schoolPassword");

    if (!codeInput || !passwordInput) {
        alert("Login form fields were not found.");
        return false;
    }

    const code = codeInput.value.trim();
    const password = passwordInput.value;

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
        loginButton.textContent = "Logging in...";
    }

    try {
        const data = await fetch(
            `${API_URL}/schools/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    code,
                    password
                })
            }
        );

        let result;

        try {
            result = await data.json();
        } catch {
            throw new Error(
                `Server returned HTTP ${data.status}`
            );
        }

        if (!data.ok) {
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
            "Unable to login. Please try again."
        );

        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = "🔐 Login";
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
        document.getElementById(
            "registerSchoolName"
        );

    const codeInput =
        document.getElementById(
            "registerSchoolCode"
        );

    const passwordInput =
        document.getElementById(
            "registerSchoolPassword"
        );

    if (
        !nameInput ||
        !codeInput ||
        !passwordInput
    ) {
        alert(
            "Registration form fields were not found."
        );

        return false;
    }

    const name = nameInput.value.trim();
    const code = codeInput.value.trim();
    const password = passwordInput.value;

    if (!name || !code || !password) {
        alert(
            "Please complete all registration fields."
        );

        return false;
    }

    try {
        const data = await fetch(
            `${API_URL}/schools/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    code,
                    password
                })
            }
        );

        const result = await data.json();

        if (!data.ok) {
            throw new Error(
                result.error ||
                "Registration failed"
            );
        }

        saveLogin(result);

        alert(
            `School ${result.school.name} registered successfully!`
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
    }

    return false;
}

/* =========================================================
   SCHOOL NAME
========================================================= */

function displaySchoolName() {
    const school = getSchool();

    const elements =
        document.querySelectorAll(
            "[data-school-name]"
        );

    elements.forEach(element => {
        element.textContent =
            school?.name || "SchoolConnect";
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
    }
}

function renderStudents() {
    const container =
        document.getElementById(
            "studentsList"
        );

    if (!container) return;

    if (!students.length) {
        container.innerHTML =
            "<p>No students found.</p>";

        return;
    }

    container.innerHTML = students
        .map(student => `
            <div class="data-card">
                <h3>${escapeHTML(student.name)}</h3>

                <p>
                    Age: ${escapeHTML(student.age)}
                </p>

                <p>
                    Class: ${escapeHTML(student.className)}
                </p>
            </div>
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

    console.log("ADD STUDENT FUNCTION STARTED");

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

    if (!nameInput || !ageInput || !classInput) {
        console.error(
            "Student form fields not found."
        );

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

    console.log(
        "ADDING STUDENT:",
        {
            name,
            age,
            className
        }
    );

    try {
        const result =
            await getJSON(
                `${API_URL}/students`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        name: name,
                        age: Number(age),
                        className: className
                    })
                }
            );

        console.log(
            "STUDENT ADDED:",
            result
        );

        alert(
            "Student added successfully!"
        );

        const form =
            document.getElementById(
                "studentForm"
            );

        if (form) {
            form.reset();
        }

        closeModal("studentModal");

        await loadStudents();

        return false;

    } catch (error) {
        console.error(
            "ADD STUDENT ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to add student."
        );

        return false;
    }
}

/* =========================================================
   CONNECT STUDENT FORM
========================================================= */

function setupStudentForm() {
    const form =
        document.getElementById(
            "studentForm"
        );

    if (!form) {
        console.error(
            "studentForm was not found."
        );

        return;
    }

    /*
       Remove any old handler by using onsubmit.
       This guarantees the browser does not perform
       the normal form submission.
    */

    form.onsubmit = function(event) {
        return addStudent(event);
    };

    console.log(
        "Student form connected successfully."
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

        await loadStudents();

    } catch (error) {
        alert(error.message);
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

function renderTeachers() {
    const container =
        document.getElementById(
            "teachersList"
        );

    if (!container) return;

    if (!teachers.length) {
        container.innerHTML =
            "<p>No teachers found.</p>";

        return;
    }

    container.innerHTML = teachers
        .map(teacher => `
            <div class="data-card">
                <h3>${escapeHTML(teacher.name)}</h3>

                <p>
                    Age: ${escapeHTML(teacher.age)}
                </p>

                <p>
                    Subject: ${escapeHTML(teacher.subject)}
                </p>

                <p>
                    Email: ${escapeHTML(teacher.email)}
                </p>
            </div>
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

function renderClasses() {
    const container =
        document.getElementById(
            "classesList"
        );

    if (!container) return;

    if (!classes.length) {
        container.innerHTML =
            "<p>No classes found.</p>";

        return;
    }

    container.innerHTML = classes
        .map(classItem => `
            <div class="data-card">
                <h3>
                    ${escapeHTML(classItem.name)}
                </h3>

                <p>
                    Teacher:
                    ${escapeHTML(classItem.teacher)}
                </p>

                <p>
                    Room:
                    ${escapeHTML(classItem.room)}
                </p>
            </div>
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

/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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

    if (!modal) {
        return;
    }

    modal.style.display = "none";
    modal.classList.remove("active");
}

/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionName, button) {
    document
        .querySelectorAll(".section")
        .forEach(function(section) {
            section.classList.remove("active");
            section.style.display = "none";
        });

    const section =
        document.getElementById(
            sectionName
        );

    if (section) {
        section.classList.add("active");
        section.style.display = "block";
    }

    document
        .querySelectorAll(".nav-btn")
        .forEach(function(btn) {
            btn.classList.remove("active");
        });

    if (button) {
        button.classList.add("active");
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
   LOGIN FORM
========================================================= */

function setupLoginForm() {
    const form =
        document.getElementById(
            "schoolLoginForm"
        );

    if (!form) return;

    form.onsubmit = loginSchool;
}

/* =========================================================
   REGISTER FORM
========================================================= */

function setupRegisterForm() {
    const form =
        document.getElementById(
            "schoolRegisterForm"
        );

    if (!form) return;

    form.onsubmit = registerSchool;
}

/* =========================================================
   LOGOUT
========================================================= */

function setupLogoutButton() {
    const buttons =
        document.querySelectorAll(
            "[data-logout]"
        );

    buttons.forEach(button => {
        button.onclick = logoutSchool;
    });
}

/* =========================================================
   OUTSIDE MODAL CLICK
========================================================= */

function setupOutsideModalClick() {
    document.addEventListener(
        "click",
        function(event) {
            if (
                event.target.classList.contains(
                    "modal"
                )
            ) {
                event.target.style.display =
                    "none";

                event.target.classList.remove(
                    "active"
                );
            }
        }
    );
}

/* =========================================================
   APPLICATION STARTUP
========================================================= */

async function setupApplication() {
    if (!isLoggedIn()) {
        return;
    }

    displaySchoolName();

    /*
       THIS WAS THE MISSING PART.
       It connects the Add Student button/form
       to the addStudent() function.
    */

    setupStudentForm();

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
   START APPLICATION
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
   MAKE FUNCTIONS AVAILABLE TO HTML
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