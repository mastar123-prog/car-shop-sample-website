// --- 1. DYNAMIC CAPTCHA LOGIC ---
const num1 = Math.floor(Math.random() * 10) + 1;
const num2 = Math.floor(Math.random() * 10) + 1;
const correctSum = num1 + num2;
const captchaLabel = document.getElementById("captchaQuestion");
if (captchaLabel) {
    captchaLabel.innerText = `Bot Check: What is ${num1} + ${num2}?`;
}

// --- 2. PASSWORD VISIBILITY TOGGLE ---
document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", function () {
        const input = this.closest(".input-wrapper").querySelector("input");
        const icon = this.querySelector("ion-icon");
        input.type = (input.type === "password") ? "text" : "password";
        icon.setAttribute("name", input.type === "password" ? "eye-outline" : "eye-off-outline");
    });
});

// --- 3. LOGIN & SESSION LOGIC ---
async function login() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    // Check Local Storage (New registrations)
    const localUser = localStorage.getItem(email);
    if (localUser) {
        const user = JSON.parse(localUser);
        if (user.pass === pass) {
            return startSession(user.name, rememberMe);
        }
    }

    // Check DB.csv (Database file)
    try {
        const response = await fetch("DB.csv");
        if (!response.ok) throw new Error("DB.csv not found");
        const text = await response.text();
        const rows = text.split("\n").slice(1).filter(row => row.trim() !== "");

        for (const row of rows) {
            const columns = row.split(",");
            const csvName = columns[1]?.trim();
            const csvEmail = columns[2]?.trim().toLowerCase();
            const csvPass = columns[3]?.trim();

            if (email === csvEmail && pass === csvPass) {
                return startSession(csvName, rememberMe);
            }
        }
    } catch (error) {
        console.error("Database error:", error);
    }

    alert("Invalid email or password.");
}

function startSession(userName, remember) {
    // "Remember Me" uses localStorage; otherwise use sessionStorage
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("isLoggedIn", "true");
    storage.setItem("userName", userName);
    alert(`Welcome, ${userName}!`);
    window.location.href = "index.htm";
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    sessionStorage.clear();
    window.location.href = "user.htm";
}

// --- 4. AUTH & GREETING CHECK ---
window.addEventListener('DOMContentLoaded', () => {
    const greeting = document.getElementById("userGreeting");
    const name = localStorage.getItem("userName") || sessionStorage.getItem("userName");
    const isAuth = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";

    // Show name if logged in
    if (greeting && isAuth) {
        greeting.innerText = name;
    }

    // Redirect restricted pages if not logged in
    const protectedPages = ["index.htm", "order.htm", "shipping.htm"];
    const currentPage = window.location.pathname.split("/").pop();
    if (protectedPages.includes(currentPage) && !isAuth) {
        window.location.href = "user.htm";
    }
});

// --- 5. REGISTRATION LOGIC ---
const regForm = document.getElementById("registerForm");
if (regForm) {
    regForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("regName").value;
        const email = document.getElementById("regEmail").value.trim().toLowerCase();
        const pass = document.getElementById("regPass").value;
        const confPass = document.getElementById("regConfPass").value;
        const userAns = parseInt(document.getElementById("captchaInput").value, 10);

        if (pass.length < 8 || !/\d/.test(pass) || !/[!@#$%^&*]/.test(pass)) {
            alert("Password must be 8+ characters with a number and special char.");
            return;
        }
        if (pass !== confPass) {
            alert("Passwords do not match!");
            return;
        }
        if (userAns !== correctSum) {
            alert("Wrong Captcha!");
            return;
        }

        localStorage.setItem(email, JSON.stringify({ name, email, pass }));
        alert("Registration Successful! Please Log In.");
        window.location.href = "user.htm";
    });
}
