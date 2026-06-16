async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    
    if (!email || !pass) {
        alert("Please enter both email and password.");
        return;
    }
    
    try {
        const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                username: email,
                password: pass
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login Successful! Redirecting...");
            // Store user info in session/localStorage if needed
            localStorage.setItem('currentUser', data.user || email);
            window.location.href = "index.htm"; 
        } else {
            alert(data.error || "Invalid email or password. Please try again.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please check that the server is running on port 5000.");
    }
}

// Password Toggle Logic
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
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
