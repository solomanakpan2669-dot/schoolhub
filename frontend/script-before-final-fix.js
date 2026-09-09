const API_URL="/api";
const TOKEN_KEY="schoolconnect_token";
const SCHOOL_KEY="schoolconnect_school";

let students=[],teachers=[],classes=[];
let editingStudentId=null,editingTeacherId=null,editingClassId=null;
let currentProfileStudent=null;

function getToken(){return localStorage.getItem(TOKEN_KEY)||"";}
function getSchool(){try{return JSON.parse(localStorage.getItem(SCHOOL_KEY)||"null")}catch{return null}}
function isLoggedIn(){return !!getToken();}
function getAuthHeaders(){const h={"Content-Type":"application/json"};if(getToken())h.Authorization=`Bearer ${getToken()}`;return h;}
function clearLogin(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SCHOOL_KEY);}
function saveLogin(d){if(d.token)localStorage.setItem(TOKEN_KEY,d.token);if(d.school)localStorage.setItem(SCHOOL_KEY,JSON.stringify(d.school));updateSchoolNameDisplay();}
function logoutSchool(){clearLogin();location.reload();}

async function getJSON(url,opt={}){
 const r=await fetch(url,{...opt,headers:{...getAuthHeaders(),...(opt.headers||{})}});
 let d={};try{d=await r.json()}catch{}
 if(r.status===401){clearLogin();location.reload();throw Error("Login required");}
 if(!r.ok)throw Error(d.error||d.message||`Request failed (${r.status})`);
 return d;
}

function updateSchoolNameDisplay(){
 const e=document.getElementById("schoolNameDisplay"),s=getSchool();
 if(e)e.textContent=s?.name||"SchoolConnect";
}
const displaySchoolName=updateSchoolNameDisplay;

async function loginSchool(e){
 e?.preventDefault();
 const code=document.getElementById("schoolCode")?.value.trim();
 const password=document.getElementById("schoolPassword")?.value||"";
 if(!code||!password)return alert("Please enter your school code and password.");
 try{const d=await getJSON(`${API_URL}/schools/login`,{method:"POST",body:JSON.stringify({code,password})});saveLogin(d);alert("Login successful!");location.reload()}catch(x){alert(x.message)}
}

async function registerSchool(e){
 e?.preventDefault();
 const name=document.getElementById("registerSchoolName")?.value.trim();
 const password=document.getElementById("registerSchoolPassword")?.value||"";
 if(!name||!password)return alert("Please enter the school name and password.");
 if(password.length<6)return alert("Password must be at least 6 characters.");
 try{
  const d=await getJSON(`${API_URL}/schools/register`,{method:"POST",body:JSON.stringify({name,password})});
  saveLogin(d);
  alert(`School registered successfully!\n\nSchool code: ${d.school?.code||d.code||"your school code"}`);
  location.reload();
 }catch(x){alert(x.message)}
}

function escapeHTML(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}

async function loadStudents(){
 const t=document.getElementById("studentsTable");
 if(t)t.innerHTML='<tr><td colspan="6">Loading students...</td></tr>';
 try{
  const d=await getJSON(`${API_URL}/students`);
  students=Array.isArray(d)?d:(d.students||[]);
  renderStudents();updateStudentCount();
 }catch(x){students=[];if(t)t.innerHTML=`<tr><td colspan="6">${escapeHTML(x.message)}</td></tr>`;updateStudentCount();}
}

function updateStudentCount(){const e=document.getElementById("studentCount");if(e)e.textContent=students.length;}

function studentAvatar(s){
 if(s.photo)return `<img src="${escapeHTML(s.photo)}" class="student-table-photo" alt="Student photo">`;
 return `<div class="student-table-avatar">${escapeHTML((s.name||"S")[0].toUpperCase())}</div>`;
}

