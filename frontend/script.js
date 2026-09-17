
// =========================================================
// SHOW / HIDE PASSWORD
// =========================================================

function togglePassword(fieldId, checkbox) {
    const field = document.getElementById(fieldId);

    if (!field) return;

    field.type = checkbox.checked ? "text" : "password";
}


/* =========================================================
   PROFESSIONAL SCHOOL NOTIFICATIONS
========================================================= */

function showNotification(message, type = "success", title = "") {

    let notification = document.getElementById("schoolNotification");

    if (!notification) {

        notification = document.createElement("div");

        notification.id = "schoolNotification";

        notification.innerHTML = `
            <div id="schoolNotificationIcon"></div>

            <div>
                <div id="schoolNotificationTitle"></div>
                <div id="schoolNotificationMessage"></div>
            </div>

            <button
                type="button"
                id="schoolNotificationClose"
                aria-label="Close notification"
            >
                ×
            </button>
        `;

        document.body.appendChild(notification);

        document
            .getElementById("schoolNotificationClose")
            .onclick = () => {
                notification.classList.remove("show");
            };
    }

    const icon = document.getElementById("schoolNotificationIcon");
    const titleElement =
        document.getElementById("schoolNotificationTitle");
    const messageElement =
        document.getElementById("schoolNotificationMessage");

    notification.className = "";

    if (type === "error") {
        icon.textContent = "✕";
        titleElement.textContent = title || "Something went wrong";
    } else if (type === "warning") {
        icon.textContent = "⚠";
        titleElement.textContent = title || "Warning";
    } else if (type === "info") {
        icon.textContent = "ℹ";
        titleElement.textContent = title || "Information";
    } else {
        icon.textContent = "✓";
        titleElement.textContent = title || "Success";
    }

    messageElement.textContent = message;

    notification.classList.add(type);
    
    requestAnimationFrame(() => {
        notification.classList.add("show");
    });

    clearTimeout(
        window.schoolNotificationTimer
    );

    window.schoolNotificationTimer =
        setTimeout(() => {

            notification.classList.remove("show");

        }, 4000);
}


/* Replace browser alerts with professional notifications */

function schoolAlert(message) {

    const text = String(message || "");
    const lower = text.toLowerCase();

    let title = "Success";
    let messageText = "Your request was completed successfully.";
    let type = "success";

    /* STUDENTS */

    if (
        lower.includes("student") &&
        (
            lower.includes("added") ||
            lower.includes("created")
        )
    ) {
        title = "Student Added";
        messageText = "The student has been added successfully.";
    }

    else if (
        lower.includes("student") &&
        (
            lower.includes("updated") ||
            lower.includes("update")
        )
    ) {
        title = "Student Updated";
        messageText = "The student information has been updated successfully.";
    }

    else if (
        lower.includes("student") &&
        (
            lower.includes("deleted") ||
            lower.includes("removed")
        )
    ) {
        title = "Student Deleted";
        messageText = "The student has been removed successfully.";
    }

    /* TEACHERS */

    else if (
        lower.includes("teacher") &&
        (
            lower.includes("added") ||
            lower.includes("created")
        )
    ) {
        title = "Teacher Added";
        messageText = "The teacher has been added successfully.";
    }

    else if (
        lower.includes("teacher") &&
        (
            lower.includes("updated") ||
            lower.includes("update")
        )
    ) {
        title = "Teacher Updated";
        messageText = "The teacher information has been updated successfully.";
    }

    else if (
        lower.includes("teacher") &&
        (
            lower.includes("deleted") ||
            lower.includes("removed")
        )
    ) {
        title = "Teacher Deleted";
        messageText = "The teacher has been removed successfully.";
    }

    /* CLASSES */

    else if (
        lower.includes("class") &&
        (
            lower.includes("added") ||
            lower.includes("created")
        )
    ) {
        title = "Class Added";
        messageText = "The class has been added successfully.";
    }

    else if (
        lower.includes("class") &&
        (
            lower.includes("updated") ||
            lower.includes("update")
        )
    ) {
        title = "Class Updated";
        messageText = "The class information has been updated successfully.";
    }

    else if (
        lower.includes("class") &&
        (
            lower.includes("deleted") ||
            lower.includes("removed")
        )
    ) {
        title = "Class Deleted";
        messageText = "The class has been removed successfully.";
    }

    /* ATTENDANCE */

    else if (
        lower.includes("attendance") &&
        (
            lower.includes("saved") ||
            lower.includes("success")
        )
    ) {
        title = "Attendance Saved";
        messageText = "Student attendance has been saved successfully.";
    }

    else if (
        lower.includes("monthly") &&
        lower.includes("attendance")
    ) {
        title = "Monthly Report Ready";
        messageText = "The monthly attendance report has been loaded.";
        type = "info";
    }

    /* LOGIN */

    else if (
        lower.includes("login") &&
        (
            lower.includes("success") ||
            lower.includes("successful")
        )
    ) {
        title = "Welcome Back";
        messageText = "You have logged in successfully.";
    }

    /* ERRORS */

    else if (
        lower.includes("error") ||
        lower.includes("failed") ||
        lower.includes("unable") ||
        lower.includes("invalid") ||
        lower.includes("cannot")
    ) {
        title = "Operation Failed";
        messageText = "We couldn't complete that request. Please try again.";
        type = "error";
    }

    /* WARNINGS */

    else if (
        lower.includes("already") ||
        lower.includes("required") ||
        lower.includes("warning")
    ) {
        title = "Please Check";
        messageText = text;
        type = "warning";
    }

    /*
     * If no special message was recognized,
     * still show the original message professionally.
     */

    else if (text) {
        messageText = text;
    }

    showNotification(
        messageText,
        type,
        title
    );
}


/* =========================================================
   SCHOOL MANAGEMENT SYSTEM
   COMPLETE FRONTEND SCRIPT
========================================================= */

const API_URL =
    window.location.port === "5500"
        ? "http://localhost:3000/api"
        : "/api";


/* =========================================================
   GLOBAL DATA
========================================================= */

let students = [];
let teachers = [];
let classes = [];

let allStudents = [];
let allTeachers = [];
let allClasses = [];

let editingStudentId = null;
let editingTeacherId = null;
let editingClassId = null;

let currentProfileStudent = null;

let attendanceRecords = {};


/* =========================================================
   HELPERS
========================================================= */

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

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* =========================================================
   STUDENT AVATAR
========================================================= */

function studentAvatar(student) {

    if (student.photo) {

        return `
            <img
                src="${escapeHTML(student.photo)}"
                class="student-table-photo"
                alt="Student photo"
            >
        `;
    }

    return `
        <div class="student-table-avatar">
            ${escapeHTML(
                (student.name || "S")
                    .charAt(0)
                    .toUpperCase()
            )}
        </div>
    `;
}


/* =========================================================
   STUDENTS
========================================================= */

async function loadStudents() {

    const table = getElement("studentsTable");

    if (table) {

        table.innerHTML =
            '<tr><td colspan="5">Loading students...</td></tr>';
    }

    try {

        const data =
            await getJSON(`${API_URL}/students`);

        students =
            Array.isArray(data)
                ? data
                : Array.isArray(data.students)
                    ? data.students
                    : [];

        allStudents = students;

        renderStudents();

        updateStudentCount();

    } catch (error) {

        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );

        students = [];
        allStudents = [];

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        }

        updateStudentCount();
    }
}


function updateStudentCount() {

    const element =
        getElement("studentCount");

    if (element) {
        element.textContent =
            students.length;
    }
}


function renderStudents(list = students) {

    const table =
        getElement("studentsTable");

    if (!table) return;

    if (!list.length) {

        table.innerHTML =
            '<tr><td colspan="5">No students found.</td></tr>';

        return;
    }

    table.innerHTML =
        list.map(student => `

            <tr>

                <td>
                    ${escapeHTML(student.id)}
                </td>

                <td>
                    <span>
                        ${escapeHTML(
                            student.name ||
                            "Unnamed"
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(student.age)}
                </td>

                <td>
                    ${escapeHTML(student.className)}
                </td>

                <td>

                    <button
                        type="button"
                        class="view-btn"
                        onclick="viewStudent(${Number(student.id)})"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editStudent(${Number(student.id)})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteStudent(${Number(student.id)})"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `).join("");
}


function searchStudents() {

    const input =
        getElement("studentSearch");

    if (!input) return;

    const query =
        input.value
            .trim()
            .toLowerCase();

    const filtered =
        students.filter(student => {

            const id =
                String(student.id ?? "")
                    .toLowerCase();

            const name =
                String(student.name ?? "")
                    .toLowerCase();

            const age =
                String(student.age ?? "")
                    .toLowerCase();

            const className =
                String(student.className ?? "")
                    .toLowerCase();

            return (
                id.includes(query) ||
                name.includes(query) ||
                age.includes(query) ||
                className.includes(query)
            );
        });

    renderStudents(filtered);
}


/* =========================================================
   ADD / EDIT STUDENT
========================================================= */

async function addStudent(event) {

    if (event) {
        event.preventDefault();
    }

    const name =
        getElement("studentName")
            ?.value
            .trim() || "";

    const age =
        Number(
            getElement("studentAge")
                ?.value
        );

    const className =
        getElement("studentClass")
            ?.value
            .trim() || "";

    if (!name || !age || !className) {

        schoolAlert(
            "Please fill in all student fields."
        );

        return;
    }

    try {

        const editing =
            editingStudentId !== null;

        const url =
            editing
                ? `${API_URL}/students/${editingStudentId}`
                : `${API_URL}/students`;

        await getJSON(url, {

            method:
                editing
                    ? "PUT"
                    : "POST",

            body: JSON.stringify({
                name,
                age,
                className
            })
        });

        schoolAlert(
            editing
                ? "Student updated successfully."
                : "Student added successfully."
        );

        editingStudentId = null;

        getElement("studentForm")?.reset();

        const title =
            getElement("studentModalTitle");

        if (title) {
            title.textContent =
                "Add Student";
        }

        closeModal("studentModal");

        await loadStudents();

    } catch (error) {

        console.error(
            "STUDENT ERROR:",
            error
        );

        schoolAlert(error.message);
    }
}


