
const BASE_URL = "https://sellsync-backend-production.up.railway.app";

function loadRequests() {
  fetch(`${BASE_URL}/api/requests/all`,{
    credentials:"include"
  })
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("requests-list");
      container.innerHTML = ""; // Clear old data

      // Helper to render users
      const render = (users, type) => {
        users.forEach(u => {
          const div = document.createElement("div");
          div.className = "request-item";
          div.innerHTML = `
            <div class="request-info">
              <h4>${u.organizationName || u.username || 'Admin'}</h4>
              <p>Email: ${u.email} | Type: ${capitalize(type)} | Registered: Recently</p>
            </div>
            <div class="request-actions">
              <button class="btn btn-primary" onclick="approveRequest('${type}', ${u.id})">Approve</button>
              <button class="btn btn-danger" onclick="rejectRequest('${type}', ${u.id})">Reject</button>
            </div>
          `;
          container.appendChild(div);
        });
      };

      render(data.admins, "admin");
      render(data.manufacturers, "manufacturer");
      render(data.wholesalers, "wholesaler");
    })
    .catch(err => {
      console.error("Error loading requests:", err);
      alert("Failed to load login requests.");
    });
       
}
function approveRequest(type, id) {
  fetch(`${BASE_URL}/api/requests/approve/${type}/${id}`, {
    method: "POST",
    credentials:"include"
  })
  .then(() => {
    alert("Approved successfully!");
    loadRequests(); // Refresh the list
  })
  .catch(error => console.error("Approval failed:", error));
}

function rejectRequest(type, id) {
  fetch(`${BASE_URL}/api/requests/reject/${type}/${id}`, {
    method: "DELETE",
    credentials:"include"
  })
  .then(() => {
    alert("Rejected successfully!");
    loadRequests(); // Refresh the list
  })
  .catch(error => console.error("Rejection failed:", error));
}


// Capitalize the type name (e.g., "manufacturer" → "Manufacturer")
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", loadRequests);



     fetch(`${BASE_URL}/api/admin/dashboard-data`, {
  headers: {
    "Authorization": "Bearer " + localStorage.getItem("token")
  },
  credentials:"include"
})
.then(res => res.json())
.then(data => {
  // Populate recent orders
  const ordersBody = document.getElementById("recent-orders");
  ordersBody.innerHTML = "";
  data.recentOrders.forEach(order => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td data-label="Order ID">#${order.id}</td>
    <td data-label="Wholesaler">${order.wholesalerName || 'N/A'}</td>
    <td data-label="Amount">₹${order.totalAmount.toFixed(2)}</td>
    <td data-label="Status"><span class="status status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span></td>
  `;
  ordersBody.appendChild(row);
});
  // data.recentOrders.forEach(order => {
  //   const row = document.createElement("tr");
  //   row.innerHTML = `
  //     <td>#${order.id}</td>
  //     <td>${order.wholesalerName || 'N/A'}</td>
  //     <td>₹${order.totalAmount.toFixed(2)}</td>
  //     <td><span class="status status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span></td>
  //   `;
  //   ordersBody.appendChild(row);
  // });

  // Populate top manufacturers
  const topBody = document.getElementById("top-manufacturers");
  topBody.innerHTML = "";
  data.topManufacturers.forEach(manu => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td data-label="Manufacturer">${manu.manufacturer}</td>
    <td data-label="Products">${manu.products}</td>
    <td data-label="Orders">${manu.orders}</td>
  `;
  topBody.appendChild(row);
});

  // data.topManufacturers.forEach(manu => {
  //   const row = document.createElement("tr");
  //   row.innerHTML = `
  //     <td>${manu.manufacturer}</td>
  //     <td>${manu.products}</td>
  //     <td>${manu.orders}</td>
  //   `;
  //   topBody.appendChild(row);
  // });
})
.catch(err => console.error("Failed to load dashboard data:", err));

     
     
     document.addEventListener("DOMContentLoaded", function () {
  fetch(`${BASE_URL}/api/admin/me`, {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
     credentials:"include"
  })
  .then(res => res.json())
  .then(data => {
    if (data.username) {
    const elements = document.getElementsByClassName("admin-username");

if (elements.length > 0) {
  elements[0].innerHTML = data.username.toUpperCase();
}

      //document.querySelector(".user-info span").textContent = data.username.toUpperCase();
    }
  })
  .catch(error => {
    console.error("Failed to fetch admin info:", error);
  });
});

     
     
     document.addEventListener("DOMContentLoaded", function () {
    fetch(`${BASE_URL}/api/admin/dashboard-summary`,{
       credentials:"include"
    })
      .then(response => response.json())
      .then(data => {
        document.getElementById("total-users").textContent = data.totalUsers;
        document.getElementById("total-orders").textContent = data.totalOrders;
        document.getElementById("total-revenue").textContent = "₹" + data.totalRevenue;
        document.getElementById("total-products").textContent = data.totalProducts;
      })
      .catch(error => console.error("Failed to load dashboard data:", error));
  });
     
// Navigation functionality
document.querySelectorAll('.menu-item').forEach(item => {
  if (item.getAttribute('data-section')) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
      const sectionId = this.getAttribute('data-section');
      document.getElementById(sectionId).classList.add('active');
      window.location.hash = `#${sectionId}`;

      // ✅ Load manufacturers only when that section is activated
      if (sectionId === 'manage-manufacturer') {
        loadManufacturers(); // 👈 This ensures data only loads when needed
      }else if(sectionId === 'manage-wholesaler'){
        loadWholesalers();
      }
    });
  }
});

