// calculator_table.js

// --- 1. DATA INITIALIZATION ---
let allModules = []; 
let userModules = []; 
let currentUserEmail = "";

try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        currentUserEmail = user.email;
    }
    
    // Load ALL data
    allModules = JSON.parse(localStorage.getItem('consilium_modules')) || [];
    
    // Filter for THIS user
    userModules = allModules.filter(m => m.userEmail === currentUserEmail);

} catch (e) {
    console.error("Data error, resetting.");
    allModules = [];
    userModules = [];
}

// Set Active Module based on USER list
let activeModuleId = userModules.length > 0 ? userModules[0].id : null;

// --- 2. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. GET USER & AUTH CHECK (Fix: Do this first!)
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // 2. ROLE CHECK (The Gatekeeper)
    if (user.affiliation === 'admin') {
        window.location.href = "admin_dashboard.html";
        return;
    }

    // 3. Update Header Initials
    const initials = ((user.fname?.[0] || 'U') + (user.lname?.[0] || '')).toUpperCase();
    const avatar = document.querySelector(".rounded-full");
    if(avatar) avatar.textContent = initials;

    // 4. ATTACH LISTENERS
    const masterBtn = document.getElementById('save-calc-btn');
    if (masterBtn) {
        masterBtn.addEventListener('click', handleSaveAndCalculate);
    }

    const addRowBtn = document.getElementById('add-assessment-row');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => addNewRowUI("", 0, 0));
    }

    // 5. RENDER UI
    renderModuleGrid();
    loadActiveModule(); 
});

// --- 3. MASTER SAVE HANDLER ---
function handleSaveAndCalculate() {
    const masterBtn = document.getElementById('save-calc-btn');
    try {
        updateDataFromUI(); // Save to Local Vars
        saveToStorage();    // Persist to LocalStorage
        calculateGrades();  // Run Math
        renderModuleGrid(); // Update Sidebar
        
        // Success Feedback
        if (masterBtn) {
            const originalHTML = masterBtn.innerHTML;
            masterBtn.innerHTML = "✅ Saved!";
            masterBtn.classList.replace('bg-indigo-600', 'bg-green-600');
            setTimeout(() => {
                masterBtn.innerHTML = originalHTML;
                masterBtn.classList.replace('bg-green-600', 'bg-indigo-600');
            }, 1500);
        }
    } catch (error) {
        console.error("Save failed:", error);
        alert("Error saving data.");
    }
}

// --- 4. DATA SAVING ---
function saveToStorage() {
    // 1. Remove this user's old data from the master list
    allModules = allModules.filter(m => m.userEmail !== currentUserEmail);
    
    // 2. Add the updated user modules back in
    allModules = [...allModules, ...userModules];
    
    // 3. Save the master list
    localStorage.setItem('consilium_modules', JSON.stringify(allModules));
}

// --- 5. UI RENDERING FUNCTIONS ---

