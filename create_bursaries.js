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

    setupTypeToggle();
    setupIncomeToggle();
    setupFacultyToggle();
    setDefaultDeadline();

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    if (editId) {
        loadForEdit(Number(editId));
    }

    const form = document.getElementById('admin-add-bursary-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

function setupTypeToggle() {
    const internalBtn = document.getElementById('type-internal-btn');
    const externalBtn = document.getElementById('type-external-btn');
    const typeInput = document.getElementById('bursary-type');
    const linkWrapper = document.getElementById('link-field-wrapper');
    const internalNote = document.getElementById('internal-note');
    const linkInput = document.getElementById('external-link');

    function setType(type) {
        typeInput.value = type;
        const isExternal = type === 'External';

        externalBtn.classList.toggle('bg-indigo-600', isExternal);
        externalBtn.classList.toggle('text-white', isExternal);
        externalBtn.classList.toggle('text-gray-600', !isExternal);

        internalBtn.classList.toggle('bg-indigo-600', !isExternal);
        internalBtn.classList.toggle('text-white', !isExternal);
        internalBtn.classList.toggle('text-gray-600', isExternal);

        linkWrapper.classList.toggle('hidden', !isExternal);
        internalNote.classList.toggle('hidden', isExternal);
        linkInput.required = isExternal;
        if (!isExternal) linkInput.value = '';
    }

    internalBtn.addEventListener('click', () => setType('Internal'));
    externalBtn.addEventListener('click', () => setType('External'));

    setType(typeInput.value || 'External');
}

function setupIncomeToggle() {
    const checkbox = document.getElementById('no-income-limit');
    const wrapper = document.getElementById('income-field-wrapper');
    const input = document.getElementById('max-income');

    function apply() {
        const noLimit = checkbox.checked;
        wrapper.classList.toggle('hidden', noLimit);
        input.required = !noLimit;
        if (noLimit) input.value = '';
    }

    checkbox.addEventListener('change', apply);
    apply();
}

function setupFacultyToggle() {
    const checkbox = document.getElementById('all-faculties');
    const wrapper = document.getElementById('faculty-grid-wrapper');
    const checkboxes = document.querySelectorAll('input[name="eligible-faculty"]');

    function apply() {
        const allSelected = checkbox.checked;
        wrapper.classList.toggle('hidden', allSelected);
        if (allSelected) {
            checkboxes.forEach(cb => cb.checked = false);
        }
    }

    checkbox.addEventListener('change', apply);
    apply();
}

function setDefaultDeadline() {
    const deadlineInput = document.getElementById('deadline');
    if (!deadlineInput) return;

    const today = new Date();
    deadlineInput.min = today.toISOString().split('T')[0];

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 90);
    deadlineInput.value = defaultDate.toISOString().split('T')[0];
}

function loadForEdit(id) {
    const bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];
    const bursary = bursaries.find(b => b.id === id);
    if (!bursary) {
        alert('That bursary could not be found — it may have already been deleted.');
        window.location.href = 'admin_bursaries.html';
        return;
    }

    document.getElementById('bursary-id').value = bursary.id;
    document.getElementById('bursary-name').value = bursary.title || '';
    document.getElementById('provider').value = bursary.provider || '';
    document.getElementById('external-link').value = bursary.link || '';
    document.getElementById('description').value = bursary.description || '';
    document.getElementById('min-average').value = bursary.minAverage ?? 50;

    const deadlineInput = document.getElementById('deadline');
    deadlineInput.removeAttribute('min'); // allow keeping an already-passed deadline when editing
    deadlineInput.value = bursary.deadline || '';

    const type = bursary.type || 'External';
    (type === 'Internal' ? document.getElementById('type-internal-btn') : document.getElementById('type-external-btn')).click();

    const income = bursary.maxIncome;
    const noLimitCheckbox = document.getElementById('no-income-limit');
    const hasLimit = income !== undefined && income !== null && income !== '' && income !== 'N/A';
    noLimitCheckbox.checked = !hasLimit;
    noLimitCheckbox.dispatchEvent(new Event('change'));
    if (hasLimit) {
        document.getElementById('max-income').value = income;
    }

    const faculties = bursary.faculties || [];
    const allCheckbox = document.getElementById('all-faculties');
    allCheckbox.checked = faculties.length === 0;
    allCheckbox.dispatchEvent(new Event('change'));
    if (faculties.length > 0) {
        document.querySelectorAll('input[name="eligible-faculty"]').forEach(cb => {
            cb.checked = faculties.includes(cb.value);
        });
    }

    document.getElementById('page-title').textContent = 'Edit Bursary';
    document.getElementById('page-subtitle').textContent = 'Update this opportunity for students.';
    document.getElementById('submit-btn-text').textContent = 'Save Changes';
}

function handleSubmit(event) {
    event.preventDefault();

    const idField = document.getElementById('bursary-id').value;
    const isEdit = !!idField;

    const type = document.getElementById('bursary-type').value || 'External';
    const name = document.getElementById('bursary-name').value.trim();
    const provider = document.getElementById('provider').value.trim();
    const link = document.getElementById('external-link').value.trim();
    const description = document.getElementById('description').value.trim();
    const minAverage = document.getElementById('min-average').value;
    const deadline = document.getElementById('deadline').value;

    const noIncomeLimit = document.getElementById('no-income-limit').checked;
    const maxIncome = noIncomeLimit ? 'N/A' : (document.getElementById('max-income').value || 'N/A');

    const allFaculties = document.getElementById('all-faculties').checked;
    let selectedFaculties = [];
    if (!allFaculties) {
        selectedFaculties = Array.from(document.querySelectorAll('input[name="eligible-faculty"]:checked')).map(cb => cb.value);
        if (selectedFaculties.length === 0) {
            alert('Please select at least one eligible faculty, or tick "Open to All Faculties".');
            return;
        }
    }

    if (type === 'External' && !link) {
        alert('Please provide an application URL for an external bursary.');
        return;
    }

    let bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];

    if (isEdit) {
        const id = Number(idField);
        const index = bursaries.findIndex(b => b.id === id);
        if (index === -1) {
            alert('Could not find this bursary to update — it may have been deleted.');
            window.location.href = 'admin_bursaries.html';
            return;
        }
        bursaries[index] = {
            ...bursaries[index],
            title: name,
            provider: provider,
            type: type,
            link: type === 'Internal' ? '' : link,
            description: description,
            maxIncome: maxIncome,
            minAverage: Number(minAverage),
            deadline: deadline,
            faculties: selectedFaculties,
            updatedAt: Date.now()
        };
        localStorage.setItem('bursaries', JSON.stringify(bursaries));
        alert('✅ Bursary updated successfully!');
    } else {
        const newBursary = {
            id: Date.now(),
            title: name,
            provider: provider,
            type: type,
            link: type === 'Internal' ? '' : link,
            description: description,
            maxIncome: maxIncome,
            minAverage: Number(minAverage),
            deadline: deadline,
            faculties: selectedFaculties,
            status: "Active",
            createdAt: Date.now()
        };
        bursaries.push(newBursary);
        localStorage.setItem('bursaries', JSON.stringify(bursaries));
        alert('✅ Bursary Published Successfully!');
    }

    window.location.href = 'admin_bursaries.html';
}