// Check URL hash on page load
window.addEventListener('load', function () {
  const hash = window.location.hash.substring(1);
  const menuItem = document.querySelector(`.menu-item[data-section="${hash}"]`);
  if (menuItem) {
    menuItem.click();
  } else {
    document.querySelector('.menu-item.active').click();
  }
});


// ========================== DELETE (Soft Deactivate) ==========================

function deleteManufacturer(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will deactivate the manufacturer (not delete permanently).",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, deactivate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/manufacturer/deactivate/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json"
        }, credentials:"include"
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Deactivation failed');
        }
        return response.text();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Deactivated!',
          text: 'Manufacturer has been deactivated.',
          confirmButtonText: 'OK'
        }).then(() => {
          loadManufacturers();
        });
      })
      .catch(error => {
        Swal.fire('Error', 'Failed to deactivate manufacturer.', 'error');
        console.error('Deactivation error:', error);
      });
    }
  });
}

function activateManufacturer(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will activate the manufacturer.",
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, activate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/manufacturer/activate/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json"
        }, credentials:"include"
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Activation failed');
        }
        return response.text();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Activated!',
          text: 'Manufacturer has been activated.',
          confirmButtonText: 'OK'
        }).then(() => {
          loadManufacturers();
        });
      })
      .catch(error => {
        Swal.fire('Error', 'Failed to activate manufacturer.', 'error');
        console.error('Activation error:', error);
      });
    }
  });
}

