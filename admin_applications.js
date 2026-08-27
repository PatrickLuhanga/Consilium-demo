// Canonical lists shared across bursary creation, management and applications.
const FACULTIES = [
    { value: "Engineering", label: "Engineering & Built Environment" },
    { value: "Applied Sciences", label: "Applied Sciences" },
    { value: "Accounting and Informatics", label: "Accounting & Informatics" },
    { value: "Management Sciences", label: "Management Sciences" },
    { value: "Arts and Design", label: "Arts & Design" },
    { value: "Health Sciences", label: "Health Sciences" },
];

const QUALIFICATIONS = [
    "Higher Certificate",
    "National Diploma",
    "Advanced Diploma",
    "Bachelor's Degree",
    "Postgraduate Diploma",
    "Master's Degree",
    "Doctorate"
];

// Expected shape of an entry in localStorage('applications'), written by the
// student-facing apply flow:
// {
//   id, studentNumber, studentName, faculty, department, qualification,
//   average, bursaryId, bursaryTitle, bursaryType, appliedDate,
//   status: "Applied" | "Interested" | "Accepted" | "Rejected",
//   rejectionReason, decidedDate
// }

let pendingRejectId = null;

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
    if (avatar) avatar.textContent = initials;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    populateFilterOptions();

    const filterFaculty = document.getElementById('filterFaculty');
    const filterStatus = document.getElementById('filterStatus');
    const filterQualification = document.getElementById('filterQualification');
    [filterFaculty, filterStatus, filterQualification].forEach(el => {
        if (el) el.addEventListener('change', renderApplications);
    });

    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (filterFaculty) filterFaculty.value = 'all';
            if (filterStatus) filterStatus.value = 'all';
            if (filterQualification) filterQualification.value = 'all';
            renderApplications();
        });
    }

    setupModal();
    renderApplications();
});

function populateFilterOptions() {
    const facultySelect = document.getElementById('filterFaculty');
    if (facultySelect) {
        facultySelect.innerHTML = '<option value="all">Show All Faculties</option>' +
            FACULTIES.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
    }

    const qualSelect = document.getElementById('filterQualification');
    if (qualSelect) {
        qualSelect.innerHTML = '<option value="all">Show All Qualifications</option>' +
            QUALIFICATIONS.map(q => `<option value="${q}">${q}</option>`).join('');
    }
}

function getApplications() {
    return JSON.parse(localStorage.getItem('applications')) || [];
}

function saveApplications(apps) {
    localStorage.setItem('applications', JSON.stringify(apps));
}

function facultyLabel(value) {
    const match = FACULTIES.find(f => f.value === value);
    return match ? match.label : (value || 'N/A');
}