function editStudent(id) {

    const student =
        students.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!student) {

        schoolAlert(
            "Student not found."
        );

        return;
    }

    editingStudentId =
        Number(id);

    const name =
        getElement("studentName");

    const age =
        getElement("studentAge");

    const className =
        getElement("studentClass");

    if (name) {
        name.value =
            student.name || "";
    }

    if (age) {
        age.value =
            student.age || "";
    }

    if (className) {
        className.value =
            student.className || "";
    }

    const title =
        getElement("studentModalTitle");

    if (title) {
        title.textContent =
            "Edit Student";
    }

    openModal("studentModal");
}


async function deleteStudent(id) {

    const student =
        students.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (
        !confirm(
            `Delete ${
                student?.name ||
                "this student"
            }?`
        )
    ) {
        return;
    }

    try {

        await getJSON(
            `${API_URL}/students/${id}`,
            {
                method: "DELETE"
            }
        );

        schoolAlert(
            "Student deleted successfully."
        );

        await loadStudents();

    } catch (error) {

        console.error(
            "DELETE STUDENT ERROR:",
            error
        );

        schoolAlert(error.message);
    }
}


/* =========================================================
   STUDENT PROFILE
   THIS VERSION CREATES THE MODAL AUTOMATICALLY
========================================================= */

function createStudentProfileModal() {

    let modal =
        getElement("studentProfileModal");

    if (modal) {
        return modal;
    }

    modal =
        document.createElement("div");

    modal.id =
        "studentProfileModal";

    modal.className =
        "modal";

    modal.style.display =
        "none";

    modal.innerHTML = `

        <div
            class="modal-content student-profile-modal-content"
            style="
                position:relative;
                max-width:500px;
                width:90%;
                background:white;
                border-radius:16px;
                padding:30px;
                box-shadow:0 20px 50px rgba(0,0,0,0.25);
            "
        >

            <button
                type="button"
                class="close-button"
                onclick="closeModal('studentProfileModal')"
                style="
                    position:absolute;
                    right:15px;
                    top:10px;
                    border:none;
                    background:none;
                    font-size:30px;
                    cursor:pointer;
                "
            >
                ×
            </button>


            <div
                style="
                    text-align:center;
                    margin-bottom:25px;
                "
            >

                <div
                    id="profileStudentAvatar"
                    style="
                        width:110px;
                        height:110px;
                        margin:0 auto 15px;
                        border-radius:50%;
                        overflow:hidden;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#2563eb;
                        color:white;
                        font-size:42px;
                        font-weight:bold;
                    "
                >
                </div>

                <h2
                    id="profileStudentName"
                    style="margin:5px 0;"
                >
                    Student
                </h2>

                <p
                    style="
                        margin:5px 0;
                        color:#6b7280;
                    "
                >
                    Student Profile
                </p>

            </div>


            <div
                style="
                    display:grid;
                    gap:12px;
                    margin-bottom:20px;
                "
            >

                <div
                    style="
                        padding:14px;
                        background:#f3f4f6;
                        border-radius:10px;
                    "
                >
                    <strong>Student ID:</strong>

                    <span
                        id="profileStudentId"
                    >
                        -
                    </span>
                </div>


                <div
                    style="
                        padding:14px;
                        background:#f3f4f6;
                        border-radius:10px;
                    "
                >
                    <strong>Age:</strong>

                    <span
                        id="profileStudentAge"
                    >
                        -
                    </span>
                </div>


                <div
                    style="
                        padding:14px;
                        background:#f3f4f6;
                        border-radius:10px;
                    "
                >
                    <strong>Class:</strong>

                    <span
                        id="profileStudentClass"
                    >
                        -
                    </span>
                </div>

            </div>


            <input
                type="file"
                id="studentPhotoUpload"
                accept="image/*"
                style="display:none;"
            >


            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:10px;
                    justify-content:center;
                "
            >

                <button
                    type="button"
                    class="primary-button"
                    onclick="chooseStudentPhoto()"
                >
                    📷 Change Photo
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="removeStudentPhoto()"
                >
                    🗑 Remove Photo
                </button>

                <button
                    type="button"
                    class="edit-btn"
                    onclick="
                        closeModal('studentProfileModal');
                        if (currentProfileStudent) {
                            editStudent(currentProfileStudent.id);
                        }
                    "
                >
                    ✏️ Edit Student
                </button>

                <button
                    type="button"
                    class="view-btn"
                    onclick="closeModal('studentProfileModal')"
                >
                    Close
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    return modal;
}


function viewStudent(id) {

    const student =
        students.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!student) {

        schoolAlert(
            "Student not found."
        );

        return;
    }


    /*
       IMPORTANT:
       Automatically create the profile window
       if the HTML does not contain it.
    */

    const modal =
        createStudentProfileModal();

    if (!modal) {

        schoolAlert(
            "Could not create student profile window."
        );

        return;
    }


    currentProfileStudent =
        student;


    const name =
        getElement("profileStudentName");

    const studentId =
        getElement("profileStudentId");

    const age =
        getElement("profileStudentAge");

    const className =
        getElement("profileStudentClass");

    const avatar =
        getElement("profileStudentAvatar");


    if (name) {

        name.textContent =
            student.name ||
            "Unnamed Student";
    }


    if (studentId) {

        studentId.textContent =
            student.id ??
            "-";
    }


    if (age) {

        age.textContent =
            student.age ??
            "-";
    }


    if (className) {

        className.textContent =
            student.className ||
            "-";
    }


    if (avatar) {

        if (student.photo) {

            avatar.innerHTML = `

                <img
                    src="${escapeHTML(student.photo)}"
                    class="student-profile-photo"
                    alt="Student photo"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                    "
                >

            `;

        } else {

            avatar.innerHTML = `

                <div
                    class="student-profile-initial"
                    style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:linear-gradient(
                            135deg,
                            #2563eb,
                            #7c3aed
                        );
                        color:white;
                        font-size:42px;
                        font-weight:bold;
                    "
                >
                    ${escapeHTML(
                        (
                            student.name ||
                            "S"
                        )
                        .charAt(0)
                        .toUpperCase()
                    )}
                </div>

            `;
        }
    }


    const upload =
        getElement(
            "studentPhotoUpload"
        );

    if (upload) {

        upload.dataset.studentId =
            student.id;

        upload.value =
            "";
    }


    openModal(
        "studentProfileModal"
    );
}


/* =========================================================
   STUDENT PHOTO
========================================================= */

function chooseStudentPhoto() {

    const input =
        getElement(
            "studentPhotoUpload"
        );

    if (input) {
        input.click();
    }
}


function compressStudentPhoto(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload =
                event => {

                    const image =
                        new Image();

                    image.onload =
                        () => {

                            const maxSize =
                                600;

                            let width =
                                image.width;

                            let height =
                                image.height;


                            if (
                                width > maxSize ||
                                height > maxSize
                            ) {

                                const scale =
                                    Math.min(
                                        maxSize / width,
                                        maxSize / height
                                    );

                                width =
                                    Math.round(
                                        width * scale
                                    );

                                height =
                                    Math.round(
                                        height * scale
                                    );
                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );

                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.8
                                )
                            );
                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Could not read the image."
                                )
                            );
                        };


                    image.src =
                        event.target.result;
                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Could not read the selected file."
                        )
                    );
                };


            reader.readAsDataURL(file);
        }
    );
}


async function uploadStudentPhoto() {

    const input =
        getElement(
            "studentPhotoUpload"
        );

    if (
        !input ||
        !input.files ||
        !input.files[0]
    ) {
        return;
    }


    const id =
        input.dataset.studentId ||
        currentProfileStudent?.id;


    if (!id) {

        schoolAlert(
            "Please open a student profile first."
        );

        return;
    }


    const file =
        input.files[0];


    if (
        !file.type.startsWith("image/")
    ) {

        schoolAlert(
            "Please select an image file."
        );

        return;
    }


    try {

        const photo =
            await compressStudentPhoto(
                file
            );


        const data =
            await getJSON(
                `${API_URL}/students/${id}/photo`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        photo
                    })
                }
            );


        const student =
            students.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (student) {

            student.photo =
                data.photo ||
                photo;
        }


        allStudents =
            students;


        renderStudents();

        viewStudent(id);

    } catch (error) {

        console.error(
            "PHOTO ERROR:",
            error
        );

        schoolAlert(error.message);
    }
}


async function removeStudentPhoto(id = null) {

    id =
        id ||
        currentProfileStudent?.id;


    if (!id) {
        return;
    }


    if (
        !confirm(
            "Remove this student's photo?"
        )
    ) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/students/${id}/photo`,
            {
                method: "DELETE"
            }
        );


        const student =
            students.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (student) {
            student.photo = null;
        }


        allStudents =
            students;


        renderStudents();

        viewStudent(id);

    } catch (error) {

        console.error(
            "REMOVE PHOTO ERROR:",
            error
        );

        schoolAlert(error.message);
    }
}


/* =========================================================
   TEACHERS
========================================================= */

async function loadTeachers() {

    const table =
        getElement("teachersTable");

    if (table) {

        table.innerHTML =
            '<tr><td colspan="6">Loading teachers...</td></tr>';
    }


    try {

        const data =
            await getJSON(
                `${API_URL}/teachers`
            );


        teachers =
            Array.isArray(data)
                ? data
                : Array.isArray(data.teachers)
                    ? data.teachers
                    : [];


        allTeachers =
            teachers;


        renderTeachers();

        updateTeacherCount();

    } catch (error) {

        console.error(
            "LOAD TEACHERS ERROR:",
            error
        );


        teachers = [];
        allTeachers = [];


        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        }


        updateTeacherCount();
    }
}


function updateTeacherCount() {

    const element =
        getElement("teacherCount");

    if (element) {

        element.textContent =
            teachers.length;
    }
}


function renderTeachers(list = teachers) {

    const table =
        getElement("teachersTable");

    if (!table) return;


    if (!list.length) {

        table.innerHTML =
            '<tr><td colspan="6">No teachers found.</td></tr>';

        return;
    }


    table.innerHTML =
        list.map(teacher => `

            <tr>

                <td>
                    ${escapeHTML(teacher.id)}
                </td>

                <td>
                    ${escapeHTML(
                        teacher.name
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        teacher.age
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        teacher.subject
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        teacher.email
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="view-btn"
                        onclick="viewTeacher(${Number(teacher.id)})"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editTeacher(${Number(teacher.id)})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteTeacher(${Number(teacher.id)})"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `).join("");
}


