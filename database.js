async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    
    // Call the async function from database.js
    const isValid = await validatePassword(email, pass);

    if (isValid) {
        alert("Login Successful! Redirecting...");
        window.location.href = "index.htm"; 
    } else {
        alert("Invalid email or password. Please try again.");
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

async function validatePassword(email, password) {
    try {
        const response = await fetch("DB.csv");
        if (!response.ok) throw new Error("Could not find DB.csv");
        
        const text = await response.text();
        // Split rows, skip header, and filter out empty lines
        const rows = text.split("\n").slice(1).filter(row => row.trim() !== "");

        for (const row of rows) {
            const columns = row.split(",");
            // CSV indices: 0:username, 1:name, 2:email, 3:password
            const csvEmail = columns[2]?.trim();
            const csvPassword = columns[3]?.trim();

            if (email === csvEmail && password === csvPassword) {
                return true; // Match found
            }
        }
        return false; // No match found
    } catch (error) {
        console.error("Database error:", error);
        return false;
    }
}
