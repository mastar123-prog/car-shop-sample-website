const API_BASE_URL = "http://localhost:5000";

function getStoredSession() {
    const isAuth = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";
    const name = localStorage.getItem("userName") || sessionStorage.getItem("userName") || "Guest";
    const username = localStorage.getItem("username") || sessionStorage.getItem("username") || "";
    const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "";
    return { isAuth, name, username, email };
}

function startSession(userName, remember, username = "", email = "") {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("isLoggedIn", "true");
    storage.setItem("userName", userName || "User");
    storage.setItem("username", username || email || userName || "User");
    storage.setItem("userEmail", email || "");
    alert(`Welcome, ${userName || "User"}!`);
    window.location.href = "index.htm";
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("userEmail");
    window.location.href = "user.htm";
}

window.logout = logout;

function setMessage(element, text, color) {
    if (!element) {
        return;
    }

    element.innerText = text;
    element.style.color = color;
}

function setupCaptcha() {
    const captchaLabel = document.getElementById("captchaQuestion");
    if (!captchaLabel) {
        return null;
    }

    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    captchaLabel.innerText = `Bot Check: What is ${num1} + ${num2}?`;
    return num1 + num2;
}

function selectedOptionText(select) {
    return select?.options[select.selectedIndex]?.textContent?.trim() || "";
}

function setupPasswordToggles() {
    document.querySelectorAll(".toggle-password").forEach((button) => {
        button.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const input = targetId
                ? document.getElementById(targetId)
                : this.closest(".input-wrapper")?.querySelector("input");
            const icon = this.querySelector("ion-icon");

            if (!input) {
                return;
            }

            input.type = input.type === "password" ? "text" : "password";
            if (icon) {
                icon.setAttribute("name", input.type === "password" ? "eye-outline" : "eye-off-outline");
            }
        });
    });
}

async function login(email, password, rememberMe) {
    const normalizedEmail = email.trim().toLowerCase();
    const localUserJson = localStorage.getItem(normalizedEmail);

    if (localUserJson) {
        try {
            const localUser = JSON.parse(localUserJson);
            if (localUser.pass === password) {
                startSession(localUser.name || normalizedEmail, rememberMe, localUser.username || normalizedEmail, normalizedEmail);
                return;
            }
        } catch (error) {
            console.warn("Could not read saved local user:", error);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: normalizedEmail,
                password
            })
        });
        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "Invalid email or password.");
            return;
        }

        startSession(result.name || result.user || normalizedEmail, rememberMe, result.user || normalizedEmail, result.email || normalizedEmail);
    } catch (error) {
        console.error("Database connection error:", error);
        alert("Login server is not running, and no matching local account was found.");
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const btn = document.getElementById("submitBtn");
        const text = document.getElementById("btnText");
        const spinner = document.getElementById("spinner");
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPass").value;
        const rememberMe = document.getElementById("rememberMe")?.checked || false;

        if (btn) {
            btn.disabled = true;
        }
        if (text) {
            text.textContent = "Checking...";
        }
        if (spinner) {
            spinner.style.display = "inline-block";
        }

        try {
            await login(email, password, rememberMe);
        } finally {
            if (btn) {
                btn.disabled = false;
            }
            if (text) {
                text.textContent = "Sign In";
            }
            if (spinner) {
                spinner.style.display = "none";
            }
        }
    });
}

function setupRegisterForm(correctSum) {
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) {
        return;
    }

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim().toLowerCase();
        const pass = document.getElementById("regPass").value;
        const confPass = document.getElementById("regConfPass").value;
        const captchaInput = document.getElementById("captchaAnswer");
        const msg = document.getElementById("msg");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setMessage(msg, "Please enter a valid email address.", "orange");
            return;
        }

        if (pass.length < 8) {
            setMessage(msg, "Password must be at least 8 characters.", "orange");
            return;
        }

        if (pass.length > 32) {
            setMessage(msg, "Password cannot exceed 32 characters.", "orange");
            return;
        }

        if (pass !== confPass) {
            setMessage(msg, "Passwords do not match.", "orange");
            return;
        }

        if (captchaInput && Number(captchaInput.value) !== correctSum) {
            setMessage(msg, "Bot check answer is incorrect.", "orange");
            return;
        }

        if (localStorage.getItem(email)) {
            setMessage(msg, "An account with this email already exists in this browser.", "#ff4d4d");
            return;
        }

        const user = {
            name,
            email,
            username: email.split("@")[0],
            pass
        };

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password: pass
                })
            });
            const result = await response.json();

            if (!response.ok && response.status !== 409) {
                throw new Error(result.error || "Registration server error");
            }

            if (response.status === 409) {
                setMessage(msg, result.error || "An account with this email already exists.", "#ff4d4d");
                return;
            }
        } catch (error) {
            console.warn("Registration server unavailable; saving account locally only.", error);
        }

        localStorage.setItem(email, JSON.stringify(user));
        setMessage(msg, "Registration successful! You can log in now.", "#1e8fff");
        registerForm.reset();
    });
}

