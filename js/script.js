const BASE_URL = "https://sellsync-backend-production.up.railway.app";

// =========================
// NAVIGATION TOGGLE
// =========================
document.addEventListener("DOMContentLoaded", function () {

const menuIcon = document.getElementById("menuIcon");
const navItems = document.getElementById("navitems");

if(menuIcon && navItems){
    menuIcon.addEventListener("click", function () {
        navItems.classList.toggle("active");
    });
}

});

// =========================
// ROLE SELECTION
// =========================
document.addEventListener("DOMContentLoaded", function () {

let selectedRole = "manufacturer";

const roleButtons = document.querySelectorAll(".role-button");

function updateRoleFields(role){

    selectedRole = role;

    document.querySelectorAll(".role-fields").forEach(section => {
        section.style.display = "none";
        section.querySelectorAll("input")
            .forEach(input => input.removeAttribute("required"));
    });

    const selectedFields = document.getElementById(`${role}-fields`);

    if(selectedFields){
        selectedFields.style.display = "block";
        selectedFields.querySelectorAll("input")
            .forEach(input => input.setAttribute("required","required"));
    }

    roleButtons.forEach(btn => btn.classList.remove("active"));

    const activeBtn = document.querySelector(`[data-role="${role}"]`);
    if(activeBtn){
        activeBtn.classList.add("active");
    }

}

roleButtons.forEach(button=>{
    button.addEventListener("click",()=>{
        updateRoleFields(button.dataset.role);
    });
});

updateRoleFields(selectedRole);


// =========================
// REGISTER MODULE
// =========================

const registerForm = document.getElementById("signupForm");

if(!registerForm) return;

registerForm.addEventListener("submit", async function(e){

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const phone = document.getElementById("phone").value;

    const roleBtn = document.querySelector(".role-button.active");

    const role = roleBtn ? roleBtn.dataset.role : null;

    if(!role)
        return Swal.fire("Error","Select role","error");

    if(!email.includes("@"))
        return Swal.fire("Error","Invalid email","error");

    if(password.length < 6)
        return Swal.fire("Error","Password minimum 6 characters","error");

    if(password !== confirmPassword)
        return Swal.fire("Error","Passwords do not match","error");


    let payload = {
        email,
        password,
        phone,
        organizationName:
            document.querySelector(`#${role}-fields input[name="organizationName"]`)?.value || "",

        address:
            document.querySelector(`#${role}-fields input[name="address"]`)?.value || "",

        gstNumber:
            document.querySelector(`#${role}-fields input[name="gstNumber"]`)?.value || ""
    };


    try{

        const res = await fetch(
            `${BASE_URL}/api/register/${role}`,
            {
                method:"POST",
                credentials:"include",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(payload)
            }
        );

        const result = await res.text();

        if(res.ok){

            Swal.fire("Success","Registration successful","success")
            .then(()=>{
                window.location.href="Login.html";
            });

        }
        else{

            Swal.fire("Error","Register failed : "+result,"error");

        }

    }
    catch(err){

        console.error(err);
        Swal.fire("Error","Server error","error");

    }

});

});

// =========================
// LOGIN MODULE
// =========================
document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("loginForm");

if(!form) return;

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try{

        const response = await fetch(
            `${BASE_URL}/api/auth/login`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials:"include",
                body:JSON.stringify({email,password})
            }
        );

        if(!response.ok)
            throw new Error("Login Failed");

        const data = await response.json();

        const role = data.role;

        Swal.fire({
            icon:"success",
            title:"Login Success"
        }).then(()=>{

            if(role === "ADMIN")
                window.location.href="admindashboard.html";

            else if(role === "MANUFACTURER")
                window.location.href="manufacturerdashboard.html";

            else if(role === "WHOLESALER")
                window.location.href="wholesalerdashboard.html";

            else
                Swal.fire("Error","Unknown role","error");

        });

    }
    catch(error){

        console.error("LOGIN ERROR:",error);
        Swal.fire("Error","Login failed","error");

    }

});

});
