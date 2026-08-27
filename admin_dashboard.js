document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    if (currentUser.affiliation !== 'admin') {
        window.location.href = "dashboard.html";
        return;
    }

    const initials = ((currentUser.fname?.[0] || 'A') + (currentUser.lname?.[0] || '')).toUpperCase();
    const avatar = document.querySelector(".rounded-full");
    if(avatar) avatar.textContent = initials;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Logout of Admin Console?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    loadDashboard();
});

const FACULTIES = [
    { value: "Engineering", label: "Engineering & Built Environment" },
    { value: "Applied Sciences", label: "Applied Sciences" },
    { value: "Accounting and Informatics", label: "Accounting & Informatics" },
    { value: "Management Sciences", label: "Management Sciences" },
    { value: "Arts and Design", label: "Arts & Design" },
    { value: "Health Sciences", label: "Health Sciences" },
];

function facultyLabel(value) {
    const match = FACULTIES.find(f => f.value === value);
    return match ? match.label : value;
}

function loadDashboard() {
    const bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || [];

    const activeCount = bursaries.length;
    const internalCount = bursaries.filter(b => (b.type || 'External') === 'Internal').length;
    const externalCount = activeCount - internalCount;
    const totalApps = applications.length;
    const pendingCount = applications.filter(a => (a.status || 'Applied') === 'Applied' || a.status === 'Interested').length;

    setText('stat-active', activeCount);
    setText('stat-breakdown', activeCount > 0 ? `${internalCount} Internal · ${externalCount} External` : '');
    setText('stat-total', totalApps);
    setText('stat-pending', pendingCount);

    const listContainer = document.getElementById('admin-bursary-list');
    if (!listContainer) return; 
    
    listContainer.innerHTML = '';

    if (bursaries.length === 0) {
        listContainer.innerHTML = `
            <div class="p-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p>No bursaries active.</p>
                <a href="create_bursaries.html" class="text-indigo-600 font-bold hover:underline text-sm mt-2 block">Create your first one</a>
            </div>`;
        return;
    }

    const sortedBursaries = bursaries.sort((a, b) => b.id - a.id);

    sortedBursaries.forEach((b) => {
        const row = document.createElement('div');
        row.className = "grid grid-cols-12 p-4 items-center hover:bg-gray-50 transition border-b border-gray-100 last:border-0";
        
        let facultyText = "All Faculties";
        if (b.faculties && b.faculties.length > 0) {
            facultyText = b.faculties.map(facultyLabel).join(', ');
        }

        const type = b.type || 'External';
        const typeBadge = type === 'Internal'
            ? `<span class="inline-block text-[10px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Internal</span>`
            : `<span class="inline-block text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">External</span>`;

        row.innerHTML = `
            <div class="col-span-6">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <p class="text-sm font-bold text-gray-900">${b.title}</p>
                    ${typeBadge}
                </div>
                <div class="text-xs">
                    <span class="block font-bold text-gray-700">${b.provider}</span> 
                    <span class="block text-gray-400 mt-0.5 truncate pr-4">${facultyText}</span>
                </div>
            </div>
            <div class="col-span-3 text-center text-sm font-medium text-gray-600">
                ${b.deadline || "Open"}
            </div>
            <div class="col-span-3 flex justify-end gap-2">
                <button onclick="editBursary(${b.id})" class="text-gray-400 hover:text-indigo-600 transition p-2 hover:bg-indigo-50 rounded-lg" title="Edit Opportunity">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="deleteBursary(${b.id})" class="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg" title="Delete Opportunity">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

function editBursary(id) {
    window.location.href = `create_bursaries.html?id=${id}`;
}

function deleteBursary(id) {
    if (confirm('Are you sure you want to remove this bursary? Students will no longer see it.')) {
        let bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];
        bursaries = bursaries.filter(b => b.id !== id);
        localStorage.setItem('bursaries', JSON.stringify(bursaries));
        loadDashboard();
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}