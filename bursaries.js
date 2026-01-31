document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Seed Data (if empty)
    seedBursaries();

    // 2. Load User & Auth Check
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert("Please log in to view bursaries.");
        window.location.href = "login.html";
        return;
    }

    // 🛑 ROLE CHECK: Kick Admins out to their own dashboard
    // FIX: Changed 'user' to 'currentUser'
    if (currentUser.affiliation === 'admin') {
        window.location.href = "admin_dashboard.html";
        return;
    }

    updateHeaderInitials(currentUser);
    renderBursaryGrid();

    // 3. LOGOUT LOGIC (Added this back so the button works)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    // 4. Attach Filter Listeners
    const filterIds = ['filterMatch', 'filterStatus', 'filterFaculty', 'filterSearch'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', renderBursaryGrid);
    });

    const resetBtn = document.getElementById('resetFiltersBtn');
    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('filterMatch').value = 'all';
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterFaculty').value = '';
            document.getElementById('filterSearch').value = '';
            renderBursaryGrid();
        });
    }

    const statusSelect = document.getElementById('modalStatusSelect');
    if(statusSelect) {
        statusSelect.addEventListener('change', updateApplicationStatus);
    }
});

// --- DATA SEEDING ---
function seedBursaries() {
    if (!localStorage.getItem('bursaries')) {
        const data = [
            { 
                id: 1, 
                title: "Tech Future Leaders", 
                provider: "Global Corp", 
                description: "Full funding for students in Software Development. Requires a passion for AI.", 
                faculties: ["Accounting and Informatics", "Engineering"], 
                minAverage: 65, 
                maxIncome: "350000",
                deadline: "2025-10-30",
                link: "https://www.google.com" 
            },
            { 
                id: 2, 
                title: "Engineering Trust", 
                provider: "BuildRight", 
                description: "Supporting Civil and Mechanical Engineering students. Includes vacation work.", 
                faculties: ["Engineering"], 
                minAverage: 60, 
                maxIncome: "600000",
                deadline: "2025-09-15",
                link: "https://www.google.com" 
            },
            { 
                id: 3, 
                title: "Accounting Grant", 
                provider: "FinTech Sol", 
                description: "For high-performing CA stream students.", 
                faculties: ["Accounting and Informatics"], 
                minAverage: 70, 
                maxIncome: "N/A",
                deadline: "2025-11-01",
                link: "https://www.google.com" 
            }
        ];
        localStorage.setItem('bursaries', JSON.stringify(data));
    }
}