function searchTeachers() {

    const input =
        getElement("teacherSearch");

    if (!input) return;


    const search =
        input.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderTeachers();

        return;
    }


    const filtered =
        teachers.filter(
            teacher =>
                `
                    ${teacher.id}
                    ${teacher.name}
                    ${teacher.age}
                    ${teacher.subject}
                    ${teacher.email}
                `
                .toLowerCase()
                .includes(search)
        );


    renderTeachers(filtered);
}


function editTeacher(id) {

    populateTeacherClassOptions();

    const teacher =
        teachers.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!teacher) {

        schoolAlert(
            "Teacher not found."
        );

        return;
    }


    editingTeacherId =
        Number(id);


    const name =
        getElement("teacherName");

    const age =
        getElement("teacherAge");

    const subject =
        getElement("teacherSubject");

    const email =
        getElement("teacherEmail");

    const teacherClass =
        getElement("teacherClass");


    if (name) {
        name.value =
            teacher.name || "";
    }

    if (age) {
        age.value =
            teacher.age || "";
    }

    if (subject) {
        subject.value =
            teacher.subject || "";
    }

    if (email) {
        email.value =
            teacher.email || "";
    }

    if (teacherClass) {
        teacherClass.value =
            teacher.assignedClassId
                ? String(teacher.assignedClassId)
                : "";
    }


    const title =
        getElement(
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

    if (event) {
        event.preventDefault();
    }


    const name =
        getElement("teacherName")
            ?.value
            .trim() || "";


    const age =
        Number(
            getElement("teacherAge")
                ?.value
        );


    const subject =
        getElement("teacherSubject")
            ?.value
            .trim() || "";


    const email =
        getElement("teacherEmail")
            ?.value
            .trim() || "";

    const assignedClassId =
        getElement("teacherClass")
            ?.value
            ? Number(
                getElement("teacherClass").value
              )
            : null;


    if (
        !name ||
        !age ||
        !subject ||
        !email
    ) {

        schoolAlert(
            "Please fill in all teacher fields."
        );

        return;
    }


    try {

        const editing =
            editingTeacherId !== null;


        const url =
            editing
                ? `${API_URL}/teachers/${editingTeacherId}`
                : `${API_URL}/teachers`;


        await getJSON(
            url,
            {

                method:
                    editing
                        ? "PUT"
                        : "POST",

                body: JSON.stringify({
                    name,
                    age,
                    subject,
                    email,
                    assignedClassId
                })
            }
        );


        schoolAlert(
            editing
                ? "Teacher updated successfully."
                : "Teacher added successfully."
        );


        editingTeacherId =
            null;


        getElement(
            "teacherForm"
        )?.reset();


        const title =
            getElement(
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

        schoolAlert(error.message);
    }
}


async function deleteTeacher(id) {

    const teacher =
        teachers.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (
        !confirm(
            `Delete ${
                teacher?.name ||
                "this teacher"
            }?`
        )
    ) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/teachers/${id}`,
            {
                method: "DELETE"
            }
        );


        schoolAlert(
            "Teacher deleted successfully."
        );


        await loadTeachers();

    } catch (error) {

        console.error(
            "DELETE TEACHER ERROR:",
            error
        );

        schoolAlert(error.message);
    }
}


/* =========================================================
   TEACHER PROFILE
========================================================= */

function viewTeacher(id) {

    const teacher =
        teachers.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!teacher) {

        schoolAlert(
            "Teacher not found."
        );

        return;
    }


    let modal =
        getElement(
            "teacherProfileModal"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "teacherProfileModal";

        modal.className =
            "modal";

        modal.innerHTML = `

            <div
                class="modal-content"
                style="
                    position:relative;
                    max-width:500px;
                    width:90%;
                    background:white;
                    border-radius:16px;
                    padding:30px;
                "
            >

                <button
                    type="button"
                    class="close-button"
                    onclick="
                        closeModal(
                            'teacherProfileModal'
                        )
                    "
                >
                    ×
                </button>

                <h2
                    id="teacherProfileName"
                ></h2>

                <p>
                    <strong>Age:</strong>
                    <span
                        id="teacherProfileAge"
                    ></span>
                </p>

                <p>
                    <strong>Subject:</strong>
                    <span
                        id="teacherProfileSubject"
                    ></span>
                </p>

                <p>
                    <strong>Email:</strong>
                    <span
                        id="teacherProfileEmail"
                    ></span>
                </p>

            </div>
        `;

        document.body.appendChild(
            modal
        );
    }


    getElement(
        "teacherProfileName"
    ).textContent =
        teacher.name || "";


    getElement(
        "teacherProfileAge"
    ).textContent =
        teacher.age ?? "-";


    getElement(
        "teacherProfileSubject"
    ).textContent =
        teacher.subject || "-";


    getElement(
        "teacherProfileEmail"
    ).textContent =
        teacher.email || "-";


    openModal(
        "teacherProfileModal"
    );
}


/* =========================================================
   TEACHER ASSIGNED CLASS DROPDOWN
========================================================= */

function populateTeacherClassOptions() {

    const select =
        getElement("teacherClass");

    if (!select) return;

    const currentValue =
        select.value;

    select.innerHTML =
        '<option value="">Not Assigned</option>';

    classes.forEach(classItem => {

        const option =
            document.createElement("option");

        option.value =
            String(classItem.id);

        option.textContent =
            classItem.name +
            (
                classItem.section
                    ? " - " + classItem.section
                    : ""
            );

        select.appendChild(option);
    });

    if (currentValue) {
        select.value = currentValue;
    }
}


/* =========================================================
   CLASSES
========================================================= */

async function loadClasses() {

    const table =
        getElement("classesTable");


    if (table) {

        table.innerHTML =
            '<tr><td colspan="5">Loading classes...</td></tr>';
    }


    try {

        const data =
            await getJSON(
                `${API_URL}/classes`
            );


        classes =
            Array.isArray(data)
                ? data
                : Array.isArray(data.classes)
                    ? data.classes
                    : [];


        allClasses =
            classes;

        populateTeacherClassOptions();


        renderClasses();

        updateClassCount();

    } catch (error) {

        console.error(
            "LOAD CLASSES ERROR:",
            error
        );


        classes = [];
        allClasses = [];


        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        }


        updateClassCount();
    }
}


function updateClassCount() {

    const element =
        getElement("classCount");


    if (element) {

        element.textContent =
            classes.length;
    }
}



function renderClasses() {

    const container =
        document.getElementById("classesTableBody") ||
        document.getElementById("classTableBody") ||
        document.querySelector("#classes table tbody");

    if (!container) {
        console.log("Classes table body not found.");
        return;
    }

    container.innerHTML = "";

    if (!classes || classes.length === 0) {

        container.innerHTML = `
            <tr>
                <td colspan="5">
                    No classes found.
                </td>
            </tr>
        `;

        return;
    }

    classes.forEach(cls => {

        const row = document.createElement("tr");

        const id = cls.id || "";
        const name = cls.name || cls.className || "";
        const teacher =
            cls.assignedTeacherName ||
            cls.assignedTeacher ||
            cls.teacher ||
            "Not assigned";

        const room = cls.room || "Not assigned";

        row.innerHTML = `
            <td>${id}</td>

            <td>
                <strong>${escapeClassDashboardHTML(name)}</strong>
            </td>

            <td>
                ${escapeClassDashboardHTML(teacher)}
            </td>

            <td>
                ${escapeClassDashboardHTML(room)}
            </td>

            <td>

                <button
                    type="button"
                    class="class-dashboard-button"
                    data-class-id="${id}">
                    🏫 Open Dashboard
                </button>

                <button
                    type="button"
                    onclick="editClass(${id})">
                    Edit
                </button>

                <button
                    type="button"
                    onclick="deleteClass(${id})">
                    Delete
                </button>

            </td>
        `;

        container.appendChild(row);

        const dashboardButton =
            row.querySelector(".class-dashboard-button");

        dashboardButton.addEventListener(
            "click",
            function () {
                openClassDashboard(id);
            }
        );

    });
}



function searchClasses() {

    const input =
        getElement("classSearch");


    if (!input) return;


    const search =
        input.value
            .trim()
            .toLowerCase();


    if (!search) {

        renderClasses();

        return;
    }


    const filtered =
        classes.filter(
            item =>
                `
                    ${item.id}
                    ${item.name || item.className}
                    ${item.teacher || item.teacherName}
                    ${item.room || item.roomNumber}
                `
                .toLowerCase()
                .includes(search)
        );


    renderClasses(filtered);
}


function editClass(id) {

    const item =
        classes.find(
            x =>
                Number(x.id) ===
                Number(id)
        );


    if (!item) {

        schoolAlert(
            "Class not found."
        );

        return;
    }


    editingClassId =
        Number(id);


    const name =
        getElement("className");

    const teacher =
        getElement("classTeacher");

    const room =
        getElement("classRoom");


    if (name) {

        name.value =
            item.name ||
            item.className ||
            "";
    }


    if (teacher) {

        teacher.value =
            item.teacher ||
            item.teacherName ||
            "";
    }


    if (room) {

        room.value =
            item.room ||
            item.roomNumber ||
            "";
    }


    const title =
        getElement(
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

    if (event) {
        event.preventDefault();
    }


    const name =
        getElement("className")
            ?.value
            .trim() || "";


    const teacher =
        getElement("classTeacher")
            ?.value
            .trim() || "";


    const room =
        getElement("classRoom")
            ?.value
            .trim() || "";


    if (!name) {

        schoolAlert(
            "Please enter a class name."
        );

        return;
    }


    try {

        const editing =
            editingClassId !== null;


        const url =
            editing
                ? `${API_URL}/classes/${editingClassId}`
                : `${API_URL}/classes`;


        await getJSON(
            url,
            {

                method:
                    editing
                        ? "PUT"
                        : "POST",

                body: JSON.stringify({
                    name,
                    teacher,
                    room
                })
            }
        );


        schoolAlert(
            editing
                ? "Class updated successfully."
                : "Class added successfully."
        );


        editingClassId =
            null;


        getElement(
            "classForm"
        )?.reset();


        const title =
            getElement(
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

        schoolAlert(error.message);
    }
}


async function deleteClass(id) {

    const item =
        classes.find(
            x =>
                Number(x.id) ===
                Number(id)
        );


    if (
        !confirm(
            `Delete ${
                item?.name ||
                item?.className ||
                "this class"
            }?`
        )
    ) {
        return;
    }


    try {

        await getJSON(
            `${API_URL}/classes/${id}`,
            {
                method: "DELETE"
            }
        );


        schoolAlert(
            "Class deleted successfully."
        );


        await loadClasses();

    } catch (error) {

        console.error(
            "DELETE CLASS ERROR:",
            error
        );

        schoolAlert(error.message);
    }
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    const modal =
        getElement(id);


    if (!modal) {

        console.error(
            `Modal not found: ${id}`
        );

        return;
    }


    modal.style.display =
        "flex";


    modal.classList.add(
        "active",
        "show"
    );

    // Populate teacher classes whenever the teacher modal opens.
    if (id === "teacherModal") {
        populateTeacherClassOptions();
    }
}


function closeModal(id) {

    const modal =
        getElement(id);


    if (!modal) return;


    modal.style.display =
        "none";


    modal.classList.remove(
        "active",
        "show"
    );
}


/* =========================================================
   TAB SWITCHING
========================================================= */

function showSection(name) {

    const validSections = [
        "students",
        "teachers",
        "classes",
        "announcements",
        "timetable",
        "classDashboard",
        "attendance",
        "monthlyAttendance"
    ];

    if (!validSections.includes(name)) {
        return;
    }

    // Hide all sections
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
        section.style.display = "none";
    });

    // Show selected section
    const selected = document.getElementById(name);

    if (!selected) {
        console.error("Section not found:", name);
        return;
    }

    selected.classList.add("active");
    selected.style.display = "block";

    // Load data
    if (name === "announcements") {
        loadAnnouncements();
    }

    if (name === "timetable") {
        setTimeout(() => {
            loadTimetable();
        }, 100);
    }

    // Update active button
    document.querySelectorAll(".tab-button").forEach(button => {

        button.classList.remove("active");

        const text = button.textContent.toLowerCase();

        if (
            (name === "students" && text.includes("students")) ||
            (name === "teachers" && text.includes("teachers")) ||
            (name === "classes" && text.includes("classes")) ||
            (name === "announcements" && text.includes("announcements")) ||
            (name === "timetable" && text.includes("timetable"))
        ) {
            button.classList.add("active");
        }
    });
}

/* =========================================================
   APPLICATION SETUP
========================================================= */

function setupApplication() {

    const studentForm =
        getElement(
            "studentForm"
        );

    const teacherForm =
        getElement(
            "teacherForm"
        );

    const classForm =
        getElement(
            "classForm"
        );


    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            addStudent
        );
    }


    if (teacherForm) {

        teacherForm.addEventListener(
            "submit",
            saveTeacher
        );
    }


    if (classForm) {

        classForm.addEventListener(
            "submit",
            saveClass
        );
    }


    const photoUpload =
        getElement(
            "studentPhotoUpload"
        );


    if (photoUpload) {

        photoUpload.addEventListener(
            "change",
            uploadStudentPhoto
        );
    }


    document.addEventListener(
        "click",
        event => {

            if (
                event.target &&
                event.target.classList &&
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


    /*
       Create the student profile modal
       immediately when the application starts.
    */

    createStudentProfileModal();


    /*
       Attendance and Monthly Attendance
       are created dynamically.
    */

    createAttendanceSection();

    createMonthlyAttendanceSection();


    showSection(
        "students"
    );


    Promise.all([
        loadStudents(),
        loadTeachers(),
        loadClasses()
    ]);
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.loadStudents =
    loadStudents;

window.addStudent =
    addStudent;

window.editStudent =
    editStudent;

window.deleteStudent =
    deleteStudent;

window.searchStudents =
    searchStudents;

window.viewStudent =
    viewStudent;


window.chooseStudentPhoto =
    chooseStudentPhoto;

window.uploadStudentPhoto =
    uploadStudentPhoto;

window.removeStudentPhoto =
    removeStudentPhoto;


window.loadTeachers =
    loadTeachers;

window.editTeacher =
    editTeacher;

window.saveTeacher =
    saveTeacher;

window.deleteTeacher =
    deleteTeacher;

window.searchTeachers =
    searchTeachers;

window.viewTeacher =
    viewTeacher;


window.loadClasses =
    loadClasses;

window.editClass =
    editClass;

window.saveClass =
    saveClass;

window.deleteClass =
    deleteClass;

window.searchClasses =
    searchClasses;


window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.showSection =
    showSection;












/* =========================================================
   VIEW BUTTON STYLE
========================================================= */

const viewButtonStyle =
    document.createElement(
        "style"
    );


viewButtonStyle.textContent = `

    .view-btn {

        border:none;

        padding:7px 12px;

        border-radius:6px;

        cursor:pointer;

        background:#2563eb;

        color:white;

        margin-right:5px;
    }


    .view-btn:hover {

        opacity:0.85;
    }


    .student-table-photo {

        width:38px;

        height:38px;

        border-radius:50%;

        object-fit:cover;
    }


    .student-table-avatar {

        width:38px;

        height:38px;

        border-radius:50%;

        display:flex;

        align-items:center;

        justify-content:center;

        background:linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
        );

        color:white;

        font-weight:700;
    }


    .student-name-cell {

        display:flex;

        align-items:center;

        gap:10px;
    }

`;


document.head.appendChild(
    viewButtonStyle
);


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        const loginScreen =
            document.getElementById("loginScreen");

        if (loginScreen) {
            loginScreen.style.display = "none";
        }

        setupApplication();
    }
);


console.log(
    "SchoolConnect frontend loaded successfully."
);

console.log(
    "Student profile window is enabled."
);

console.log(
    "Login and registration are disabled."
);
/* =========================================================
   NEW ATTENDANCE SYSTEM
========================================================= */

function createAttendanceSection() {

    let section = document.getElementById("attendance");

    if (!section) {

        const main =
            document.querySelector("main.container") ||
            document.querySelector("main") ||
            document.body;

        section = document.createElement("section");

        section.id = "attendance";
        section.className = "section";
        section.style.display = "none";

        section.innerHTML = `
            <div class="section-header">
                <div>
                    <h2>📋 Daily Register</h2>
                    <p id="attendanceClassInfo">
                        Mark attendance for this class.
                    </p>
                </div>
            </div>

            <div style="margin:20px 0;">

                <label>
                    <strong>Date:</strong>
                </label>

                <input
                    type="date"
                    id="newAttendanceDate"
                    style="
                        padding:10px;
                        margin-left:10px;
                        border:1px solid #ccc;
                        border-radius:8px;
                    "
                >

                <button
                    type="button"
                    class="primary-button"
                    id="loadAttendanceButton"
                    style="margin-left:10px;"
                >
                    Load Attendance
                </button>

            </div>

            <div id="newAttendanceMessage"></div>

            <div style="
                overflow-x:auto;
                max-height:500px;
                overflow-y:auto;
            ">

                <table>

                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody id="newAttendanceTable">
                        <tr>
                            <td colspan="3">
                                Loading students...
                            </td>
                        </tr>
                    </tbody>

                </table>

            </div>

            <div style="margin-top:20px;">

                <button
                    type="button"
                    class="primary-button"
                    id="saveAttendanceButton"
                >
                    💾 Save Attendance
                </button>

            </div>

            <div style="margin-top:15px;">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="openClassDashboard(currentClassDashboardId)"
                >
                    ← Back to Class Dashboard
                </button>

            </div>
        `;

        main.appendChild(section);

        const dateInput =
            document.getElementById("newAttendanceDate");

        if (dateInput) {
            dateInput.value =
                new Date().toISOString().slice(0, 10);
        }

        const loadButton =
            document.getElementById("loadAttendanceButton");

        if (loadButton) {
            loadButton.addEventListener(
                "click",
                loadNewAttendance
            );
        }

        const saveButton =
            document.getElementById("saveAttendanceButton");

        if (saveButton) {
            saveButton.addEventListener(
                "click",
                saveNewAttendance
            );
        }
    }

    return section;
}


async function loadNewAttendance() {

    const dateInput =
        document.getElementById("newAttendanceDate");

    const table =
        document.getElementById("newAttendanceTable");

    if (!dateInput || !table) {
        return;
    }

    const date = dateInput.value;

    if (!date) {
        schoolAlert("Please select a date.");
        return;
    }

    const classId =
        currentClassDashboardId;

    const className =
        currentClassDashboard?.name ||
        currentClassDashboard?.className ||
        "";

    if (!classId) {
        schoolAlert("No class selected.");
        return;
    }

    const classInfo =
        document.getElementById("attendanceClassInfo");

    if (classInfo) {
        classInfo.textContent =
            "Mark attendance for " +
            className.toUpperCase();
    }

    table.innerHTML = `
        <tr>
            <td colspan="3">
                Loading students...
            </td>
        </tr>
    `;

    try {

        const studentsData =
            await getJSON(
                `${API_URL}/students`
            );

        const students =
            Array.isArray(studentsData)
                ? studentsData.filter(student => {

                    const studentClass =
                        String(
                            student.className || ""
                        )
                        .trim()
                        .toLowerCase();

                    return studentClass ===
                        String(className)
                            .trim()
                            .toLowerCase();

                })
                : [];

        let attendanceData = [];

        try {

            attendanceData =
                await getJSON(
                    `${API_URL}/attendance?date=${encodeURIComponent(date)}&classId=${encodeURIComponent(classId)}&className=${encodeURIComponent(className)}`
                );

        } catch (error) {

            console.warn(
                "Attendance records could not be loaded:",
                error
            );

        }

        const records = {};

        if (Array.isArray(attendanceData)) {

            attendanceData.forEach(record => {

                records[record.studentId] =
                    record.status;

            });

        }

        if (!students.length) {

            table.innerHTML = `
                <tr>
                    <td colspan="3">
                        No students found in ${escapeHTML(className)}.
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML =
            students.map(student => {

                const status =
                    records[student.id] ||
                    "Present";

                return `
                    <tr>

                        <td>
                            ${escapeHTML(student.name)}
                        </td>

                        <td>
                            ${escapeHTML(student.className)}
                        </td>

                        <td>

                            <select
                                class="attendance-status"
                                data-student-id="${student.id}"
                                style="
                                    padding:8px;
                                    border-radius:6px;
                                "
                            >

                                <option value="Present"
                                    ${status === "Present" ? "selected" : ""}>
                                    Present
                                </option>

                                <option value="Absent"
                                    ${status === "Absent" ? "selected" : ""}>
                                    Absent
                                </option>

                                <option value="Late"
                                    ${status === "Late" ? "selected" : ""}>
                                    Late
                                </option>

                            </select>

                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "CLASS ATTENDANCE ERROR:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="3">
                    Failed to load students.
                </td>
            </tr>
        `;

        schoolAlert(
            error.message
        );
    }
}


async function saveNewAttendance() {

    const dateInput =
        document.getElementById("newAttendanceDate");

    if (!dateInput) {
        return;
    }

    const date =
        dateInput.value;

    const selects =
        document.querySelectorAll(
            "#newAttendanceTable .attendance-status"
        );

    if (!date) {
        schoolAlert("Please select a date.");
        return;
    }

    if (!selects.length) {
        schoolAlert("No students available.");
        return;
    }

    const classId =
        currentClassDashboardId;

    const className =
        currentClassDashboard?.name ||
        currentClassDashboard?.className ||
        "";

    if (!classId) {
        schoolAlert("No class selected.");
        return;
    }

    const records = [];

    selects.forEach(select => {

        records.push({

            studentId:
                Number(
                    select.dataset.studentId
                ),

            status:
                select.value,

            classId:
                Number(classId),

            className:
                className

        });

    });

    try {

        await getJSON(
            `${API_URL}/attendance`,
            {
                method: "POST",

                body: JSON.stringify({

                    date,

                    classId:
                        Number(classId),

                    className,

                    records

                })
            }
        );

        schoolAlert(
            "Attendance saved successfully."
        );

        await loadNewAttendance();

    } catch (error) {

        console.error(
            "SAVE CLASS ATTENDANCE ERROR:",
            error
        );

        schoolAlert(
            error.message
        );
    }
}


/* =========================================================
   MONTHLY ATTENDANCE
========================================================= */

function createMonthlyAttendanceSection() {

    if (document.getElementById("monthlyAttendance")) {
        return;
    }

    const main =
        document.querySelector("main.container") ||
        document.querySelector("main") ||
        document.body;

    const section = document.createElement("section");

    section.id = "monthlyAttendance";
    section.className = "section";
    section.style.display = "none";

    section.innerHTML = `
        <div class="section-header">
            <div>
                <h2>📊 Monthly Attendance</h2>
                <p>View attendance summary for each student.</p>
            </div>
        </div>

        <div style="margin:20px 0;">

            <label>
                <strong>Month:</strong>
            </label>

            <input
                type="month"
                id="monthlyAttendanceMonth"
                style="
                    padding:10px;
                    margin-left:10px;
                    border:1px solid #ccc;
                    border-radius:8px;
                "
            >

            <button
                type="button"
                class="primary-button"
                id="loadMonthlyAttendanceButton"
                style="margin-left:10px;"
            >
                Load Report
            </button>

        </div>

        <div style="overflow-x:auto;">

            <table>

                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Late</th>
                        <th>Total</th>
                        <th>Percentage</th>
                    </tr>
                </thead>

                <tbody id="monthlyAttendanceTable">
                    <tr>
                        <td colspan="7">
                            Select a month.
                        </td>
                    </tr>
                </tbody>

            </table>

        </div>
    `;

    main.appendChild(section);

    const monthInput =
        document.getElementById(
            "monthlyAttendanceMonth"
        );

    monthInput.value =
        new Date().toISOString().slice(0, 7);

    document
        .getElementById("loadMonthlyAttendanceButton")
        .addEventListener(
            "click",
            loadNewMonthlyAttendance
        );
}


async function loadNewMonthlyAttendance() {

    const month =
        document.getElementById(
            "monthlyAttendanceMonth"
        ).value;

    const table =
        document.getElementById(
            "monthlyAttendanceTable"
        );

    if (!month) {
        schoolAlert("Please select a month.");
        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="7">
                Loading...
            </td>
        </tr>
    `;

    try {

        const data =
            await getJSON(
                `${API_URL}/attendance/monthly?month=${encodeURIComponent(month)}`
            );

        if (!data.length) {

            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        No attendance records for this month.
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML = data.map(student => {

            return `
                <tr>

                    <td>
                        ${escapeHTML(student.name)}
                    </td>

                    <td>
                        ${escapeHTML(student.className)}
                    </td>

                    <td>
                        ${student.present}
                    </td>

                    <td>
                        ${student.absent}
                    </td>

                    <td>
                        ${student.late}
                    </td>

                    <td>
                        ${student.total}
                    </td>

                    <td>
                        ${student.percentage}%
                    </td>

                </tr>
            `;

        }).join("");

    } catch (error) {

        console.error(
            "MONTHLY ATTENDANCE ERROR:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    Failed to load monthly attendance.
                </td>
            </tr>
        `;

        schoolAlert(error.message);
    }
}


/* =========================================================
   START NEW ATTENDANCE
========================================================= */


function initializeNewSections() {
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNewSections
    );
} else {
    initializeNewSections();
}

