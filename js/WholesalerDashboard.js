const BASE_URL = "https://sellsync-backend-production.up.railway.app";
// ======================= CONFIG ===========================
const apiBaseUrl = `${BASE_URL}`;
let cartItems = [];
let total = 0;

// ======================= UTILITIES ===========================
function $(selector) {
  return document.querySelector(selector);
}
function $all(selector) {
  return document.querySelectorAll(selector);
}

// ======================= SECTION DISPLAY ===========================
function showSection(sectionId) {
  // Hide all sections first
  $all('[id$="-section"]').forEach(sec => sec.style.display = "none");

  // Show the requested section
  const targetSection = document.getElementById(`${sectionId}-section`);
  if (targetSection) targetSection.style.display = "block";

  
  // Show/hide top navbar only for browse section
    const topNavbar = document.querySelector('.top-navbar');
  if (topNavbar) {
    if (sectionId === "browse") {
      topNavbar.style.display = "flex";
    } else {
      topNavbar.style.display = "none";
    }
  }


  // Update sidebar active state
  $all('.sidebar-menu li a').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.section === sectionId) link.classList.add('active');
  });

  // Load data for that section
  switch (sectionId) {
    case "browse": fetchProducts(); break;
    case "orders": fetchMyOrders(); break;
    case "support": initSupportSection(); break; 
    case "profile": loadProfileData(); break;
    case "dashboard": initDashboard(); break;
    case "requests": initProductRequests(); break;

  }
}

// ======================= LOAD PROFILE ===========================
async function loadProfileData() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/wholesaler/profile`, { credentials: "include" });
    if (!res.ok) throw new Error("Unauthorized or not found");
    const data = await res.json();

    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || "";
    };

    setValue("whCompanyName", data.organizationName || data.companyName);
    setValue("whEmail", data.email);
    setValue("whPhone", data.phone);
    setValue("whGst", data.gstNumber || data.taxId);
    setValue("whAddress", data.address);

  } catch (err) {
    console.error("Error loading profile:", err);
    Swal.fire("Error", "Unable to fetch profile. Try again later.", "error");
  }
}

// ======================= FETCH PRODUCTS ===========================
function fetchProducts(filterCategory = "") {
  const productGrid = document.getElementById("product-grid");
  if (!productGrid) return;

  const url = filterCategory
    ? `${apiBaseUrl}/wholesaler/products/browse?category=${filterCategory}`
    : `${apiBaseUrl}/wholesaler/products/browse`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      productGrid.innerHTML = "";
      if (data.length === 0) {
        productGrid.innerHTML = "<p>No products found in this category.</p>";
        return;
      }
      data.forEach(product => {
        productGrid.innerHTML += `
          <div class="product-card" style="border:1px solid #ddd;padding:15px;border-radius:10px;margin-bottom:20px;">
            <img src="${product.imageUrl}" alt="${product.name}" style="width:100%;max-height:200px;object-fit:contain;">
            <h3 class="product-name">${product.name}</h3>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Price:</strong> ₹${product.price}</p>
            <p><strong>Manufacturer:</strong> ${product.manufacturerName}</p>
            <div id="desc-${product.id}" style="display:none;margin-top:10px;">
              <strong>Description:</strong> ${product.description || "No description available."}
            </div>
            <button class="btn btn-info" onclick="toggleDescription('${product.id}')">More Details</button>
            <button class="btn btn-primary" onclick="addToCart('${product.id}','${product.name}',${product.price},'${product.imageUrl}')">Add to Cart</button>
          </div>`;
      });
    })
    .catch(err => {
      console.error("Error fetching products:", err);
      alert("There was an error loading the products.");
    });
}

function toggleDescription(productId) {
  const desc = document.getElementById(`desc-${productId}`);
  if (desc) desc.style.display = desc.style.display === "none" ? "block" : "none";
}

// ======================= PRODUCT REQUESTS ===========================
async function initProductRequests() {
  const manufacturerSelect = document.getElementById("request-manufacturer");
  const form = document.getElementById("product-request-form");
  const requestsList = document.getElementById("requests-list");

  // ✅ Load all manufacturers into the dropdown
  try {
    const response = await fetch(`${apiBaseUrl}/api/manufacturer`, {
      method: "GET",
      credentials: "include"
    });
    if (!response.ok) throw new Error("Failed to load manufacturers");
    const manufacturers = await response.json();
    //console.log("Manufacturers:", manufacturers);

    manufacturerSelect.innerHTML = `<option value="">-- Select Manufacturer --</option>`;
    manufacturers.forEach(manu => {
      // Adjust property names based on API response
      manufacturerSelect.innerHTML += `<option value="${manu.id}">${manu.organizationName}</option>`;
    });
  } catch (err) {
    console.error("❌ Error loading manufacturers:", err);
    Swal.fire("Error", "Unable to load manufacturers.", "error");
  }

  // ✅ Handle form submission
  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();
      const data = {
        productName: document.getElementById("request-name").value.trim(),
        category: document.getElementById("request-category").value.trim(),
        manufacturer: manufacturerSelect.value,
        quantity: parseInt(document.getElementById("request-quantity").value),
        specifications: document.getElementById("request-specs").value.trim(),
        deadline: document.getElementById("request-deadline").value
      };

      if (!data.productName || !data.category || !data.manufacturer || !data.quantity || !data.deadline) {
        Swal.fire("Validation Error", "Please fill all required fields.", "warning");
        return;
      }

      try {
        const res = await fetch(`${apiBaseUrl}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data)
        });
        if (res.ok) {
          Swal.fire("Success", "Your product request was submitted!", "success");
          form.reset();
          loadRequestsTable();
        } else {
          const errText = await res.text();
          Swal.fire("Error", errText, "error");
        }
      } catch (err) {
        console.error("❌ Error submitting request:", err);
        Swal.fire("Error", "Something went wrong.", "error");
      }
    };
  }

  // ✅ Load existing requests
  async function loadRequestsTable() {
    try {
      const res = await fetch(`${apiBaseUrl}/api/requests/my`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load requests");
      const requests = await res.json();
      requestsList.innerHTML = "";
      if (requests.length === 0) {
        requestsList.innerHTML = `<tr><td colspan="6">No product requests found.</td></tr>`;
        return;
      }

      requests.forEach(req => {
        requestsList.innerHTML += `
        <tr>
    <td data-label="Date">${new Date(req.deadline).toLocaleDateString()}</td>
    <td data-label="Product">${req.productName}</td>
    <td data-label="Category">${req.category}</td>
    <td data-label="Quantity">${req.quantity}</td>
    <td data-label="Responses">${req.status}</td>
  </tr>`;
      });
    } catch (err) {
      console.error("❌ Error loading requests:", err);
    }
  }

  loadRequestsTable();
}