function loadManufacturers() {
  const activeBody = document.getElementById("manufacturerBody");
  const inactiveBody = document.getElementById("inactiveManufacturerBody");
  activeBody.innerHTML = "";
  inactiveBody.innerHTML = "";

  fetch(`${BASE_URL}/api/manufacturer/active`{
         credentials:"include"
        })
    .then(response => response.json())
    .then(data => {
      data.forEach(m => {
        const row = document.createElement("tr");
        // row.innerHTML = `
        //   <td>${m.id}</td>
        //   <td>${m.email}</td>
        //   <td>${m.organizationName}</td>
        //   <td>${m.address}</td>
        //   <td>${m.phone}</td>
        //   <td>${m.gstNumber}</td>
        //   <td class="action-btns">
        //     <button class="btn btn-outline" onclick="editManufacturer(${m.id})">Edit</button>
        //     <button class="btn btn-danger" onclick="deleteManufacturer(${m.id})">Deactivate</button>
        //   </td>
        // `;
        row.innerHTML = `
  <td data-label="ID">${m.id}</td>
  <td data-label="Email">${m.email}</td>
  <td data-label="Organization">${m.organizationName}</td>
  <td data-label="Address">${m.address}</td>
  <td data-label="Phone">${m.phone}</td>
  <td data-label="GST">${m.gstNumber}</td>
  <td data-label="Actions" class="action-btns">
    <button class="btn btn-outline" onclick="editManufacturer(${m.id})">Edit</button>
    <button class="btn btn-danger" onclick="deleteManufacturer(${m.id})">Deactivate</button>
  </td>
`;
        activeBody.appendChild(row);
      });
    });

  fetch(`${BASE_URL}/api/manufacturer/inactive`,{
     credentials:"include"
  })
    .then(response => response.json())
    .then(data => {
      data.forEach(m => {
        const row = document.createElement("tr");
        row.innerHTML = `
         <td data-label="ID">${m.id}</td>
  <td data-label="Email">${m.email}</td>
  <td data-label="Organization">${m.organizationName}</td>
  <td data-label="Address">${m.address}</td>
  <td data-label="Phone">${m.phone}</td>
  <td data-label="GST">${m.gstNumber}</td>
          <td class="action-btns">
            <button class="btn btn-success" onclick="activateManufacturer(${m.id})">Activate</button>
          </td>
        `;
        inactiveBody.appendChild(row);
      });
    })
    .catch(error => console.error("Failed to load manufacturers:", error));
}

function deleteWholesaler(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will deactivate the wholesaler (not delete permanently).",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, deactivate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/wholesaler/deactivate/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json"
        },
         credentials:"include"
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Deactivation failed');
        }
        return response.text();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Deactivated!',
          text: 'Wholesaler has been deactivated.',
          confirmButtonText: 'OK'
        }).then(() => {
          loadWholesalers();
        });
      })
      .catch(error => {
        Swal.fire('Error', 'Failed to deactivate wholesaler.', 'error');
        console.error('Deactivation error:', error);
      });
    }
  });
}


function editManufacturer(id) {
  fetch(`${BASE_URL}/api/manufacturer/${id}`,{
     credentials:"include"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      console.log("Fetched Manufacturer:", data);
      openModal("manufacturer", data);
    })
    .catch(error => {
      console.error("Error fetching manufacturer data:", error);
      Swal.fire("Error", "Failed to fetch manufacturer details", "error");
    });
}

function editWholesaler(id) {
  fetch(`${BASE_URL}/api/wholesaler/${id}`,{
     credentials:"include"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      console.log("Fetched Wholesaler:", data);
      openModal("wholesaler", data);
    })
    .catch(error => {
      console.error("Error fetching wholesaler data:", error);
      Swal.fire("Error", "Failed to fetch wholesaler details", "error");
    });
}

  // Optional: closeModal function to hide modal
  function closeModal() {
    document.getElementById('modal').style.display = 'none';
  }
     
 
  // ========================== DELETE (Soft Deactivate) ==========================

