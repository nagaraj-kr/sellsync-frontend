const BASE_URL = "https://sellsync-backend-production.up.railway.app";

document.addEventListener("DOMContentLoaded", function () {
    
    // =========================
    // 1. NAVIGATION TOGGLE
    // =========================
    const menuIcon = document.getElementById("menuIcon");
    const navItems = document.getElementById("navitems");
    if(menuIcon && navItems){
        menuIcon.addEventListener("click", () => navItems.classList.toggle("active"));
    }

    // =========================
    // 2. REGISTRATION MODULE
    // =========================
    const registerForm = document.getElementById("signupForm");
    const roleButtons = document.querySelectorAll(".role-button");
    let selectedRole = "manufacturer"; // Default value

    if (roleButtons.length > 0) {
        roleButtons.forEach(button => {
            button.addEventListener("click", () => {
                roleButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                selectedRole = button.dataset.role;
            });
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const phone = document.getElementById("phone").value;
            const organizationName = document.getElementById("orgName").value;
            const address = document.getElementById("address").value;
            const gstNumber = document.getElementById("gstNumber").value;

            if (password !== confirmPassword) {
                return Swal.fire("Error", "Passwords do not match", "error");
            }

            const payload = { email, password, phone, organizationName, address, gstNumber };

            try {
                const res = await fetch(`${BASE_URL}/api/register/${selectedRole}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await res.text();
                if (res.ok) {
                    Swal.fire("Success", "Registration successful", "success")
                        .then(() => window.location.href = "Login.html");
                } else {
                    Swal.fire("Error", "Registration failed: " + result, "error");
                }
            } catch (err) {
                Swal.fire("Error", "Server error. Check your connection.", "error");
            }
        });
    }

    // =========================
    // 3. LOGIN MODULE
    // =========================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch(`${BASE_URL}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // Cookie session-ku idhu mukkiyam
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) throw new Error("Login Failed");

                const data = await response.json();
                const role = data.role; // Backend "ADMIN", "MANUFACTURER", "WHOLESALER" nu return pannanum

                Swal.fire({
                    icon: "success",
                    title: "Login Success"
                }).then(() => {
                    // Role-based redirection
                    if (role === "ADMIN") window.location.href = "admindashboard.html";
                    else if (role === "MANUFACTURER") window.location.href = "manufacturerdashboard.html";
                    else if (role === "WHOLESALER") window.location.href = "wholesalerdashboard.html";
                    else Swal.fire("Error", "Unknown role received from server", "error");
                });

            } catch (error) {
                console.error("LOGIN ERROR:", error);
                Swal.fire("Error", "Invalid Email or Password", error);
            }
        });
    }
});
