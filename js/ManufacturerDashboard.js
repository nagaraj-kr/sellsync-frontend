
const BASE_URL = "https://sellsync-backend-production.up.railway.app";
// ✅ Helpers
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => document.querySelectorAll(sel);

// ✅ Main loader
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ JS loaded');

  // Sidebar menu click
  $all('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const sec = link.dataset.section;
      if (sec) showSection(sec);
    });
  });

  // Load default
  showSection('dashboard-section');

  // Logout
const logoutBtn = $('#logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
      }
    });
  });
}
});



// ✅ Section loader
function showSection(sectionId) {
  // Hide all
  $all('.content-section').forEach(sec => sec.style.display = 'none');
  // Show selected
  const target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';
  // Active nav
  $all('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === sectionId));

  // Switch-case to load data
  switch (sectionId) {
    case 'dashboard-section':
      initDashboard();
      break;
    case 'orders-section':
      loadOrders();
      break;
    case 'products-section':
      loadProducts();
      break;
    case 'wholesalers-section':
      loadWholesalerRequests();
      break;
    case 'support-section':
      initSupportSection();
      break;
    case 'profile-section':
      loadManufacturerProfile();
      break;
    default:
      console.warn('⚠️ No loader implemented for', sectionId);
  }
}

// ✅ Dashboard
function initDashboard() {
  console.log('📊 Loading dashboard...');
  loadDashboardStats();
  loadRecentPendingOrders();
}

function loadDashboardStats() {
  // ✅ Load dashboard summary (orders, revenue)
  fetch(`${BASE_URL}/api/manufacturer/dashboardsummary`)
    .then(res => res.json())
    .then(d => {
      $('#ordersReceived').textContent = d.totalOrders || 0;
      $('#totalRevenue').textContent = `₹${(d.totalRevenue || 0).toLocaleString()}`;
    })
    .catch(err => console.error('❌ Dashboard error', err));

  // ✅ Load manufacturer profile to show organization name
  fetch('/api/manufacturer/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch manufacturer profile');
      }
      return response.json();
    })
    .then(data => {
      const orgElements = document.querySelectorAll('.organization-name');
      orgElements.forEach(el => {
        el.textContent = " " + data.organizationName.toUpperCase();
      });
    })
    .catch(error => {
      console.error('❌ Error fetching manufacturer name:', error);
    });

  // ✅ Load total products separately
  fetch(`${BASE_URL}/api/products`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then(products => {
      $('#totalProducts').textContent = products.length;
    })
    .catch(err => {
      console.error('❌ Products count error', err);
      $('#totalProducts').textContent = 'Error';
    });

  // ✅ Load total wholesalers separately
  fetch(`${BASE_URL}/api/wholesaler`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then(wholesalers => {
      $('#totalWholesalers').textContent = wholesalers.length;
    })
    .catch(err => {
      console.error('❌ Wholesalers count error', err);
      $('#totalWholesalers').textContent = 'Error';
    });
}

// Load Recent Orders 
function loadRecentPendingOrders() {
  const token = localStorage.getItem("token");
  const statusFilter = document.getElementById("orderFilterStatus")?.value || "";
  const dateFilter = document.getElementById("orderFilterDate")?.value || "";

  fetch(`${BASE_URL}/api/orders/manufacturer/orders`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to fetch orders.");
      }
      return res.json();
    })
    .then(data => {
      const tbody = document.getElementById("recent-orders-tbody");

      if (!tbody) {
        console.error("#recent-orders-tbody not found.");
        return;
      }
      tbody.innerHTML = "";

      // Filter for pending orders safely
      const filteredPendingOrders = data.filter(order => {
        const isPending = order.orderStatus?.toLowerCase() === "pending";
        const matchesStatus = !statusFilter ||
          (order.orderStatus?.toLowerCase() === statusFilter.toLowerCase());

        const matchesDate = !dateFilter ||
          (order.orderDate?.startsWith(dateFilter));

        return isPending && matchesStatus && matchesDate;
      });

      if (filteredPendingOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No pending orders found.</td></tr>`;
      } else {
        filteredPendingOrders.forEach(order => {
          const formattedDate = order.orderDate
            ? new Date(order.orderDate).toLocaleDateString()
            : "Unknown";

          const row = `
                     <tr>
        <td data-label="Order ID">#ORD-${order.orderId || ''}</td>
        <td data-label="Wholesaler">${order.buyerName || order.supplierName || "N/A"}</td>
        <td data-label="Date">${formattedDate}</td>
        <td data-label="Amount">₹${order.totalAmount?.toFixed(2) || ''}</td>
        <td data-label="Status">${order.orderStatus || ''}</td>
      </tr>`;

          tbody.innerHTML += row;
        });
      }
    })
    .catch(error => {
      console.error("Error loading recent orders:", error);
      document.getElementById("recent-orders-tbody").innerHTML = `<tr><td colspan="6">Error loading data.</td></tr>`;
    });
}


//products 
// ✅ Global variables
let editingProductId = null;
const addProductModal = document.getElementById("addProductModal");
const addProductBtn = document.getElementById("addProductBtn");
const cancelAddProduct = document.getElementById("cancelAddProduct");
const modalClose = document.querySelector(".modal-close");
const saveProductBtn = document.getElementById("saveProduct");

// ✅ Clear form function
function clearForm() {
  document.getElementById("productName").value = "";
  document.getElementById("productCategory").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productStock").value = "";
  document.getElementById("productDescription").value = "";
  document.getElementById("productImage").value = "";
  editingProductId = null;
}

// ✅ Save/Add/Edit product
saveProductBtn.addEventListener("click", () => {
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value.trim();
  const price = document.getElementById("productPrice").value.trim();
  const stock = document.getElementById("productStock").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const imageInput = document.getElementById("productImage");
  const imageFile = imageInput.files[0];

  if (!name || !category || !price || !stock) {
    Swal.fire("Validation Error", "All fields except image and description are required.", "warning");
    return;
  }
  if (isNaN(price) || parseFloat(price) <= 0) {
    Swal.fire("Validation Error", "Price must be a valid positive number.", "warning");
    return;
  }
  if (isNaN(stock) || parseInt(stock) < 0) {
    Swal.fire("Validation Error", "Stock must be a non-negative integer.", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("category", category);
  formData.append("price", parseFloat(price));
  formData.append("stock", parseInt(stock));
  formData.append("description", description);
  if (imageFile) formData.append("image", imageFile);

  const isEdit = editingProductId !== null;
  const url = isEdit
    ? `${BASE_URL}/api/products/${editingProductId}`
    : `${BASE_URL}/api/products`;
  const method = isEdit ? "PUT" : "POST";

  fetch(url, { method, body: formData })
    .then(res => {
      if (!res.ok) throw new Error("Failed to save product");
      return res.json();
    })
    .then(() => {
      addProductModal.style.display = "none";
      clearForm();
      loadProducts(); // reload table
      Swal.fire({
        title: isEdit ? "Product Updated" : "Product Added",
        text: isEdit
          ? "The product has been successfully updated."
          : "The new product has been successfully added.",
        icon: "success"
      });
      editingProductId = null;
    })
    .catch(err => {
      console.error(err);
      Swal.fire("Error", "Failed to save product.", "error");
    });
});

// ✅ Open modal for Add Product
addProductBtn.addEventListener("click", () => {
  editingProductId = null;
  clearForm();
  document.getElementById("modalTitle").textContent = "Add New Product";
  addProductModal.style.display = "flex";
});

// ✅ Close modal buttons
[cancelAddProduct, modalClose].forEach(btn => {
  btn.addEventListener("click", () => {
    clearForm();
    addProductModal.style.display = "none";
  });
});

// ✅ Main load products function
function loadProducts() {
  console.log("📦 Loading products with actions...");

  const tbody = document.getElementById("productsTableBody");
  if (!tbody) {
    console.error("❌ productsTableBody element not found!");
    return;
  }
  tbody.innerHTML = "";

  fetch(`${BASE_URL}/api/products`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load products. Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const activeProducts = data.filter(p => p.status === "active");

      if (activeProducts.length === 0) {
        const noRow = document.createElement("tr");
        noRow.innerHTML = `<td colspan="7" class="text-center">No active products found.</td>`;
        tbody.appendChild(noRow);
        return;
      }

      activeProducts.forEach(product => {
        const imgSrc = product.imageUrl
          ? `${BASE_URL}${product.imageUrl}`
          : "/images/question.png";

        const row = document.createElement("tr");
        row.innerHTML = `
    <td data-label="Product ID">#PROD-${product.id}</td>
    <td data-label="Image"><img src="${imgSrc}" style="width:50px;height:auto;" alt="Product"></td>
    <td data-label="Name">${product.name}</td>
    <td data-label="Category">${product.category}</td>
    <td data-label="Price">₹${parseInt(product.price).toLocaleString()}</td>
    <td data-label="Stock">${product.stock}</td>
    <td data-label="Actions">
      <button class="btn btn-sm edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="btn btn-sm btn-danger pause-btn" title="Pause"><i class="fa-solid fa-pause"></i></button>
    </td>
        `;

        // Edit product
        row.querySelector(".edit-btn").addEventListener("click", () => {
          document.getElementById("productName").value = product.name;
          document.getElementById("productCategory").value = product.category;
          document.getElementById("productPrice").value = product.price;
          document.getElementById("productStock").value = product.stock;
          document.getElementById("productDescription").value = product.description || "";
          document.getElementById("productImage").value = "";
          editingProductId = product.id;
          document.getElementById("modalTitle").textContent = "Edit Product";
          addProductModal.style.display = "flex";
        });

        // Pause product
        row.querySelector(".pause-btn").addEventListener("click", () => {
          Swal.fire({
            title: "Are you sure?",
            text: "Do you want to pause this product?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, pause it!"
          }).then(result => {
            if (result.isConfirmed) {
              fetch(`${BASE_URL}/api/products/${product.id}/pause`, { method: "PUT" })
                .then(res => {
                  if (!res.ok) throw new Error("Pause failed");
                  row.remove();
                  Swal.fire("Paused!", "Product has been paused.", "success");
                })
                .catch(err => {
                  console.error("❌ Pause error:", err);
                  Swal.fire("Error", "Failed to pause product.", "error");
                });
            }
          });
        });

        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error("❌ Error fetching products:", error);
      const errorRow = document.createElement("tr");
      errorRow.innerHTML = `<td colspan="7" class="text-center text-danger">Error loading products.</td>`;
      tbody.appendChild(errorRow);
    });
}

// ✅ Initial call
document.addEventListener("DOMContentLoaded", loadProducts);
// Pagination helpers
function paginate(array, page, pageSize) {
  const start = (page - 1) * pageSize;
  return array.slice(start, start + pageSize);
}

function renderPaginationControls(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  container.appendChild(prevBtn);
  container.appendChild(pageInfo);
  container.appendChild(nextBtn);
}

// Main loadOrders with pagination and approve/reject
function loadOrders() {
  console.log('📦 Loading orders...');
  fetch(`${BASE_URL}/api/orders/manufacturer/orders`)
    .then(res => res.json())
    .then(data => {
      // Split orders
      const pendingOrders = data.filter(order => order.orderStatus?.toLowerCase() === 'pending');
      const processedOrders = data.filter(order => order.orderStatus?.toLowerCase() !== 'pending');

      // Pagination state
      let pendingPage = 1, processedPage = 1;
      const pageSize = 10;
      const pendingTotalPages = Math.ceil(pendingOrders.length / pageSize) || 1;
      const processedTotalPages = Math.ceil(processedOrders.length / pageSize) || 1;

      function renderPending() {
        const tbody = document.getElementById('pendingOrdersTableBody');
        tbody.innerHTML = '';
        const pageData = paginate(pendingOrders, pendingPage, pageSize);
        if (pageData.length === 0) {
          tbody.innerHTML = `<tr><td colspan="8">No pending orders found.</td></tr>`;
        } else {
          pageData.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td data-label="Order ID">#ORD-${order.orderId || ''}</td>
              <td data-label="Product Name">${order.productName || ''}</td>
              <td data-label="Wholesaler">${order.buyerName || order.supplierName || 'N/A'}</td>
              <td data-label="Date">${order.orderDate || ''}</td>
              <td data-label="Items">${order.itemCount || ''}</td>
              <td data-label="Total">₹${order.totalAmount || 0}</td>
              <td data-label="Status">
                <span class="status status-${order.orderStatus?.toLowerCase() || ''}">
                  ${order.orderStatus || ''}
                </span>
              </td>
              <td data-label="Actions">
                <button class="btn btn-sm btn-success approve-btn" data-id="${order.orderId}">Approve</button>
                <button class="btn btn-sm btn-danger reject-btn" data-id="${order.orderId}">Reject</button>
              </td>
            `;
            tbody.appendChild(row);
          });
        }
        renderPaginationControls('pendingOrdersPagination', pendingPage, pendingTotalPages, (page) => {
          pendingPage = page;
          renderPending();
          attachOrderActionHandlers();
        });
        attachOrderActionHandlers();
      }

      function renderProcessed() {
        const tbody = document.getElementById('processedOrdersTableBody');
        tbody.innerHTML = '';
        const pageData = paginate(processedOrders, processedPage, pageSize);
        if (pageData.length === 0) {
          tbody.innerHTML = `<tr><td colspan="8">No processed orders found.</td></tr>`;
        } else {
          pageData.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td data-label="Order ID">#ORD-${order.orderId || ''}</td>
              <td data-label="Product Name">${order.productName || ''}</td>
              <td data-label="Wholesaler">${order.buyerName || order.supplierName || 'N/A'}</td>
              <td data-label="Date">${order.orderDate || ''}</td>
              <td data-label="Items">${order.itemCount || ''}</td>
              <td data-label="Total">₹${order.totalAmount || 0}</td>
              <td data-label="Status">
                <span class="status status-${order.orderStatus?.toLowerCase() || ''}">
                  ${order.orderStatus || ''}
                </span>
              </td>
              <td data-label="Action Taken">
                ${order.orderStatus?.toLowerCase() === 'processing'
                  ? 'Approved'
                  : 'Rejected'}
              </td>
            `;
            tbody.appendChild(row);
          });
        }
        renderPaginationControls('processedOrdersPagination', processedPage, processedTotalPages, (page) => {
          processedPage = page;
          renderProcessed();
        });
      }

      function attachOrderActionHandlers() {
        document.querySelectorAll('.approve-btn').forEach(btn => {
          btn.onclick = () => handleAction(btn.dataset.id, 'Processing');
        });
        document.querySelectorAll('.reject-btn').forEach(btn => {
          btn.onclick = () => handleAction(btn.dataset.id, 'Canceled');
        });
      }

      renderPending();
      renderProcessed();
    })
    .catch(err => console.error('❌ Orders error:', err));
}

// Approve / Reject action
function handleAction(orderId, status) {
  fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: status })
  })
    .then(res => res.json())
    .then(updatedOrder => {
      console.log(`✅ Order ${orderId} updated to ${status}`, updatedOrder);
      loadOrders();
    })
    .catch(err => console.error('❌ Error updating order status:', err));
}

// ✅ Wholesaler Requests with Approve/Reject buttons
function loadWholesalerRequests() {
  console.log('🤝 Loading wholesaler requests...');
  const tbody = document.getElementById('wholesaler-requests-tbody');
  if (!tbody) {
    console.error('❌ Table body not found!');
    return;
  }

  // Clear old rows
  tbody.innerHTML = '';

  fetch(`${BASE_URL}/api/requests`)
    .then(res => res.json())
    .then(data => {
      data.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
       <td data-label="Wholesaler ID">${req.wholesalerId || '-'}</td>
  <td data-label="Business Name">${req.wholesalerBusinessName || 'N/A'}</td>
  <td data-label="Email">${req.wholesalerEmail || 'N/A'}</td>
  <td data-label="Product Name">${req.productName || ''}</td>
  <td data-label="Quantity">${req.quantity || ''}</td>
  <td data-label="Description">${req.specifications || ''}</td>
  <td data-label="Request Date">${new Date(req.deadline).toLocaleDateString()}</td>
  <td data-label="Status">${req.status}</td>
  <td data-label="Actions">
    ${req.status === 'Pending'
      ? `
          <button class="btn btn-success btn-sm approve-btn" data-id="${req.id}">Approve</button>
          <button class="btn btn-danger btn-sm reject-btn" data-id="${req.id}">Reject</button>
        `
      : '-'
    }
  </td>
        `;
        tbody.appendChild(row);
      });

      // Attach event listeners after rendering
      document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          approveRequest(btn.dataset.id);
        });
      });

      document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          rejectRequest(btn.dataset.id);
        });
      });
    })
    .catch(err => console.error('❌ Requests error', err));
}

