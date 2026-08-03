// ZELVIQO Luxury Skincare
let selectedProduct = "";
let selectedPrice = "";

function selectProduct(productName, productPrice) {
    selectedProduct = productName;
    selectedPrice = productPrice;

    const displayElement = document.getElementById("selected-product-display");
    if (displayElement) {
        displayElement.innerText = "Selected Product: " + selectedProduct + " (" + selectedPrice + ")";
    }

    const orderSection = document.querySelector(".order");
    if (orderSection) {
        orderSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}

function sendWhatsApp() {
    if (!selectedProduct) {
        alert("Please select a product first.");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();

    if (name === "" || phone === "" || address === "") {
        alert("Please fill all fields.");
        return;
    }

    const text = `🛍️ New Order\n\n📦 Product: ${selectedProduct}\n💰 Price: ${selectedPrice}\n👤 Customer Name: ${name}\n📞 Phone: ${phone}\n📍 Address: ${address}`;

    const whatsappURL = "https://wa.me/8801860821074?text=" + encodeURIComponent(text);
    window.open(whatsappURL, "_blank");
}
