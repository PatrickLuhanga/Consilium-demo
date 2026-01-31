document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('reset-form');
    const emailInput = document.getElementById('email');
    const errorText = document.getElementById('email-error');
    
    // Containers to toggle
    const formContainer = document.getElementById('reset-form-container');
    const successContainer = document.getElementById('success-message');
    const footerLink = document.getElementById('footer-link');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = emailInput.value.trim().toLowerCase();
            const users = JSON.parse(localStorage.getItem('users')) || [];

            // 1. Check if user exists
            const userExists = users.some(u => u.email.toLowerCase() === email);

            if (!userExists) {
                // ERROR STATE
                emailInput.classList.add('border-red-500'); // Add red border if you styled it
                errorText.textContent = "We couldn't find an account with that email.";
                errorText.classList.remove('hidden');
                return;
            }

            // 2. SUCCESS STATE
            // Clear errors
            errorText.classList.add('hidden');
            
            // Simulate API delay for realism (1 second)
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Sending...";
            btn.disabled = true;
            btn.classList.add('opacity-75', 'cursor-not-allowed');

            setTimeout(() => {
                // Hide Form, Show Success
                formContainer.classList.add('hidden');
                footerLink.classList.add('hidden');
                successContainer.classList.remove('hidden');
                
                // Add a cool fade-in effect
                successContainer.classList.add('animate-fade-in-up'); 
            }, 1000);
        });
    }

    // Clear error when user types
    emailInput.addEventListener('input', () => {
        errorText.classList.add('hidden');
    });
});