// ✅ Approve API
function approveRequest(requestId) {
  fetch(`${BASE_URL}/api/requests/${requestId}/status?status=Approved`, {
    method: 'PUT'
  })
    .then(res => {
      if (res.ok) {
        alert('Request approved!');
        loadWholesalerRequests();
      } else {
        alert('Failed to approve request');
      }
    })
    .catch(err => {
      console.error('❌ Approve error', err);
      alert('Error occurred approving request');
    });
}

// ✅ Reject API
function rejectRequest(requestId) {
  fetch(`${BASE_URL}/api/requests/${requestId}/status?status=Rejected`, {
    method: 'PUT'
  })
    .then(res => {
      if (res.ok) {
        alert('Request rejected!');
        loadWholesalerRequests();
      } else {
        alert('Failed to reject request');
      }
    })
    .catch(err => {
      console.error('❌ Reject error', err);
      alert('Error occurred rejecting request');
    });
}

// ✅ Call on page load
document.addEventListener('DOMContentLoaded', () => {
  loadWholesalerRequests();
});




// ✅ Function to load manufacturer profile
async function loadManufacturerProfile() {
  console.log("👤 Loading manufacturer profile...");
  try {
    const response = await fetch(`${BASE_URL}/api/manufacturer/profile`);
    if (response.ok) {
      const data = await response.json();

      document.getElementById("companyName").value = data.organizationName || "";
      document.getElementById("contactEmail").value = data.email || "";
      document.getElementById("contactPhone").value = data.phone || "";
      document.getElementById("gstNumber").value = data.gstNumber || "";
      document.getElementById("companyAddress").value = data.address || "";

      console.log("✅ Profile data loaded successfully.");
    } else {
      Swal.fire("Error", "Failed to load profile details.", "error");
    }
  } catch (error) {
    console.error("❌ Error loading profile:", error);
    Swal.fire("Error", "Error fetching profile. Please try again.", "error");
  }
}