// ======================= SUPPORT SECTION ===========================
let supportUsername = "";
let supportRole = "";

async function initSupportSection() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/support/me`, { credentials: "include" });
    if (!res.ok) throw new Error("Not authenticated");
    const data = await res.json();
    supportUsername = data.username;
    supportRole = data.role;
    console.log("✅ Support user loaded:", supportUsername, supportRole);
    loadSupportTickets();
  } catch (err) {
    console.error("❌ Failed to load support user:", err);
  }

  const submitBtn = document.getElementById("support-submit");
  if (submitBtn) {
    submitBtn.onclick = submitSupportTicket;
  }
}

async function submitSupportTicket() {
  const subject = $("#supportSubject").value.trim();
  const orderId = $("#orderId").value.trim();
  const message = $("#supportMessage").value.trim();
  const image = $("#supportAttachment").files[0];

  if (!subject || !orderId || !message) {
    Swal.fire("Validation Error", "All fields are required.", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("username", supportUsername);
  formData.append("role", supportRole);
  formData.append("subject", subject);
  formData.append("orderId", orderId);
  formData.append("message", message);
  if (image) formData.append("image", image);

  try {
    const res = await fetch(`${apiBaseUrl}/api/support/submit`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
    if (res.ok) {
      Swal.fire("Success", "Ticket submitted!", "success");
      loadSupportTickets();
    } else {
      Swal.fire("Error", "Failed to submit ticket", "error");
    }
  } catch (err) {
    console.error("❌ Submit error:", err);
  }
}

async function loadSupportTickets() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/support/user?username=${supportUsername}&role=${supportRole}`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to load tickets");
    const tickets = await res.json();
    const tbody = document.querySelector("#support-section table tbody");
    tbody.innerHTML = "";
    tickets.forEach(ticket => {
      tbody.innerHTML += `
      <tr>
      <td data-label="Ticket ID">${ticket.id}</td>
      <td data-label="Subject">${ticket.subject}</td>
      <td data-label="Order ID">${ticket.orderId}</td>
      <td data-label="Image">${ticket.imagePath ? `<img src="${ticket.imagePath}" width="60">` : "N/A"}</td>
      <td data-label="Message">${ticket.message}</td>
      <td data-label="Status">${ticket.status}</td>
    </tr>`;
    });
  } catch (err) {
    console.error("❌ Load tickets error:", err);
  }
}


