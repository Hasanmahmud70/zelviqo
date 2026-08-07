// ================================================================
// ZELVIQO LUXURY SKINCARE - MAIN FRONTEND CONTROLLER
// SUPABASE POWERED ORDER SYSTEM & ADMIN DASHBOARD
// ================================================================

// Supabase Configuration
const SUPABASE_URL = "https://xllyqwzcgqwbstduemev.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbHlxbXpjZ3F3YnN0ZHVlbWV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDM1ODYsImV4cCI6MjEwMTY";

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Application State
let selectedProductName = "";
let selectedUnitPrice = 0;
let selectedProductImage = "";
let quantity = 1;
let selectedZone = "Inside Dhaka";
let deliveryCharge = 60;
let selectedPaymentMethod = "Cash On Delivery";
let appliedCoupon = null;

const couponList = [
    { code: "ZELVIQO10", type: "percent", value: 10, minOrder: 500, active: true },
    { code: "WELCOME100", type: "flat", value: 100, minOrder: 1000, active: true }
];

let allAdminOrders = [];

// DOM Ready Initialization
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', { page_title: document.title });
    }
});

// Select Product Handler
function selectProduct(productName, price, image = "") {
    selectedProductName = productName;
    selectedUnitPrice = price;
    selectedProductImage = image;
    quantity = 1;
    appliedCoupon = null;

    const titleElem = document.getElementById("selected-product-title");
    if (titleElem) {
        titleElem.innerText = `Selected Product: ${selectedProductName} (৳${selectedUnitPrice})`;
    }
    
    const checkoutCard = document.getElementById("checkout-card");
    if (checkoutCard) checkoutCard.style.display = "block";

    const successCard = document.getElementById("orderSuccessCard");
    if (successCard) successCard.style.display = "none";

    const qtyInput = document.getElementById("quantity");
    if (qtyInput) qtyInput.value = quantity;

    const couponInput = document.getElementById("couponInput");
    if (couponInput) couponInput.value = "";

    const couponMsg = document.getElementById("couponMessage");
    if (couponMsg) couponMsg.innerText = "";

    updateOrderSummary();

    // Trigger Meta Pixel & GA4 ViewContent Events
    if (typeof fbq === 'function') {
        fbq('track', 'ViewContent', {
            content_name: productName,
            value: price,
            currency: 'BDT'
        });
    }
    if (typeof gtag === 'function') {
        gtag('event', 'view_item', {
            items: [{ item_name: productName, price: price }]
        });
    }

    const checkoutElem = document.getElementById("order");
    if (checkoutElem) checkoutElem.scrollIntoView({ behavior: "smooth" });
}

// Adjust Quantity
function adjustQuantity(delta) {
    quantity = Math.max(1, quantity + delta);
    const qtyInput = document.getElementById("quantity");
    if (qtyInput) qtyInput.value = quantity;
    updateOrderSummary();
}

// Select Delivery Zone
function selectZone(zoneName, charge) {
    selectedZone = zoneName;
    deliveryCharge = charge;

    const dhakaElem = document.getElementById("zone-dhaka");
    const outsideElem = document.getElementById("zone-outside");

    if (dhakaElem) dhakaElem.classList.toggle("active", zoneName === "Inside Dhaka");
    if (outsideElem) outsideElem.classList.toggle("active", zoneName === "Outside Dhaka");

    updateOrderSummary();
}

// Select Payment Method
function selectPaymentMethod(methodKey) {
    const codElem = document.getElementById("pay-cod");
    const mfsElem = document.getElementById("pay-mfs");
    const cardElem = document.getElementById("pay-card");
    const submitBtn = document.getElementById("submitOrderBtn");

    if (codElem) codElem.classList.toggle("active", methodKey === "COD");
    if (mfsElem) mfsElem.classList.toggle("active", methodKey === "MFS");
    if (cardElem) cardElem.classList.toggle("active", methodKey === "CARD");

    if (methodKey === "COD") {
        selectedPaymentMethod = "Cash On Delivery";
        if (submitBtn) submitBtn.innerText = "Confirm Order (Cash on Delivery)";
    } else if (methodKey === "MFS") {
        selectedPaymentMethod = "Mobile Banking (bKash/Nagad/Rocket/Upay)";
        if (submitBtn) submitBtn.innerText = "Proceed to Mobile Banking Checkout";
    } else if (methodKey === "CARD") {
        selectedPaymentMethod = "Card Payment / SSLCommerz";
        if (submitBtn) submitBtn.innerText = "Proceed to Card Payment";
    }
}