// ✅ Call loadManufacturerProfile() only when profile section is clicked
document.getElementById("profile-section").addEventListener("click", function () {
  loadManufacturerProfile();
});

// ✅ Change Password functionality
document.getElementById("changePasswordBtn").addEventListener("click", async function () {
  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    Swal.fire("Validation Error", "All fields are required.", "warning");
    return;
  }
  if (newPassword !== confirmPassword) {
    Swal.fire("Validation Error", "New and confirm passwords do not match.", "warning");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/manufacturer/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });

    if (response.ok) {
      const message = await response.text();
      Swal.fire("Success", message, "success");
      // Clear the fields
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";
    } else {
      const errorText = await response.text();
      Swal.fire("Error", errorText, "error");
    }
  } catch (error) {
    console.error("❌ Password change failed:", error);
    Swal.fire("Error", "Something went wrong. Please try again.", "error");
  }
});


// ================== SUPPORT ===================
const API_BASE = `${BASE_URL}/api/support`;
let username = "";
let role = "";

// ✅ Initialize Support Section (call this when user navigates to support)
async function initSupportSection() {
  console.log("🎧 Initializing support section...");
  try {
    const res = await fetch(`${API_BASE}/me`, {
      method: "GET",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Not authenticated");

    const data = await res.json();
    username = data.username;
    role = data.role;

    console.log("✅ Logged in as:", username, "Role:", role);
    document.getElementById("support-section").style.display = "block";

    // Bind buttons only once
    document.getElementById("submitSupportBtn").onclick = submitTicket;
    document.getElementById("cancelSupportBtn").onclick = clearSupportForm;

    // Load tickets
    loadMyTickets();
  } catch (error) {
    console.error("❌ User not authenticated:", error);
    Swal.fire("Not Authenticated", "Please login to access the support section.", "warning");
  }
}

// ✅ Submit Ticket
async function submitTicket() {
  const subject = document.getElementById("supportSubject").value.trim();
  const orderId = document.getElementById("orderId").value.trim();
  const message = document.getElementById("supportMessage").value.trim();
  const image = document.getElementById("supportAttachment").files[0];

  // Basic validation
  if (!subject || !orderId || !message) {
    Swal.fire("Validation Error", "Please fill in all required fields.", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("username", username);
  formData.append("role", role);
  formData.append("subject", subject);
  formData.append("orderId", orderId);
  formData.append("message", message);
  if (image) formData.append("image", image);

  try {
    const res = await fetch(`${API_BASE}/submit`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (res.ok) {
      Swal.fire("Success", " Support request submitted successfully!", "success");
      clearSupportForm();
      loadMyTickets();
    } else {
      Swal.fire("Error", "❌ Failed to submit ticket.", "error");
    }
  } catch (error) {
    console.error("❌ Submission error:", error);
    Swal.fire("Error", "Something went wrong while submitting your ticket.", "error");
  }
}

// ✅ Clear Support Form (no SweetAlert here)
function clearSupportForm() {
  document.getElementById("supportSubject").value = "";
  document.getElementById("orderId").value = "";
  document.getElementById("supportMessage").value = "";
  document.getElementById("supportAttachment").value = "";
  // ❌ No alert here as you requested
}

// ✅ Load My Tickets
async function loadMyTickets() {
  try {
    const params = new URLSearchParams({ username, role });
    const res = await fetch(`${API_BASE}/user?${params.toString()}`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Unable to fetch tickets");
    const tickets = await res.json();

    const tbody = document.getElementById("ticketBody");
    tbody.innerHTML = "";

    tickets.forEach(ticket => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td data-label="Ticket ID">${ticket.id}</td>
  <td data-label="Subject">${ticket.subject}</td>
  <td data-label="Order ID">${ticket.orderId}</td>
  <td data-label="Image">${ticket.imagePath ? `<img src="${BASE_URL}${ticket.imagePath}" width="60" />` : "N/A"}</td>
  <td data-label="Message">${ticket.message}</td>
  <td data-label="Status">${ticket.status}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("❌ Error loading tickets:", error);
    Swal.fire("Error", "Could not load tickets.", "error");
  }
}



