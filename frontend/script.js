const API_URL = "/api";

let students = [];
let teachers = [];
let classes = [];

let editingStudentId = null;
let editingTeacherId = null;
let editingClassId = null;

let currentProfileStudent = null;


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
   STUDENTS
========================================================= */

async function loadStudents() {
    const table = getElement("studentsTable");

    if (table) {
        table.innerHTML =
            '<tr><td colspan="5">Loading students...</td></tr>';
    }

    try {
        const data = await getJSON(`${API_URL}/students`);

        students = Array.isArray(data)
            ? data
            : Array.isArray(data.students)
                ? data.students
                : [];

        renderStudents();
        updateStudentCount();

    } catch (error) {

        console.error("LOAD STUDENTS ERROR:", error);

        students = [];

        if (table) {
            table.innerHTML =
                `<tr><td colspan="5">${escapeHTML(error.message)}</td></tr>`;
        }

        updateStudentCount();
    }
}


function updateStudentCount() {
    const element = getElement("studentCount");

    if (element) {
        element.textContent = students.length;
    }
}


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
                (student.name || "S").charAt(0).toUpperCase()
            )}
        </div>
    `;
}


function renderStudents(list = students) {

    const table = getElement("studentsTable");

    if (!table) return;

    if (!list.length) {
        table.innerHTML =
            '<tr><td colspan="5">No students found.</td></tr>';
        return;
    }

    table.innerHTML = list.map(student => `
        <tr>

            <td>
                ${escapeHTML(student.id)}
            </td>

            <td>
                <div
                    class="student-name-cell"
                    onclick="viewStudent(${Number(student.id)})"
                    style="cursor:pointer;"
                >
                    ${studentAvatar(student)}
                    <span>
                        ${escapeHTML(student.name || "Unnamed")}
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


function searchStudents() {

    const input = getElement("studentSearch");

    if (!input) return;

    const search = input.value
        .trim()
        .toLowerCase();

    if (!search) {
        renderStudents();
        return;
    }

    const filtered = students.filter(student => {

        return `
            ${student.id}
            ${student.name}
            ${student.age}
            ${student.className}
        `
            .toLowerCase()
            .includes(search);
    });

    renderStudents(filtered);
}


async function addStudent(event) {

    if (event) {
        event.preventDefault();
    }

    const name =
        getElement("studentName")?.value.trim() || "";

    const age =
        Number(getElement("studentAge")?.value);

    const className =
        getElement("studentClass")?.value.trim() || "";

    if (!name || !age || !className) {
        alert("Please fill in all student fields.");
        return;
    }

    try {

        const editing = editingStudentId !== null;

        const url = editing
            ? `${API_URL}/students/${editingStudentId}`
            : `${API_URL}/students`;

        await getJSON(url, {
            method: editing ? "PUT" : "POST",

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

        closeModal("studentModal");

        await loadStudents();

    } catch (error) {

        console.error("STUDENT ERROR:", error);

        alert(error.message);
    }
}


function editStudent(id) {

    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) {
        alert("Student not found.");
        return;
    }

    editingStudentId = Number(id);

    const name = getElement("studentName");
    const age = getElement("studentAge");
    const className = getElement("studentClass");

    if (name) name.value = student.name || "";
    if (age) age.value = student.age || "";
    if (className) className.value = student.className || "";

    const title = getElement("studentModalTitle");

    if (title) {
        title.textContent = "Edit Student";
    }

    openModal("studentModal");
}


async function deleteStudent(id) {

    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!confirm(
        `Delete ${student?.name || "this student"}?`
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

        alert("Student deleted successfully.");

        await loadStudents();

    } catch (error) {

        console.error("DELETE STUDENT ERROR:", error);

        alert(error.message);
    }
}


/* =========================================================
   STUDENT PROFILE / PHOTO
========================================================= */

function viewStudent(id) {

    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) {
        alert("Student not found.");
        return;
    }

    const modal = getElement("studentProfileModal");

    if (!modal) {
        alert("Student profile window is not available.");
        return;
    }

    currentProfileStudent = student;

    const name = getElement("profileStudentName");
    const age = getElement("profileStudentAge");
    const className = getElement("profileStudentClass");
    const avatar = getElement("profileStudentAvatar");

    if (name) {
        name.textContent =
            student.name || "Unnamed Student";
    }

    if (age) {
        age.textContent =
            student.age ?? "-";
    }

    if (className) {
        className.textContent =
            student.className || "-";
    }

    if (avatar) {

        avatar.innerHTML = student.photo

            ? `
                <img
                    src="${escapeHTML(student.photo)}"
                    class="student-profile-photo"
                    alt="Student photo"
                >
            `

            : `
                <div class="student-profile-initial">
                    ${escapeHTML(
                        (student.name || "S")
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>
            `;
    }

    const upload =
        getElement("studentPhotoUpload");

    if (upload) {
        upload.dataset.studentId = student.id;
        upload.value = "";
    }

    openModal("studentProfileModal");
}


