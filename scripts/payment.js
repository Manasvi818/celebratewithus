const originalAmount = 19900;

// ✅ Get template from URL (ONLY source of truth)
const urlParams = new URLSearchParams(window.location.search);
const selectedTemplate = urlParams.get("template");

const BASE_URL = "https://celebratewithus.onrender.com";

let finalAmount = 19900;
let appliedCoupon = "";
let appliedDiscount = 0;

const projectId = "proj_" + Date.now();

document.addEventListener("DOMContentLoaded", () => {

  console.log("TEMPLATE:", selectedTemplate);
  console.log("Razorpay loaded:", typeof Razorpay);

  const payBtn = document.getElementById("rzpButton");

  if (payBtn) {
    payBtn.addEventListener("click", openCheckout);
  }

});

// 🚀 MAIN PAYMENT FUNCTION
async function openCheckout() {

  if (!selectedTemplate) {
    alert("No template selected");
    return;
  }

  const template = selectedTemplate.toLowerCase().trim();

  try {

    // ✅ CREATE ORDER
    const res = await fetch(`${BASE_URL}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountINR: finalAmount / 100,
        template // ✅ FIXED (important)
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      alert("Server error");
      return;
    }

    if (!data.success) {
      alert("Failed to create order");
      return;
    }

    // 💳 RAZORPAY OPTIONS
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: "Celebratewithus",
      description: "Template Purchase ₹199",

      // ✅ PAYMENT SUCCESS HANDLER
      handler: async function (response) {

        const coupon = appliedCoupon || "No Coupon Applied";
        const discount = appliedDiscount || 0;

        const invoiceRes = await fetch(`${BASE_URL}/verify-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,

            projectId,
            coupon,
            discount,
            amount: finalAmount / 100,

            name: "Guest",
            email: "guest@email.com",

            template // ✅ FIXED (important)
          })
        });

        console.log("Invoice status:", invoiceRes.status);

        let result;

        try {
          result = await invoiceRes.json();
        } catch (e) {
          const text = await invoiceRes.text();
          console.error("NOT JSON RESPONSE:", text);
          alert("Server error: invoice API not working");
          return;
        }

        if (result.success && result.editLink) {

          // Optional storage
          localStorage.setItem("nextCoupon", result.nextCoupon);
          localStorage.setItem("invoicePath", result.invoice);

          // ✅ OPEN INVOICE
          if (result.invoice) {
            window.open(BASE_URL + result.invoice, "_blank");
          }

          // ✅ REDIRECT TO EDITOR
          window.location.href = result.editLink;

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

    // 🔘 BUTTON UI
    const btn = document.getElementById("rzpButton");

    btn.innerText = "Processing...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    const rzp = new Razorpay(options);
    rzp.open();

    rzp.on("payment.failed", function () {
      alert("Payment failed — please try again.");

      btn.innerText = "Pay Now";
      btn.style.opacity = "1";
      btn.disabled = false;
    });

  } catch (error) {
    console.error("ERROR:", error);
    alert("Something went wrong: " + error.message);
  }
}

// 🎟️ COUPON FUNCTION (unchanged logic)
window.applyCoupon = async function () {

  const code = document.getElementById("coupon").value;

  const res = await fetch(`${BASE_URL}/apply-coupon`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ code })
  });

  const data = await res.json();

  if (data.valid) {

    finalAmount = originalAmount - (originalAmount * data.discount / 100);

    appliedCoupon = code;
    appliedDiscount = data.discount;

    document.getElementById("discountMsg").innerText =
      `Discount applied: ${data.discount}%`;

    document.getElementById("priceDisplay").innerText =
      "₹" + (finalAmount / 100);

  } else {
    alert("Invalid or used coupon");
  }
};