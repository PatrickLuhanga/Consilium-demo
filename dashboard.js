document.addEventListener('DOMContentLoaded', () => {
    
    // 1. GET USER
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // 🛑 2. ROLE CHECK (The Gatekeeper)
    // If an Admin tries to load this student page, send them to Admin Dashboard
    if (user.affiliation === 'admin') {
        window.location.href = "admin_dashboard.html";
        return;
    }

    // 3. SET HEADER INITIALS & NAME
    const initials = ((user.fname?.[0] || 'U') + (user.lname?.[0] || '')).toUpperCase();
    
    // Header Avatar
    const avatar = document.getElementById("header-avatar"); // Ensure your HTML uses this ID or class
    if (!avatar) {
         // Fallback for class-based selection if ID is missing
         const avatarClass = document.querySelector(".rounded-full");
         if(avatarClass) avatarClass.textContent = initials;
    } else {
        avatar.textContent = initials;
    }
    
    // Welcome Message
    const welcomeEl = document.getElementById('welcome-msg');
    if(welcomeEl) welcomeEl.textContent = `Welcome back, ${user.fname}`;

    // 4. LOGOUT LOGIC (Crucial: This was missing!)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    // 5. LOAD DATA
    calculateStats(user);
    renderBursaryPreview(user);
});

// ==========================================
// 1. ACADEMIC STATS & SUBJECTS
// ==========================================
function calculateStats(user) {
    // Get user's modules (filtered by email)
    const allModules = JSON.parse(localStorage.getItem('consilium_modules')) || [];
    const modules = allModules.filter(m => m.userEmail === user.email);

    let totalWeight = 0;
    let weightedSum = 0;
    let riskCount = 0;

    modules.forEach(m => {
        // Calculate average for this specific module
        let modTotalW = 0;
        let modWeightedSum = 0;
        
        if (m.assessments) {
            m.assessments.forEach(a => {
                modTotalW += a.weight;
                modWeightedSum += (a.mark * a.weight);
            });
        }

        const currentAvg = modTotalW > 0 ? (modWeightedSum / modTotalW) : 0;
        
        // Add to global stats
        weightedSum += currentAvg;
        totalWeight++;

        if (currentAvg < 50) riskCount++;
    });

    const globalAvg = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // --- UPDATE BIG NUMBERS ---
    setText('dash-avg-mark', `${globalAvg}%`);
    setText('dash-module-count', `${modules.length} subjects`);
    setText('dash-risk-count', riskCount);

    // --- RENDER SUBJECT LIST ---
    const subjContainer = document.getElementById('subject-status-container');
    if(subjContainer) {
        subjContainer.innerHTML = '';

        if (modules.length === 0) {
            subjContainer.innerHTML = `<p class="text-sm text-gray-400 italic">No subjects tracked.</p>`;
        } else {
            modules.forEach(m => {
                let modTotalW = 0;
                let modWeightedSum = 0;
                if (m.assessments) {
                    m.assessments.forEach(a => {
                        modTotalW += a.weight;
                        modWeightedSum += (a.mark * a.weight);
                    });
                }
                const avg = modTotalW > 0 ? Math.round(modWeightedSum / modTotalW) : 0;
                
                let barColor = "bg-indigo-600";
                if (avg < 50) barColor = "bg-red-500";
                else if (avg >= 75) barColor = "bg-green-500";

                const div = document.createElement('div');
                div.className = "bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between";
                div.innerHTML = `
                    <div>
                        <p class="font-bold text-gray-800 text-sm">${m.code || 'SUB'}</p>
                        <p class="text-xs text-gray-500 truncate w-24">${m.name}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-gray-900">${avg}%</p>
                        <div class="w-12 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div class="h-full ${barColor}" style="width: ${avg}%"></div>
                        </div>
                    </div>
                `;
                subjContainer.appendChild(div);
            });
        }
    }
}

// ==========================================
// 2. BURSARY MATCHES & APPLICATIONS
// ==========================================
function renderBursaryPreview(user) {
    const container = document.getElementById('bursary-list-container');
    if(!container) return;

    const bursaries = JSON.parse(localStorage.getItem('bursaries')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || [];

    // Filter Applications for this user
    const myApps = applications.filter(a => a.userEmail === user.email);
    setText('dash-app-count', myApps.length); 

    // --- NORMALIZER ---
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

    // Find Matches
    const matches = bursaries.filter(b => {
        const safeAvg = b.minAverage !== undefined ? b.minAverage : (b.minAvg || 0);
        
        if (userAvg < safeAvg) return false;
        
        if (b.faculties && b.faculties.length > 0) {
            const hasFac = b.faculties.some(f => {
                const reqFacClean = normalize(f);
                return userFacClean.includes(reqFacClean) || reqFacClean.includes(userFacClean);
            });
            if (!hasFac) return false;
        }
        return true;
    });

    setText('dash-match-count', matches.length);

    // Render List (Top 3)
    container.innerHTML = '';
    if (matches.length === 0) {
        container.innerHTML = `
        <div class="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
            <p class="text-gray-500 text-sm">No matches found yet.</p>
            <a href="profile.html" class="text-indigo-600 font-bold text-xs hover:underline">Update Profile</a>
        </div>`;
        return;
    }

    matches.slice(0, 3).forEach(b => {
        const app = myApps.find(a => a.bursaryId === b.id);
        const isApplied = app && app.status === "Applied";
        
        const div = document.createElement('div');
        div.className = "bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4";
        
        const actionButton = isApplied 
            ? `<span class="text-green-700 font-bold text-sm px-4 py-2 bg-green-50 rounded-lg border border-green-100 text-center">Applied</span>`
            : `<a href="bursaries.html" class="text-gray-700 font-bold text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-center">View</a>`;

        div.innerHTML = `
            <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">${b.provider}</p>
                <h3 class="font-bold text-gray-900">${b.title}</h3>
            </div>
            ${actionButton}
        `;
        container.appendChild(div);
    });
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}