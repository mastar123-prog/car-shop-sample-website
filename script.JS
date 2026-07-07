// ---------- Login State ----------
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const userGreeting = document.getElementById('userGreeting');
    if (currentUser && userGreeting) {
        userGreeting.textContent = currentUser;
    }
}
checkLoginStatus();

// ---------- Login ----------
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!email || !pass) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, username: email, password: pass })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login Successful! Redirecting...");
            localStorage.setItem('currentUser', data.user || email);
            window.location.href = "index.htm";
        } else {
            alert(data.error || "Invalid email or password. Please try again.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please check that the server is running.");
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    alert("Logged out!");
    window.location.href = "index.htm";
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        login();
    });
}

// ---------- Password Toggle ----------
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('ion-icon');

        if (input.type === "password") {
            input.type = "text";
            icon.setAttribute('name', 'eye-off-outline');
        } else {
            input.type = "password";
            icon.setAttribute('name', 'eye-outline');
        }
    });
});

// ---------- Bot Check Captcha (order.htm) ----------
let captchaAnswer = null;

function setupCaptcha() {
    const captchaLabel = document.getElementById('captchaQuestion');
    if (!captchaLabel) return;

    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = a + b;
    captchaLabel.textContent = `Bot Check: What is ${a} + ${b}?`;
}
setupCaptcha();

// ---------- Order Form (order.htm) ----------
const orderForm = document.getElementById("orderForm");
if (orderForm) {
    orderForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const orderMessage = document.getElementById('orderMessage');
        const username = document.getElementById('orderUser').value.trim();
        const password = document.getElementById('orderPass').value.trim();
        const partSelect = document.getElementById('partSelect');
        const shippingMethod = document.getElementById('shippingMethod').value;
        const address = document.getElementById('address').value.trim();
        const cardNumber = document.getElementById('orderCard').value.trim();
        const captchaInput = document.getElementById('captchaInput').value.trim();

        if (!partSelect.value) {
            orderMessage.style.color = "red";
            orderMessage.textContent = "Please select an accessory.";
            return;
        }

        if (parseInt(captchaInput, 10) !== captchaAnswer) {
            orderMessage.style.color = "red";
            orderMessage.textContent = "Bot check failed. Please try again.";
            setupCaptcha();
            document.getElementById('captchaInput').value = "";
            return;
        }

        const selectedOption = partSelect.options[partSelect.selectedIndex];
        const item = selectedOption.textContent.split(" - ")[0].trim();
        const price = partSelect.value;

        try {
            const response = await fetch("/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    item: item,
                    price: price,
                    shipping_method: shippingMethod,
                    address: address,
                    card_number: cardNumber
                })
            });

            const data = await response.json();

            if (response.ok) {
                const order = data.order;
                orderMessage.style.color = "green";
                orderMessage.innerHTML =
                    `Order placed! Your tracking number is <strong>${order.tracking_id}</strong>. ` +
                    `Estimated delivery: ${order.estimated_delivery}`;
                orderForm.reset();
                setupCaptcha();
            } else {
                orderMessage.style.color = "red";
                orderMessage.textContent = data.error || "Something went wrong placing your order.";
            }
        } catch (error) {
            console.error("Order error:", error);
            orderMessage.style.color = "red";
            orderMessage.textContent = "Could not reach the server. Please check that it's running.";
        }
    });
}

// ---------- Tracking Form (tracking.htm) ----------
const trackerForm = document.getElementById("trackerForm");
if (trackerForm) {
    trackerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const trackingId = document.getElementById('trackingId').value.trim();
        const resultBox = document.getElementById('trackingResult');

        try {
            const response = await fetch(`/orders/${encodeURIComponent(trackingId)}`);
            const data = await response.json();

            if (response.ok) {
                const order = data.order;
                resultBox.innerHTML = `
                    <p><strong>Tracking ID:</strong> ${order.tracking_id}</p>
                    <p><strong>Item:</strong> ${order.item}</p>
                    <p><strong>Price:</strong> $${order.price}</p>
                    <p><strong>Shipping Method:</strong> ${order.shipping_method}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Ordered On:</strong> ${order.created_at}</p>
                    <p><strong>Estimated Delivery:</strong> ${order.estimated_delivery}</p>
                `;
            } else {
                resultBox.innerHTML = `<p style="color:red;">${data.error || "Tracking number not found."}</p>`;
            }
        } catch (error) {
            console.error("Tracking error:", error);
            resultBox.innerHTML = `<p style="color:red;">Could not reach the server. Please check that it's running.</p>`;
        }
    });
}