document.addEventListener("DOMContentLoaded", () => {

    const announcementDate =
        document.getElementById("announcementDate");

    if (announcementDate) {
        announcementDate.value =
            new Date().toISOString().split("T")[0];
    }

});


async function saveAnnouncement() {

    const titleElement =
        document.getElementById("announcementTitle");

    const messageElement =
        document.getElementById("announcementMessage");

    const dateElement =
        document.getElementById("announcementDate");

    const classElement =
        document.getElementById("announcementClass");

    const title =
        titleElement
            ? titleElement.value.trim()
            : "";

    const message =
        messageElement
            ? messageElement.value.trim()
            : "";

    const className =
        classElement
            ? classElement.value
            : "";

    let date =
        dateElement
            ? dateElement.value
            : "";

    if (!date) {

        date =
            new Date()
                .toISOString()
                .split("T")[0];

        if (dateElement) {
            dateElement.value = date;
        }
    }

    if (!className) {

        alert("Please select a class.");
        return;
    }

    if (!title || !message) {

        alert(
            "Please enter an announcement title and message."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/announcements`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        message: message,
                        date: date,
                        className: className
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            alert(
                result.error ||
                "Failed to save announcement."
            );

            return;
        }

        if (titleElement) {
            titleElement.value = "";
        }

        if (messageElement) {
            messageElement.value = "";
        }

        await loadAnnouncements();

        alert(
            "Announcement saved for " +
            className +
            " successfully!"
        );

    } catch (error) {

        console.error(
            "ANNOUNCEMENT ERROR:",
            error
        );

        alert(
            "Could not connect to the server."
        );
    }
}


async function loadAnnouncements() {

    const list =
        document.getElementById(
            "announcementsList"
        );

    if (!list) {
        return;
    }

    const classElement =
        document.getElementById(
            "announcementViewClass"
        );

    const className =
        classElement
            ? classElement.value
            : "";

    try {

        let url =
            `${API_URL}/announcements`;

        if (className) {

            url +=
                "?className=" +
                encodeURIComponent(className);
        }

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to load announcements"
            );
        }

        if (!data.length) {

            list.innerHTML = `
                <p>
                    No announcements for
                    ${className || "this class"} yet.
                </p>
            `;

            return;
        }

        list.innerHTML =
            data.map(item => `

                <div class="card">

                    <h3>
                        📢 ${item.title}
                    </h3>

                    <p>
                        <strong>
                            Class:
                        </strong>
                        ${item.className || "All Classes"}
                    </p>

                    <small>
                        📅 ${item.date}
                    </small>

                    <p>
                        ${item.message}
                    </p>

                    <button
                        class="danger-button"
                        onclick="deleteAnnouncement(${item.id})">
                        🗑️ Delete
                    </button>

                </div>

            `).join("");

    } catch (error) {

        console.error(
            "LOAD ANNOUNCEMENTS ERROR:",
            error
        );

        list.innerHTML =
            "<p>Failed to load announcements.</p>";
    }
}


async function deleteAnnouncement(id) {

    if (
        !confirm(
            "Delete this announcement?"
        )
    ) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/announcements/${id}`,
                {
                    method: "DELETE"
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            alert(
                result.error ||
                "Failed to delete announcement."
            );

            return;
        }

        await loadAnnouncements();

    } catch (error) {

        console.error(
            "DELETE ANNOUNCEMENT ERROR:",
            error
        );

        alert(
            "Could not connect to the server."
        );
    }
}


/* =========================================================
   SCHOOL TIMETABLE
========================================================= */

const DEFAULT_TIMETABLE_PERIODS = [
    "8:20 AM - 9:05 AM",
    "9:05 AM - 9:50 AM",
    "9:50 AM - 10:35 AM",
    "10:35 AM - 11:20 AM",
    "11:20 AM - 12:05 PM",
    "12:05 PM - 12:50 PM",
    "12:50 PM - 1:35 PM",
    "1:35 PM - 2:20 PM"
];

const TIMETABLE_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday"
];