function deleteManufacturer(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will deactivate the manufacturer (not delete permanently).",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, deactivate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/manufacturer/deactivate/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json"
        }, credentials:"include"
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Deactivation failed');
        }
        return response.text();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Deactivated!',
          text: 'Manufacturer has been deactivated.',
          confirmButtonText: 'OK'
        }).then(() => {
          loadManufacturers();
        });
      })
      .catch(error => {
        Swal.fire('Error', 'Failed to deactivate manufacturer.', 'error');
        console.error('Deactivation error:', error);
      });
    }
  });
}
   
     
     
     
function openModal(type, data = null) {
  document.getElementById("modalTitle").innerText = data
    ? `Edit ${capitalize(type)}`
    : `Add ${capitalize(type)}`;

  if (data) {
    document.getElementById("entityId").value = data.id || "";
    document.getElementById("modalEmail").value = data.email || "";
    document.getElementById("modalName").value = data.name || data.organizationName || "";
    document.getElementById("modalAddress").value = data.address || "";
    document.getElementById("modalPhone").value = data.phone || "";
    document.getElementById("modalGst").value = data.gst || data.gstNumber || "";
  } else {
    document.getElementById("managementForm").reset();  // Clear the form
    document.getElementById("entityId").value = "";
  }

  // ✅ Always set entityType after reset
  document.getElementById("entityType").value = type;

  document.getElementById("modalPassword").value = "";
  document.getElementById("modalConfirmPassword").value = "";
  document.getElementById("modal").style.display = "flex";
}


     document.getElementById("managementForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const entityId = document.getElementById("entityId").value.trim();
  const entityType = document.getElementById("entityType").value.trim();// 'manufacturer' or 'wholesaler'
  console.log("SUBMIT ENTITY TYPE:", entityType);
  const email = document.getElementById("modalEmail").value;
  const organizationName = document.getElementById("modalName").value;
  const address = document.getElementById("modalAddress").value;
  const phone = document.getElementById("modalPhone").value;
  const gstNumber = document.getElementById("modalGst").value;
  const password = document.getElementById("modalPassword").value;
  const confirmPassword = document.getElementById("modalConfirmPassword").value;

  if (password !== confirmPassword) {
    Swal.fire("Error", "Passwords do not match", "error");
    return;
  }

  const requestData = {
    email,
    organizationName,
    address,
    phone,
    gstNumber,
    password
  };

  let url = `${BASE_URL}/api/${entityType}`;
  let method = "POST";

  if (entityId !== "") {
    url += `/${entityId}`;
    method = "PUT";
  }

  fetch(url, {
    method: method,
     credentials:"include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(method === "POST" ? `Failed to add ${entityType}` : `Failed to update ${entityType}`);
      }
      return response.json();
    })
    .then(data => {
      Swal.fire({
        icon: "success",
        title: method === "POST" ? `${capitalize(entityType)} added!` : `${capitalize(entityType)} updated!`,
        showConfirmButton: true
      }).then(() => {
        location.reload();
      });
    })
    .catch(error => {
      console.error("Error:", error);
      Swal.fire("Error", error.message, "error");
    });
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}



function openAddModal(type) {
  document.getElementById("managementForm").reset();
  document.getElementById("entityId").value = "";
  openModal(type); // ✅ PASS THE TYPE HERE
}

    // Password toggle functionality
    document.querySelectorAll('.password-toggle').forEach(toggle => {
      toggle.addEventListener('click', function () {
        const inputId = this.id.replace('toggle', '').toLowerCase();
        const input = document.getElementById(inputId);
        const icon = this;
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      });
    });

    
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }


function loadWholesalers() {
  const activeBody = document.getElementById("wholesalerBody");
  const inactiveBody = document.getElementById("inactiveWholesalerBody");
  activeBody.innerHTML = "";
  inactiveBody.innerHTML = "";

  // Load active wholesalers
  fetch(`${BASE_URL}/api/wholesaler/active`,{
     credentials:"include"
  })
    .then(res => res.json())
    .then(data => {
      data.forEach(w => {
        const row = document.createElement("tr");
        // row.innerHTML = `
        //   <td>${w.id}</td>
        //   <td>${w.email}</td>
        //   <td>${w.organizationName}</td>
        //   <td>${w.address}</td>
        //   <td>${w.phone}</td>
        //   <td>${w.gstNumber}</td>
        //   <td class="action-btns">
        //     <button class="btn btn-outline" onclick="editWholesaler(${w.id})">Edit</button>
        //     <button class="btn btn-danger" onclick="deleteWholesaler(${w.id})">Deactivate</button>
        //   </td>
        // `;
        row.innerHTML = `
  <td data-label="ID">${w.id}</td>
  <td data-label="Email">${w.email}</td>
  <td data-label="Organization">${w.organizationName}</td>
  <td data-label="Address">${w.address}</td>
  <td data-label="Phone">${w.phone}</td>
  <td data-label="GST">${w.gstNumber}</td>
  <td data-label="Actions" class="action-btns">
    <button class="btn btn-outline" onclick="editWholesaler(${w.id})">Edit</button>
    <button class="btn btn-danger" onclick="deleteWholesaler(${w.id})">Deactivate</button>
  </td>
`;
        activeBody.appendChild(row);
      });
    });

  // Load inactive wholesalers
  fetch(`${BASE_URL}/api/wholesaler/inactive`,{
     credentials:"include"
  })
    .then(res => res.json())
    .then(data => {
      data.forEach(w => {
        const row = document.createElement("tr");
        row.innerHTML = `
    <td data-label="ID">${w.id}</td>
  <td data-label="Email">${w.email}</td>
  <td data-label="Organization">${w.organizationName}</td>
  <td data-label="Address">${w.address}</td>
  <td data-label="Phone">${w.phone}</td>
  <td data-label="GST">${w.gstNumber}</td>
          <td class="action-btns">
            <button class="btn btn-success" onclick="activateWholesaler(${w.id})">Activate</button>
          </td>
        `;
        inactiveBody.appendChild(row);
      });
    });
}


