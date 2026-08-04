// ZELVIQO Luxury Skincare
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyHHoRFbVOwRGEknpHJ49wMneEgop0MB3zF7T6oRVg3-PdACMjNZYs3FtiKz9MAz5dv/exec";

let selectedProduct = "";
let selectedPrice = "";
let unitPriceNum = 0;
let currentQuantity = 1;
let currencySymbol = "৳";

function selectProduct(productName, productPrice) {
    selectedProduct = productName;
    selectedPrice = productPrice;
    currentQuantity = 1;

    // Extract numerical value from price (e.g. "৳499" -> 499)
    unitPriceNum = parseInt(productPrice.replace(/[^0-9]/g, ''), 10) || 0;
    currencySymbol = productPrice.replace(/[0-9]/g, '').trim() || "৳";

    const displayElement = document.getElementById("selected-product-display");
    if (displayElement) {
        displayElement.innerText = "Selected Product: " + selectedProduct + " (" + selectedPrice + ")";
    }

    // Show quantity selector and reset value
    const quantityWrapper = document.getElementById("quantity-wrapper");
    if (quantityWrapper) {
        quantityWrapper.style.display = "flex";
    }

    const qtyInput = document.getElementById("quantity");
    if (qtyInput) {
        qtyInput.value = currentQuantity;
    }

    updateTotalPriceDisplay();

    const statusElement = document.getElementById("order-status");
    if (statusElement) {
        statusElement.style.display = "none";
    }

    const orderSection = document.querySelector(".order");
    if (orderSection) {
        orderSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}

function changeQuantity(change) {
    currentQuantity += change;
    if (currentQuantity < 1) {
        currentQuantity = 1;
    }

    const qtyInput = document.getElementById("quantity");
    if (qtyInput) {
        qtyInput.value = currentQuantity;
    }

    updateTotalPriceDisplay();
}

function updateTotalPriceDisplay() {
    const total = unitPriceNum * currentQuantity;
    const totalPriceDisplay = document.getElementById("total-price-display");
    if (totalPriceDisplay) {
        totalPriceDisplay.innerText = currencySymbol + total;
    }
}

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

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    if (name === "" || phone === "" || address === "") {
        alert("Please fill all fields.");
        return;
    }

    const totalPrice = currencySymbol + (unitPriceNum * currentQuantity);

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    const payload = {
        productName: selectedProduct,
        productPrice: selectedPrice,
        quantity: currentQuantity,
        totalPrice: totalPrice,
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
        if (data.result === "success") {
            // Show success message
            statusElement.innerText = "✅ Thank you! Your order has been received successfully.";
            statusElement.style.display = "block";

            // Clear the form automatically
            document.getElementById("orderForm").reset();
            selectedProduct = "";
            selectedPrice = "";
            currentQuantity = 1;
            unitPriceNum = 0;
            document.getElementById("selected-product-display").innerText = "";
            
            const quantityWrapper = document.getElementById("quantity-wrapper");
            if (quantityWrapper) {
                quantityWrapper.style.display = "none";
            }
        } else {
            alert("Order failed. Please try again.");
        }
    })
    .catch(error => {
        console.error("Submission Error:", error);
        alert("An error occurred while submitting your order. Please try again.");
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = "Confirm Order";
    });
}