// Apply Coupon Code
function applyCouponCode() {
    const codeInput = document.getElementById("couponInput").value.trim().toUpperCase();
    const msgBox = document.getElementById("couponMessage");

    if (!codeInput) {
        msgBox.className = "coupon-msg error";
        msgBox.innerText = "Please enter a coupon code.";
        return;
    }

    const subtotal = selectedUnitPrice * quantity;
    const coupon = couponList.find(c => c.code === codeInput && c.active);

    if (!coupon) {
        msgBox.className = "coupon-msg error";
        msgBox.innerText = "❌ Invalid or expired coupon code.";
        appliedCoupon = null;
    } else if (subtotal < coupon.minOrder) {
        msgBox.className = "coupon-msg error";
        msgBox.innerText = `❌ Minimum order total of ৳${coupon.minOrder} required.`;
        appliedCoupon = null;
    } else {
        appliedCoupon = coupon;
        msgBox.className = "coupon-msg success";
        msgBox.innerText = "🎉 Coupon applied successfully!";
    }

    updateOrderSummary();
}

// Calculate & Update Order Summary
function updateOrderSummary() {
    const subtotal = selectedUnitPrice * quantity;
    
    // Free Delivery Threshold (>= 1999)
    let finalDeliveryFee = deliveryCharge;
    const banner = document.getElementById("free-delivery-banner");

    if (subtotal >= 1999) {
        finalDeliveryFee = 0;
        if (banner) {
            banner.className = "free-delivery-banner qualified";
            banner.innerHTML = "🎉 You qualify for <strong>FREE DELIVERY</strong>!";
        }
    } else {
        const remaining = 1999 - subtotal;
        if (banner) {
            banner.className = "free-delivery-banner unqualified";
            banner.innerHTML = `💡 Add <strong>৳${remaining}</strong> more for <strong>FREE DELIVERY</strong>!`;
        }
    }

    // Calculate Coupon Discount
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === "percent") {
            discount = Math.round((subtotal * appliedCoupon.value) / 100);
        } else {
            discount = Math.min(appliedCoupon.value, subtotal);
        }
    }

    const grandTotal = Math.max(0, subtotal + finalDeliveryFee - discount);

    // Update DOM Elements
    const unitPriceElem = document.getElementById("sumUnitPrice");
    const qtyElem = document.getElementById("sumQty");
    const subtotalElem = document.getElementById("sumSubtotal");
    const deliveryElem = document.getElementById("sumDelivery");
    const discountLine = document.getElementById("discountLine");
    const discountElem = document.getElementById("sumDiscount");
    const grandTotalElem = document.getElementById("sumGrandTotal");

    if (unitPriceElem) unitPriceElem.innerText = `৳${selectedUnitPrice}`;
    if (qtyElem) qtyElem.innerText = quantity;
    if (subtotalElem) subtotalElem.innerText = `৳${subtotal}`;
    if (deliveryElem) deliveryElem.innerText = finalDeliveryFee === 0 ? "FREE" : `৳${finalDeliveryFee}`;

    if (discount > 0) {
        if (discountLine) discountLine.style.display = "flex";
        if (discountElem) discountElem.innerText = `-৳${discount}`;
    } else {
        if (discountLine) discountLine.style.display = "none";
    }

    if (grandTotalElem) grandTotalElem.innerText = `৳${grandTotal}`;
}

