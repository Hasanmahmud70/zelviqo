// ZELVIQO Luxury Skincare Order System
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx62WkXdibA0NPmnUZVEaUORzIglzMARf3sYMEXXKfQdsAeIXFPfJni6R5u9nnRPmLSSA/exec";

// Global State
let selectedProduct = "";
let selectedPrice = "";
let unitPriceNum = 0;
let currentQuantity = 1;
let currencySymbol = "৳";
let deliveryLocation = "dhaka"; // 'dhaka' or 'outside'
let appliedCouponCode = "";
let discountAmount = 0;

// Configurable Coupon Codes Table
const VALID_COUPONS = {
    "ZELVIQO10": { type: "percent", value: 10 },  // 10% Off
    "WELCOME100": { type: "flat", value: 100 },   // ৳100 Off
    "SAVE15": { type: "percent", value: 15 }      // 15% Off
};

// Select Product Handler
function selectProduct(productName, productPrice) {
    selectedProduct = productName;
    selectedPrice = productPrice;
    currentQuantity = 1;

    // Extract price number
    unitPriceNum = parseInt(productPrice.replace(/[^0-9]/g, ''), 10) || 0;
    currencySymbol = productPrice.replace(/[0-9]/g, '').trim() || "৳";

    // Reset Coupons on new product selection
    appliedCouponCode = "";
    discountAmount = 0;
    const couponMsg = document.getElementById("coupon-message");
    if (couponMsg) { couponMsg.innerText = ""; couponMsg.className = "coupon-msg"; }
    const couponInput = document.getElementById("couponCode");
    if (couponInput) { couponInput.value = ""; }

    // Update Product Header
    const displayElement = document.getElementById("selected-product-display");
    if (displayElement) {
        displayElement.innerText = "Selected Product: " + selectedProduct + " (" + selectedPrice + ")";
    }

    // Show Checkout Card
    const checkoutCard = document.getElementById("checkout-card");
    if (checkoutCard) {
        checkoutCard.style.display = "block";
    }

    // Reset quantity field
    const qtyInput = document.getElementById("quantity");
    if (qtyInput) {
        qtyInput.value = currentQuantity;
    }

    // Hide previous status card
    const statusElement = document.getElementById("order-status");
    if (statusElement) {
        statusElement.style.display = "none";
    }

    updateOrderSummary();

    // Smooth Scroll to Order Form
    const orderSection = document.getElementById("order");
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: "smooth" });
    }
}

// Change Quantity Handler
function changeQuantity(change) {
    currentQuantity += change;
    if (currentQuantity < 1) {
        currentQuantity = 1;
    }

    const qtyInput = document.getElementById("quantity");
    if (qtyInput) {
        qtyInput.value = currentQuantity;
    }

    // Recalculate discount if coupon is percent based
    if (appliedCouponCode && VALID_COUPONS[appliedCouponCode]) {
        calculateDiscount();
    }

    updateOrderSummary();
}

// Delivery Location Handler
function setDeliveryLocation(location) {
    deliveryLocation = location;
    
    // Toggle active state classes
    const optDhaka = document.getElementById("opt-dhaka");
    const optOutside = document.getElementById("opt-outside");
    
    if (location === "dhaka") {
        optDhaka.classList.add("active");
        optOutside.classList.remove("active");
    } else {
        optOutside.classList.add("active");
        optDhaka.classList.remove("active");
    }

    updateOrderSummary();
}

// Apply Coupon Handler
function applyCoupon() {
    const couponInput = document.getElementById("couponCode");
    const couponMsg = document.getElementById("coupon-message");
    if (!couponInput || !couponMsg) return;

    const enteredCode = couponInput.value.trim().toUpperCase();

    if (!enteredCode) {
        couponMsg.innerText = "Please enter a coupon code.";
        couponMsg.className = "coupon-msg error";
        return;
    }

    if (VALID_COUPONS[enteredCode]) {
        appliedCouponCode = enteredCode;
        calculateDiscount();
        couponMsg.innerText = "🎉 Coupon applied successfully!";
        couponMsg.className = "coupon-msg success";
    } else {
        appliedCouponCode = "";
        discountAmount = 0;
        couponMsg.innerText = "❌ Invalid coupon code.";
        couponMsg.className = "coupon-msg error";
    }

    updateOrderSummary();
}

// Calculate Coupon Discount
function calculateDiscount() {
    if (!appliedCouponCode || !VALID_COUPONS[appliedCouponCode]) {
        discountAmount = 0;
        return;
    }

    const productTotal = unitPriceNum * currentQuantity;
    const rule = VALID_COUPONS[appliedCouponCode];

    if (rule.type === "percent") {
        discountAmount = Math.round((productTotal * rule.value) / 100);
    } else if (rule.type === "flat") {
        discountAmount = Math.min(rule.value, productTotal);
    }
}