function renderStudents(list=students){
 const t=document.getElementById("studentsTable");if(!t)return;
 if(!list.length){t.innerHTML='<tr><td colspan="6">No students found.</td></tr>';return;}
 t.innerHTML=list.map(s=>`
 <tr>
  <td><div class="student-name-cell" onclick="viewStudent(${Number(s.id)})">${studentAvatar(s)}<span>${escapeHTML(s.name||"Unnamed")}</span></div></td>
  <td>${escapeHTML(s.age)}</td><td>${escapeHTML(s.className)}</td>
  <td><button class="btn btn-secondary" onclick="viewStudent(${Number(s.id)})">View</button></td>
  <td><button class="btn btn-primary" onclick="editStudent(${Number(s.id)})">Edit</button></td>
  <td><button class="btn btn-danger" onclick="deleteStudent(${Number(s.id)})">Delete</button></td>
 </tr>`).join("");
}

async function addStudent(e){
 e?.preventDefault();
 const name=document.getElementById("studentName")?.value.trim();
 const age=Number(document.getElementById("studentAge")?.value);
 const className=document.getElementById("studentClass")?.value.trim();
 if(!name||!age||!className)return alert("Please fill in all student fields.");
 try{
  const url=editingStudentId?`${API_URL}/students/${editingStudentId}`:`${API_URL}/students`;
  await getJSON(url,{method:editingStudentId?"PUT":"POST",body:JSON.stringify({name,age,className})});
  alert(editingStudentId?"Student updated successfully.":"Student added successfully.");
  resetStudentForm();closeModal("studentModal");loadStudents();
 }catch(x){alert(x.message)}
}

function editStudent(id){
 const s=students.find(x=>Number(x.id)===Number(id));if(!s)return alert("Student not found.");
 editingStudentId=Number(id);
 document.getElementById("studentModalTitle").textContent="Edit Student";
 document.getElementById("studentName").value=s.name||"";
 document.getElementById("studentAge").value=s.age||"";
 document.getElementById("studentClass").value=s.className||"";
 openModal("studentModal");
}

function resetStudentForm(){
 editingStudentId=null;
 document.getElementById("studentForm")?.reset();
 const t=document.getElementById("studentModalTitle");if(t)t.textContent="Add Student";
}

async function deleteStudent(id){
 const s=students.find(x=>Number(x.id)===Number(id));
 if(!confirm(`Delete ${s?.name||"this student"}?`))return;
 try{await getJSON(`${API_URL}/students/${id}`,{method:"DELETE"});alert("Student deleted successfully.");loadStudents()}catch(x){alert(x.message)}
}

function searchStudents(){
 const q=document.getElementById("studentSearch")?.value.toLowerCase().trim()||"";
 renderStudents(q?students.filter(s=>`${s.name} ${s.age} ${s.className}`.toLowerCase().includes(q)):students);
}

function viewStudent(id){
 const s=students.find(x=>Number(x.id)===Number(id));if(!s)return alert("Student not found.");
 currentProfileStudent=s;
 const m=document.getElementById("studentProfileModal");if(!m)return alert("Student profile window is missing.");
 document.getElementById("profileStudentName").textContent=s.name||"Unnamed Student";
 document.getElementById("profileStudentAge").textContent=s.age??"-";
 document.getElementById("profileStudentClass").textContent=s.className||"-";
 const input=document.getElementById("studentPhotoUpload");if(input){input.dataset.studentId=s.id;input.value="";}
 const a=document.getElementById("profileStudentAvatar");
 a.innerHTML=s.photo?`<img src="${escapeHTML(s.photo)}" class="student-profile-photo" alt="Student photo">`:`<div class="student-profile-initial">${escapeHTML((s.name||"S")[0].toUpperCase())}</div>`;
 m.style.display="flex";m.classList.add("active");
}

function chooseStudentPhoto(){document.getElementById("studentPhotoUpload")?.click();}

function compressStudentPhoto(file){
 return new Promise((resolve,reject)=>{
  const r=new FileReader();
  r.onload=e=>{
   const img=new Image();
   img.onload=()=>{
    const max=600;let w=img.width,h=img.height;
    if(w>max||h>max){const z=Math.min(max/w,max/h);w=Math.round(w*z);h=Math.round(h*z);}
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
    resolve(c.toDataURL("image/jpeg",.8));
   };
   img.onerror=()=>reject(Error("Could not read the image."));
   img.src=e.target.result;
  };
  r.onerror=()=>reject(Error("Could not read the selected file."));
  r.readAsDataURL(file);
 });
}

