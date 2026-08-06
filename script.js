// ================================================================
// ZELVIQO LUXURY SKINCARE - MAIN CONTROLLER & STATE MANAGER
// ================================================================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxJHhOKaySODvfnXdKQXMFEDFaUaGHEVx9kUU-zEQ98kK6F6HUHtGaeXRfaCYQ2m44s/exec";

// Application State
let selectedProductName = "";
let selectedUnitPrice = 0;
let quantity = 1;
let selectedZone = "Inside Dhaka";
let deliveryCharge = 60;
let appliedCoupon = null;
let couponsList = [];

// Initialize Page Data
document.addEventListener("DOMContentLoaded", () => {
    fetchCouponsFromBackend();
});

// Fetch Live Coupons from Google Apps Script
async function fetchCouponsFromBackend() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getCoupons`);
        const data = await response.json();
        if (data.result === "success" && Array.isArray(data.coupons)) {
            couponsList = data.coupons;
        }
    } catch (err) {
        console.warn("Using offline fallback coupons due to network:", err);
        couponsList = [
            { code: "ZELVIQO10", type: "percent", value: 10, minOrder: 500, active: true },
            { code: "WELCOME100", type: "flat", value: 100, minOrder: 1000, active: true }
        ];
    }
}

// Select Product Handler
function selectProduct(productName, price) {
    selectedProductName = productName;
    selectedUnitPrice = price;
    quantity = 1;
    appliedCoupon = null;

    document.getElementById("selected-product-title").innerText = `Selected Product: ${selectedProductName} (৳${selectedUnitPrice})`;
    document.getElementById("checkout-card").style.display = "block";
    document.getElementById("orderSuccessCard").style.display = "none";
    document.getElementById("quantity").value = quantity;
    document.getElementById("couponInput").value = "";
    document.getElementById("couponMessage").innerText = "";

    updateOrderSummary();

    const checkoutElem = document.getElementById("order");
    if (checkoutElem) checkoutElem.scrollIntoView({ behavior: "smooth" });
}

// Adjust Quantity
function adjustQuantity(delta) {
    quantity = Math.max(1, quantity + delta);
    document.getElementById("quantity").value = quantity;
    updateOrderSummary();
}

// Select Delivery Zone
function selectZone(zoneName, charge) {
    selectedZone = zoneName;
    deliveryCharge = charge;

    document.getElementById("zone-dhaka").classList.toggle("active", zoneName === "Inside Dhaka");
    document.getElementById("zone-outside").classList.toggle("active", zoneName === "Outside Dhaka");

    updateOrderSummary();
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
    const coupon = couponsList.find(c => c.code === codeInput && c.active);

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
        banner.className = "free-delivery-banner qualified";
        banner.innerHTML = "🎉 You qualify for <strong>FREE DELIVERY</strong>!";
    } else {
        const remaining = 1999 - subtotal;
        banner.className = "free-delivery-banner unqualified";
        banner.innerHTML = `💡 Add <strong>৳${remaining}</strong> more for <strong>FREE DELIVERY</strong>!`;
    }

    // Calculate Discount
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === "percent") {
            discount = Math.round((subtotal * appliedCoupon.value) / 100);
        } else {
            discount = Math.min(appliedCoupon.value, subtotal);
        }
    }

    const grandTotal = Math.max(0, subtotal + finalDeliveryFee - discount);

    // Update DOM
    document.getElementById("sumUnitPrice").innerText = `৳${selectedUnitPrice}`;
    document.getElementById("sumQty").innerText = quantity;
    document.getElementById("sumSubtotal").innerText = `৳${subtotal}`;
    document.getElementById("sumDelivery").innerText = finalDeliveryFee === 0 ? "FREE" : `৳${finalDeliveryFee}`;

    const discountLine = document.getElementById("discountLine");
    if (discount > 0) {
        discountLine.style.display = "flex";
        document.getElementById("sumDiscount").innerText = `-৳${discount}`;
    } else {
        discountLine.style.display = "none";
    }

    document.getElementById("sumGrandTotal").innerText = `৳${grandTotal}`;
}

// Process Order Submission
async function processOrderSubmission() {
    if (!selectedProductName) {
        alert("Please select a product first.");
        return;
    }

    const submitBtn = document.getElementById("submitOrderBtn");
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing Order...";

    const subtotal = selectedUnitPrice * quantity;
    const finalDeliveryCharge = subtotal >= 1999 ? 0 : deliveryCharge;
    let discount = 0;
    if (appliedCoupon) {
        discount = appliedCoupon.type === "percent" ? Math.round((subtotal * appliedCoupon.value) / 100) : Math.min(appliedCoupon.value, subtotal);
    }
    const grandTotal = Math.max(0, subtotal + finalDeliveryCharge - discount);
    const orderId = "ZQ-" + Math.floor(100000 + Math.random() * 900000);

    const payload = {
        action: "createOrder",
        orderId: orderId,
        productName: selectedProductName,
        unitPrice: selectedUnitPrice,
        quantity: quantity,
        productTotal: subtotal,
        deliveryZone: selectedZone,
        deliveryCharge: finalDeliveryCharge,
        couponCode: appliedCoupon ? appliedCoupon.code : "NONE",
        discount: discount,
        grandTotal: grandTotal,
        customerName: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        address: document.getElementById("address").value.trim(),
        paymentMethod: "Cash on Delivery"
    };

    try {
        // 1. Submit to Google Sheets API
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.result === "success") {
            // 2. Save Order to Firebase Firestore
            if (window.zelviqoAuth) {
                await window.zelviqoAuth.saveOrderToFirestore(payload);
            }

            // Render Success UI
            document.getElementById("checkout-card").style.display = "none";
            document.getElementById("createdOrderId").innerText = orderId;
            document.getElementById("orderSuccessCard").style.display = "block";
            document.getElementById("orderForm").reset();
            // Meta Purchase Event
if (typeof fbq === "function") {
    fbq('track', 'Purchase', {
        value: grandTotal,
        currency: 'BDT'
    });
}
        } else {
            alert("Order submission failed. Please try again or order via WhatsApp.");
        }
    } catch (err) {
        console.error("Order Submission Error:", err);
        alert("An error occurred. Please check your connection.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Confirm Order (Cash on Delivery)";
    }
}

// Track Order Status
async function trackOrderSubmit() {
    const orderId = document.getElementById("trackOrderIdInput").value.trim();
    const resultCard = document.getElementById("trackResultCard");

    if (!orderId) {
        alert("Please enter a valid Order ID.");
        return;
    }

    resultCard.style.display = "block";
    resultCard.innerHTML = "<p>Searching order details...</p>";

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getOrderStatus&orderId=${encodeURIComponent(orderId)}`);
        const data = await response.json();

        if (data.result === "success" && data.order) {
            const o = data.order;
            resultCard.innerHTML = `
                <h3>Order Status: <span class="status-badge ${o.status.toLowerCase()}">${o.status}</span></h3>
                <p><strong>Order ID:</strong> ${o.orderId}</p>
                <p><strong>Product:</strong> ${o.productName} (x${o.quantity})</p>
                <p><strong>Grand Total:</strong> ৳${o.grandTotal}</p>
            `;
        } else {
            resultCard.innerHTML = `<p style="color:red;">❌ ${data.message || 'Order ID not found.'}</p>`;
        }
    } catch (err) {
        resultCard.innerHTML = "<p style='color:red;'>Failed to fetch status. Check your connection.</p>";
    }
}

