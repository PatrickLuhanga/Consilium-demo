const protectedPages = [
    "dashboard.html", "profile.html", "bursaries.html", "grades.html", 
    "admin_dashboard.html", "admin_bursaries.html", "admin_applications.html"
];

const pathParts = window.location.pathname.split("/");
const currentPage = pathParts[pathParts.length - 1]; 

if (protectedPages.includes(currentPage) && !localStorage.getItem("currentUser")) {
    window.location.href = "login.html";
}

const form = document.getElementById("form");
const fname_input = document.getElementById("fname");
const lname_input = document.getElementById("lname");
const email_input = document.getElementById("email");
const affiliation_input = document.getElementById("affiliation");
const psw_input = document.getElementById("psw");
const confirmpsw_input = document.getElementById("confirmpsw");

function normalizeEmail(raw) {
    return (raw || "").trim().toLowerCase();
}

if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        let errors = [];

        if (form.dataset.type === "signup") {
            errors = validateSignupform();
        } else if (form.dataset.type === "login") {
            errors = validateLoginForm();
        }

        if (errors.length === 0) {
            
            if (form.dataset.type === "signup") {
                if (!email_input || !psw_input) return;

                const user = {
                    fname: fname_input ? fname_input.value.trim() : "",
                    lname: lname_input ? lname_input.value.trim() : "",
                    email: normalizeEmail(email_input.value),
                    affiliation: affiliation_input ? affiliation_input.value : "student", 
                    password: psw_input.value,
                    studentNumber: "",
                    department: "",
                    faculty: "",
                    average: 0
                };

                const users = JSON.parse(localStorage.getItem("users")) || [];
                const userExists = users.some(u => normalizeEmail(u.email) === user.email);

                if (userExists) {
                    showError(email_input, "email-error", "An account with this email already exists");
                    return;
                }

                users.push(user);
                localStorage.setItem("users", JSON.stringify(users));

                alert("Account created! Please log in.");
                window.location.href = "login.html";
            }

            if (form.dataset.type === "login") {
                if (!email_input || !psw_input) return;

                const emailNorm = normalizeEmail(email_input.value);
                const users = JSON.parse(localStorage.getItem("users")) || [];
                const foundUser = users.find(u => normalizeEmail(u.email) === emailNorm);

                if (!foundUser) {
                    showError(email_input, "email-error", "No account found with this email");
                    return;
                }
                
                if (foundUser.password !== psw_input.value) {
                    showError(psw_input, "psw-error", "Incorrect password");
                    return;
                }

                localStorage.setItem("currentUser", JSON.stringify(foundUser));

                if (foundUser.affiliation === "admin") {
                    window.location.href = "admin_dashboard.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            }
        }
    });
}

function validateSignupform() {
    let errors = [];
    clearErrors();

    const fname = getValue(fname_input);
    const lname = getValue(lname_input);
    const email = normalizeEmail(getValue(email_input));
    const psw = getValue(psw_input);
    const confirmPsw = getValue(confirmpsw_input);
    const affiliation = getValue(affiliation_input);

    if (!fname) errors.push(showError(fname_input, "fname-error", "First name required"));
    if (!lname) errors.push(showError(lname_input, "lname-error", "Last name required"));
    
    if (!email) {
        errors.push(showError(email_input, "email-error", "Email required"));
    } else if (!email.match(/^[A-Za-z0-9._%+-]+@(dut4life\.ac\.za|dut\.ac\.za)$/)) {
        errors.push(showError(email_input, "email-error", "Must use a valid DUT email"));
    }

    if (!affiliation) errors.push(showError(affiliation_input, "affiliation-error", "Affiliation required"));

    if (!psw) {
        errors.push(showError(psw_input, "psw-error", "Password required"));
    } else if (psw.length > 12) {
        errors.push(showError(psw_input, "psw-error", "Max 12 characters"));
    }

    if (!confirmPsw) {
        errors.push(showError(confirmpsw_input, "confirmpsw-error", "Confirm password required"));
    } else if (psw !== confirmPsw) {
        errors.push(showError(confirmpsw_input, "confirmpsw-error", "Passwords do not match"));
    }

    return errors;
}

function validateLoginForm() {
    let errors = [];
    clearErrors();

    const email = normalizeEmail(getValue(email_input));
    const psw = getValue(psw_input);

    if (!email) {
        errors.push(showError(email_input, "email-error", "Email required"));
    } else if (!email.match(/^[A-Za-z0-9._%+-]+@(dut4life\.ac\.za|dut\.ac\.za)$/)) {
        errors.push(showError(email_input, "email-error", "Must be a valid DUT email"));
    }

    if (!psw) {
        errors.push(showError(psw_input, "psw-error", "Password required"));
    }

    return errors;
}

function getValue(input) {
    return input ? input.value.trim() : "";
}

function showError(input, errorId, msg) {
    if (input) input.classList.add("border-red-500");
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    return msg;
}

function clearErrors() {
    const inputs = [fname_input, lname_input, email_input, affiliation_input, psw_input, confirmpsw_input];
    inputs.forEach(input => {
        if (input) input.classList.remove("border-red-500");
    });
    
    const errorIds = ["fname-error", "lname-error", "email-error", "affiliation-error", "psw-error", "confirmpsw-error"];
    errorIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });

}
