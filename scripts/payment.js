
const originalAmount = 39900;

const urlParams = new URLSearchParams(window.location.search);
const selectedTemplate = urlParams.get("template");

const BASE_URL = "https://celebratewithus.onrender.com";
  let finalAmount = 39900;
  let usedCoupon = null;
let appliedCoupon = "";
let appliedDiscount = 0;

document.addEventListener("DOMContentLoaded", () => {

  console.log("TEMPLATE:", localStorage.getItem("selectedTemplate"));
  console.log("Razorpay loaded:", typeof Razorpay);

  const payBtn = document.getElementById("rzpButton");

  if (payBtn) {
    payBtn.addEventListener("click", openCheckout);
  }

});
const projectId = "proj_" + Date.now();

  
  async function openCheckout() {

    const selectedTemplate = localStorage.getItem("selectedTemplate");

    if (!selectedTemplate) {
      console.error("No template selected");
      return;
    }

    const template = selectedTemplate.toLowerCase().trim();

    try {
      const res = await fetch(`${BASE_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountINR: finalAmount / 100,
          notes: { templateId: selectedTemplate }
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


      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Celebratewithus",
        description: "Template Purchase ₹399",

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

  // ✅ ADD THESE
  name: "Guest",
  email: "guest@email.com",
  template: selectedTemplate
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

           localStorage.setItem("nextCoupon", result.nextCoupon);

           localStorage.setItem("invoicePath", result.invoice);

            // ✅ OPEN BACKEND INVOICE (BEST)
            if (result.invoice) {
              window.open(BASE_URL + result.invoice, "_blank");
            }

            setTimeout(() => {
              window.location.href = result.editLink;
            }, 1500);

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

  // OPTIONAL: Coupon function
  

  window.selectVibe = function(vibe){
    localStorage.setItem("selectedTemplate", vibe);
  };



window.applyCoupon = async function () {
    const code = document.getElementById("coupon").value;

    const res = await fetch(`${BASE_URL}/apply-coupon`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.valid) {
      usedCoupon = code;

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