function renderApplications() {
    const tbody = document.getElementById('applications-table-body');
    const emptyState = document.getElementById('empty-state');
    if (!tbody) return;

    const applications = getApplications();

    const facultyFilter = document.getElementById('filterFaculty')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const qualificationFilter = document.getElementById('filterQualification')?.value || 'all';

    const filtered = applications.filter(app => {
        if (facultyFilter !== 'all' && app.faculty !== facultyFilter) return false;
        if (qualificationFilter !== 'all' && app.qualification !== qualificationFilter) return false;
        if (statusFilter !== 'all' && (app.status || 'Applied') !== statusFilter) return false;
        return true;
    });

    filtered.sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0));

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    filtered.forEach(app => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition";

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900">${escapeHtml(app.studentNumber || 'N/A')}</td>
            <td class="px-6 py-4">${escapeHtml(app.studentName || 'N/A')}</td>
            <td class="px-6 py-4">${escapeHtml(facultyLabel(app.faculty))}</td>
            <td class="px-6 py-4">${escapeHtml(app.department || 'N/A')}</td>
            <td class="px-6 py-4">${escapeHtml(app.qualification || 'N/A')}</td>
            <td class="px-6 py-4">${app.average !== undefined && app.average !== null ? app.average + '%' : 'N/A'}</td>
            <td class="px-6 py-4 font-medium text-gray-800">${escapeHtml(app.bursaryTitle || 'N/A')}</td>
            <td class="px-6 py-4 text-gray-500">${formatDate(app.appliedDate)}</td>
            <td class="px-6 py-4 text-right">${statusCell(app)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function statusCell(app) {
    const status = app.status || 'Applied';
    if (status === 'Rejected') {
        return `<button onclick="viewRejectionReason(${app.id})" class="inline-block text-xs font-bold uppercase tracking-wide text-red-700 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition" title="View reason">Rejected</button>`;
    }
    if (status === 'Accepted') {
        return `<span class="inline-block text-xs font-bold uppercase tracking-wide text-green-700 bg-green-50 px-3 py-1.5 rounded-full">Accepted</span>`;
    }
    return `
        <div class="flex justify-end gap-2">
            <button onclick="acceptApplication(${app.id})" class="text-xs font-bold uppercase tracking-wide text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition">Accept</button>
            <button onclick="openRejectModal(${app.id})" class="text-xs font-bold uppercase tracking-wide text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition">Reject</button>
        </div>
    `;
}

function acceptApplication(id) {
    if (!confirm('Mark this application as Accepted?')) return;
    const apps = getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return;
    apps[idx].status = 'Accepted';
    apps[idx].rejectionReason = null;
    apps[idx].decidedDate = new Date().toISOString();
    saveApplications(apps);
    renderApplications();
}

function openRejectModal(id) {
    pendingRejectId = id;
    const modal = document.getElementById('rejection-modal');
    const textarea = document.getElementById('rejection-reason-input');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const errorMsg = document.getElementById('rejection-error');

    title.textContent = 'Reject Application';
    subtitle.textContent = "Let the student know why this application wasn't successful. This comment will be visible to them.";
    textarea.value = '';
    textarea.readOnly = false;
    confirmBtn.classList.remove('hidden');
    cancelBtn.textContent = 'Cancel';
    errorMsg.classList.add('hidden');

    modal.classList.remove('hidden');
    textarea.focus();
}

function viewRejectionReason(id) {
    const apps = getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return;

    pendingRejectId = null;
    const modal = document.getElementById('rejection-modal');
    const textarea = document.getElementById('rejection-reason-input');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const errorMsg = document.getElementById('rejection-error');

    title.textContent = 'Rejection Reason';
    subtitle.textContent = 'This is the comment shared with the student.';
    textarea.value = app.rejectionReason || 'No reason was recorded.';
    textarea.readOnly = true;
    confirmBtn.classList.add('hidden');
    cancelBtn.textContent = 'Close';
    errorMsg.classList.add('hidden');

    modal.classList.remove('hidden');
}

function setupModal() {
    const modal = document.getElementById('rejection-modal');
    if (!modal) return;

    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const textarea = document.getElementById('rejection-reason-input');
    const errorMsg = document.getElementById('rejection-error');

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        pendingRejectId = null;
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            pendingRejectId = null;
        }
    });

    confirmBtn.addEventListener('click', () => {
        const reason = textarea.value.trim();
        if (!reason) {
            errorMsg.classList.remove('hidden');
            return;
        }
        if (pendingRejectId == null) return;

        const apps = getApplications();
        const idx = apps.findIndex(a => a.id === pendingRejectId);
        if (idx !== -1) {
            apps[idx].status = 'Rejected';
            apps[idx].rejectionReason = reason;
            apps[idx].decidedDate = new Date().toISOString();
            saveApplications(apps);
        }
        modal.classList.add('hidden');
        pendingRejectId = null;
        renderApplications();
    });
}

function formatDate(iso) {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function downloadCSV() {
    const applications = getApplications();
    if (applications.length === 0) {
        alert('No applications to export.');
        return;
    }

    const headers = ['Student No.', 'Student Name', 'Faculty', 'Department', 'Qualification', 'Average (%)', 'Bursary', 'Date Applied', 'Status', 'Rejection Reason'];
    const rows = applications.map(app => [
        app.studentNumber || '',
        app.studentName || '',
        facultyLabel(app.faculty),
        app.department || '',
        app.qualification || '',
        app.average ?? '',
        app.bursaryTitle || '',
        formatDate(app.appliedDate),
        app.status || 'Applied',
        app.rejectionReason || ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(csvEscape).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consilium-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
