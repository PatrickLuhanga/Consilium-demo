document.addEventListener('DOMContentLoaded', () => {

    // 1. DEPARTMENT MAPPING
    const facultyDepartments = {
        "Accounting and Informatics": ["Information Technology", "Financial Information Systems", "Auditing & Taxation", "Management Accounting", "Financial Accounting"],
        "Applied Sciences": ["Chemistry", "Biotechnology", "Food & Nutrition", "Maritime Studies", "Sport Studies"],
        "Arts & Design": ["Fashion Design", "Graphic Design", "Fine Art", "Jewellery Design", "Photography"],
        "Engineering": ["Civil Engineering", "Electrical Power Engineering", "Electronic Engineering", "Mechanical Engineering", "Chemical Engineering", "Construction Management"],
        "Health Sciences": ["Nursing", "Radiography", "Dental Technology", "Emergency Medical Care", "Somatology"],
        "Management Sciences": ["Business Administration", "Human Resources", "Marketing", "Public Relations", "Tourism"]
    };

    // 2. AUTH CHECK
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // 3. INJECT NAV LINKS (Function to handle both Desktop and Mobile containers)
    function injectNav(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let linksHtml = '';
        if (currentUser.affiliation === 'admin') {
            // ADMIN LINKS (Removed 'My Profile')
            linksHtml = `
                <a href="admin_dashboard.html" class="hover:text-indigo-700 transition">Dashboard</a>
                <a href="admin_bursaries.html" class="hover:text-indigo-700 transition">Manage Bursaries</a>
                <a href="admin_applications.html" class="hover:text-indigo-700 transition">Applications</a> 
            `;
        } else {
            // STUDENT LINKS (Removed 'My Profile')
            linksHtml = `
                <a href="dashboard.html" class="hover:text-indigo-700 transition">Dashboard</a>
                <a href="bursaries.html" class="hover:text-indigo-700 transition">Bursaries</a>
                <a href="grades.html" class="hover:text-indigo-700 transition">Grades/Timetable</a>
            `;
        }
        container.innerHTML = linksHtml;
    }

    // Run injection for both
    injectNav('desktop-nav');
    injectNav('mobile-nav');

    // 4. HEADER & PROFILE DISPLAY
    const initials = ((currentUser.fname?.[0] || '') + (currentUser.lname?.[0] || '')).toUpperCase();
    
    // Header Avatar
    const headerAv = document.getElementById('header-avatar');
    if(headerAv) headerAv.textContent = initials;

    // Body Avatar
    const bodyAv = document.getElementById('body-avatar');
    if(bodyAv) bodyAv.textContent = initials;

    document.getElementById('display-name').textContent = (currentUser.fname + " " + currentUser.lname);
    document.getElementById('display-email').textContent = currentUser.email;
    document.getElementById('role-badge').textContent = currentUser.affiliation || "User";

    // 5. FILL INPUTS
    const fnameIn = document.getElementById('fname');
    const lnameIn = document.getElementById('lname');
    fnameIn.value = currentUser.fname || "";
    lnameIn.value = currentUser.lname || "";

    // Student Elements
    const studentSection = document.getElementById('student-section');
    const stdNumIn = document.getElementById('student-num');
    const avgIn = document.getElementById('average');
    const facultyIn = document.getElementById('faculty');
    const deptIn = document.getElementById('department');

    // Admin Elements
    const adminSection = document.getElementById('admin-section');
    const staffIdIn = document.getElementById('staff-id');
    const adminDeptIn = document.getElementById('admin-dept');

    // Helper: Populate Depts
    function populateDepartments(selectedFaculty, selectedDept = "") {
        deptIn.innerHTML = '<option value="">Select Department...</option>';
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

    // 6. TOGGLE SECTIONS
    if (currentUser.affiliation === 'admin') {
        adminSection.classList.remove('hidden');
        studentSection.classList.add('hidden');
        staffIdIn.value = currentUser.staffNumber || "";
        adminDeptIn.value = currentUser.department || "";
    } else {
        studentSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
        stdNumIn.value = currentUser.studentNumber || "";
        avgIn.value = currentUser.average || "";
        facultyIn.value = currentUser.faculty || "";
        populateDepartments(currentUser.faculty, currentUser.department);
    }

    // Listener
    facultyIn.addEventListener('change', (e) => {
        populateDepartments(e.target.value);
    });

    // 7. SAVE BUTTON
    document.getElementById('save-btn').addEventListener('click', () => {
        currentUser.fname = fnameIn.value;
        currentUser.lname = lnameIn.value;

        if (currentUser.affiliation === 'admin') {
            currentUser.staffNumber = staffIdIn.value;
            currentUser.department = adminDeptIn.value;
        } else {
            currentUser.studentNumber = stdNumIn.value;
            currentUser.average = avgIn.value;
            currentUser.faculty = facultyIn.value;
            currentUser.department = deptIn.value;
        }

        // Save
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

    // 8. ACTIONS
    document.getElementById('logout-btn').addEventListener('click', () => {
        if(confirm("Logout?")) {
            localStorage.removeItem('currentUser');
            window.location.href = "login.html";
        }
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        if (currentUser.affiliation === 'admin') {
            window.location.href = "admin_dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }
    });
});