// Process Order Submission
async function processOrderSubmission() {
    if (!selectedProductName) {
        alert("Please select a product first.");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !phone || !address) {
        alert("Please fill in all required fields (Name, Phone Number, and Address).");
        return;
    }

    if (!/^01[3-9][0-9]{8}$/.test(phone)) {
        alert("Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).");
        return;
    }

    const submitBtn = document.getElementById("submitOrderBtn");
    if (!submitBtn) return;

    // Prevent duplicate submission
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Processing Order...";

    const subtotal = selectedUnitPrice * quantity;
    const finalDeliveryCharge = subtotal >= 1999 ? 0 : deliveryCharge;
    let discount = 0;
    if (appliedCoupon) {
        discount = appliedCoupon.type === "percent" 
            ? Math.round((subtotal * appliedCoupon.value) / 100) 
            : Math.min(appliedCoupon.value, subtotal);
    }
    const grandTotal = Math.max(0, subtotal + finalDeliveryCharge - discount);

    // Collision-safe Order ID: ZQ- + 6 Random Digits
    const orderId = "ZQ-" + Math.floor(100000 + Math.random() * 900000);

    const orderPayload = {
        order_id: orderId,
        product_name: selectedProductName,
        product_image: selectedProductImage,
        unit_price: selectedUnitPrice,
        quantity: quantity,
        subtotal: subtotal,
        delivery_zone: selectedZone,
        delivery_charge: finalDeliveryCharge,
        coupon_code: appliedCoupon ? appliedCoupon.code : "NONE",
        discount: discount,
        grand_total: grandTotal,
        customer_name: name,
        phone: phone,
        email: email || null,
        address: address,
        payment_method: selectedPaymentMethod,
        order_status: "Pending",
        payment_status: "Unpaid"
    };

    // Fire Analytics InitiateCheckout
    if (typeof fbq === 'function') {
        fbq('track', 'InitiateCheckout', {
            value: grandTotal,
            currency: 'BDT',
            content_name: selectedProductName
        });
    }

    try {
        if (!supabaseClient) {
            throw new Error("Supabase client is not initialized. Check your credentials.");
        }

        // Save Order to Supabase Database
        const { data, error } = await supabaseClient
            .from("orders")
            .insert([orderPayload])
            .select();

        if (error) {
            throw error;
        }

        // Fire Purchase Event ONLY after successful insert
        if (typeof fbq === 'function') {
            fbq('track', 'Purchase', {
                value: grandTotal,
                currency: 'BDT',
                content_name: selectedProductName
            });
        }
        if (typeof gtag === 'function') {
            gtag('event', 'purchase', {
                transaction_id: orderId,
                value: grandTotal,
                currency: 'BDT',
                items: [{ item_name: selectedProductName, price: selectedUnitPrice, quantity: quantity }]
            });
        }

        // Render Success UI
        document.getElementById("checkout-card").style.display = "none";
        document.getElementById("createdOrderId").innerText = orderId;
        document.getElementById("orderSuccessCard").style.display = "block";
        document.getElementById("orderForm").reset();

    } catch (err) {
        console.error("Order process error:", err);
        alert("Unable to place your order right now. Please try again.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    }
}

// Track Order Status
async function trackOrderSubmit() {
    const orderIdInput = document.getElementById("trackOrderIdInput").value.trim().toUpperCase();
    const resultCard = document.getElementById("trackResultCard");

    if (!orderIdInput) {
        alert("Please enter a valid Order ID (e.g. ZQ-123456).");
        return;
    }

    resultCard.style.display = "block";
    resultCard.innerHTML = "<p>Searching order status...</p>";

    try {
        if (!supabaseClient) throw new Error("Supabase is not initialized.");

        const { data, error } = await supabaseClient
            .from("orders")
            .select("*")
            .eq("order_id", orderIdInput)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            const statusClass = (data.order_status || 'pending').toLowerCase();
            resultCard.innerHTML = `
                <div style="text-align: left;">
                    <h3>Order Status: <span class="status-badge ${statusClass}">${data.order_status || 'Pending'}</span></h3>
                    <p style="margin-top:10px;"><strong>Order ID:</strong> ${data.order_id}</p>
                    <p><strong>Customer Name:</strong> ${data.customer_name}</p>
                    <p><strong>Product:</strong> ${data.product_name} (x${data.quantity})</p>
                    <p><strong>Payment Method:</strong> ${data.payment_method}</p>
                    <p><strong>Payment Status:</strong> ${data.payment_status || 'Unpaid'}</p>
                    <p><strong>Grand Total:</strong> ৳${data.grand_total}</p>
                </div>
            `;
        } else {
            resultCard.innerHTML = `<p style="color:var(--error); font-weight:700;">❌ Order ID not found. Please check and try again.</p>`;
        }
    } catch (err) {
        console.error("Track order error:", err);
        resultCard.innerHTML = "<p style='color:var(--error); font-weight:700;'>Unable to fetch status. Please try again later.</p>";
    }
}

// Admin Dashboard Functions
function openAdminModal() {
    document.getElementById("adminModal").style.display = "flex";
    fetchAdminOrders();
}

async function fetchAdminOrders() {
    const tbody = document.getElementById("adminOrdersTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:30px;">Loading orders...</td></tr>`;

    try {
        if (!supabaseClient) throw new Error("Supabase client is not initialized.");

        const { data, error } = await supabaseClient
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allAdminOrders = data || [];
        renderAdminOrdersTable(allAdminOrders);

    } catch (err) {
        console.error("Admin fetch error:", err);
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:var(--error); padding:20px;">Failed to load orders: ${err.message}</td></tr>`;
    }
}

function renderAdminOrdersTable(orders) {
    const tbody = document.getElementById("adminOrdersTableBody");
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:30px;">No orders found.</td></tr>`;
        return;
    }

    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

    tbody.innerHTML = orders.map(o => {
        const orderDate = o.created_at ? new Date(o.created_at).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        }) : "N/A";

        const optionsHtml = statuses.map(s => 
            `<option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>`
        ).join("");

        const statusClass = (o.order_status || 'Pending').toLowerCase();

        return `
            <tr>
                <td><strong>${o.order_id}</strong></td>
                <td style="font-size:12px; white-space:nowrap;">${orderDate}</td>
                <td>${o.customer_name || 'N/A'}</td>
                <td><a href="tel:${o.phone}" style="color:var(--primary); font-weight:700;">${o.phone || 'N/A'}</a></td>
                <td>${o.product_name}</td>
                <td>${o.quantity}</td>
                <td>৳${o.subtotal}</td>
                <td>৳${o.delivery_charge}</td>
                <td>৳${o.discount}</td>
                <td><strong>৳${o.grand_total}</strong></td>
                <td><small>${o.payment_method}</small></td>
                <td>
                    <select class="admin-status-select ${statusClass}" onchange="updateOrderStatus('${o.order_id}', this.value, this)">
                        ${optionsHtml}
                    </select>
                </td>
            </tr>
        `;
    }).join("");
}

