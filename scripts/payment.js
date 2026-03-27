console.log("Razorpay loaded:", typeof Razorpay);
const payBtn = document.getElementById("rzpButton");
const BASE_URL = "https://celebratewithus.onrender.com";

if (payBtn) {
    payBtn.addEventListener("click", openCheckout);
}

const rzp = new Razorpay(options);

async function openCheckout() {
    try {
        const res = await fetch(`${BASE_URL}/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amountINR: 599,
                notes: {
                    templateId: localStorage.getItem("selectedTemplate") || "unknown"
                }
            }),
        });

        const data = await res.json();

        if (!data.success) {
            alert("Failed to create order");
            return;
        }

        const options = {
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    order_id: data.orderId,
    name: "Celebratewithus",
    description: "Template Purchase ₹599",

    handler: function (response) {
        verifyPayment(response);
    },

    theme: { color: "#6366F1" },

    
    // ✅ ADD HERE (inside options)
    modal: {
        ondismiss: function () {
            alert("Payment popup closed.");
        }
    }
};

        const rzp = new Razorpay(options);
        rzp.open();

        rzp.on("payment.failed", function () {
            alert("Payment failed — please try again.");
        });

    } catch (error) {
    console.error("ERROR:", error);
    alert("Something went wrong: " + error.message);
}
}

async function verifyPayment(response) {
    try {
        const res = await fetch(`${BASE_URL}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature
})
        });

        const data = await res.json();

        if (data.success) {
            alert("Payment Verified! 🎉");

            const templateId = localStorage.getItem("selectedTemplate");

            if (!templateId) {
                alert("No template selected.");
                return;
            }

            // ✅ Download trigger
            window.location.href = `${BASE_URL}/download?template=${templateId}`;

        } else {
            alert("Payment verification failed.");
        }

    } catch (err) {
        console.error(err);
        alert("Something went wrong verifying payment.");
    }
}