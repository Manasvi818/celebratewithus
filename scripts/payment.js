const originalAmount = 19900;

// ✅ Get template from URL (ONLY source of truth)
const urlParams = new URLSearchParams(window.location.search);
const selectedTemplate = urlParams.get("template");

const BASE_URL = "https://celebratewithus-ebr0.onrender.com";

let finalAmount = 19900;
let appliedCoupon = "";
let appliedDiscount = 0;



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
  key_id: data.keyId,
  amount: data.amount,
  currency: data.currency,
  order_id: data.orderId,
  name: "Celebratewithus",
  description: "Template Purchase ₹199",

  handler: async function (response) {

    const template = selectedTemplate;
    const projectId = "proj_" + Date.now();

    const invoiceRes = await fetch(`${BASE_URL}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        projectId,
        template,
        amount: finalAmount / 100,
        coupon: appliedCoupon || "",
        discount: appliedDiscount || 0,
        name: "Guest",
        email: "guest@email.com"
      })
    });

    const result = await invoiceRes.json();

    if (!result.success) {
      alert("Verification failed");
      return;
    }

    localStorage.setItem("projectId", projectId);
    localStorage.setItem("selectedTemplate", template);
    localStorage.setItem("invoicePath", result.invoice || "");

    if (result.invoice) {
      window.open(BASE_URL + result.invoice, "_blank");
    }

    window.location.href = `templates/${template}/editor.html`;
  },

  modal: {
    ondismiss: function () {
      alert("Payment popup closed.");
    }
  }
};

// ✅ BUTTON UI
const btn = document.getElementById("rzpButton");

btn.innerText = "Processing...";
btn.style.opacity = "0.7";
btn.disabled = true;

// ✅ OPEN RAZORPAY
const rzp = new Razorpay(options);
rzp.open();

// ✅ PAYMENT FAILED HANDLER (OUTSIDE options)
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