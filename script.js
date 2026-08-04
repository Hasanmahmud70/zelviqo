// ZELVIQO Luxury Skincare
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz77vWvR2xZdYHTXsyofnP7wnbkKDM54JUTPg3nInGndjLEH4-0pmdcKHb5_0mNs-_1hQ/exec";

let selectedProduct = "";
let selectedPrice = "";

function selectProduct(productName, productPrice) {
    selectedProduct = productName;
    selectedPrice = productPrice;

    const displayElement = document.getElementById("selected-product-display");
    if (displayElement) {
        displayElement.innerText = "Selected Product: " + selectedProduct + " (" + selectedPrice + ")";
    }

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

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    const payload = {
        productName: selectedProduct,
        productPrice: selectedPrice,
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
            document.getElementById("selected-product-display").innerText = "";
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
