
console.log("Razorpay loaded:", typeof Razorpay);
const payBtn = document.getElementById("rzpButton");
const BASE_URL = "https://celebratewithus.onrender.com";
const selectedTemplate = localStorage.getItem("selectedTemplate");
let finalAmount = 14900; // ₹149 in paise
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
  description: "Template Purchase ₹149",

  handler: async function (response) {
    const res = await fetch("/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response)
    });

    const data = await res.json();

    if (data.success && data.editLink) {
      window.location.href = data.editLink;
    } else {
      alert("Something went wrong");
    }
  },

  modal: {
    ondismiss: function () {
      alert("Payment popup closed.");
    }
  }
};


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