// ======================= LOGOUT ===========================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = async (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        // 🔥 If you have NO logout API, just clear token
        localStorage.removeItem("token");
        Swal.fire({
          title: "Logged out!",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        setTimeout(() => {
          window.location.href = "/login.html";
        }, 1500);
      }
    });
  };
}






// ======================= CART ===========================
// Global cart array


function addToCart(id, name, price, img) {
  const existingItem = cartItems.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cartItems.push({ id, name, price, quantity: 1, img });
  }
  updateCart();
  const cartContainer = document.querySelector("#cart-container");
  if (cartContainer) cartContainer.style.display = "flex";
}

function updateCart() {
  const cartBody = document.querySelector(".cart-body");
  const cartTotal = document.querySelector(".cart-total span:last-child");
  const cartBadge = document.querySelector(".cart-icon .badge");
  const checkoutBtn = document.querySelector(".checkout-btn");

  if (!cartBody || !cartTotal || !checkoutBtn) return;

  cartBody.innerHTML = "";
  total = 0;

  if (cartItems.length === 0) {
    cartBody.innerHTML = `<p class="empty-cart-message">Your cart is empty</p>`;
    if (cartBadge) cartBadge.textContent = "0";
    checkoutBtn.disabled = true;
    cartTotal.textContent = "₹0.00";
    return;
  }

  checkoutBtn.disabled = false;
  if (cartBadge) {
    cartBadge.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.img}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>₹${item.price.toFixed(2)} each</p>
        <div class="cart-item-price">₹${itemTotal.toFixed(2)}</div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="decrease" data-index="${index}">-</button>
            <input type="number" value="${item.quantity}" min="1" data-index="${index}">
            <button class="increase" data-index="${index}">+</button>
          </div>
          <button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    cartBody.appendChild(cartItem);
  });

  cartTotal.textContent = `₹${total.toFixed(2)}`;
  attachCartEventListeners();
}

function attachCartEventListeners() {
  document.querySelectorAll(".increase").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      cartItems[idx].quantity++;
      updateCart();
    };
  });

  document.querySelectorAll(".decrease").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      if (cartItems[idx].quantity > 1) {
        cartItems[idx].quantity--;
        updateCart();
      }
    };
  });

  document.querySelectorAll(".remove-item").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      cartItems.splice(idx, 1);
      updateCart();
    };
  });

  document.querySelectorAll(".quantity-control input").forEach(input => {
    input.onchange = function () {
      const idx = parseInt(this.dataset.index);
      const newQty = parseInt(this.value);
      if (!isNaN(newQty) && newQty > 0) {
        cartItems[idx].quantity = newQty;
        updateCart();
      } else {
        this.value = cartItems[idx].quantity; // revert
      }
    };
  });
}



// ======================= ORDERS & DASHBOARD ===========================
function fetchMyOrders() {
  fetch(`${apiBaseUrl}/api/orders/my`)
    .then(res => res.json())
    .then(orders => {
      const tbody = $("#orders-section table tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      orders.forEach(order => {
        tbody.innerHTML += `
            <tr>
            <td data-label="Order ID">#ORD-${order.orderId}</td>
            <td data-label="Date">${order.orderDate}</td>
            <td data-label="Supplier">${order.supplierName || "Unknown"}</td>
            <td data-label="Items">${order.itemCount ?? 0}</td>
            <td data-label="Total">₹${order.totalAmount ?? 0}</td>
            <td data-label="Status"><span class="status status-${(order.orderStatus || '').toLowerCase()}">${order.orderStatus}</span></td>
            <td data-label="Actions">
              <button class="action-btn view"><i class="fas fa-eye"></i></button>
              <button class="action-btn download"><i class="fas fa-download"></i></button>
            </td>
          </tr>`;
      });
    })
    .catch(err => console.error("Error fetching orders:", err));
}

