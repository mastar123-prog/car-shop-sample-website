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

    // First: Check Local Storage fallback
    const localUser = localStorage.getItem(email);
    if (localUser) {
        const user = JSON.parse(localUser);
        if (user.pass === pass) {
            return startSession(user.name, rememberMe);
        }
    }

    // Second: Talk directly to your Python Flask backend API
    try {
        const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: pass
            })
        });

        const result = await response.json();

        if (response.ok) {
            return startSession(result.name || result.user, rememberMe);
        } else {
            alert(result.error || "Invalid email or password.");
            return;
        }
    } catch (error) {
        console.error("Database connection error:", error);
        alert("Cannot connect to login server. Is your Python backend running?");
    }
}

function startSession(userName, remember) {
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

// --- 5. REGISTRATION FORM LOGIC (WITH VALIDATIONS) ---
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // Gather values
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim().toLowerCase();
        const pass = document.getElementById("regPass").value;
        const confPass = document.getElementById("regConfPass").value;
        const msg = document.getElementById("msg");

        // Strict Email Format Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (msg) {
                msg.style.color = "orange";
                msg.innerText = "Please enter a valid email address.";
            }
            return;
        }

        // Password Minimum & Maximum Character Limit Checks
        if (pass.length < 8) {
            if (msg) {
                msg.style.color = "orange";
                msg.innerText = "Password must be at least 8 characters.";
            }
            return;
        }
        if (pass.length > 32) {
            if (msg) {
                msg.style.color = "orange";
                msg.innerText = "Password cannot exceed 32 characters.";
            }