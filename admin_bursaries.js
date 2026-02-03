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
            if(confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('currentUser');
                window.location.href = "login.html";
            }
        });
    }

    const form = document.getElementById('admin-add-bursary-form');
    
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            const name = document.getElementById('bursary-name').value;
            const provider = document.getElementById('provider').value;
            const link = document.getElementById('external-link').value;
            const description = document.getElementById('description').value;
            
            const maxIncome = document.getElementById('max-income').value;
            const minAverage = document.getElementById('min-average').value;
            const deadline = document.getElementById('deadline').value;

            const selectedFaculties = [];
            const checkboxes = document.querySelectorAll('input[name="eligible-faculty"]:checked');
            checkboxes.forEach((checkbox) => {
                selectedFaculties.push(checkbox.value);
            });

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

            let bursaryList = JSON.parse(localStorage.getItem('bursaries')) || [];
            bursaryList.push(newBursary);
            localStorage.setItem('bursaries', JSON.stringify(bursaryList));

            alert('✅ Bursary Published Successfully!');
            window.location.href = 'admin_dashboard.html'; 
        });
    }

});
