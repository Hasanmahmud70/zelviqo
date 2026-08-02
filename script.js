// ZELVIQO Luxury Skincare

console.log("Welcome to ZELVIQO");

document.addEventListener("DOMContentLoaded", function () {

    // সব Order Now বাটন
    const orderButtons = document.querySelectorAll(".card button");

    orderButtons.forEach(button => {
        button.addEventListener("click", function () {

            // Order Section এ নিয়ে যাবে
            document.querySelector(".order").scrollIntoView({
                behavior: "smooth"
            });

        });
    });

    // Form Submit
    const form = document.querySelector("form");

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        const name = form.querySelector("input[type='text']").value;
        const phone = form.querySelector("input[type='tel']").value;
        const address = form.querySelector("textarea").value;

        if (name === "" || phone === "" || address === "") {
            alert("Please fill all fields.");
            return;
        }

        alert(
            "Thank you " +
            name +
            "!\n\nYour order has been received successfully."
        );

        form.reset();

    });

});