// Core Calculations & UI Sync
function updateOrderSummary() {
    const productTotal = unitPriceNum * currentQuantity;
    
    // Free Delivery Check (Product total >= 1999)
    let deliveryCharge = 0;
    const freeDeliveryBanner = document.getElementById("free-delivery-banner");

    if (productTotal >= 1999) {
        deliveryCharge = 0;
        if (freeDeliveryBanner) {
            freeDeliveryBanner.className = "free-delivery-banner qualified";
            freeDeliveryBanner.innerHTML = "🎉 <strong>CONGRATULATIONS!</strong> You qualify for <strong>FREE DELIVERY</strong>!";
        }
    } else {
        deliveryCharge = (deliveryLocation === "outside") ? 120 : 60;
        const remaining = 1999 - productTotal;
        if (freeDeliveryBanner) {
            freeDeliveryBanner.className = "free-delivery-banner unqualified";
            freeDeliveryBanner.innerHTML = `💡 Add <strong>${currencySymbol}${remaining}</strong> more to get <strong>FREE DELIVERY</strong>!`;
        }
    }

    const grandTotal = Math.max(0, (productTotal + deliveryCharge) - discountAmount);

    // Update DOM Text
    document.getElementById("summary-unit-price").innerText = currencySymbol + unitPriceNum;
    document.getElementById("summary-qty").innerText = currentQuantity;
    document.getElementById("summary-product-total").innerText = currencySymbol + productTotal;
    
    const deliveryChargeText = (deliveryCharge === 0) ? "FREE" : (currencySymbol + deliveryCharge);
    document.getElementById("summary-delivery-charge").innerText = deliveryChargeText;

    // Discount Row Visibility
    const discountRow = document.getElementById("discount-summary-row");
    if (discountAmount > 0) {
        discountRow.style.display = "flex";
        document.getElementById("summary-discount").innerText = "-" + currencySymbol + discountAmount;
    } else {
        discountRow.style.display = "none";
    }

    document.getElementById("summary-grand-total").innerText = currencySymbol + grandTotal;
}

// Auto Order ID Generator (e.g. ZQ-1025)
function generateOrderId() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return "ZQ-" + randomNum;
}

// FAQ Accordion Toggle
function toggleFaq(buttonElement) {
    const faqItem = buttonElement.parentElement;
    faqItem.classList.toggle("active");
}

// Submit Order Function
function submitOrder() {
    if (!selectedProduct) {
        alert("Please select a product first.");
        return;
    }

    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const addressInput = document.getElementById("address");
    const submitBtn = document.getElementById("submitBtn");
    const statusElement = document.getElementById("order-status");
    const checkoutCard = document.getElementById("checkout-card");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    if (name === "" || phone === "" || address === "") {
        alert("Please fill in all shipping details.");
        return;
    }

    const productTotal = unitPriceNum * currentQuantity;
    const deliveryCharge = (productTotal >= 1999) ? 0 : ((deliveryLocation === "outside") ? 120 : 60);
    const grandTotal = Math.max(0, (productTotal + deliveryCharge) - discountAmount);
    const orderId = generateOrderId();
    const deliveryTypeLabel = (deliveryLocation === "outside") ? "Outside Dhaka" : "Inside Dhaka";

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing Order...";

    const payload = {
        orderId: orderId,
        productName: selectedProduct,
        unitPrice: unitPriceNum,
        quantity: currentQuantity,
        productTotal: productTotal,
        deliveryType: deliveryTypeLabel,
        deliveryCharge: deliveryCharge,
        couponCode: appliedCouponCode || "NONE",
        discount: discountAmount,
        grandTotal: grandTotal,
        customerName: name,
        phone: phone,
        address: address
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === "success" || data.result === "Success") {
            // Hide form and display success card
            if (checkoutCard) checkoutCard.style.display = "none";
            
            statusElement.innerHTML = `
                <div class="status-icon">✅</div>
                <h3>Thank You!</h3>
                <p>Your order has been placed successfully.</p>
                <div class="order-id-badge">Order ID: <strong>${orderId}</strong></div>
                <p style="color:#555; font-size:14px;">We will contact you soon to confirm your delivery.</p>
            `;
            statusElement.style.display = "block";

            // Reset Form and State
            document.getElementById("orderForm").reset();
            selectedProduct = "";
            selectedPrice = "";
            currentQuantity = 1;
            unitPriceNum = 0;
            appliedCouponCode = "";
            discountAmount = 0;
            document.getElementById("selected-product-display").innerText = "";
        } else {
            alert("Order failed to submit. Please try again or contact us via WhatsApp.");
        }
    })
    .catch(error => {
        console.error("Submission Error:", error);
        alert("An error occurred while submitting your order. Please check your internet connection.");
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = "Confirm Order (Cash on Delivery)";
    });
}