async function loadDashboardStats() {
  const token = localStorage.getItem("token");
  try {
    const totalOrdersRes = await fetch(`${apiBaseUrl}/api/orders/my`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const totalOrdersData = await totalOrdersRes.json();
    $("#total-orders").innerText = totalOrdersData.length;

    const pendingRes = await fetch(`${apiBaseUrl}/api/orders/my/pending`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const pendingData = await pendingRes.json();
    $("#pending-orders").innerText = pendingData.length;

    const suppliersRes = await fetch(`${apiBaseUrl}/api/manufacturer`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const suppliersData = await suppliersRes.json();
    $("#connected-suppliers").innerText = suppliersData.length;

    const totalAmount = totalOrdersData.reduce((sum, order) => sum + order.totalAmount, 0);
    $("#total-spend").innerText = `₹${totalAmount.toLocaleString()}`;
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
  }
}

function initDashboard() {
  loadDashboardStats();
    loadPendingOrders();
  // You can call loadPendingOrders() if needed
}

// ======================= PAYMENT (RAZORPAY) ===========================
function setupCheckout() {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", () => {
    const amount = total * 100;
    fetch(`${apiBaseUrl}/api/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    })
    .then(res => res.json())
    .then(orderData => {
      const options = {
        key: "rzp_test_zL7hUYsaWYLQLJ",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SellSync",
        description: "Order Payment",
        order_id: orderData.id,
       handler: function (response) {
  // ✅ Payment succeeded
  console.log(" Payment Success! Payment ID:", response.razorpay_payment_id);

  // 👉 Build order payload
  const payload = {
    cartItems: cartItems.map(({ id, price, quantity }) => ({
      productId: id,
      quantity: quantity,
      price: price
    })),
    totalAmount: total,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpayOrderId: response.razorpay_order_id,
    razorpaySignature: response.razorpay_signature
  };

  // 👉 Send order details to backend
  fetch(`${apiBaseUrl}/api/orders/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to save order");
    return res.text();
  })
  .then(msg => {
    // ✅ Order saved successfully
    Swal.fire("Success", "Order placed successfully!", "success");
    // Clear cart
    cartItems = [];
    updateCart();
    // Refresh order list
    fetchMyOrders();
  })
  .catch(err => {
    console.error("❌ Order save failed:", err);
    Swal.fire("Error", "Payment succeeded but order saving failed!", "error");
  });
},

        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999"
        },
        theme: { color: "#3399cc" }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    })
    .catch(err => {
      console.error("❌ Razorpay order creation failed:", err);
      alert("Payment error. Please try again.");
    });
  });
}


// ======================= INIT ALL ===========================
document.addEventListener("DOMContentLoaded", () => {
  // Hide all sections, show dashboard
  $all('[id$="-section"]').forEach(sec => sec.style.display = "none");
  const dash = document.getElementById("dashboard-section");
  if (dash) dash.style.display = "block";

  // Sidebar navigation
  $all(".sidebar-menu li a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });

  // Setup search
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      document.querySelectorAll(".product-card").forEach(card => {
        const name = card.querySelector(".product-name").textContent.toLowerCase();
        card.style.display = name.includes(searchTerm) ? "block" : "none";
      });
    });
  }

  // Setup cart buttons
  const openCart = document.getElementById("open-cart");
  if (openCart) openCart.addEventListener("click", () => $("#cart-container").style.display = "flex");
  const closeCart = document.querySelector(".close-cart");
  if (closeCart) closeCart.addEventListener("click", () => $("#cart-container").style.display = "none");

  // Setup checkout
  setupCheckout();

  // Load dashboard initially
  initDashboard();
});
// =================== Pending Orders =============
// function loadPendingOrders() {
//   const tbody = document.getElementById("orders-tbody");
//   if (!tbody) return; // safety check

//   fetch(`${apiBaseUrl}/api/orders/my/pending`, {
//     headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
//   })
//     .then(res => {
//       if (!res.ok) throw new Error("Failed to fetch");
//       return res.json();
//     })
//     .then(data => {
//       tbody.innerHTML = ""; // clear old rows

//       if (!data || data.length === 0) {
//         tbody.innerHTML = `<tr><td colspan="6">No pending orders found.</td></tr>`;
//         return;
//       }

