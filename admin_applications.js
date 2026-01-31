document.addEventListener('DOMContentLoaded', () => {
    
    // 1. AUTH CHECK
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // 🛑 2. ROLE CHECK (The Gatekeeper)
    // Security: If a Student tries to load this Admin page, kick them back to Student Dashboard
    if (currentUser.affiliation !== 'admin') {
        window.location.href = "dashboard.html";
        return;
    }

    // 3. SET HEADER INITIALS
    const initials = ((currentUser.fname?.[0] || 'A') + (currentUser.lname?.[0] || '')).toUpperCase();
    const avatar = document.querySelector(".rounded-full");
    if(avatar) avatar.textContent = initials;

    // 4. LOGOUT LOGIC
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    // 5. CHECK FOR DATA & SEED IF EMPTY (For Testing)
    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    if (apps.length === 0) {
        console.log("⚠️ No applications found. Generating TEST DATA...");
        
        const testApp = {
            id: 999,
            studentName: "Test Student",
            studentNumber: "22012345",
            studentFaculty: "Engineering",
            studentDepartment: "Civil Engineering",
            studentAverage: 75,
            bursaryTitle: "Toyota Engineering Bursary",
            status: "Applied",
            dateApplied: new Date().toLocaleDateString(),
            userEmail: "test@student.com",
            bursaryId: 1
        };
        
        localStorage.setItem('applications', JSON.stringify([testApp]));
        // Reload to show the new data
        location.reload(); 
        return;
    }

    // 6. LOAD TABLE
    renderTable();

    // 7. ATTACH LISTENERS
    const filterFac = document.getElementById('filterFaculty');
    const filterStat = document.getElementById('filterStatus');
    const resetBtn = document.getElementById('resetFilters');

    if(filterFac) filterFac.addEventListener('change', renderTable);
    if(filterStat) filterStat.addEventListener('change', renderTable);
    if(resetBtn) resetBtn.addEventListener('click', () => {
        if(filterFac) filterFac.value = 'all';
        if(filterStat) filterStat.value = 'all';
        renderTable();
    });
});

// --- RENDER TABLE FUNCTION ---
function renderTable() {
    const tbody = document.getElementById('applications-table-body');
    const emptyState = document.getElementById('empty-state');
    const applications = JSON.parse(localStorage.getItem('applications')) || [];
    
    // Get Filter Values
    const facultyFilter = document.getElementById('filterFaculty') ? document.getElementById('filterFaculty').value.toLowerCase() : 'all';
    const statusFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'all';

    tbody.innerHTML = '';
    let visibleCount = 0;

    // Sort by Date (Newest first)
    const sortedApps = applications.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));

    sortedApps.forEach(app => {
        
        // Filter Logic
        if (statusFilter !== 'all' && app.status !== statusFilter) return;
        const cleanFaculty = (app.studentFaculty || "").toLowerCase();
        if (facultyFilter !== 'all' && !cleanFaculty.includes(facultyFilter)) return;

        visibleCount++;

        // Status Badge Logic
        let statusBadge = "";
        if (app.status === 'Applied') {
            statusBadge = `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg font-bold">Applied</span>`;
        } else if (app.status === 'Interested') {
            statusBadge = `<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-lg font-bold">To Do</span>`;
        } else {
             statusBadge = `<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-lg font-bold">${app.status}</span>`;
        }

        // Data Safe Handling
        const sNum = app.studentNumber || "-"; 
        const sDept = app.studentDepartment || "-"; 

        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 transition border-b border-gray-50";
        row.innerHTML = `
            <td class="px-6 py-4 text-gray-500 font-mono text-xs">${sNum}</td>
            <td class="px-6 py-4 font-bold text-gray-900">${app.studentName}</td>
            <td class="px-6 py-4 text-gray-600">${app.studentFaculty}</td>
            <td class="px-6 py-4 text-gray-600 text-xs">${sDept}</td>
            <td class="px-6 py-4 font-medium">${app.studentAverage}%</td>
            <td class="px-6 py-4 text-indigo-700 font-medium">${app.bursaryTitle}</td>
            <td class="px-6 py-4 text-gray-500 text-xs">${app.dateApplied}</td>
            <td class="px-6 py-4 text-right">${statusBadge}</td>
        `;
        tbody.appendChild(row);
    });

    // Empty State Toggle
    if (visibleCount === 0) {
        if(emptyState) emptyState.classList.remove('hidden');
    } else {
        if(emptyState) emptyState.classList.add('hidden');
    }
}

// --- EXPORT CSV FUNCTION ---
function downloadCSV() {
    const applications = JSON.parse(localStorage.getItem('applications')) || [];
    if (applications.length === 0) { alert("No data to export."); return; }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "Student Number,Student Name,Faculty,Department,Average,Bursary,Status,Date\n"; 

    applications.forEach(app => {
        const row = [
            app.studentNumber || "-",
            app.studentName || "Unknown",
            app.studentFaculty || "Unknown",
            app.studentDepartment || "-",
            app.studentAverage || "0",
            app.bursaryTitle || "Unknown",
            app.status || "Unknown",
            app.dateApplied || "-"
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "consilium_applications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}