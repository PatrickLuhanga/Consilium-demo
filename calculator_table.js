let allModules = []; 
let userModules = []; 
let currentUserEmail = "";

try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        currentUserEmail = user.email;
    }
    
    allModules = JSON.parse(localStorage.getItem('consilium_modules')) || [];
    userModules = allModules.filter(m => m.userEmail === currentUserEmail);

} catch (e) {
    console.error("Data error, resetting.");
    allModules = [];
    userModules = [];
}

let activeModuleId = userModules.length > 0 ? userModules[0].id : null;

document.addEventListener('DOMContentLoaded', () => {
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.affiliation === 'admin') {
        window.location.href = "admin_dashboard.html";
        return;
    }

    const initials = ((user.fname?.[0] || 'U') + (user.lname?.[0] || '')).toUpperCase();
    const avatar = document.querySelector(".rounded-full");
    if(avatar) avatar.textContent = initials;

    const masterBtn = document.getElementById('save-calc-btn');
    if (masterBtn) {
        masterBtn.addEventListener('click', handleSaveAndCalculate);
    }

    const addRowBtn = document.getElementById('add-assessment-row');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => addNewRowUI("", 0, ""));
    }

    const goalInput = document.getElementById('goal-input');
    if (goalInput) goalInput.addEventListener('input', calculateGrades);

    const examInput = document.getElementById('exam-weight-config');
    const dpInput = document.getElementById('dp-weight-config');
    if (examInput && dpInput) {
        examInput.addEventListener('input', () => {
            let val = parseFloat(examInput.value) || 0;
            if (val > 100) val = 100;
            dpInput.value = 100 - val;
            calculateGrades();
        });
        dpInput.addEventListener('input', () => {
            let val = parseFloat(dpInput.value) || 0;
            if (val > 100) val = 100;
            examInput.value = 100 - val;
            calculateGrades();
        });
    }

    renderModuleGrid();
    loadActiveModule(); 
});