function closeModal() {
  document.getElementById('modal').style.display = 'none';
}



function deleteWholesaler(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will deactivate the wholesaler (not delete permanently).",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, deactivate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/wholesaler/deactivate/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json"
        }, credentials:"include"
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Deactivation failed');
        }
        return response.text();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Deactivated!',
          text: 'Wholesaler has been deactivated.',
          confirmButtonText: 'OK'
        }).then(() => {
          loadWholesalers();
        });
      })
      .catch(error => {
        Swal.fire('Error', 'Failed to deactivate wholesaler.', 'error');
        console.error('Deactivation error:', error);
      });
    }
  });
}


function activateWholesaler(id) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will activate the wholesaler.",
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, activate it!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/wholesaler/activate/${id}`, {
        method: 'PUT',
         credentials:"include",
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Activation failed');
        }
        return response.text();
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Activated!',
          text: 'Wholesaler has been activated.',
          confirmButtonText: 'OK'
        }).then(() => {
          loadWholesalers(); // Refresh the table
        });
      })
      .catch(error => {
        Swal.fire('Error', 'Failed to activate wholesaler.', 'error');
        console.error('Activation error:', error);
      });
    }
  });
}

     
     document.addEventListener("DOMContentLoaded", () => {
  // 🚀 Fetch currently logged-in admin info on page load
  fetch("/api/admin/settings/current",{
     credentials:"include"
  })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) throw new Error("Not logged in");
        throw new Error("Failed to load admin data");
      }
      return response.json();
    })
    .then(admin => {
      console.log("Current Admin:", admin);

      // Store the admin ID in a variable (no need for localStorage)
      window.currentAdminId = admin.id;

      // Populate profile fields

      document.getElementById("username").value = admin.username || "";
      document.getElementById("email").value = admin.email || "";
      document.getElementById("phone").value = admin.phone || ""; // 📞 Corrected here
    })
    .catch(error => {
      console.error("Error fetching admin info:", error);
      alert(error.message);
      if (error.message === "Not logged in") {
        window.location.href = "/login.html"; // Redirect to login if session expired
      }
    });
});

// ✅ Save updated profile function
function saveProfile() {
  const adminId = window.currentAdminId; // get the admin ID

  if (!adminId) {
    alert("Admin not found. Please log in again.");
    return;
  }

  const data = {
    id: adminId,
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value
  };

  fetch("/api/admin/settings/update-profile", {
    method: "PUT",
     credentials:"include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    })
    .then(updatedAdmin => {
      alert("Profile updated successfully");
      console.log("Updated admin data:", updatedAdmin);
    })
    .catch(error => {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    });
}


// 👁️ Toggle password visibility
function togglePassword(fieldId, iconElement) {
  const field = document.getElementById(fieldId);
  if (field.type === "password") {
    field.type = "text";
    iconElement.classList.remove("fa-eye-slash");
    iconElement.classList.add("fa-eye");
  } else {
    field.type = "password";
    iconElement.classList.remove("fa-eye");
    iconElement.classList.add("fa-eye-slash");
  }
}

// 🔐 Change Password Function
function changePassword() {
  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please fill in all fields.");
    return;
  }

  if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    alert("New password must be at least 8 characters long, include a number and a special character.");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("New password and confirm password do not match!");
    return;
  }

  const data = {
    currentPassword: currentPassword,
    newPassword: newPassword
  };

  fetch("/api/admin/settings/change-password", {
    method: "PUT",
     credentials:"include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(res => {
      if (res.message) {
        alert(res.message);
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        
          setTimeout(() => {
          window.location.href = "/Login.html"; // <-- change this to your actual login URL if different
        }, 1500);
      } else {
        throw new Error(res.error || "Password change failed");
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert(error.message || "Error changing password");
    });
}






    function updateSecurity() {
      const twoFactor = document.getElementById('twoFactorAuth').checked;
      const loginAlerts = document.getElementById('loginAlerts').checked;

      console.log("Updating security settings:", { twoFactor, loginAlerts });
      alert("Security settings updated!");
    }

   function logout() {
  Swal.fire({
    title: 'Are you sure you want to log out?',
    text: "You will be redirected to the login page.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, log out!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: 'success',
        title: 'Logged out!',
        text: 'You have been successfully logged out.',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1600); // Wait until alert closes
    }
  });
}

     
     
     //====================== Support Section ==================================
     
const API_BASE = `${BASE_URL}/api/support`;

document.addEventListener("DOMContentLoaded", () => {
  loadAllTickets();
});

async function loadAllTickets() {
  try {
    const res = await fetch(`${API_BASE}/all`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load tickets");

    const tickets = await res.json();
    document.getElementById("pendingTickets").innerHTML = "";
    document.getElementById("inProgressTickets").innerHTML = "";
    document.getElementById("resolvedTickets").innerHTML = "";

    tickets.forEach(ticket => {
      const row = document.createElement("tr");
      row.innerHTML = `
  <td data-label="ID">${ticket.id}</td>
  <td data-label="Username">${ticket.username}</td>
  <td data-label="Role">${ticket.role}</td>
  <td data-label="Subject">${ticket.subject}</td>
  <td data-label="Order ID">${ticket.orderId}</td>
  <td data-label="Image">${ticket.imagePath ? `<img src="${ticket.imagePath}" width="60">` : "N/A"}</td>
  <td data-label="Message">${ticket.message}</td>
  <td data-label="Status">${ticket.status}</td>
  <td data-label="Action">
    ${generateStatusButtons(ticket)}
  </td>
