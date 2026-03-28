
console.log("Razorpay loaded:", typeof Razorpay);
const payBtn = document.getElementById("rzpButton");
const BASE_URL = "https://celebratewithus.onrender.com";
const selectedTemplate = localStorage.getItem("selectedTemplate");
let finalAmount = 59900; // ₹599 in paise
let usedCoupon = null;

if (payBtn) {
    payBtn.addEventListener("click", openCheckout);
}


async function openCheckout() {
    try {
        const res = await fetch(`${BASE_URL}/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amountINR: finalAmount / 100,
                
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
  razorpay_signature: response.razorpay_signature,

  // ✅ ADD THESE
  name: localStorage.getItem("userName") || "Guest",
  email: localStorage.getItem("userEmail") || "guest@email.com",
  amount: 599,
  couponCode: localStorage.getItem("usedCoupon") || null,
   template: selectedTemplate   
})
        });

        const data = await res.json();

        if (data.success) {
    alert("Payment Verified! 🎉");

    // ✅ SAVE invoice + coupon
    localStorage.setItem("paymentData", JSON.stringify({
        invoice: data.invoice,
        coupon: data.coupon
    }));

    const templateId = localStorage.getItem("selectedTemplate");

    if (!templateId) {
        alert("No template selected.");
        return;
    }

    // ✅ Redirect to success page (NOT download directly)
    window.location.href = "success.html";
}
        else {
            alert("Payment verification failed.");
        }

    } catch (err) {
        console.error(err);
        alert("Something went wrong verifying payment.");
    }
}

async function applyCoupon() {
  const code = document.getElementById("coupon").value;

  const res = await fetch(`${BASE_URL}/apply-coupon`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ code })
  });

  const data = await res.json();

  if (data.valid) {
    usedCoupon = code;

    finalAmount = finalAmount - (finalAmount * data.discount / 100);

    document.getElementById("discountMsg").innerText =
      `Discount applied: ${data.discount}%`;

    localStorage.setItem("usedCoupon", code);
  } else {
    alert("Invalid or used coupon");
  }
}

function selectVibe(vibe) {
  localStorage.setItem("selectedTemplate", vibe);
}