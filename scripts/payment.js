
document.addEventListener("DOMContentLoaded", () => {

  console.log("TEMPLATE:", localStorage.getItem("selectedTemplate"));
  console.log("Razorpay loaded:", typeof Razorpay);

  const BASE_URL = "https://celebratewithus.onrender.com";
  let finalAmount = 14900;
  let usedCoupon = null;
let appliedCoupon = "";
let appliedDiscount = 0;

const projectId = "proj_" + Date.now();

  const payBtn = document.getElementById("rzpButton");

  if (payBtn) {
    payBtn.addEventListener("click", openCheckout);
  }

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
        description: "Template Purchase ₹149",

       handler: async function (response) {

  const coupon = appliedCoupon || "No Coupon Applied";
  const discount = appliedDiscount || 0;
// ✅ SMALL CONDITION (ONLY FOR JOYFUL TIMES)
let finalTemplate = selectedTemplate;

if (
  selectedTemplate === "Joyful Family" ||
  selectedTemplate === "Joyful Times"
) {
  finalTemplate = "joyful-times";
}  else {
  // ✅ Fix ALL other templates automatically
  finalTemplate = selectedTemplate.toLowerCase().replace(/\s+/g, "-");
}
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
  amount: 149,

  // ✅ ADD THESE
  name: "Guest",
  email: "guest@email.com",
template: finalTemplate
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

  // OPTIONAL: Coupon function
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

      finalAmount = finalAmount - (finalAmount * data.discount / 100);

      appliedCoupon = code;
appliedDiscount = data.discount;

      document.getElementById("discountMsg").innerText =
        `Discount applied: ${data.discount}%`;

      
    } else {
      alert("Invalid or used coupon");
    }
  };

  window.selectVibe = function(vibe){
    localStorage.setItem("selectedTemplate", vibe);
  };

});