function renderModuleGrid() {
    const grid = document.getElementById('module-grid');
    if (!grid) return;
    grid.innerHTML = ''; 

    // Render ONLY user modules
    userModules.forEach(mod => {
        const isActive = mod.id === activeModuleId;
        const card = document.createElement('div');
        card.className = `cursor-pointer p-4 rounded-xl border-2 transition min-w-[120px] ${
            isActive ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'
        }`;
        card.onclick = () => switchModule(mod.id);
        card.innerHTML = `
            <div class="flex flex-col items-center">
                <span class="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs mb-2">${mod.code || '??'}</span>
                <span class="text-xs font-bold text-gray-800 text-center truncate w-full">${mod.name}</span>
            </div>
        `;
        grid.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.className = "border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition min-w-[120px]";
    addBtn.innerHTML = `<span class="text-2xl">+</span><span class="text-xs font-bold uppercase">New Module</span>`;
    addBtn.onclick = openNewModuleModal;
    grid.appendChild(addBtn);
}

function loadActiveModule() {
    const emptyState = document.getElementById('empty-state-msg');
    const calcUI = document.getElementById('calculator-ui');
    
    // Find in USER list
    const mod = userModules.find(m => m.id === activeModuleId);

    if (!mod) {
        if(emptyState) emptyState.classList.remove('hidden');
        if(calcUI) calcUI.classList.add('hidden');
        return;
    }

    if(emptyState) emptyState.classList.add('hidden');
    if(calcUI) calcUI.classList.remove('hidden');

    const titleEl = document.getElementById('module-title');
    if (titleEl) titleEl.innerText = mod.name;
    
    const codeEl = document.getElementById('module-icon');
    if (codeEl) codeEl.innerText = mod.code;

    const examInput = document.getElementById('exam-weight-config');
    if (examInput) examInput.value = mod.examWeight;

    const goalInput = document.getElementById('goal-input');
    if (goalInput) goalInput.value = mod.goal;
    
    // Setup Assessment List
    const list = document.getElementById('assessment-list');
    if (!list) return;
    list.innerHTML = ''; 

    // Add Button
    const addBtn = document.createElement('button');
    addBtn.id = 'add-assessment-row';
    addBtn.type = 'button';
    addBtn.className = 'col-span-1 sm:col-span-4 text-xs text-indigo-600 font-semibold hover:text-indigo-800 mt-2 flex items-center gap-1 justify-start';
    addBtn.textContent = '+ Add Assessment';
    addBtn.onclick = () => addNewRowUI("", 0, 0);
    list.appendChild(addBtn);

    // Populate Rows
    if (mod.assessments && mod.assessments.length > 0) {
        mod.assessments.forEach(ass => addNewRowUI(ass.name, ass.weight, ass.mark));
    } else {
        addNewRowUI("", 0, 0);
    }

    calculateGrades();
}

function addNewRowUI(name = "", weight = 0, mark = 0) {
    const list = document.getElementById('assessment-list');
    if (!list) return;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = name;
    nameInput.placeholder = 'Name';
    nameInput.className = 'p-2 border border-gray-300 rounded text-sm text-gray-700 w-full';

    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.value = weight;
    weightInput.placeholder = 'Weight';
    weightInput.className = 'assessment-weight p-2 border border-gray-300 rounded text-center text-sm w-full max-w-[80px] mx-auto';

    const markInput = document.createElement('input');
    markInput.type = 'number';
    markInput.value = mark;
    markInput.placeholder = 'Mark';
    markInput.className = 'assessment-mark p-2 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded text-center text-sm w-full max-w-[80px] mx-auto';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = "flex items-center justify-center p-2 rounded hover:bg-red-50 mx-auto text-gray-400 hover:text-red-600 transition";
    delBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
    
    delBtn.onclick = function() {
        nameInput.remove();
        weightInput.remove();
        markInput.remove();
        delBtn.remove();
        handleSaveAndCalculate(); 
    };

    const addBtn = document.getElementById('add-assessment-row');
    if (addBtn) {
        list.insertBefore(nameInput, addBtn);
        list.insertBefore(weightInput, addBtn);
        list.insertBefore(markInput, addBtn);
        list.insertBefore(delBtn, addBtn);
    }
}

function updateDataFromUI() {
    const mod = userModules.find(m => m.id === activeModuleId);
    if (!mod) return;

    mod.examWeight = parseFloat(document.getElementById('exam-weight-config').value) || 0;
    mod.goal = parseFloat(document.getElementById('goal-input').value) || 0;

    const names = document.querySelectorAll('#assessment-list input[type="text"]');
    const weights = document.querySelectorAll('.assessment-weight');
    const marks = document.querySelectorAll('.assessment-mark');

    mod.assessments = [];
    
    for (let i = 0; i < weights.length; i++) {
        mod.assessments.push({
            name: names[i] ? names[i].value : "",
            weight: parseFloat(weights[i].value) || 0,
            mark: parseFloat(marks[i].value) || 0
        });
    }
}

function calculateGrades() {
    const examW = parseFloat(document.getElementById('exam-weight-config').value) || 0;
    const dpW = 100 - examW;
    const goal = parseFloat(document.getElementById('goal-input').value) || 0;
    const weights = document.querySelectorAll('.assessment-weight');
    const marks = document.querySelectorAll('.assessment-mark');

    let weightedSum = 0;
    let totalAssessmentWeight = 0;

    for (let i = 0; i < weights.length; i++) {
        const w = parseFloat(weights[i].value) || 0;
        const m = parseFloat(marks[i].value) || 0;
        if (w > 0) {
            weightedSum += (m * w);
            totalAssessmentWeight += w;
        }
    }

    const dpDisplay = document.getElementById('display-dp');
    if(dpDisplay) {
        let warningMsg = document.getElementById('weight-warning-msg');
        if (!warningMsg) {
            warningMsg = document.createElement('div');
            warningMsg.id = 'weight-warning-msg';
            dpDisplay.parentElement.appendChild(warningMsg);
        }
        if (totalAssessmentWeight < 100) {
            warningMsg.innerText = `⚠️ Total: ${totalAssessmentWeight}%. Missing ${100 - totalAssessmentWeight}%.`;
            warningMsg.className = "text-xs text-orange-600 font-bold mt-1 block";
        } else if (totalAssessmentWeight > 100) {
            warningMsg.innerText = `🚫 Total: ${totalAssessmentWeight}%. Exceeds 100%.`;
            warningMsg.className = "text-xs text-red-600 font-bold mt-1 block";
        } else {
            warningMsg.innerText = "✅ Weights total 100%";
            warningMsg.className = "text-xs text-green-600 font-bold mt-1 block";
        }
    }

    const currentDP = totalAssessmentWeight > 0 ? weightedSum / totalAssessmentWeight : 0;
    const dpWeightDisp = document.getElementById('dp-weight-display');
    if (dpWeightDisp) dpWeightDisp.innerText = `(DP Weight is at ${dpW}%)`;
    if (dpDisplay) dpDisplay.innerText = Math.round(currentDP) + "%";

    const displayReq = document.getElementById('display-exam-req');
    const explHand = document.getElementById('expl-points-in-hand');
    const explNeed = document.getElementById('expl-points-needed');
    document.getElementById('display-goal-text').innerText = goal;
    
    if (displayReq && examW > 0) {
        const pointsInHand = currentDP * (dpW / 100);
        const pointsNeeded = goal - pointsInHand;
        const reqExam = pointsNeeded / (examW / 100);
        const finalVal = Math.round(reqExam);

        if (explHand) explHand.innerText = pointsInHand.toFixed(1);
        if (explNeed) explNeed.innerText = pointsNeeded > 0 ? pointsNeeded.toFixed(1) : 0;
        displayReq.innerText = finalVal + "%";
        
        if (finalVal > 100) displayReq.className = "text-4xl font-extrabold text-red-600";
        else if (finalVal <= 0) { displayReq.innerText = "PASS"; displayReq.className = "text-4xl font-extrabold text-green-600"; }
        else displayReq.className = "text-4xl font-extrabold text-indigo-600";
    }
}

function switchModule(id) {
    activeModuleId = id;
    renderModuleGrid();
    loadActiveModule();
}

function openNewModuleModal() {
    const name = prompt("Enter Module Name (e.g. Mathematics):");
    if (!name) return;
    const code = prompt("Enter 2-letter Code (e.g. MA):")?.toUpperCase() || "??";
    
    if (!currentUserEmail) {
        alert("Please log in to add modules.");
        return;
    }

    const newMod = { 
        id: Date.now(), 
        userEmail: currentUserEmail, 
        name, 
        code, 
        examWeight: 60, 
        goal: 50, 
        assessments: [] 
    };
    
    userModules.push(newMod); 
    saveToStorage(); 
    
    activeModuleId = newMod.id;
    renderModuleGrid();
    loadActiveModule();
}

function deleteActiveModule() {
    if(!activeModuleId) return;
    if(confirm("Delete this module and all grades?")) {
        userModules = userModules.filter(m => m.id !== activeModuleId);
        saveToStorage(); 
        activeModuleId = userModules.length > 0 ? userModules[0].id : null;
        renderModuleGrid();
        loadActiveModule();
    }
}