function setupOrderForm(correctSum) {
    const orderForm = document.getElementById("orderForm");
    if (!orderForm) {
        return;
    }

    const session = getStoredSession();
    const usernameInput = document.getElementById("orderUser");
    const message = document.getElementById("orderMessage");

    if (usernameInput && session.username) {
        usernameInput.value = session.username;
    }

    orderForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = document.getElementById("orderPass").value;
        const partSelect = document.getElementById("partSelect");
        const shippingSelect = document.getElementById("shippingMethod");
        const address = document.getElementById("address").value.trim();
        const cardNumber = document.getElementById("orderCard").value.trim();
        const captchaInput = document.getElementById("captchaInput");

        if (Number(captchaInput?.value) !== correctSum) {
            setMessage(message, "Bot check answer is incorrect.", "orange");
            return;
        }

        const itemText = selectedOptionText(partSelect).replace(/\s+-\s+\$\d+.*/, "");
        const submitButton = orderForm.querySelector("button[type='submit']");
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Processing...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password,
                    item: itemText,
                    price: partSelect.value,
                    shipping_method: shippingSelect.value,
                    address,
                    card_number: cardNumber
                })
            });
            const result = await response.json();

            if (!response.ok) {
                setMessage(message, result.error || "Order could not be processed.", "#ff4d4d");
                return;
            }

            const trackingId = result.order.tracking_id;
            localStorage.setItem("lastTrackingId", trackingId);
            setMessage(message, `Order placed! Tracking number: ${trackingId}`, "#1e8fff");
            orderForm.reset();
            if (usernameInput && session.username) {
                usernameInput.value = session.username;
            }
        } catch (error) {
            console.error("Order server error:", error);
            setMessage(message, "Order server is not running. Start app.py and try again.", "#ff4d4d");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Process Order";
            }
        }
    });
}

function setupTrackerForm() {
    const trackerForm = document.getElementById("trackerForm");
    if (!trackerForm) {
        return;
    }

    const input = document.getElementById("trackingId");
    const result = document.getElementById("trackingResult");
    const lastTrackingId = localStorage.getItem("lastTrackingId");
    if (input && lastTrackingId) {
        input.value = lastTrackingId;
    }

    trackerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const trackingId = input.value.trim();

        if (!trackingId) {
            result.innerHTML = "<p>Please enter a tracking number.</p>";
            return;
        }

        result.innerHTML = "<p>Checking package...</p>";

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(trackingId)}`);
            const data = await response.json();

            if (!response.ok) {
                result.innerHTML = `<p class="error-text">${data.error || "Tracking number not found."}</p>`;
                return;
            }

            const order = data.order;
            result.innerHTML = `
                <div class="tracking-card">
                    <h3>${order.status}</h3>
                    <p><strong>Tracking:</strong> ${order.tracking_id}</p>
                    <p><strong>Item:</strong> ${order.item} - $${order.price}</p>
                    <p><strong>Shipping:</strong> ${order.shipping_method}</p>
                    <p><strong>Ordered:</strong> ${order.created_at}</p>
                    <p><strong>Estimated delivery:</strong> ${order.estimated_delivery}</p>
                </div>
            `;
        } catch (error) {
            console.error("Tracking server error:", error);
            result.innerHTML = "<p class=\"error-text\">Tracking server is not running. Start app.py and try again.</p>";
        }
    });
}

function setupAuthGreeting() {
    const greeting = document.getElementById("userGreeting");
    const { isAuth, name } = getStoredSession();

    if (greeting) {
        greeting.innerText = isAuth ? name : "Guest";
    }

    const protectedPages = ["index.htm", "order.htm", "shipping.htm", "tracking.htm"];
    const currentPage = window.location.pathname.split("/").pop() || "index.htm";
    if (protectedPages.includes(currentPage) && !isAuth) {
        window.location.href = "user.htm";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const correctSum = setupCaptcha();
    setupPasswordToggles();
    setupLoginForm();
    setupRegisterForm(correctSum);
    setupOrderForm(correctSum);
    setupTrackerForm();
    setupAuthGreeting();
});
