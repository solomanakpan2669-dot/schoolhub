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
                    <div class="student-name-cell">

                        ${studentAvatar(student)}

                        <span>
                            ${escapeHTML(
                                student.name ||
                                "Unnamed"
                            )}
                        </span>

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

        alert(
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

        alert(
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

        alert(error.message);
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

        alert(
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

        alert(
            "Student deleted successfully."
        );

        await loadStudents();

    } catch (error) {

        console.error(
            "DELETE STUDENT ERROR:",
            error
        );

        alert(error.message);
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

        alert(
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

        alert(
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

        alert(
            "Please open a student profile first."
        );

        return;
    }


    const file =
        input.files[0];


    if (
        !file.type.startsWith("image/")
    ) {

        alert(
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

        alert(error.message);
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

        alert(error.message);
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
        Number(id);


    const name =
        getElement("teacherName");

    const age =
        getElement("teacherAge");

    const subject =
        getElement("teacherSubject");

    const email =
        getElement("teacherEmail");


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


    if (
        !name ||
        !age ||
        !subject ||
        !email
    ) {

        alert(
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
                    email
                })
            }
        );


        alert(
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

        alert(error.message);
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


        alert(
            "Teacher deleted successfully."
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

        alert(
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


function renderClasses(list = classes) {

    const table =
        getElement("classesTable");


    if (!table) return;


    if (!list.length) {

        table.innerHTML =
            '<tr><td colspan="5">No classes found.</td></tr>';

        return;
    }


    table.innerHTML =
        list.map(item => `

            <tr>

                <td>
                    ${escapeHTML(item.id)}
                </td>

                <td>
                    ${escapeHTML(
                        item.name ||
                        item.className ||
                        ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.teacher ||
                        item.teacherName ||
                        ""
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.room ||
                        item.roomNumber ||
                        ""
                    )}
                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editClass(${Number(item.id)})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteClass(${Number(item.id)})"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `).join("");
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

        alert(
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

        alert(
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


        alert(
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

        alert(error.message);
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


        alert(
            "Class deleted successfully."
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
        "attendance",
        "monthlyAttendance"
    ];


    if (
        !validSections.includes(name)
    ) {
        return;
    }


    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

            section.style.display =
                "none";
        });


    const selected =
        getElement(name);


    if (selected) {

        selected.classList.add(
            "active"
        );

        selected.style.display =
            "block";
    }


    const buttons =
        document.querySelectorAll(
            ".tab-button"
        );


    buttons.forEach(button => {

        button.classList.remove(
            "active"
        );


        const text =
            button.textContent
                .toLowerCase();


        if (
            (name === "students" &&
                text.includes("students")) ||

            (name === "teachers" &&
                text.includes("teachers")) ||

            (name === "classes" &&
                text.includes("classes")) ||

            (name === "attendance" &&
                text.includes("attendance") &&
                !text.includes("monthly")) ||

            (name === "monthlyAttendance" &&
                text.includes("monthly"))
        ) {

            button.classList.add(
                "active"
            );
        }
    });


    if (name === "students") {
        loadStudents();
    }


    if (name === "teachers") {
        loadTeachers();
    }


    if (name === "classes") {
        loadClasses();
    }


    if (name === "attendance") {

        createAttendanceSection();

        const section =
            getElement("attendance");

        if (section) {
            section.style.display =
                "block";
        }
    }


    if (
        name ===
        "monthlyAttendance"
    ) {

        createMonthlyAttendanceSection();

        const section =
            getElement(
                "monthlyAttendance"
            );

        if (section) {
            section.style.display =
                "block";
        }
    }
}


/* =========================================================
   ATTENDANCE
========================================================= */

function createAttendanceSection() {

    if (
        getElement("attendance")
    ) {
        return;
    }


    const nav =
        document.querySelector("nav");


    if (nav) {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "tab-button";

        button.textContent =
            "📋 Attendance";

        button.type =
            "button";

        button.onclick =
            () =>
                showSection(
                    "attendance"
                );

        nav.appendChild(
            button
        );
    }


    const main =
        document.querySelector("main");


    if (!main) return;


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "attendance";

    section.className =
        "section";

    section.style.display =
        "none";


    section.innerHTML = `

        <div class="section-header">

            <div>

                <h2>
                    Attendance
                </h2>

                <p>
                    Mark and manage student attendance
                </p>

            </div>

        </div>


        <div
            style="
                display:flex;
                gap:12px;
                align-items:center;
                flex-wrap:wrap;
                margin:20px 0;
            "
        >

            <label>
                <strong>Date:</strong>
            </label>

            <input
                type="date"
                id="attendanceDate"
                style="
                    padding:10px;
                    border:1px solid #d1d5db;
                    border-radius:8px;
                "
            >

            <button
                type="button"
                class="primary-button"
                onclick="loadAttendance()"
            >
                Load Attendance
            </button>

        </div>


        <div
            id="attendanceSummary"
            style="
                margin-bottom:15px;
                font-weight:600;
            "
        ></div>


        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>

                        <th>
                            Student
                        </th>

                        <th>
                            Class
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody
                    id="attendanceTable"
                >

                    <tr>

                        <td colspan="3">
                            Select a date and load attendance.
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>


        <div style="margin-top:20px;">

            <button
                type="button"
                class="primary-button"
                onclick="saveAttendance()"
            >
                💾 Save Attendance
            </button>

        </div>
    `;


    main.appendChild(
        section
    );


    const dateInput =
        getElement(
            "attendanceDate"
        );


    if (dateInput) {

        dateInput.value =
            new Date()
                .toISOString()
                .slice(0, 10);
    }
}


async function loadAttendance() {

    const dateInput =
        getElement(
            "attendanceDate"
        );

    const table =
        getElement(
            "attendanceTable"
        );


    if (
        !dateInput ||
        !table
    ) {
        return;
    }


    const date =
        dateInput.value;


    if (!date) {

        alert(
            "Please select a date."
        );

        return;
    }


    try {

        if (!students.length) {
            await loadStudents();
        }


        allStudents =
            students;


        const data =
            await getJSON(
                `${API_URL}/attendance?date=${encodeURIComponent(date)}`
            );


        attendanceRecords =
            {};


        if (Array.isArray(data)) {

            data.forEach(
                record => {

                    attendanceRecords[
                        Number(
                            record.studentId
                        )
                    ] =
                        record.status;
                }
            );
        }


        renderAttendance();

    } catch (error) {

        console.error(
            "LOAD ATTENDANCE ERROR:",
            error
        );


        table.innerHTML = `

            <tr>

                <td colspan="3">
                    Failed to load attendance.
                </td>

            </tr>

        `;
    }
}


function renderAttendance() {

    const table =
        getElement(
            "attendanceTable"
        );

    const summary =
        getElement(
            "attendanceSummary"
        );


    if (!table) return;


    allStudents =
        students;


    if (!allStudents.length) {

        table.innerHTML = `

            <tr>

                <td colspan="3">
                    No students found.
                </td>

            </tr>

        `;

        return;
    }


    table.innerHTML =
        allStudents.map(
            student => {

                const id =
                    Number(
                        student.id
                    );


                const status =
                    attendanceRecords[id] ||
                    "Present";


                const photo =
                    student.photo

                        ? `

                            <img
                                src="${escapeHTML(student.photo)}"
                                style="
                                    width:38px;
                                    height:38px;
                                    border-radius:50%;
                                    object-fit:cover;
                                "
                            >

                        `

                        : `

                            <div
                                style="
                                    width:38px;
                                    height:38px;
                                    border-radius:50%;
                                    display:inline-flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:linear-gradient(
                                        135deg,
                                        #2563eb,
                                        #7c3aed
                                    );
                                    color:white;
                                    font-weight:700;
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


                return `

                    <tr>

                        <td>

                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                "
                            >

                                ${photo}

                                <strong>
                                    ${escapeHTML(
                                        student.name
                                    )}
                                </strong>

                            </div>

                        </td>


                        <td>
                            ${escapeHTML(
                                student.className
                            )}
                        </td>


                        <td>

                            <select
                                onchange="
                                    setAttendanceStatus(
                                        ${id},
                                        this.value
                                    )
                                "
                                style="
                                    padding:8px;
                                    border-radius:8px;
                                    border:1px solid #d1d5db;
                                "
                            >

                                <option
                                    value="Present"
                                    ${
                                        status ===
                                        "Present"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Present
                                </option>

                                <option
                                    value="Absent"
                                    ${
                                        status ===
                                        "Absent"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Absent
                                </option>

                                <option
                                    value="Late"
                                    ${
                                        status ===
                                        "Late"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Late
                                </option>

                            </select>

                        </td>

                    </tr>

                `;
            }
        ).join("");


    updateAttendanceSummary();
}


function setAttendanceStatus(
    studentId,
    status
) {

    attendanceRecords[
        Number(studentId)
    ] =
        status;


    updateAttendanceSummary();
}


function updateAttendanceSummary() {

    const summary =
        getElement(
            "attendanceSummary"
        );


    if (!summary) return;


    allStudents =
        students;


    let present = 0;
    let absent = 0;
    let late = 0;


    allStudents.forEach(
        student => {

            const status =
                attendanceRecords[
                    Number(student.id)
                ] ||
                "Present";


            if (status === "Present") {
                present++;
            }

            if (status === "Absent") {
                absent++;
            }

            if (status === "Late") {
                late++;
            }
        }
    );


    summary.textContent =
        `Present: ${present} | ` +
        `Absent: ${absent} | ` +
        `Late: ${late}`;
}


async function saveAttendance() {

    const dateInput =
        getElement(
            "attendanceDate"
        );


    if (
        !dateInput ||
        !dateInput.value
    ) {

        alert(
            "Please select a date."
        );

        return;
    }


    allStudents =
        students;


    const records =
        allStudents.map(
            student => ({

                studentId:
                    Number(student.id),

                status:
                    attendanceRecords[
                        Number(student.id)
                    ] ||
                    "Present"
            })
        );


    try {

        await getJSON(
            `${API_URL}/attendance`,
            {

                method: "POST",

                body: JSON.stringify({

                    date:
                        dateInput.value,

                    records
                })
            }
        );


        alert(
            "Attendance saved successfully!"
        );


        await loadAttendance();

    } catch (error) {

        console.error(
            "SAVE ATTENDANCE ERROR:",
            error
        );

        alert(error.message);
    }
}


/* =========================================================
   MONTHLY ATTENDANCE
========================================================= */

function createMonthlyAttendanceSection() {

    if (
        getElement(
            "monthlyAttendance"
        )
    ) {
        return;
    }


    const nav =
        document.querySelector("nav");


    if (nav) {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "tab-button";

        button.type =
            "button";

        button.textContent =
            "📊 Monthly";

        button.onclick =
            () =>
                showSection(
                    "monthlyAttendance"
                );

        nav.appendChild(
            button
        );
    }


    const main =
        document.querySelector("main");


    if (!main) return;


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "monthlyAttendance";

    section.className =
        "section";

    section.style.display =
        "none";


    section.innerHTML = `

        <div class="section-header">

            <div>

                <h2>
                    Monthly Attendance
                </h2>

                <p>
                    View student attendance for an entire month
                </p>

            </div>

        </div>


        <div
            style="
                display:flex;
                gap:12px;
                align-items:center;
                flex-wrap:wrap;
                margin:20px 0;
            "
        >

            <label>
                <strong>Month:</strong>
            </label>

            <input
                type="month"
                id="monthlyAttendanceDate"
                style="
                    padding:10px;
                    border:1px solid #d1d5db;
                    border-radius:8px;
                "
            >

            <button
                type="button"
                class="primary-button"
                onclick="loadMonthlyAttendance()"
            >
                📊 View Monthly Report
            </button>

        </div>


        <div
            id="monthlyAttendanceSummary"
            style="
                margin-bottom:15px;
                font-weight:600;
            "
        ></div>


        <div style="overflow-x:auto;">

            <table>

                <thead>

                    <tr>

                        <th>
                            Student
                        </th>

                        <th>
                            Class
                        </th>

                        <th>
                            Present
                        </th>

                        <th>
                            Absent
                        </th>

                        <th>
                            Late
                        </th>

                        <th>
                            Total Days
                        </th>

                        <th>
                            Attendance
                        </th>

                    </tr>

                </thead>


                <tbody
                    id="monthlyAttendanceTable"
                >

                    <tr>

                        <td colspan="7">
                            Select a month to view attendance.
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>
    `;


    main.appendChild(
        section
    );


    const input =
        getElement(
            "monthlyAttendanceDate"
        );


    if (input) {

        input.value =
            new Date()
                .toISOString()
                .slice(0, 7);
    }
}


async function loadMonthlyAttendance() {

    const input =
        getElement(
            "monthlyAttendanceDate"
        );

    const table =
        getElement(
            "monthlyAttendanceTable"
        );

    const summary =
        getElement(
            "monthlyAttendanceSummary"
        );


    if (
        !input ||
        !table
    ) {
        return;
    }


    const month =
        input.value;


    if (!month) {

        alert(
            "Please select a month."
        );

        return;
    }


    try {

        const data =
            await getJSON(
                `${API_URL}/attendance/monthly?month=${encodeURIComponent(month)}`
            );


        if (
            !Array.isArray(data) ||
            !data.length
        ) {

            table.innerHTML = `

                <tr>

                    <td colspan="7">
                        No attendance records found.
                    </td>

                </tr>

            `;

            if (summary) {
                summary.textContent = "";
            }

            return;
        }


        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;


        table.innerHTML =
            data.map(
                student => {

                    totalPresent +=
                        Number(
                            student.present
                        ) || 0;

                    totalAbsent +=
                        Number(
                            student.absent
                        ) || 0;

                    totalLate +=
                        Number(
                            student.late
                        ) || 0;


                    const photo =
                        student.photo

                            ? `

                                <img
                                    src="${escapeHTML(student.photo)}"
                                    style="
                                        width:38px;
                                        height:38px;
                                        border-radius:50%;
                                        object-fit:cover;
                                    "
                                >

                            `

                            : `

                                <div
                                    style="
                                        width:38px;
                                        height:38px;
                                        border-radius:50%;
                                        display:inline-flex;
                                        align-items:center;
                                        justify-content:center;
                                        background:linear-gradient(
                                            135deg,
                                            #2563eb,
                                            #7c3aed
                                        );
                                        color:white;
                                        font-weight:700;
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


                    return `

                        <tr>

                            <td>

                                <div
                                    style="
                                        display:flex;
                                        align-items:center;
                                        gap:10px;
                                    "
                                >

                                    ${photo}

                                    <strong>
                                        ${escapeHTML(
                                            student.name
                                        )}
                                    </strong>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    student.className
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    student.present
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    student.absent
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    student.late
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    student.total
                                )}
                            </td>


                            <td>

                                <strong>
                                    ${escapeHTML(
                                        student.percentage
                                    )}%
                                </strong>

                            </td>

                        </tr>

                    `;
                }
            ).join("");


        if (summary) {

            summary.textContent =
                `Present: ${totalPresent} | ` +
                `Absent: ${totalAbsent} | ` +
                `Late: ${totalLate}`;
        }

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
    }
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


window.createAttendanceSection =
    createAttendanceSection;

window.loadAttendance =
    loadAttendance;

window.saveAttendance =
    saveAttendance;

window.setAttendanceStatus =
    setAttendanceStatus;


window.createMonthlyAttendanceSection =
    createMonthlyAttendanceSection;

window.loadMonthlyAttendance =
    loadMonthlyAttendance;


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
    setupApplication
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