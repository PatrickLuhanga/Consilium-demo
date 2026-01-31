document.addEventListener('DOMContentLoaded', () => {
    
    // 1. AUTH CHECK
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // 🛑 2. ROLE CHECK (The Gatekeeper)
    // Security: If a Student tries to load this Admin page, kick them to Student Dashboard
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
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    // 5. HANDLE FORM SUBMISSION (Add Bursary)
    const form = document.getElementById('admin-add-bursary-form');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            // Gather Inputs
            const name = document.getElementById('bursary-name').value;
            const provider = document.getElementById('provider').value;
            const link = document.getElementById('external-link').value;
            const description = document.getElementById('description').value;
            
            const maxIncome = document.getElementById('max-income').value;
            const minAverage = document.getElementById('min-average').value;
            const deadline = document.getElementById('deadline').value;

            // Handle Checkboxes (Faculties)
            const selectedFaculties = [];
            const checkboxes = document.querySelectorAll('input[name="eligible-faculty"]:checked');
            checkboxes.forEach((checkbox) => {
                selectedFaculties.push(checkbox.value);
            });

            // Create Object (Standardized Format)
            const newBursary = {
                id: Date.now(), 
                title: name,
                provider: provider,
                link: link,
                description: description,        
                maxIncome: maxIncome || "N/A",
                minAverage: Number(minAverage),  
                deadline: deadline,
                faculties: selectedFaculties,
                status: "Active"
            };

            // Save to LocalStorage
            let bursaryList = JSON.parse(localStorage.getItem('bursaries')) || [];
            bursaryList.push(newBursary);
            localStorage.setItem('bursaries', JSON.stringify(bursaryList));

            alert('✅ Bursary Published Successfully!');
            window.location.href = 'admin_dashboard.html'; 
        });
    }
});