let timetablePeriods = [];


function getSelectedTimetableClass() {
    const select =
        document.getElementById("timetableClassSelect");

    return select ? select.value : "SS3";
}


function getTimetablePeriods() {

    const saved =
        localStorage.getItem("schoolTimetablePeriods");

    if (saved) {
        try {
            const periods = JSON.parse(saved);

            if (
                Array.isArray(periods) &&
                periods.length > 0
            ) {
                return periods;
            }

        } catch (error) {
            console.error(
                "TIMETABLE PERIOD ERROR:",
                error
            );
        }
    }

    return [...DEFAULT_TIMETABLE_PERIODS];
}


function savePeriodsToBrowser() {

    localStorage.setItem(
        "schoolTimetablePeriods",
        JSON.stringify(timetablePeriods)
    );
}


function renderTimetable() {

    timetablePeriods =
        getTimetablePeriods();

    const header =
        document.getElementById(
            "timetableHeader"
        );

    const body =
        document.getElementById(
            "timetableBody"
        );

    if (!header || !body) return;


    header.innerHTML = `
        <th class="day-column">
            Day
        </th>
    `;


    timetablePeriods.forEach(time => {

        const th =
            document.createElement("th");

        th.textContent = time;

        header.appendChild(th);

    });


    body.innerHTML = "";


    TIMETABLE_DAYS.forEach(day => {

        const row =
            document.createElement("tr");

        const dayCell =
            document.createElement("th");

        dayCell.textContent = day;

        row.appendChild(dayCell);


        timetablePeriods.forEach(time => {

            const cell =
                document.createElement("td");

            cell.dataset.day = day;
            cell.dataset.time = time;

            cell.innerHTML = `
                <span class="empty-timetable">
                    +
                </span>
            `;


            cell.onclick = () => {

                editTimetableCell(
                    cell,
                    day,
                    time
                );

            };


            row.appendChild(cell);

        });


        body.appendChild(row);

    });


    loadTimetableGrid();
}


