document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-form');
    const emailInput = document.getElementById('email');
    const errorText = document.getElementById('email-error');
    const formContainer = document.getElementById('reset-form-container');
    const successContainer = document.getElementById('success-message');
    const footerLink = document.getElementById('footer-link');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput.value.trim().toLowerCase();
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userExists = users.some(u => u.email.toLowerCase() === email);
            
            if (!userExists) {
                emailInput.classList.add('border-red-500');
                errorText.textContent = "We couldn't find an account with that email.";
                errorText.classList.remove('hidden');
                return;
            }
            
            errorText.classList.add('hidden');
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Sending...";
            btn.disabled = true;
            btn.classList.add('opacity-75', 'cursor-not-allowed');
            
            setTimeout(() => {
                formContainer.classList.add('hidden');
                footerLink.classList.add('hidden');
                successContainer.classList.remove('hidden');
                successContainer.classList.add('animate-fade-in-up'); 
            }, 1000);
        });
    }
    
    emailInput.addEventListener('input', () => {
        errorText.classList.add('hidden');
    });
});