async function uploadStudentPhoto(){
 const i=document.getElementById("studentPhotoUpload");if(!i?.files?.[0])return;
 const id=i.dataset.studentId||currentProfileStudent?.id;if(!id)return alert("Please open a student profile first.");
 if(!i.files[0].type.startsWith("image/"))return alert("Please select an image file.");
 try{
  const photo=await compressStudentPhoto(i.files[0]);
  const d=await getJSON(`${API_URL}/students/${id}/photo`,{method:"PUT",body:JSON.stringify({photo})});
  const s=students.find(x=>Number(x.id)===Number(id));if(s)s.photo=d.photo||photo;
  renderStudents();viewStudent(id);
 }catch(x){alert(x.message)}
}

async function removeStudentPhoto(id=null){
 id=id||currentProfileStudent?.id;
 if(!id||!confirm("Remove this student's photo?"))return;
 try{
  await getJSON(`${API_URL}/students/${id}/photo`,{method:"DELETE"});
  const s=students.find(x=>Number(x.id)===Number(id));if(s)s.photo=null;
  renderStudents();viewStudent(id);
 }catch(x){alert(x.message)}
}

async function loadTeachers(){
 const t=document.getElementById("teachersTable");if(t)t.innerHTML='<tr><td colspan="6">Loading teachers...</td></tr>';
 try{const d=await getJSON(`${API_URL}/teachers`);teachers=Array.isArray(d)?d:(d.teachers||[]);renderTeachers();updateTeacherCount()}
 catch(x){teachers=[];if(t)t.innerHTML=`<tr><td colspan="6">${escapeHTML(x.message)}</td></tr>`;updateTeacherCount()}
}
function updateTeacherCount(){const e=document.getElementById("teacherCount");if(e)e.textContent=teachers.length;}
function renderTeachers(list=teachers){
 const t=document.getElementById("teachersTable");if(!t)return;
 if(!list.length){t.innerHTML='<tr><td colspan="6">No teachers found.</td></tr>';return;}
 t.innerHTML=list.map(x=>`<tr><td>${escapeHTML(x.name)}</td><td>${escapeHTML(x.age)}</td><td>${escapeHTML(x.subject)}</td><td>${escapeHTML(x.email)}</td><td><button class="btn btn-secondary" onclick="viewTeacher(${Number(x.id)})">View</button></td><td><button class="btn btn-primary" onclick="editTeacher(${Number(x.id)})">Edit</button> <button class="btn btn-danger" onclick="deleteTeacher(${Number(x.id)})">Delete</button></td></tr>`).join("");
}
function searchTeachers(){const q=document.getElementById("teacherSearch")?.value.toLowerCase().trim()||"";renderTeachers(q?teachers.filter(x=>`${x.name} ${x.subject} ${x.email}`.toLowerCase().includes(q)):teachers);}
function editTeacher(id){
 const x=teachers.find(a=>Number(a.id)===Number(id));if(!x)return alert("Teacher not found.");
 editingTeacherId=Number(id);
 document.getElementById("teacherModalTitle").textContent="Edit Teacher";
 document.getElementById("teacherName").value=x.name||"";
 document.getElementById("teacherAge").value=x.age||"";
 document.getElementById("teacherSubject").value=x.subject||"";
 document.getElementById("teacherEmail").value=x.email||"";
 openModal("teacherModal");
}
async function saveTeacher(e){
 e?.preventDefault();
 const name=document.getElementById("teacherName")?.value.trim(),age=Number(document.getElementById("teacherAge")?.value),subject=document.getElementById("teacherSubject")?.value.trim(),email=document.getElementById("teacherEmail")?.value.trim();
 if(!name||!age||!subject||!email)return alert("Please fill in all teacher fields.");
 try{
  const url=editingTeacherId?`${API_URL}/teachers/${editingTeacherId}`:`${API_URL}/teachers`;
  await getJSON(url,{method:editingTeacherId?"PUT":"POST",body:JSON.stringify({name,age,subject,email})});
  alert(editingTeacherId?"Teacher updated successfully.":"Teacher added successfully.");
  editingTeacherId=null;document.getElementById("teacherForm")?.reset();document.getElementById("teacherModalTitle").textContent="Add Teacher";closeModal("teacherModal");loadTeachers();
 }catch(x){alert(x.message)}
}
async function deleteTeacher(id){
 const x=teachers.find(a=>Number(a.id)===Number(id));if(!confirm(`Delete ${x?.name||"this teacher"}?`))return;
 try{await getJSON(`${API_URL}/teachers/${id}`,{method:"DELETE"});alert("Teacher deleted successfully.");loadTeachers()}catch(e){alert(e.message)}
}
function viewTeacher(id){
 const x=teachers.find(a=>Number(a.id)===Number(id));if(!x)return alert("Teacher not found.");
 let m=document.getElementById("teacherProfileModal");
 if(!m){m=document.createElement("div");m.id="teacherProfileModal";m.className="modal";m.innerHTML=`<div class="modal-content"><button onclick="closeModal('teacherProfileModal')">&times;</button><h2 id="teacherProfileName"></h2><p>Age: <span id="teacherProfileAge"></span></p><p>Subject: <span id="teacherProfileSubject"></span></p><p>Email: <span id="teacherProfileEmail"></span></p></div>`;document.body.appendChild(m);}
 document.getElementById("teacherProfileName").textContent=x.name||"";
 document.getElementById("teacherProfileAge").textContent=x.age??"-";
 document.getElementById("teacherProfileSubject").textContent=x.subject||"-";
 document.getElementById("teacherProfileEmail").textContent=x.email||"-";
 m.style.display="flex";m.classList.add("active");
}

