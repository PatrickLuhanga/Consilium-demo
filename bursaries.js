document.addEventListener('DOMContentLoaded', () => {
    fetchBursariesFromAPI(); 

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    if (currentUser.affiliation === 'admin') {
        window.location.href = "admin_dashboard.html";
        return;
    }

    updateHeaderInitials(currentUser);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

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
            document.getElementById('filterFaculty').value = currentUser.faculty || '';
            document.getElementById('filterSearch').value = '';
            renderBursaryGrid();
        });
    }

    const statusSelect = document.getElementById('modalStatusSelect');
    if(statusSelect) {
        statusSelect.addEventListener('change', updateApplicationStatus);
    }
});

async function fetchBursariesFromAPI() {
    console.log("Connecting to Python Backend...");
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/bursaries');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Success! Received data:", data);

        localStorage.setItem('bursaries', JSON.stringify(data));
        renderBursaryGrid();

    } catch (error) {
        console.error("Connection Failed:", error);
        console.warn("Falling back to offline mode (LocalStorage).");
        renderBursaryGrid();
    }
}

function renderBursaryGrid() {
    const grid = document.getElementById('bursaryGrid');
    const emptyState = document.getElementById('emptyState');
    
    const bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || []; 
    const user = JSON.parse(localStorage.getItem('currentUser')) || {};

    const fMatch = document.getElementById('filterMatch') ? document.getElementById('filterMatch').value : 'all';
    const fStatus = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';
    const fFaculty = document.getElementById('filterFaculty') ? document.getElementById('filterFaculty').value : user.faculty || '';
    const fSearch = document.getElementById('filterSearch') ? document.getElementById('filterSearch').value.toLowerCase() : '';

    grid.innerHTML = '';
    let visibleCount = 0;

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

        let isMatch = true;
        
        if (userAvg < safeAvg) isMatch = false; 
        
        if (b.faculties && b.faculties.length > 0) { 
            const hasFac = b.faculties.some(f => {
                const reqFacClean = normalize(f);
                return userFacClean.includes(reqFacClean) || reqFacClean.includes(userFacClean);
            });
            if (!hasFac) isMatch = false;
        }

        if (fMatch === 'matches' && !isMatch) return; 
        if (fStatus && status !== fStatus) return; 
        
        if (fFaculty) {
            const filterClean = normalize(fFaculty);
            const facultyMatch = b.faculties.some(f => normalize(f).includes(filterClean));
            if (!facultyMatch) return;
        }

        if (fSearch && !b.title.toLowerCase().includes(fSearch) && !b.provider.toLowerCase().includes(fSearch)) return; 

        visibleCount++;

        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-static fade-in flex flex-col h-full relative overflow-hidden group";
        
        let statusText = "";
        let statusClass = "text-gray-500 font-medium";

        if (status === "Applied") {
            statusText = "Applied";
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
        if(emptyState) emptyState.classList.remove('hidden');
    } else {
        if(emptyState) emptyState.classList.add('hidden');
    }
}

let currentBursaryId = null;

function openModal(id) {
    const bursaries = JSON.parse(localStorage.getItem('bursaries'));
    const b = bursaries.find(item => item.id === id);
    if (!b) return;

    currentBursaryId = id;
    const safeAvg = b.minAverage !== undefined ? b.minAverage : (b.minAvg || 0);

    setText('modalTitle', b.title);
    setText('modalProvider', b.provider);
    setText('modalDesc', b.description || "No description provided.");
    
    setText('modalAvg', `${safeAvg}%`);
    setText('modalDeadline', b.deadline || "Open");
    setText('modalIncome', (b.maxIncome && b.maxIncome !== "N/A") ? `R${b.maxIncome}` : "No Limit");
    setText('modalFaculty', (b.faculties && b.faculties.length) ? b.faculties.join(", ") : "All Faculties");
    
    const linkBtn = document.getElementById('modalLink');
    linkBtn.href = b.link || "#";
    linkBtn.onclick = function() {
        document.getElementById('modalStatusSelect').value = "Applied";
        updateApplicationStatus();
        alert("Good luck! We've marked this as 'Applied' in your dashboard.");
    };

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

    if (index > -1) {
        applications[index].status = newStatus;
        applications[index].dateUpdated = new Date().toLocaleDateString();
        applications[index].studentNumber = user.studentNumber || "N/A";
        applications[index].studentDepartment = user.department || "N/A";
    } else {
        applications.push({
            id: Date.now(),
            bursaryId: b.id,
            bursaryTitle: b.title,
            userEmail: user.email,
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