document.addEventListener("DOMContentLoaded", function () {
  const menuIcon = document.getElementById("menuIcon");
  const navItems = document.getElementById("navitems");

  menuIcon.addEventListener("click", function () {
    // Toggle a class to show/hide menu
    navItems.classList.toggle("active");
  });
});

const BASE_URL = "https://sellsync-backend-production.up.railway.app";


document.addEventListener("DOMContentLoaded", function () {
    

    // ========== Role Selection ==========
    let selectedRole = "admin";
    const roleButtons = document.querySelectorAll(".role-button");

    function updateRoleFields(role) {
        selectedRole = role;

        // Hide all role fields and remove required
        document.querySelectorAll(".role-fields").forEach(section => {
            section.style.display = "none";
            section.querySelectorAll("input").forEach(input => input.removeAttribute("required"));
        });

        // Show selected role section and add required
        const selectedFields = document.getElementById(`${selectedRole}-fields`);
        if (selectedFields) {
            selectedFields.style.display = "block";
            selectedFields.querySelectorAll("input").forEach(input => input.setAttribute("required", "required"));
        }

        // Highlight active role button
        roleButtons.forEach(btn => btn.classList.remove("active"));
        const activeBtn = document.querySelector(`[data-role="${role}"]`);
        if (activeBtn) {
            activeBtn.classList.add("active");
        }
    }

    if (roleButtons.length > 0) {
        roleButtons.forEach(button => {
            button.addEventListener("click", () => {
                updateRoleFields(button.dataset.role);
            });
        });

        updateRoleFields(selectedRole); // safe init
    }

    // ========== Register Form Submission ==========
 const registerForm = document.getElementById("signupForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const phone = document.getElementById("phone").value;

        // Detect selected role
        const selectedRoleBtn = document.querySelector(".role-button.active");
        const selectedRole = selectedRoleBtn ? selectedRoleBtn.getAttribute("data-role") : null;

        if (!selectedRole) return Swal.fire("Error", "Please select a role.", "error");
        if (!email.includes('@')) return Swal.fire("Error", "Invalid email.", "error");
        if (password.length < 6) return Swal.fire("Error", "Password must be at least 6 characters.", "error");
        if (password !== confirmPassword) return Swal.fire("Error", "Passwords do not match.", "error");

        // Base payload
        let payload = { email, password, phone };

        // Username only for Admin
        if (selectedRole === "admin") {
            const username = document.getElementById("username").value;
            if (!username) return Swal.fire("Error", "Username is required for Admin.", "error");
            payload.username = username;
        }

        // Additional fields for manufacturer or wholesaler
        if (selectedRole === "manufacturer" || selectedRole === "wholesaler") {
            payload.organizationName = document.querySelector(`#${selectedRole}-fields input[name="organizationName"]`)?.value || "";
            payload.address = document.querySelector(`#${selectedRole}-fields input[name="address"]`)?.value || "";
            payload.gstNumber = document.querySelector(`#${selectedRole}-fields input[name="gstNumber"]`)?.value || "";
        }

        try {
            const res = await fetch(`${BASE_URL}/api/register/${selectedRole}`, {
                method: "POST",
                credentials:"include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.text();
            if (res.ok) {
                Swal.fire("Success!", "Registration successful!", "success").then(() => {
                    window.location.href = "Login.html";
                });
            } else {
                Swal.fire("Error!", "Registration failed: " + result, "error");
            }
        } catch (err) {
            console.error("Registration error:", err);
            Swal.fire("Error!", "Registration error occurred.", "error");
        }
    });
}
});

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {

            const response = await fetch(
                "https://sellsync-backend-production.up.railway.app/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Login Failed");
            }

            const data = await response.json();

            console.log("Login success:", data);

            Swal.fire({
                icon: "success",
                title: "Login Success"
            }).then(() => {
                window.location.href = "admin-dashboard.html";
            });

        } catch (error) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: "Invalid email or password"
            });

        }

    });

});