function handleSaveAndCalculate() {
    const masterBtn = document.getElementById('save-calc-btn');
    try {
        updateDataFromUI(); 
        saveToStorage();    
        calculateGrades();  
        renderModuleGrid(); 
        
        if (masterBtn) {
            const originalHTML = masterBtn.innerHTML;
            masterBtn.innerHTML = "Saved!";
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

function saveToStorage() {
    allModules = allModules.filter(m => m.userEmail !== currentUserEmail);
    allModules = [...allModules, ...userModules];
    localStorage.setItem('consilium_modules', JSON.stringify(allModules));
}

function renderModuleGrid() {
    const grid = document.getElementById('module-grid');
    if (!grid) return;
    grid.innerHTML = ''; 

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
    const dpInput = document.getElementById('dp-weight-config');
    if (examInput) examInput.value = mod.examWeight;
    if (dpInput) dpInput.value = 100 - mod.examWeight;

    const goalInput = document.getElementById('goal-input');
    if (goalInput) goalInput.value = mod.goal;
    
    const list = document.getElementById('assessment-list');
    if (!list) return;
    list.innerHTML = ''; 

    const addBtn = document.createElement('button');
    addBtn.id = 'add-assessment-row';
    addBtn.type = 'button';
    addBtn.className = 'col-span-1 sm:col-span-5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 mt-2 flex items-center gap-1 justify-start';
    addBtn.textContent = '+ Add Assessment';
    addBtn.onclick = () => addNewRowUI("", 0, ""); 
    list.appendChild(addBtn);

    if (mod.assessments && mod.assessments.length > 0) {
        mod.assessments.forEach(ass => addNewRowUI(ass.name, ass.weight, ass.mark));
    } else {
        addNewRowUI("", 0, "");
    }

    calculateGrades();
}

function addNewRowUI(name = "", weight = 0, mark = "") {
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
    weightInput.addEventListener('input', calculateGrades); 

    const markInput = document.createElement('input');
    markInput.type = 'number';
    markInput.value = mark; 
    markInput.placeholder = '-';
    markInput.className = 'assessment-mark p-2 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded text-center text-sm w-full max-w-[80px] mx-auto';
    markInput.addEventListener('input', calculateGrades); 

    const suggestedSpan = document.createElement('div');
    suggestedSpan.className = 'assessment-suggested text-center text-sm font-bold text-gray-400 bg-gray-50 rounded p-2 flex items-center justify-center h-[38px] w-full max-w-[80px] mx-auto';
    suggestedSpan.innerText = '-';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = "flex items-center justify-center p-2 rounded hover:bg-red-50 mx-auto text-gray-400 hover:text-red-600 transition";
    delBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
    
    delBtn.onclick = function() {
        nameInput.remove();
        weightInput.remove();
        markInput.remove();
        suggestedSpan.remove();
        delBtn.remove();
        handleSaveAndCalculate(); 
    };

    const addBtn = document.getElementById('add-assessment-row');
    if (addBtn) {
        list.insertBefore(nameInput, addBtn);
        list.insertBefore(weightInput, addBtn);
        list.insertBefore(markInput, addBtn);
        list.insertBefore(suggestedSpan, addBtn);
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
        let mVal = marks[i].value.trim(); 
        if(mVal !== "") mVal = parseFloat(mVal);

        mod.assessments.push({
            name: names[i] ? names[i].value : "",
            weight: parseFloat(weights[i].value) || 0,
            mark: mVal
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
    let totalCompletedWeight = 0;
    let totalConfiguredWeight = 0;
    let remainingWeight = 0; 

    for (let i = 0; i < weights.length; i++) {
        const w = parseFloat(weights[i].value) || 0;
        const markVal = marks[i].value.trim(); 
        
        totalConfiguredWeight += w;

        if (w > 0 && markVal !== "") {
            const m = parseFloat(markVal);
            weightedSum += (m * w);
            totalCompletedWeight += w;
        } else if (w > 0 && markVal === "") {
            remainingWeight += w; 
        }
    }

    let targetDP = goal; 
    let neededDPPoints = (targetDP * totalConfiguredWeight) - weightedSum;
    let suggestedMark = remainingWeight > 0 ? (neededDPPoints / remainingWeight) : 0;
    let displaySuggested = Math.round(suggestedMark);

    const suggestedSpans = document.querySelectorAll('.assessment-suggested');
    for (let i = 0; i < weights.length; i++) {
        const markVal = marks[i].value.trim();
        const w = parseFloat(weights[i].value) || 0;

        if (markVal === "") {
            if (w > 0 && remainingWeight > 0) {
                // Here is the 100%+ visual fix
                if (displaySuggested > 100) {
                    suggestedSpans[i].innerText = "100%+";
                    suggestedSpans[i].className = 'assessment-suggested text-center text-xs sm:text-sm font-bold rounded p-2 flex items-center justify-center h-[38px] w-full max-w-[80px] mx-auto bg-red-50 text-red-600';
                } else {
                    suggestedSpans[i].innerText = (displaySuggested > 0 ? displaySuggested : 0) + "%";
                    suggestedSpans[i].className = 'assessment-suggested text-center text-xs sm:text-sm font-bold rounded p-2 flex items-center justify-center h-[38px] w-full max-w-[80px] mx-auto bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm';
                }
            } else {
                suggestedSpans[i].innerText = "-";
                suggestedSpans[i].className = 'assessment-suggested text-center text-sm font-bold text-gray-400 bg-gray-50 rounded p-2 flex items-center justify-center h-[38px] w-full max-w-[80px] mx-auto';
            }
        } else {
            suggestedSpans[i].innerText = "✓";
            suggestedSpans[i].className = 'assessment-suggested text-center text-sm font-bold text-green-500 bg-green-50 rounded p-2 flex items-center justify-center h-[38px] w-full max-w-[80px] mx-auto';
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
        if (totalConfiguredWeight < 100) {
            warningMsg.innerText = `Setup: ${totalConfiguredWeight}% / 100% accounted for.`;
            warningMsg.className = "text-xs text-orange-600 font-bold mt-1 block";
        } else if (totalConfiguredWeight > 100) {
            warningMsg.innerText = `Setup: ${totalConfiguredWeight}%. Exceeds 100%.`;
            warningMsg.className = "text-xs text-red-600 font-bold mt-1 block";
        } else {
            warningMsg.innerText = "Setup complete (100%)";
            warningMsg.className = "text-xs text-green-600 font-bold mt-1 block";
        }
    }

    const accumulatedDP = weightedSum / 100; 
    const runningAverageDP = totalCompletedWeight > 0 ? weightedSum / totalCompletedWeight : 0;
    
    if (dpDisplay) {
        // Pace UI removed below
        dpDisplay.innerHTML = `
            <div class="text-right">
                <div class="text-2xl font-bold text-gray-800">${Math.round(accumulatedDP)} <span class="text-sm text-gray-400 font-normal">/ 100</span></div>
            </div>
        `;
    }

    const displayReq = document.getElementById('display-exam-req');
    const explContainer = document.getElementById('points-explanation');
    const displayGoalText = document.getElementById('display-goal-text');

    if (displayGoalText) displayGoalText.innerText = goal;
    
    if (displayReq && examW > 0) {
        const truePointsBanked = accumulatedDP * (dpW / 100);
        
        const predictedPointsFromDP = runningAverageDP * (dpW / 100); 
        
        const maxPossibleGrade = predictedPointsFromDP + examW;

        displayReq.classList.remove('text-green-600', 'text-indigo-600', 'text-red-600', 'uppercase', 'text-3xl', 'text-4xl');

        if (goal > maxPossibleGrade) {
            displayReq.innerText = "MAX " + Math.floor(maxPossibleGrade) + "%";
            displayReq.className = "text-3xl font-extrabold text-gray-600 uppercase";
            
            if (explContainer) {
                explContainer.innerHTML = `
                    <span class="text-gray-600 font-bold">Goal Unreachable </span><br>
                    You have currently secured <strong>${truePointsBanked.toFixed(1)}%</strong> of your final module grade.<br><br>
                    Even if you keep up your ${Math.round(runningAverageDP)}% average and get <strong>100%</strong> on the exam, your final grade caps at <strong>${maxPossibleGrade.toFixed(1)}%</strong>.<br>
                    Try setting a new goal.
                `;
            }

        } else {
            const pointsNeeded = goal - predictedPointsFromDP;
            const reqExam = pointsNeeded / (examW / 100);
            const finalVal = Math.round(reqExam);

            if (finalVal <= 0) {
                displayReq.innerText = "PASS"; 
                displayReq.className = "text-4xl font-extrabold text-green-600";
                
                if (explContainer) {
                    explContainer.innerHTML = `
                        <span class="text-green-600 font-bold">Goal Achieved!</span><br>
                        Your coursework marks alone have already secured enough points to reach your goal of ${goal}%.
                    `;
                }

            } else {
                displayReq.innerText = finalVal + "%";
                displayReq.className = "text-4xl font-extrabold text-indigo-600";

                if (explContainer) {
                    explContainer.innerHTML = `
                        You have officially secured <strong>${truePointsBanked.toFixed(1)}%</strong> of your final module grade so far.<br><br>
                       
                    `;// Assuming you hit the suggested marks to maintain your <strong>${Math.round(runningAverageDP)}%</strong> average, you will need <strong>${finalVal}%</strong> on the final exam.
                }
            }
        }
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