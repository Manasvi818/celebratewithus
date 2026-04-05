
document.addEventListener("DOMContentLoaded", () => {

  console.log("TEMPLATE:", localStorage.getItem("selectedTemplate"));
  console.log("Razorpay loaded:", typeof Razorpay);

  const BASE_URL = "https://celebratewithus.onrender.com";
  let finalAmount = 14900;
  let usedCoupon = null;

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

          const res = await fetch(`${BASE_URL}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              ...response,
              template: selectedTemplate
            })
          });

          const result = await res.json();

          if (result.success && result.editLink) {

            localStorage.setItem("usedCoupon", usedCoupon || "N/A");

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

      document.getElementById("discountMsg").innerText =
        `Discount applied: ${data.discount}%`;

      localStorage.setItem("usedCoupon", code);
    } else {
      alert("Invalid or used coupon");
    }
  };

  window.selectVibe = function(vibe){
    localStorage.setItem("selectedTemplate", vibe);
  };

});