async function updateOrderStatus(orderId, newStatus, selectElem) {
    try {
        if (!supabaseClient) throw new Error("Supabase client is not initialized.");

        const { error } = await supabaseClient
            .from("orders")
            .update({ order_status: newStatus })
            .eq("order_id", orderId);

        if (error) throw error;

        // Update cached array
        const target = allAdminOrders.find(o => o.order_id === orderId);
        if (target) target.order_status = newStatus;

        if (selectElem) {
            selectElem.className = `admin-status-select ${newStatus.toLowerCase()}`;
        }

    } catch (err) {
        console.error("Update status error:", err);
        alert("Failed to update status in Supabase. Please try again.");
    }
}

function filterAdminOrders() {
    const searchVal = document.getElementById("adminSearchInput").value.trim().toLowerCase();
    
    if (!searchVal) {
        renderAdminOrdersTable(allAdminOrders);
        return;
    }

    const filtered = allAdminOrders.filter(o => 
        (o.order_id && o.order_id.toLowerCase().includes(searchVal)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(searchVal)) ||
        (o.phone && o.phone.toLowerCase().includes(searchVal))
    );

    renderAdminOrdersTable(filtered);
}

// Tabs, FAQ & UI Helpers
function switchTab(btn, contentClass) {
    const parent = btn.closest(".product-info");
    if (!parent) return;

    parent.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    parent.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    const content = parent.querySelector(`.${contentClass}`);
    if (content) content.classList.add("active");
}