`;
      // row.innerHTML = `
      //   <td>${ticket.id}</td>
      //   <td>${ticket.username}</td>
      //   <td>${ticket.role}</td>
      //   <td>${ticket.subject}</td>
      //   <td>${ticket.orderId}</td>
      //   <td>${ticket.imagePath ? `<img src="${ticket.imagePath}" width="60">` : "N/A"}</td>
      //   <td>${ticket.message}</td>
      //   <td>${ticket.status}</td>
      //   <td>
      //     ${generateStatusButtons(ticket)}
      //   </td>
      // `;

      if (ticket.status === "Pending") {
        document.getElementById("pendingTickets").appendChild(row);
      } else if (ticket.status === "In Progress") {
        document.getElementById("inProgressTickets").appendChild(row);
      } else {
        document.getElementById("resolvedTickets").appendChild(row);
      }
    });

  } catch (error) {
    console.error("Error loading tickets:", error);
    alert("Could not load tickets.");
  }
}

function generateStatusButtons(ticket) {
  let buttons = "";
  if (ticket.status === "Pending") {
    buttons = `
      <button onclick="updateStatus(${ticket.id}, 'In Progress')">Mark In Progress</button>
      <button onclick="updateStatus(${ticket.id}, 'Resolved')">Mark Resolved</button>
    `;
  } else if (ticket.status === "In Progress") {
    buttons = `<button onclick="updateStatus(${ticket.id}, 'Resolved')">Mark Resolved</button>`;
  } else {
    buttons = `<span style="color:green">No Action</span>`;
  }
  return buttons;
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/${id}/status?status=${status}`, {
      method: "PUT",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Update failed");
    alert("Status updated successfully");
    loadAllTickets();
  } catch (err) {
    console.error("Error updating status:", err);
    alert("Failed to update status");
  }
}