async function loadClasses(){
 const t=document.getElementById("classesTable");if(t)t.innerHTML='<tr><td colspan="5">Loading classes...</td></tr>';
 try{const d=await getJSON(`${API_URL}/classes`);classes=Array.isArray(d)?d:(d.classes||[]);renderClasses();updateClassCount()}
 catch(x){classes=[];if(t)t.innerHTML=`<tr><td colspan="5">${escapeHTML(x.message)}</td></tr>`;updateClassCount()}
}
function updateClassCount(){const e=document.getElementById("classCount");if(e)e.textContent=classes.length;}
function renderClasses(list=classes){
 const t=document.getElementById("classesTable");if(!t)return;
 if(!list.length){t.innerHTML='<tr><td colspan="5">No classes found.</td></tr>';return;}
 t.innerHTML=list.map(x=>`<tr><td>${escapeHTML(x.name||x.className)}</td><td>${escapeHTML(x.teacher||x.teacherName)}</td><td>${escapeHTML(x.room||x.roomNumber)}</td><td><button class="btn btn-primary" onclick="editClass(${Number(x.id)})">Edit</button></td><td><button class="btn btn-danger" onclick="deleteClass(${Number(x.id)})">Delete</button></td></tr>`).join("");
}
function searchClasses(){const q=document.getElementById("classSearch")?.value.toLowerCase().trim()||"";renderClasses(q?classes.filter(x=>`${x.name||x.className} ${x.teacher||x.teacherName} ${x.room||x.roomNumber}`.toLowerCase().includes(q)):classes);}
function editClass(id){
 const x=classes.find(a=>Number(a.id)===Number(id));if(!x)return alert("Class not found.");
 editingClassId=Number(id);
 document.getElementById("classModalTitle").textContent="Edit Class";
 document.getElementById("className").value=x.name||x.className||"";
 document.getElementById("classTeacher").value=x.teacher||x.teacherName||"";
 document.getElementById("classRoom").value=x.room||x.roomNumber||"";
 openModal("classModal");
}
async function saveClass(e){
 e?.preventDefault();
 const name=document.getElementById("className")?.value.trim(),teacher=document.getElementById("classTeacher")?.value.trim(),room=document.getElementById("classRoom")?.value.trim();
 if(!name)return alert("Please enter a class name.");
 try{
  const url=editingClassId?`${API_URL}/classes/${editingClassId}`:`${API_URL}/classes`;
  await getJSON(url,{method:editingClassId?"PUT":"POST",body:JSON.stringify({name,teacher,room})});
  alert(editingClassId?"Class updated successfully.":"Class added successfully.");
  editingClassId=null;document.getElementById("classForm")?.reset();document.getElementById("classModalTitle").textContent="Add Class";closeModal("classModal");loadClasses();
 }catch(x){alert(x.message)}
}
async function deleteClass(id){
 const x=classes.find(a=>Number(a.id)===Number(id));if(!confirm(`Delete ${x?.name||x?.className||"this class"}?`))return;
 try{await getJSON(`${API_URL}/classes/${id}`,{method:"DELETE"});alert("Class deleted successfully.");loadClasses()}catch(e){alert(e.message)}
}