function chooseStudentPhoto() {

    getElement("studentPhotoUpload")?.click();
}


function compressStudentPhoto(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = event => {

            const image = new Image();

            image.onload = () => {

                const maxSize = 600;

                let width = image.width;
                let height = image.height;

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
                        Math.round(width * scale);

                    height =
                        Math.round(height * scale);
                }

                const canvas =
                    document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context =
                    canvas.getContext("2d");

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

            image.onerror = () =>
                reject(
                    new Error("Could not read the image.")
                );

            image.src = event.target.result;
        };

        reader.onerror = () =>
            reject(
                new Error("Could not read the selected file.")
            );

        reader.readAsDataURL(file);
    });
}


async function uploadStudentPhoto() {

    const input =
        getElement("studentPhotoUpload");

    if (!input?.files?.[0]) {
        return;
    }

    const id =
        input.dataset.studentId ||
        currentProfileStudent?.id;

    if (!id) {
        alert("Please open a student profile first.");
        return;
    }

    if (!input.files[0].type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
    }

    try {

        const photo =
            await compressStudentPhoto(
                input.files[0]
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
                item => Number(item.id) === Number(id)
            );

        if (student) {
            student.photo =
                data.photo || photo;
        }

        renderStudents();

        viewStudent(id);

    } catch (error) {

        console.error("PHOTO ERROR:", error);

        alert(error.message);
    }
}