//       const rowsHtml = data
//         .map(order => {
//           const formattedDate = new Date(order.orderDate).toLocaleDateString();
//           return `
//             <tr>
//               <td>#ORD-${order.orderId}</td>
//               <td>${order.supplierName || "Unknown"}</td>
//               <td>${formattedDate}</td>
//               <td>₹${(order.totalAmount || 0).toFixed(2)}</td>
//               <td><span class="status status-${(order.orderStatus || '').toLowerCase()}">${order.orderStatus}</span></td>
//             </tr>`;
//         })
//         .join("");
//       tbody.innerHTML = rowsHtml;
//     })
//     .catch(err => {
//       console.error("❌ Failed to load pending orders:", err);
//       tbody.innerHTML = `<tr><td colspan="6">Error loading orders.</td></tr>`;
//     });
// }

// ...existing code...

function renderRecentOrders(orders) {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) return;

  tbody.innerHTML = ""; // clear old content

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No pending orders found.</td></tr>`;
    return;
  }

  // Only show the 5 most recent orders
  const recentOrders = orders.slice(0, 5);

  // Check screen size
  if (window.innerWidth <= 600) {
    // Mobile: show as cards
    tbody.innerHTML = ""; // clear table
    recentOrders.forEach(order => {
      const formattedDate = new Date(order.orderDate).toLocaleDateString();
      const card = document.createElement("tr");
      card.innerHTML = `
        <td colspan="6" style="padding:0;">
          <div class="order-card-mobile" style="border:1px solid #ddd;border-radius:10px;margin-bottom:12px;padding:12px;">
            <div><strong>Order ID:</strong> #ORD-${order.orderId}</div>
            <div><strong>Supplier:</strong> ${order.supplierName || "Unknown"}</div>
            <div><strong>Date:</strong> ${formattedDate}</div>
            <div><strong>Total:</strong> ₹${(order.totalAmount || 0).toFixed(2)}</div>
            <div><strong>Status:</strong> <span class="status status-${(order.orderStatus || '').toLowerCase()}">${order.orderStatus}</span></div>
          </div>
        </td>
      `;
      tbody.appendChild(card);
    });
  } else {
    // Tablet/Desktop: show as table rows
    const rowsHtml = recentOrders
      .map(order => {
        const formattedDate = new Date(order.orderDate).toLocaleDateString();
        return `
          <tr>
            <td>#ORD-${order.orderId}</td>
            <td>${order.supplierName || "Unknown"}</td>
            <td>${formattedDate}</td>
            <td>₹${(order.totalAmount || 0).toFixed(2)}</td>
            <td><span class="status status-${(order.orderStatus || '').toLowerCase()}">${order.orderStatus}</span></td>
          </tr>`;
      })
      .join("");
    tbody.innerHTML = rowsHtml;
  }
}

function loadPendingOrders() {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) return; // safety check

  fetch(`${apiBaseUrl}/api/orders/my/pending`, {
    headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    })
    .then(data => {
      renderRecentOrders(data);
    })
    .catch(err => {
      console.error("❌ Failed to load pending orders:", err);
      tbody.innerHTML = `<tr><td colspan="6">Error loading orders.</td></tr>`;
    });
}

// Re-render orders on resize for responsiveness
window.addEventListener("resize", () => {
  // If the orders section is visible, re-render
  const tbody = document.getElementById("orders-tbody");
  if (tbody && tbody.children.length > 0) {
    // Re-fetch and re-render to adapt to new screen size
    loadPendingOrders();
  }
});

// ...existing code...
// ======================= CHANGE PASSWORD ===========================
document.addEventListener("DOMContentLoaded", () => {
  const changeBtn = document.getElementById("whChangePasswordBtn");
  if (!changeBtn) return;

  changeBtn.addEventListener("click", async () => {
    const currentPassword = document.getElementById("whCurrentPassword").value.trim();
    const newPassword = document.getElementById("whNewPassword").value.trim();
    const confirmPassword = document.getElementById("whConfirmPassword").value.trim();

    // 🔎 Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire("Validation Error", "All fields are required.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire("Validation Error", "New and confirm passwords do not match.", "warning");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/wholesaler/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // ✅ important if backend uses session/cookie
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      if (response.ok) {
        const message = await response.text();
        Swal.fire("Success", message || "Password changed successfully!", "success");
        // clear inputs
        document.getElementById("whCurrentPassword").value = "";
        document.getElementById("whNewPassword").value = "";
        document.getElementById("whConfirmPassword").value = "";
      } else {
        const errorText = await response.text();
        Swal.fire("Error", errorText || "Failed to change password.", "error");
      }
    } catch (err) {
      console.error("❌ Password change failed:", err);
      Swal.fire("Error", "Something went wrong. Please try again.", "error");
    }
  });
});