function openModal(id){const m=document.getElementById(id);if(m){m.style.display="flex";m.classList.add("active")}}
function closeModal(id){const m=document.getElementById(id);if(m){m.style.display="none";m.classList.remove("active")}}

function showSection(name,button=null){
 document.querySelectorAll(".section").forEach(x=>{x.style.display="none";x.classList.remove("active")});
 const s=document.getElementById(`${name}Section`);if(s){s.style.display="block";s.classList.add("active")}
 document.querySelectorAll(".tab-button,.nav-btn").forEach(x=>x.classList.remove("active"));button?.classList.add("active");
 if(name==="students")loadStudents();if(name==="teachers")loadTeachers();if(name==="classes")loadClasses();
}

function restoreSavedSchoolCode(){const e=document.getElementById("schoolCode"),s=getSchool();if(e&&s?.code)e.value=s.code;}
function showRegisterScreen(){document.getElementById("loginScreen")?.style.setProperty("display","none");document.getElementById("registerScreen")?.style.setProperty("display","block");}
function showLoginScreen(){document.getElementById("registerScreen")?.style.setProperty("display","none");document.getElementById("loginScreen")?.style.setProperty("display","block");}
function toggleSchoolPassword(){const e=document.getElementById("schoolPassword");if(e)e.type=e.type==="password"?"text":"password";}

async function updateAuthScreen(){return; /*
 const a=document.getElementById("authScreen"),d=document.getElementById("dashboardApp");if(!a||!d)return;
 a.style.display="none";d.style.display="block";
 try{await getJSON(`${API_URL}/students`);a.style.display="none";d.style.display="block"}catch{clearLogin();a.style.display="flex";d.style.display="none"}
}

*/}

function setupApplication(){
 updateSchoolNameDisplay();
 document.getElementById("loginForm")?.addEventListener("submit",loginSchool);
 document.getElementById("registerForm")?.addEventListener("submit",registerSchool);
 document.getElementById("studentForm")?.addEventListener("submit",addStudent);
 document.getElementById("teacherForm")?.addEventListener("submit",saveTeacher);
 document.getElementById("classForm")?.addEventListener("submit",saveClass);
 document.getElementById("logoutButton")?.addEventListener("click",logoutSchool);
 document.getElementById("studentPhotoUpload")?.addEventListener("change",uploadStudentPhoto);
 document.addEventListener("click",e=>{if(e.target.classList.contains("modal"))closeModal(e.target.id)});
 Promise.all([loadStudents(),loadTeachers(),loadClasses()]);
}

window.loginSchool=loginSchool;window.registerSchool=registerSchool;window.logoutSchool=logoutSchool;
window.showRegisterScreen=showRegisterScreen;window.showLoginScreen=showLoginScreen;window.toggleSchoolPassword=toggleSchoolPassword;
window.loadStudents=loadStudents;window.addStudent=addStudent;window.editStudent=editStudent;window.deleteStudent=deleteStudent;window.searchStudents=searchStudents;window.viewStudent=viewStudent;
window.uploadStudentPhoto=uploadStudentPhoto;window.removeStudentPhoto=removeStudentPhoto;window.chooseStudentPhoto=chooseStudentPhoto;
window.loadTeachers=loadTeachers;window.editTeacher=editTeacher;window.saveTeacher=saveTeacher;window.deleteTeacher=deleteTeacher;window.searchTeachers=searchTeachers;window.viewTeacher=viewTeacher;
window.loadClasses=loadClasses;window.editClass=editClass;window.saveClass=saveClass;window.deleteClass=deleteClass;window.searchClasses=searchClasses;
window.openModal=openModal;window.closeModal=closeModal;window.showSection=showSection;

document.addEventListener("DOMContentLoaded",async()=>{restoreSavedSchoolCode();await updateAuthScreen();setupApplication();});
console.log("SchoolConnect frontend loaded successfully.");
