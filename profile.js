document.addEventListener('DOMContentLoaded', () => {
    const facultyDepartments = {
        "Accounting and Informatics": ["Information Technology", "Information Systems", "Auditing & Taxation", "Management Accounting", "Financial Accounting"],
        "Applied Sciences": ["Chemistry", "Biotechnology", "Food & Nutrition", "Maritime Studies", "Sport Studies"],
        "Arts & Design": ["Fashion Design", "Graphic Design", "Fine Art", "Jewellery Design", "Photography"],
        "Engineering": ["Civil Engineering", "Electrical Power Engineering", "Electronic Engineering", "Mechanical Engineering", "Chemical Engineering", "Construction Management"],
        "Health Sciences": ["Nursing", "Radiography", "Dental Technology", "Emergency Medical Care", "Somatology"],
        "Management Sciences": ["Business Administration", "Human Resources", "Marketing", "Public Relations", "Tourism"]
    };

    const departmentCourses = {
        "Information Technology": [
            "Higher Certificate in Information Technology",
            "Diploma in ICT in Applications Development",
            "Diploma in ICT in Applications Development (4-year Foundation)",
            "Bachelor of Information and Communications Technology (BICT)",
            "Advanced Diploma in ICT",
            "Honours Bachelor of Information and Communications Technology",
            "Master of Information and Communications Technology (MICT)",
            "Doctor of Philosophy in Information Technology (PhD)"
        ],
        "Information Systems": [
            "Diploma in Financial Information Systems",
            "Advanced Diploma in Financial Information Systems",
            "Postgraduate Diploma in Financial Information Systems",
            "Master of Accounting (Financial Information Systems)"
        ],
        "Auditing & Taxation": [
            "Diploma in Internal Auditing",
            "Advanced Diploma in Internal Auditing",
            "Postgraduate Diploma in Internal Auditing",
            "Diploma in Taxation",
            "Advanced Diploma in Taxation",
            "Postgraduate Diploma in Taxation",
            "Master of Accounting (Taxation)",
            "Master of Accounting (Internal Auditing)"
        ],
        "Management Accounting": [
            "Diploma in Management Accounting",
            "Advanced Diploma in Management Accounting",
            "Postgraduate Diploma in Management Accounting",
            "Master of Accounting (Management Accounting)",
            "Doctor of Philosophy in Accounting"
        ],
        "Financial Accounting": [
            "Diploma in Accounting",
            "Advanced Diploma in Accounting",
            "Postgraduate Diploma in Accounting",
            "Master of Accounting (Financial Accounting)",
            "Doctor of Philosophy in Accounting"
        ]
    };

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    function injectNav(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let linksHtml = '';
        if (currentUser.affiliation === 'admin') {
            linksHtml = `
                <a href="admin_dashboard.html" class="hover:text-indigo-700 transition">Dashboard</a>
                <a href="admin_bursaries.html" class="hover:text-indigo-700 transition">Manage Bursaries</a>
                <a href="admin_applications.html" class="hover:text-indigo-700 transition">Applications</a> 
            `;
        } else {
            linksHtml = `
                <a href="dashboard.html" class="hover:text-indigo-700 transition">Dashboard</a>
                <a href="bursaries.html" class="hover:text-indigo-700 transition">Bursaries</a>
                <a href="grades.html" class="hover:text-indigo-700 transition">Grades/Timetable</a>
            `;
        }
        container.innerHTML = linksHtml;
    }

    injectNav('desktop-nav');
    injectNav('mobile-nav');

    const initials = ((currentUser.fname?.[0] || '') + (currentUser.lname?.[0] || '')).toUpperCase();
    
    const headerAv = document.getElementById('header-avatar');
    if(headerAv) headerAv.textContent = initials;

    const bodyAv = document.getElementById('body-avatar');
    if(bodyAv) bodyAv.textContent = initials;

    document.getElementById('display-name').textContent = (currentUser.fname + " " + currentUser.lname);
    document.getElementById('display-email').textContent = currentUser.email;
    document.getElementById('role-badge').textContent = currentUser.affiliation || "User";

    const fnameIn = document.getElementById('fname');
    const lnameIn = document.getElementById('lname');
    const incomeIn = document.getElementById('annual-income');
    
    if (fnameIn) fnameIn.value = currentUser.fname || "";
    if (lnameIn) lnameIn.value = currentUser.lname || "";
    if (incomeIn) incomeIn.value = currentUser.income || "";
    
    if (currentUser.disabled === "yes") {
        const yesRadio = document.querySelector('input[name="disabled-status"][value="yes"]');
        if (yesRadio) yesRadio.checked = true;
    } else {
        const noRadio = document.querySelector('input[name="disabled-status"][value="no"]');
        if (noRadio) noRadio.checked = true;
    }

    const studentSection = document.getElementById('student-section');
    const stdNumIn = document.getElementById('student-num');
    const avgIn = document.getElementById('average');
    const facultyIn = document.getElementById('faculty');
    const deptIn = document.getElementById('department');
    const courseIn = document.getElementById('course');

    const adminSection = document.getElementById('admin-section');
    const staffIdIn = document.getElementById('staff-id');
    const adminDeptIn = document.getElementById('admin-dept');

    function populateDepartments(selectedFaculty, selectedDept = "") {
        if (!deptIn) return;
        deptIn.innerHTML = '<option value="">Select Department...</option>';
        if (courseIn) courseIn.innerHTML = '<option value="">Select Department First...</option>';
        
        if (selectedFaculty && facultyDepartments[selectedFaculty]) {
            facultyDepartments[selectedFaculty].forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                if (dept === selectedDept) option.selected = true;
                deptIn.appendChild(option);
            });
        }
    }

    function populateCourses(selectedDept, selectedCourse = "") {
        if (!courseIn) return;
        courseIn.innerHTML = '<option value="">Select Course...</option>';
        if (selectedDept && departmentCourses[selectedDept]) {
            departmentCourses[selectedDept].forEach(course => {
                const option = document.createElement('option');
                option.value = course;
                option.textContent = course;
                if (course === selectedCourse) option.selected = true;
                courseIn.appendChild(option);
            });
        }
    }

    if (currentUser.affiliation === 'admin') {
        if (adminSection) adminSection.classList.remove('hidden');
        if (studentSection) studentSection.classList.add('hidden');
        if (staffIdIn) staffIdIn.value = currentUser.staffNumber || "";
        if (adminDeptIn) adminDeptIn.value = currentUser.department || "";
    } else {
        if (studentSection) studentSection.classList.remove('hidden');
        if (adminSection) adminSection.classList.add('hidden');
        if (stdNumIn) stdNumIn.value = currentUser.studentNumber || "";
        if (avgIn) avgIn.value = currentUser.average || "";
        if (facultyIn) facultyIn.value = currentUser.faculty || "";
        
        populateDepartments(currentUser.faculty, currentUser.department);
        populateCourses(currentUser.department, currentUser.course);
    }

    if (facultyIn) {
        facultyIn.addEventListener('change', (e) => {
            populateDepartments(e.target.value);
        });
    }

    if (deptIn) {
        deptIn.addEventListener('change', (e) => {
            populateCourses(e.target.value);
        });
    }

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (fnameIn) currentUser.fname = fnameIn.value;
            if (lnameIn) currentUser.lname = lnameIn.value;
            if (incomeIn) currentUser.income = incomeIn.value;
            
            const disabledRadios = document.querySelector('input[name="disabled-status"]:checked');
            if (disabledRadios) {
                currentUser.disabled = disabledRadios.value;
            }

            if (currentUser.affiliation === 'admin') {
                if (staffIdIn) currentUser.staffNumber = staffIdIn.value;
                if (adminDeptIn) currentUser.department = adminDeptIn.value;
            } else {
                if (stdNumIn) currentUser.studentNumber = stdNumIn.value;
                if (avgIn) currentUser.average = avgIn.value;
                if (facultyIn) currentUser.faculty = facultyIn.value;
                if (deptIn) currentUser.department = deptIn.value;
                if (courseIn) currentUser.course = courseIn.value;
            }

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const index = users.findIndex(u => u.email === currentUser.email);
            if (index !== -1) {
                users[index] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
            }

            alert("✅ Profile updated successfully!");
            location.reload(); 
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (currentUser.affiliation === 'admin') {
                window.location.href = "admin_dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }
        });
    }
});