function toggleFaq(btn) {
    const item = btn.parentElement;
    if (item) item.classList.toggle("active");
}

function resetOrderForm() {
    const successCard = document.getElementById("orderSuccessCard");
    const checkoutCard = document.getElementById("checkout-card");
    if (successCard) successCard.style.display = "none";
    if (checkoutCard) checkoutCard.style.display = "none";
    selectedProductName = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Modal Controllers
function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "flex";
}

function openAccountModal(tab = 'profile') {
    const modal = document.getElementById("accountModal");
    if (modal) modal.style.display = "flex";
    switchDashTab(tab);
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function switchAuthView(view) {
    const loginView = document.getElementById("loginView");
    const signupView = document.getElementById("signupView");
    const forgotView = document.getElementById("forgotView");

    if (loginView) loginView.style.display = view === "login" ? "block" : "none";
    if (signupView) signupView.style.display = view === "signup" ? "block" : "none";
    if (forgotView) forgotView.style.display = view === "forgot" ? "block" : "none";
}

async function handleAuthSubmit(type) {
    if (!window.zelviqoAuth) return;
    if (type === "login") {
        await window.zelviqoAuth.loginUser(
            document.getElementById("loginEmail").value,
            document.getElementById("loginPassword").value
        );
    } else if (type === "signup") {
        await window.zelviqoAuth.registerUser(
            document.getElementById("signupName").value,
            document.getElementById("signupEmail").value,
            document.getElementById("signupPassword").value,
            document.getElementById("signupPhone").value
        );
    } else if (type === "forgot") {
        await window.zelviqoAuth.resetPassword(document.getElementById("forgotEmail").value);
    }
}

async function switchDashTab(tab) {
    const profileTabBtn = document.getElementById("tabBtnProfile");
    const historyTabBtn = document.getElementById("tabBtnHistory");
    const profileTab = document.getElementById("dashProfileTab");
    const historyTab = document.getElementById("dashHistoryTab");

    if (profileTabBtn) profileTabBtn.classList.toggle("active", tab === "profile");
    if (historyTabBtn) historyTabBtn.classList.toggle("active", tab === "history");

    if (profileTab) profileTab.style.display = tab === "profile" ? "block" : "none";
    if (historyTab) historyTab.style.display = tab === "history" ? "block" : "none";

    if (tab === "history") {
        const historyBox = document.getElementById("orderHistoryContainer");
        if (!historyBox) return;

        historyBox.innerHTML = "<p>Loading your orders...</p>";

        const phone = document.getElementById("accPhone")?.value.trim() || "";

        if (!phone) {
            historyBox.innerHTML = "<p>Please add your phone number in Profile to view order history.</p>";
            return;
        }

        try {
            if (!supabaseClient) throw new Error("Supabase client is not initialized.");

            const { data, error } = await supabaseClient
                .from("orders")
                .select("*")
                .eq("phone", phone)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                historyBox.innerHTML = "<p>No order history found for this phone number.</p>";
            } else {
                historyBox.innerHTML = data.map(o => `
                    <div class="history-item">
                        <div><strong>${o.order_id}</strong> — ${o.product_name} (x${o.quantity})</div>
                        <div>Total: <strong>৳${o.grand_total}</strong> | Status: <span class="status-badge ${(o.order_status || 'pending').toLowerCase()}">${o.order_status || 'Pending'}</span></div>
                    </div>
                `).join("");
            }
        } catch (err) {
            historyBox.innerHTML = "<p>Unable to load order history.</p>";
        }
    }
}