// Tabs & UI Helpers
function switchTab(btn, contentClass) {
    const parent = btn.closest(".product-info");
    parent.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    parent.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    parent.querySelector(`.${contentClass}`).classList.add("active");
}

function toggleFaq(btn) {
    const item = btn.parentElement;
    item.classList.toggle("active");
}

function resetOrderForm() {
    document.getElementById("orderSuccessCard").style.display = "none";
    document.getElementById("checkout-card").style.display = "none";
    selectedProductName = "";
}

// Modals Controller
function openAuthModal() {
    document.getElementById("authModal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function switchAuthView(view) {
    document.getElementById("loginView").style.display = view === "login" ? "block" : "none";
    document.getElementById("signupView").style.display = view === "signup" ? "block" : "none";
    document.getElementById("forgotView").style.display = view === "forgot" ? "block" : "none";
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

async function openAccountModal(tab) {
    document.getElementById("accountModal").style.display = "flex";
    switchDashTab(tab);
}

async function switchDashTab(tab) {
    document.getElementById("tabBtnProfile").classList.toggle("active", tab === "profile");
    document.getElementById("tabBtnHistory").classList.toggle("active", tab === "history");

    document.getElementById("dashProfileTab").style.display = tab === "profile" ? "block" : "none";
    document.getElementById("dashHistoryTab").style.display = tab === "history" ? "block" : "none";

    if (tab === "history" && window.zelviqoAuth) {
        const historyBox = document.getElementById("orderHistoryContainer");
        const orders = await window.zelviqoAuth.fetchUserOrderHistory();
        
        if (orders.length === 0) {
            historyBox.innerHTML = "<p>No orders found under this account.</p>";
        } else {
            historyBox.innerHTML = orders.map(o => `
                <div class="history-item">
                    <strong>${o.orderId}</strong> - ${o.productName} (x${o.quantity}) | <strong>৳${o.grandTotal}</strong>
                </div>
            `).join("");
        }
    }
}

async function saveProfileChanges() {
    if (window.zelviqoAuth) {
        await window.zelviqoAuth.updateUserProfile(
            document.getElementById("accName").value,
            document.getElementById("accPhone").value,
            document.getElementById("accAddress").value
        );
    }
}