async function removeStudentPhoto(id = null) {

    id =
        id ||
        currentProfileStudent?.id;

    if (!id) return;

    if (!confirm(
        "Remove this student's photo?"
    )) {
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
                item => Number(item.id) === Number(id)
            );

        if (student) {
            student.photo = null;
        }

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

        renderTeachers();

        updateTeacherCount();

    } catch (error) {

        console.error(
            "LOAD TEACHERS ERROR:",
            error
        );

        teachers = [];

        if (table) {

            table.innerHTML =
                `<tr>
                    <td colspan="6">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>`;
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
        teachers.filter(teacher =>
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
            item => Number(item.id) === Number(id)
        );

    if (!teacher) {
        alert("Teacher not found.");
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

    if (name) name.value =
        teacher.name || "";

    if (age) age.value =
        teacher.age || "";

    if (subject) subject.value =
        teacher.subject || "";

    if (email) email.value =
        teacher.email || "";

    const title =
        getElement("teacherModalTitle");

    if (title) {
        title.textContent =
            "Edit Teacher";
    }

    openModal("teacherModal");
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

        await getJSON(url, {

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
        });

        alert(
            editing
                ? "Teacher updated successfully."
                : "Teacher added successfully."
        );

        editingTeacherId = null;

        getElement("teacherForm")?.reset();

        const title =
            getElement("teacherModalTitle");

        if (title) {
            title.textContent =
                "Add Teacher";
        }

        closeModal("teacherModal");

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
            item => Number(item.id) === Number(id)
        );

    if (!confirm(
        `Delete ${teacher?.name || "this teacher"}?`
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


function viewTeacher(id) {

    const teacher =
        teachers.find(
            item => Number(item.id) === Number(id)
        );

    if (!teacher) {
        alert("Teacher not found.");
        return;
    }

    let modal =
        getElement("teacherProfileModal");

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "teacherProfileModal";

        modal.className =
            "modal";

        modal.innerHTML = `

            <div class="modal-content">

                <button
                    class="close-button"
                    onclick="closeModal('teacherProfileModal')"
                >
                    ×
                </button>

                <h2 id="teacherProfileName"></h2>

                <p>
                    <strong>Age:</strong>
                    <span id="teacherProfileAge"></span>
                </p>

                <p>
                    <strong>Subject:</strong>
                    <span id="teacherProfileSubject"></span>
                </p>

                <p>
                    <strong>Email:</strong>
                    <span id="teacherProfileEmail"></span>
                </p>

            </div>
        `;

        document.body.appendChild(modal);
    }

    getElement("teacherProfileName").textContent =
        teacher.name || "";

    getElement("teacherProfileAge").textContent =
        teacher.age ?? "-";

    getElement("teacherProfileSubject").textContent =
        teacher.subject || "-";

    getElement("teacherProfileEmail").textContent =
        teacher.email || "-";

    openModal("teacherProfileModal");
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

        renderClasses();

        updateClassCount();

    } catch (error) {

        console.error(
            "LOAD CLASSES ERROR:",
            error
        );

        classes = [];

        if (table) {

            table.innerHTML =
                `<tr>
                    <td colspan="5">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>`;
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
                        item.className
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.teacher ||
                        item.teacherName
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.room ||
                        item.roomNumber
                    )}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="editClass(${Number(item.id)})"
                    >
                        Edit
                    </button>

                    <button
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
        classes.filter(item =>
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
            x => Number(x.id) === Number(id)
        );

    if (!item) {
        alert("Class not found.");
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
        getElement("classModalTitle");

    if (title) {
        title.textContent =
            "Edit Class";
    }

    openModal("classModal");
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

        await getJSON(url, {

            method:
                editing
                    ? "PUT"
                    : "POST",

            body: JSON.stringify({
                name,
                teacher,
                room
            })
        });

        alert(
            editing
                ? "Class updated successfully."
                : "Class added successfully."
        );

        editingClassId = null;

        getElement("classForm")?.reset();

        const title =
            getElement("classModalTitle");

        if (title) {
            title.textContent =
                "Add Class";
        }

        closeModal("classModal");

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
            x => Number(x.id) === Number(id)
        );

    if (!confirm(
        `Delete ${
            item?.name ||
            item?.className ||
            "this class"
        }?`
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

    if (!modal) return;

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
        "classes"
    ];

    if (!validSections.includes(name)) {
        return;
    }

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove("active");
            section.style.display = "none";
        });


    const selected =
        getElement(name);

    if (selected) {

        selected.classList.add("active");
        selected.style.display = "block";
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
                text.includes("classes"))
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
}


/* =========================================================
   APPLICATION STARTUP
========================================================= */

function setupApplication() {

    const studentForm =
        getElement("studentForm");

    const teacherForm =
        getElement("teacherForm");

    const classForm =
        getElement("classForm");


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
        getElement("studentPhotoUpload");

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


    showSection("students");


    Promise.all([
        loadStudents(),
        loadTeachers(),
        loadClasses()
    ]);
}


/* =========================================================
   GLOBAL FUNCTIONS FOR HTML onclick
========================================================= */

window.loadStudents = loadStudents;
window.addStudent = addStudent;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.searchStudents = searchStudents;
window.viewStudent = viewStudent;

window.uploadStudentPhoto =
    uploadStudentPhoto;

window.removeStudentPhoto =
    removeStudentPhoto;

window.chooseStudentPhoto =
    chooseStudentPhoto;


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
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    setupApplication
);


console.log(
    "SchoolConnect frontend loaded successfully."
);

console.log(
    "Login and registration are disabled."
);