// --- RENDER GRID ---
function renderBursaryGrid() {
    const grid = document.getElementById('bursaryGrid');
    const emptyState = document.getElementById('emptyState');
    
    const bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || []; 
    const user = JSON.parse(localStorage.getItem('currentUser'));

    const fMatch = document.getElementById('filterMatch').value;
    const fStatus = document.getElementById('filterStatus').value;
    const fFaculty = document.getElementById('filterFaculty').value;
    const fSearch = document.getElementById('filterSearch').value.toLowerCase();

    grid.innerHTML = '';
    let visibleCount = 0;

    // HELPER: Normalize strings for easier matching
    const normalize = (str) => {
        if (!str) return "";
        return str.toLowerCase()
            .replace(/_/g, " ")       
            .replace(/&/g, "and")     
            .replace(/\s+/g, " ")     
            .trim();
    };

    const userAvg = parseFloat(user.average) || 0;
    const userFacClean = normalize(user.faculty); 

    bursaries.forEach(b => {
        const app = applications.find(a => a.userEmail === user.email && a.bursaryId === b.id);
        const status = app ? app.status : "Interested"; 

        const safeAvg = b.minAverage !== undefined ? b.minAverage : (b.minAvg || 0);

        // --- MATCHING LOGIC ---
        let isMatch = true;
        
        // 1. Grade Check
        if (userAvg < safeAvg) isMatch = false; 
        
        // 2. Faculty Check
        if (b.faculties && b.faculties.length > 0) { 
            const hasFac = b.faculties.some(f => {
                const reqFacClean = normalize(f);
                return userFacClean.includes(reqFacClean) || reqFacClean.includes(userFacClean);
            });
            
            if (!hasFac) isMatch = false;
        }

        // --- FILTERING ---
        if (fMatch === 'matches' && !isMatch) return; 
        if (fStatus && status !== fStatus) return; 
        
        if (fFaculty) {
            const filterClean = normalize(fFaculty);
            const facultyMatch = b.faculties.some(f => normalize(f).includes(filterClean));
            if (!facultyMatch) return;
        }

        if (fSearch && !b.title.toLowerCase().includes(fSearch) && !b.provider.toLowerCase().includes(fSearch)) return; 

        visibleCount++;

        // --- RENDER CARD ---
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-static fade-in flex flex-col h-full relative overflow-hidden group";
        
        let statusText = "";
        let statusClass = "text-gray-500 font-medium";

        if (status === "Applied") {
            statusText = "✅ Applied";
            statusClass = "text-green-600 font-bold";
        } else if (isMatch) {
            statusText = "Recommended Match";
            statusClass = "text-gray-600 font-medium";
        }

        card.innerHTML = `
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-indigo-600 uppercase tracking-wide">${b.provider}</span>
                </div>

                <h3 class="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-indigo-700 transition-colors">${b.title}</h3>

                <div class="space-y-1">
                    <p class="text-sm text-gray-500 font-medium">Min Avg: <span class="text-gray-900 font-bold">${safeAvg}%</span></p>
                    ${statusText ? `<p class="text-sm ${statusClass}">${statusText}</p>` : ''}
                </div>
            </div>

            <button onclick="openModal(${b.id})" class="mt-6 w-full bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition text-sm shadow-sm">
                View Details
            </button>
        `;
        grid.appendChild(card);
    });

    if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// --- MODAL LOGIC ---
let currentBursaryId = null;

function openModal(id) {
    const bursaries = JSON.parse(localStorage.getItem('bursaries'));
    const b = bursaries.find(item => item.id === id);
    if (!b) return;

    currentBursaryId = id;
    const safeAvg = b.minAverage !== undefined ? b.minAverage : (b.minAvg || 0);

    // Fill Info
    setText('modalTitle', b.title);
    setText('modalProvider', b.provider);
    setText('modalDesc', b.description || "No description provided.");
    
    // Fill Grid Details
    setText('modalAvg', `${safeAvg}%`);
    setText('modalDeadline', b.deadline || "Open");
    setText('modalIncome', (b.maxIncome && b.maxIncome !== "N/A") ? `R${b.maxIncome}` : "No Limit");
    setText('modalFaculty', (b.faculties && b.faculties.length) ? b.faculties.join(", ") : "All Faculties");
    
    // LINK LOGIC (AUTO-SAVE)
    const linkBtn = document.getElementById('modalLink');
    linkBtn.href = b.link;
    linkBtn.onclick = function() {
        // Automatically mark as applied when they leave
        document.getElementById('modalStatusSelect').value = "Applied";
        updateApplicationStatus();
        alert("Good luck! We've marked this as 'Applied' in your dashboard.");
    };

    // Set Status
    const applications = JSON.parse(localStorage.getItem('applications')) || [];
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const app = applications.find(a => a.userEmail === user.email && a.bursaryId === id);
    
    document.getElementById('modalStatusSelect').value = app ? app.status : "Interested";

    document.getElementById('modalBg').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalBg').classList.add('hidden');
    currentBursaryId = null;
}

function updateApplicationStatus() {
    if (!currentBursaryId) return;

    const newStatus = document.getElementById('modalStatusSelect').value;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const bursaries = JSON.parse(localStorage.getItem('bursaries'));
    const b = bursaries.find(item => item.id === currentBursaryId);

    let applications = JSON.parse(localStorage.getItem('applications')) || [];
    
    const index = applications.findIndex(a => a.userEmail === user.email && a.bursaryId === currentBursaryId);

    // --- CREATE / UPDATE APPLICATION ---
    if (index > -1) {
        applications[index].status = newStatus;
        applications[index].dateUpdated = new Date().toLocaleDateString();
        // Update user details in case they changed since last application
        applications[index].studentNumber = user.studentNumber || "N/A";
        applications[index].studentDepartment = user.department || "N/A";
    } else {
        applications.push({
            id: Date.now(),
            bursaryId: b.id,
            bursaryTitle: b.title,
            userEmail: user.email,
            
            // SAVE STUDENT DETAILS FOR ADMIN
            studentName: user.fullName || (user.fname + " " + user.lname),
            studentNumber: user.studentNumber || "N/A",  
            studentFaculty: user.faculty || "Unknown",
            studentDepartment: user.department || "Unknown", 
            studentAverage: user.average || 0,
            
            status: newStatus,
            dateApplied: new Date().toLocaleDateString()
        });
    }

    localStorage.setItem('applications', JSON.stringify(applications));
    renderBursaryGrid(); 
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

function updateHeaderInitials(user) {
    const initials = ((user.fname?.[0] || 'U') + (user.lname?.[0] || '')).toUpperCase();
    const avatar = document.querySelector(".rounded-full");
    if(avatar) avatar.textContent = initials;
}