async function loadTimetableGrid() {

    const className =
        getSelectedTimetableClass();

    try {

        const response =
            await fetch(
                `${API_URL}/timetable`
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load timetable"
            );
        }

        const data =
            await response.json();


        document
            .querySelectorAll(
                "#schoolTimetable td[data-day]"
            )
            .forEach(cell => {

                const item =
                    data.find(entry =>
                        String(entry.className)
                            .toLowerCase() ===
                        String(className)
                            .toLowerCase()
                        &&
                        entry.day ===
                        cell.dataset.day
                        &&
                        entry.time ===
                        cell.dataset.time
                    );


                if (item) {

                    cell.dataset.id =
                        item.id;

                    cell.innerHTML = `
                        <div class="timetable-subject">
                            ${escapeTimetableText(
                                item.subject
                            )}
                        </div>

                        <div class="timetable-teacher">
                            (${escapeTimetableText(
                                item.teacher
                            )})
                        </div>
                    `;

                } else {

                    delete cell.dataset.id;

                    cell.innerHTML = `
                        <span class="empty-timetable">
                            +
                        </span>
                    `;
                }

            });

    } catch (error) {

        console.error(
            "TIMETABLE LOAD ERROR:",
            error
        );
    }
}


function escapeTimetableText(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


async function editTimetableCell(
    cell,
    day,
    time
) {

    const className =
        getSelectedTimetableClass();


    const oldSubject =
        cell.querySelector(
            ".timetable-subject"
        )?.textContent || "";


    const oldTeacher =
        cell.querySelector(
            ".timetable-teacher"
        )?.textContent
            .replace(/[()]/g, "")
            .trim() || "";


    const subject =
        prompt(
            `${className}\n${day}\n${time}\n\nSubject:`,
            oldSubject
        );


    if (subject === null) return;


    const cleanSubject =
        subject.trim();


    if (!cleanSubject) {

        if (cell.dataset.id) {

            await deleteTimetableEntry(
                cell.dataset.id
            );

        }

        await loadTimetableGrid();

        return;
    }


    const teacher =
        prompt(
            `Teacher for ${cleanSubject}:`,
            oldTeacher
        );


    if (teacher === null) return;


    const cleanTeacher =
        teacher.trim();


    if (!cleanTeacher) {

        alert(
            "Please enter the teacher name."
        );

        return;
    }


    try {

        let response;


        if (cell.dataset.id) {

            response =
                await fetch(
                    `${API_URL}/timetable/${cell.dataset.id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            day,
                            className,
                            subject:
                                cleanSubject,
                            teacher:
                                cleanTeacher,
                            time
                        })
                    }
                );

        } else {

            response =
                await fetch(
                    `${API_URL}/timetable`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            day,
                            className,
                            subject:
                                cleanSubject,
                            teacher:
                                cleanTeacher,
                            time
                        })
                    }
                );
        }


        if (!response.ok) {

            const result =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                result.error ||
                "Could not save timetable"
            );
        }


        await loadTimetableGrid();

    } catch (error) {

        console.error(
            "TIMETABLE SAVE ERROR:",
            error
        );

        alert(
            "Could not save the timetable entry."
        );
    }
}


async function deleteTimetableEntry(id) {

    try {

        await fetch(
            `${API_URL}/timetable/${id}`,
            {
                method: "DELETE"
            }
        );

    } catch (error) {

        console.error(
            "TIMETABLE DELETE ERROR:",
            error
        );
    }
}


/* =========================================================
   EDIT TIMES BUTTON
========================================================= */

function editTimetableTimes() {

    const editor =
        document.getElementById(
            "timetableTimeEditor"
        );

    const fields =
        document.getElementById(
            "timeEditorFields"
        );

    if (!editor || !fields) return;


    fields.innerHTML = "";


    timetablePeriods.forEach(
        (period, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "time-editor-field";


            wrapper.innerHTML = `
                <label>
                    Period ${index + 1}
                </label>

                <input
                    type="text"
                    class="timetable-time-input"
                    value="${escapeTimetableText(period)}"
                >
            `;


            fields.appendChild(wrapper);

        }
    );


    editor.style.display = "block";


    editor.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function saveTimetableTimes() {

    const inputs =
        document.querySelectorAll(
            ".timetable-time-input"
        );


    const newPeriods =
        Array.from(inputs)
            .map(input =>
                input.value.trim()
            );


    if (
        newPeriods.length === 0 ||
        newPeriods.some(
            period => !period
        )
    ) {

        alert(
            "Every timetable period needs a time."
        );

        return;
    }


    timetablePeriods =
        newPeriods;

    savePeriodsToBrowser();

    renderTimetable();

    closeTimetableTimeEditor();


    alert(
        "Timetable times updated successfully."
    );
}


function closeTimetableTimeEditor() {

    const editor =
        document.getElementById(
            "timetableTimeEditor"
        );

    if (editor) {
        editor.style.display = "none";
    }
}


/* =========================================================
   ADD PERIOD
========================================================= */

function addTimetablePeriod() {

    const newTime =
        prompt(
            "Enter the new period time.\n\nExample:\n2:20 PM - 3:05 PM"
        );


    if (!newTime) return;


    timetablePeriods.push(
        newTime.trim()
    );


    savePeriodsToBrowser();

    renderTimetable();


    alert(
        "New period added."
    );
}


/* =========================================================
   CLASS SWITCHER
========================================================= */

function setupTimetableClassSwitcher() {

    const selector =
        document.getElementById(
            "timetableClassSelect"
        );

    if (!selector) return;


    selector.addEventListener(
        "change",
        () => {

            renderTimetable();

        }
    );
}


/* =========================================================
   LOAD TIMETABLE
========================================================= */

function loadTimetable() {

    timetablePeriods =
        getTimetablePeriods();

    renderTimetable();
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupTimetableClassSwitcher();

        if (
            document.getElementById(
                "schoolTimetable"
            )
        ) {
            renderTimetable();
        }

    }
);


/* =========================================================
   CLASS DASHBOARD
========================================================= */

let currentClassDashboard = null;


/* OPEN CLASS DASHBOARD */



/* =========================================================
   REAL CLASS WORKSPACE
========================================================= */


let currentClassDashboardId = null;


/* OPEN CLASS WORKSPACE */



async function openClassDashboard(classId) {

    try {

        console.log("Opening dashboard for class:", classId);

        const response = await fetch(API_URL + "/classes");

        if (!response.ok) {
            throw new Error(
                "Could not load classes (" +
                response.status +
                ")"
            );
        }

        const result = await response.json();

        console.log("Classes API response:", result);

        /*
         * Your API may return:
         *   an array
         *   { classes: [...] }
         *   { data: [...] }
         *   { rows: [...] }
         */

        let classList = [];

        if (Array.isArray(result)) {
            classList = result;
        } else if (Array.isArray(result.classes)) {
            classList = result.classes;
        } else if (Array.isArray(result.data)) {
            classList = result.data;
        } else if (Array.isArray(result.rows)) {
            classList = result.rows;
        }

        if (!Array.isArray(classList)) {
            throw new Error("Invalid classes data");
        }

        const selectedClass = classList.find(
            cls => Number(cls.id) === Number(classId)
        );

        if (!selectedClass) {
            throw new Error(
                "Class ID " + classId + " was not found"
            );
        }

        currentClassDashboard = selectedClass;
        currentClassDashboardId = selectedClass.id;

        console.log(
            "Selected class:",
            selectedClass
        );

        if (typeof showSection === "function") {
            showSection("classDashboard");
        }

        const title =
            document.getElementById(
                "classDashboardTitle"
            );

        const teacher =
            document.getElementById(
                "classDashboardTeacher"
            );

        const info =
            document.getElementById(
                "classDashboardInfo"
            );

        const studentsBox =
            document.getElementById(
                "classDashboardStudents"
            );

        const className =
            selectedClass.name ||
            selectedClass.className ||
            "Class";

        const teacherName =
            selectedClass.assignedTeacherName ||
            selectedClass.assignedTeacher ||
            selectedClass.teacher ||
            "Not assigned";

        const students =
            Array.isArray(selectedClass.students)
                ? selectedClass.students
                : [];

        if (title) {
            title.textContent =
                className + " Class Dashboard";
        }

        if (teacher) {
            teacher.textContent =
                "Teacher: " + teacherName;
        }

        if (info) {

            info.innerHTML = `
                <div class="class-dashboard-info-card">
                    <strong>Class</strong>
                    <span>
                        ${escapeClassDashboardHTML(className)}
                    </span>
                </div>

                <div class="class-dashboard-info-card">
                    <strong>Teacher</strong>
                    <span>
                        ${escapeClassDashboardHTML(teacherName)}
                    </span>
                </div>

                <div class="class-dashboard-info-card">
                    <strong>Room</strong>
                    <span>
                        ${escapeClassDashboardHTML(
                            selectedClass.room ||
                            "Not assigned"
                        )}
                    </span>
                </div>

                <div class="class-dashboard-info-card">
                    <strong>Students</strong>
                    <span>
                        ${students.length}
                    </span>
                </div>
            `;
        }

        if (typeof renderClassDashboardStudents === "function") {
            renderClassDashboardStudents(students);
        }

        if (
            typeof loadClassDashboardAnnouncements ===
            "function"
        ) {
            await loadClassDashboardAnnouncements(
                className
            );
        }

        if (
            typeof addClassWorkspaceControls ===
            "function"
        ) {
            addClassWorkspaceControls();
        }

        

    } catch (error) {

        console.error(
            "Class dashboard error:",
            error
        );

        alert(
            "Could not open this class. " +
            error.message
        );
    }
}




/* CLASS STUDENTS */

function renderClassDashboardStudents(students) {

    const container =
        document.getElementById(
            "classDashboardStudents"
        );

    if (!container) return;


    if (!students.length) {

        container.innerHTML = `

            <div style="
                padding:20px;
                text-align:center;
                border:1px solid #ddd;
                border-radius:10px;
            ">

                <p>No students in this class yet.</p>

                <button
                    type="button"
                    class="primary-button"
                    onclick="addStudentToCurrentClass()"
                >
                    ➕ Add Student
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
            flex-wrap:wrap;
            margin-bottom:15px;
        ">

            <strong>
                👨‍🎓 Students (${students.length})
            </strong>

            <button
                type="button"
                class="primary-button"
                onclick="addStudentToCurrentClass()"
            >
                ➕ Add Student
            </button>

        </div>


        <div style="overflow-x:auto;">

            <table style="
                width:100%;
                border-collapse:collapse;
            ">

                <thead>

                    <tr>

                        <th style="padding:10px;text-align:left;">
                            #
                        </th>

                        <th style="padding:10px;text-align:left;">
                            Student
                        </th>

                        <th style="padding:10px;text-align:left;">
                            Age
                        </th>

                        <th style="padding:10px;text-align:left;">
                            Class
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${students.map((student,index) => `

                        <tr>

                            <td style="padding:10px;">
                                ${index + 1}
                            </td>

                            <td style="padding:10px;">
                                ${escapeClassDashboardHTML(
                                    student.name || "Unnamed"
                                )}
                            </td>

                            <td style="padding:10px;">
                                ${escapeClassDashboardHTML(
                                    student.age ?? "-"
                                )}
                            </td>

                            <td style="padding:10px;">
                                ${escapeClassDashboardHTML(
                                    student.className || "-"
                                )}
                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        </div>

    `;
}


/* ADD STUDENT TO CURRENT CLASS */

function addStudentToCurrentClass() {

    if (!currentClassDashboard) {
        alert("No class selected.");
        return;
    }


    const className =
        currentClassDashboard.name ||
        currentClassDashboard.className ||
        "";


    const classInput =
        document.getElementById(
            "studentClass"
        );

    if (classInput) {
        classInput.value = className;
    }


    if (
        typeof openModal === "function"
    ) {

        openModal("studentModal");

    } else {

        alert(
            "Student form could not be opened."
        );

    }

}


/* LOAD ANNOUNCEMENTS FOR THIS CLASS */

async function loadClassDashboardAnnouncements(className) {

    const container =
        document.getElementById(
            "classDashboardAnnouncements"
        );

    if (!container) return;


    container.innerHTML =
        "<p>Loading announcements...</p>";


    try {

        const response = await fetch(
            `${API_URL}/announcements?className=${encodeURIComponent(className)}`
        );

        if (!response.ok) {
            throw new Error(
                "Could not load announcements."
            );
        }

        const announcements =
            await response.json();


        if (
            !Array.isArray(announcements) ||
            announcements.length === 0
        ) {

            container.innerHTML = `

                <p>
                    No announcements for
                    ${escapeClassDashboardHTML(className)}.
                </p>

            `;

            return;
        }


        container.innerHTML =
            announcements.map(item => `

                <div style="
                    border:1px solid #ddd;
                    padding:15px;
                    margin-bottom:10px;
                    border-radius:10px;
                ">

                    <h4>
                        📢
                        ${escapeClassDashboardHTML(
                            item.title || "Announcement"
                        )}
                    </h4>

                    <p>
                        ${escapeClassDashboardHTML(
                            item.message || ""
                        )}
                    </p>

                    <small>
                        📅
                        ${escapeClassDashboardHTML(
                            item.date || ""
                        )}
                    </small>

                </div>

            `).join("");


    } catch (error) {

        console.error(
            "Announcement error:",
            error
        );

        container.innerHTML =
            "<p>Could not load announcements.</p>";

    }

}


/* ADD WORKSPACE CONTROLS */

function addClassWorkspaceControls() {

    const dashboard =
        document.getElementById("classDashboard");

    if (!dashboard) return;

    let controls =
        document.getElementById("classWorkspaceControls");

    if (controls) {
        controls.remove();
    }

    const className =
        currentClassDashboard?.name ||
        currentClassDashboard?.className ||
        "Class";

    const teacherName =
        currentClassDashboard?.teacher ||
        currentClassDashboard?.assignedTeacherName ||
        "Teacher";

    controls =
        document.createElement("div");

    controls.id =
        "classWorkspaceControls";

    controls.innerHTML = `

        <div class="professional-teacher-dashboard">

            <!-- HEADER -->

            <div class="teacher-portal-header">

                <div class="teacher-portal-brand">

                    <div class="teacher-portal-logo">
                        🏫
                    </div>

                    <div>

                        <div class="teacher-portal-small">
                            TEACHER PORTAL
                        </div>

                        <h2>
                            ${escapeClassDashboardHTML(className)}
                        </h2>

                        <p>
                            Welcome back, ${escapeClassDashboardHTML(teacherName)}
                        </p>

                    </div>

                </div>

                <div class="teacher-status">
                    <span class="status-dot"></span>
                    Class Active
                </div>

            </div>


            <!-- QUICK STATS -->

            <div class="teacher-quick-stats">

                <div class="teacher-stat-card">

                    <div class="teacher-stat-icon students">
                        👨‍🎓
                    </div>

                    <div>
                        <span>
                            STUDENTS
                        </span>

                        <strong id="teacherStudentCount">
                            0
                        </strong>
                    </div>

                </div>


                <div class="teacher-stat-card">

                    <div class="teacher-stat-icon timetable">
                        📅
                    </div>

                    <div>
                        <span>
                            TIMETABLE
                        </span>

                        <strong>
                            View
                        </strong>
                    </div>

                </div>


                <div class="teacher-stat-card">

                    <div class="teacher-stat-icon announcements">
                        📢
                    </div>

                    <div>
                        <span>
                            ANNOUNCEMENTS
                        </span>

                        <strong>
                            View
                        </strong>
                    </div>

                </div>


                <div class="teacher-stat-card">

                    <div class="teacher-stat-icon classroom">
                        🏫
                    </div>

                    <div>
                        <span>
                            CLASSROOM
                        </span>

                        <strong>
                            ${escapeClassDashboardHTML(
                                currentClassDashboard?.room ||
                                "Not assigned"
                            )}
                        </strong>
                    </div>

                </div>

            </div>


            <!-- MANAGEMENT -->

            <div class="teacher-management">

                <div class="teacher-management-title">

                    <div>

                        <span>
                            CLASS MANAGEMENT
                        </span>

                        <h3>
                            Manage your classroom
                        </h3>

                    </div>

                    <button
                        type="button"
                        class="teacher-refresh-button"
                        onclick="refreshClassDashboard()"
                    >
                        🔄 Refresh
                    </button>

                </div>


                <div class="teacher-management-grid">

                    <button
                        type="button"
                        class="teacher-management-card add"
                        onclick="addStudentToCurrentClass()"
                    >

                        <div class="management-icon">
                            ➕
                        </div>

                        <div class="management-text">

                            <strong>
                                Add Student
                            </strong>

                            <span>
                                Register a new student
                                in this class
                            </span>

                        </div>

                        <b>→</b>

                    </button>


                    <button
                        type="button"
                        class="teacher-management-card schedule"
                        onclick="openClassTimetable()"
                    >

                        <div class="management-icon">
                            📅
                        </div>

                        <div class="management-text">

                            <strong>
                                Class Timetable
                            </strong>

                            <span>
                                View lessons and
                                class schedule
                            </span>

                        </div>

                        <b>→</b>

                    </button>


                    <button
                        type="button"
                        class="teacher-management-card notice"
                        onclick="openClassAnnouncements()"
                    >

                        <div class="management-icon">
                            📢
                        </div>

                        <div class="management-text">

                            <strong>
                                Announcements
                            </strong>

                            <span>
                                View important class
                                announcements
                            </span>

                        </div>

                        <b>→</b>

                    </button>


                    <button
                        type="button"
                        class="teacher-management-card students"
                        onclick="openClassStudents()"
                    >

                        <div class="management-icon">
                            👨‍🎓
                        </div>

                        <div class="management-text">

                            <strong>
                                Student Directory
                            </strong>

                            <span>
                                View students in this class
                            </span>

                        </div>

                        <b>→</b>

                    </button>

                </div>

            </div>

        </div>

    `;


    const styleId =
        "professionalTeacherDashboardStyles";

    if (!document.getElementById(styleId)) {

        const style =
            document.createElement("style");

        style.id = styleId;

        style.textContent = `

            #classWorkspaceControls {
                margin-top: 26px;
                padding: 0;
                border: 0;
                background: transparent;
            }

            .professional-teacher-dashboard {
                overflow: hidden;
                border-radius: 22px;
                background: #f1f5f9;
                box-shadow:
                    0 15px 45px rgba(15,23,42,.12);
                border: 1px solid #dbe3ee;
            }

            .teacher-portal-header {
                min-height: 170px;
                padding: 30px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;

                background:
                    radial-gradient(
                        circle at 85% 20%,
                        rgba(59,130,246,.35),
                        transparent 28%
                    ),
                    radial-gradient(
                        circle at 10% 100%,
                        rgba(14,165,233,.25),
                        transparent 30%
                    ),
                    linear-gradient(
                        135deg,
                        #0f172a,
                        #172554 55%,
                        #1e3a8a
                    );
            }

            .teacher-portal-brand {
                display: flex;
                align-items: center;
                gap: 18px;
            }

            .teacher-portal-logo {
                width: 64px;
                height: 64px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 18px;
                font-size: 30px;
                background: rgba(255,255,255,.12);
                border: 1px solid rgba(255,255,255,.2);
                box-shadow:
                    0 10px 25px rgba(0,0,0,.2);
            }

            .teacher-portal-small {
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 2px;
                color: #93c5fd;
                margin-bottom: 5px;
            }

            .teacher-portal-header h2 {
                margin: 0;
                font-size: 30px;
                font-weight: 800;
            }

            .teacher-portal-header p {
                margin: 6px 0 0;
                color: #cbd5e1;
                font-size: 14px;
            }

            .teacher-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 9px 14px;
                border-radius: 999px;
                background: rgba(255,255,255,.1);
                border: 1px solid rgba(255,255,255,.15);
                font-size: 12px;
                font-weight: 700;
                white-space: nowrap;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #22c55e;
                box-shadow:
                    0 0 0 4px rgba(34,197,94,.15);
            }

            .teacher-quick-stats {
                display: grid;
                grid-template-columns:
                    repeat(4, minmax(0,1fr));
                gap: 14px;
                padding: 18px;
                background: #e8eef7;
            }

            .teacher-stat-card {
                display: flex;
                align-items: center;
                gap: 13px;
                padding: 17px;
                background: white;
                border-radius: 16px;
                border: 1px solid #dce4ef;
                box-shadow:
                    0 5px 15px rgba(15,23,42,.05);
            }

            .teacher-stat-icon {
                width: 46px;
                height: 46px;
                min-width: 46px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 13px;
                font-size: 21px;
            }

            .teacher-stat-icon.students {
                background: #dbeafe;
            }

            .teacher-stat-icon.timetable {
                background: #ede9fe;
            }

            .teacher-stat-icon.announcements {
                background: #fef3c7;
            }

            .teacher-stat-icon.classroom {
                background: #dcfce7;
            }

            .teacher-stat-card span {
                display: block;
                color: #64748b;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: .8px;
            }

            .teacher-stat-card strong {
                display: block;
                margin-top: 4px;
                color: #0f172a;
                font-size: 16px;
            }

            .teacher-management {
                padding: 25px;
                background: #f8fafc;
            }

            .teacher-management-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 15px;
                margin-bottom: 18px;
            }

            .teacher-management-title span {
                color: #64748b;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 1.5px;
            }

            .teacher-management-title h3 {
                margin: 4px 0 0;
                color: #0f172a;
                font-size: 20px;
            }

            .teacher-refresh-button {
                border: 0;
                padding: 10px 15px;
                border-radius: 10px;
                background: #0f172a;
                color: white;
                font-weight: 700;
                cursor: pointer;
                transition: .2s;
            }

            .teacher-refresh-button:hover {
                background: #1e3a8a;
                transform: translateY(-1px);
            }

            .teacher-management-grid {
                display: grid;
                grid-template-columns:
                    repeat(2, minmax(0,1fr));
                gap: 15px;
            }

            .teacher-management-card {
                min-height: 110px;
                border: 1px solid #dce4ef;
                border-radius: 16px;
                padding: 17px;
                display: flex;
                align-items: center;
                gap: 14px;
                text-align: left;
                cursor: pointer;
                background: white;
                transition:
                    transform .18s ease,
                    box-shadow .18s ease,
                    border-color .18s ease;
            }

            .teacher-management-card:hover {
                transform: translateY(-3px);
                box-shadow:
                    0 12px 25px rgba(15,23,42,.09);
            }

            .teacher-management-card.add:hover {
                border-color: #60a5fa;
            }

            .teacher-management-card.schedule:hover {
                border-color: #a78bfa;
            }

            .teacher-management-card.notice:hover {
                border-color: #fbbf24;
            }

            .teacher-management-card.students:hover {
                border-color: #34d399;
            }

            .management-icon {
                width: 50px;
                height: 50px;
                min-width: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                font-size: 23px;
            }

            .add .management-icon {
                background: #dbeafe;
            }

            .schedule .management-icon {
                background: #ede9fe;
            }

            .notice .management-icon {
                background: #fef3c7;
            }

            .students .management-icon {
                background: #dcfce7;
            }

            .management-text {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .management-text strong {
                color: #0f172a;
                font-size: 15px;
            }

            .management-text span {
                color: #64748b;
                font-size: 12px;
                line-height: 1.4;
            }

            .teacher-management-card b {
                color: #94a3b8;
                font-size: 21px;
                transition: transform .18s ease;
            }

            .teacher-management-card:hover b {
                transform: translateX(4px);
                color: #334155;
            }

            @media (max-width: 850px) {

                .teacher-quick-stats {
                    grid-template-columns:
                        repeat(2, minmax(0,1fr));
                }

            }

            @media (max-width: 600px) {

                .teacher-portal-header {
                    padding: 22px;
                    align-items: flex-start;
                    flex-direction: column;
                }

                .teacher-portal-header h2 {
                    font-size: 24px;
                }

                .teacher-quick-stats,
                .teacher-management-grid {
                    grid-template-columns: 1fr;
                }

                .teacher-management {
                    padding: 18px;
                }

                .teacher-management-title {
                    align-items: flex-start;
                    flex-direction: column;
                }

            }

        `;

        document.head.appendChild(style);
    }


    const info =
        document.getElementById("classDashboardInfo");

    if (info && info.parentElement) {

        info.parentElement.insertAdjacentElement(
            "afterend",
            controls
        );

    } else {

        dashboard.prepend(controls);

    }


    /* UPDATE STUDENT COUNT */

    const students =
        Array.isArray(currentClassDashboard?.students)
            ? currentClassDashboard.students
            : [];

    const count =
        document.getElementById("teacherStudentCount");

    if (count) {
        count.textContent = students.length;
    }

}


/* OPEN STUDENTS */

function openClassStudents() {

    const element =
        document.getElementById(
            "classDashboardStudents"
        );

    if (element) {

        element.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* OPEN ANNOUNCEMENTS */

function openClassAnnouncements() {

    const element =
        document.getElementById(
            "classDashboardAnnouncements"
        );

    if (element) {

        element.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* OPEN TIMETABLE FOR CURRENT CLASS */

function openClassTimetable() {

    if (!currentClassDashboard) {
        alert("No class selected.");
        return;
    }


    const className =
        currentClassDashboard.name ||
        currentClassDashboard.className ||
        "";


    showSection("timetable");


    const selectors =
        document.querySelectorAll(
            "select"
        );


    selectors.forEach(select => {

        const options =
            Array.from(
                select.options || []
            );

        const match =
            options.find(
                option =>
                    String(option.textContent)
                        .trim()
                        .toLowerCase() ===
                    String(className)
                        .trim()
                        .toLowerCase()
            );

        if (match) {
            select.value = match.value;
        }

    });


    if (
        typeof loadTimetable === "function"
    ) {

        setTimeout(
            () => loadTimetable(),
            100
        );

    }

}


/* OPEN REGISTER */

function openClassRegister() {

    if (!currentClassDashboard) {
        alert("No class selected.");
        return;
    }

    const classId =
        currentClassDashboard.id;

    const className =
        currentClassDashboard.name ||
        currentClassDashboard.className ||
        "Class";

    currentClassDashboardId = classId;

    if (typeof createAttendanceSection === "function") {
        createAttendanceSection();
    }

    const attendanceSection =
        document.getElementById("attendance");

    if (!attendanceSection) {
        alert("The attendance section is not available yet.");
        return;
    }

    document.querySelectorAll(".section").forEach(section => {
        section.style.display = "none";
        section.classList.remove("active");
    });

    attendanceSection.style.display = "block";
    attendanceSection.classList.add("active");

    const heading =
        attendanceSection.querySelector("h2");

    if (heading) {
        heading.textContent =
            "📋 " + className + " — Daily Register";
    }

    if (typeof loadAttendance === "function") {

        try {
            loadAttendance(classId, className);
        } catch (error) {
            console.error("Attendance loading error:", error);
        }

    }

}


/* ATTENDANCE HISTORY */

function openClassAttendanceHistory() {

    if (!currentClassDashboard) {
        alert("No class selected.");
        return;
    }

    const classId =
        currentClassDashboard.id;

    const className =
        currentClassDashboard.name ||
        currentClassDashboard.className ||
        "Class";

    currentClassDashboardId =
        classId;

    /* Create the history section */

    if (
        typeof createMonthlyAttendanceSection ===
        "function"
    ) {
        createMonthlyAttendanceSection();
    }

    const section =
        document.getElementById(
            "monthlyAttendance"
        );

    if (!section) {
        alert(
            "Attendance History could not be opened."
        );
        return;
    }

    /* Hide every other section */

    document
        .querySelectorAll(".section")
        .forEach(item => {

            item.style.display =
                "none";

            item.classList.remove(
                "active"
            );

        });

    /* Show Attendance History */

    section.style.display =
        "block";

    section.classList.add(
        "active"
    );

    /* Change heading */

    const heading =
        section.querySelector("h2");

    if (heading) {

        heading.textContent =
            "📊 " +
            className +
            " — Attendance History";

    }

    /* Add class information */

    let classInfo =
        document.getElementById(
            "monthlyAttendanceClassInfo"
        );

    if (!classInfo) {

        classInfo =
            document.createElement(
                "p"
            );

        classInfo.id =
            "monthlyAttendanceClassInfo";

        classInfo.style.fontWeight =
            "600";

        const header =
            section.querySelector(
                ".section-header"
            );

        if (header) {
            header.appendChild(
                classInfo
            );
        }

    }

    if (classInfo) {

        classInfo.textContent =
            "Class: " +
            className;

    }

    /* Load the current month */

    const input =
        document.getElementById(
            "monthlyAttendanceDate"
        );

    if (input && !input.value) {

        input.value =
            new Date()
                .toISOString()
                .slice(0, 7);

    }

    /* Load history */

    if (
        typeof loadMonthlyAttendance ===
        "function"
    ) {

        loadMonthlyAttendance(
            classId,
            className
        );

    }

}


/* REFRESH */





async function refreshClassDashboard() {

    if (!currentClassDashboardId) {
        return;
    }

    await openClassDashboard(
        currentClassDashboardId
    );

}


/* SAFE HTML */

function escapeClassDashboardHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



