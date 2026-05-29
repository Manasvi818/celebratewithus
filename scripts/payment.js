const BASE_URL = "https://celebratewithus-production.up.railway.app";

// ✅ Session-only flag — true only if coupon was applied THIS visit
let couponAppliedThisSession = false;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const template = params.get("template");

  console.log("TEMPLATE:", template);

  // ✅ Always show ₹199 on page load — never carry over old coupon
  const priceDisplay = document.getElementById("priceDisplay");
  if (priceDisplay) priceDisplay.textContent = "₹199";

  const btn = document.getElementById("rzpButton");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      if (!template) {
        alert("No template selected");
        return;
      }

      console.log("CALLING:", `${BASE_URL}/create-order`);

      // ✅ KEY FIX: Only use discounted price if customer applied coupon THIS visit
      // If they didn't apply a coupon this session, always charge ₹199
      const finalAmount = couponAppliedThisSession
        ? (parseInt(localStorage.getItem("finalAmount")) || 199)
        : 199;
      const appliedCoupon = couponAppliedThisSession
        ? (localStorage.getItem("appliedCoupon") || "")
        : "";

      const res = await fetch(`${BASE_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountINR: finalAmount,
          template,
          coupon: appliedCoupon
        })
      });

      if (!res.ok) {
        throw new Error("Failed to reach server");
      }

      const data = await res.json();

      if (!data.success) {
        alert("Order creation failed");
        return;
      }

      // 💳 RAZORPAY OPTIONS
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "CelebrateWithUs",
        description: `Template Purchase ₹${finalAmount}`,

        handler: async function (response) {
          try {
            console.log("Payment Success:", response);

            const verifyRes = await fetch(`${BASE_URL}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                template
              })
            });

            const result = await verifyRes.json();

            if (!result.success) {
              alert("Payment verification failed");
              return;
            }

            localStorage.setItem("projectId",   result.projectId);
            localStorage.setItem("invoicePath", result.invoice);

            // ✅ Clear coupon data after successful payment
            // So next purchase always starts fresh at ₹199
            localStorage.removeItem("finalAmount");
            localStorage.removeItem("appliedCoupon");
            localStorage.removeItem("discount");
            localStorage.removeItem("nextCoupon");
            couponAppliedThisSession = false;

            alert("Payment successful!");
            window.location.href = `/editor/${template}/${result.projectId}`;

          } catch (err) {
            console.error("VERIFY ERROR:", err);
            alert("Verification error");
          }
        },

        modal: {
          ondismiss: function () {
            btn.innerText = "Pay with Razorpay";
            btn.disabled = false;
          }
        }
      };

      // 🔘 BUTTON UI
      btn.innerText = "Processing...";
      btn.disabled = true;

      const rzp = new Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert("Payment failed: " + response.error.description);
        btn.innerText = "Pay with Razorpay";
        btn.disabled = false;
      });

    } catch (err) {
      console.error("ERROR:", err);
      alert("Something went wrong: " + err.message);
    }
  });
});

async function applyCoupon() {
  const couponCode   = document.getElementById("coupon").value.trim();
  const discountMsg  = document.getElementById("discountMsg");
  const priceDisplay = document.getElementById("priceDisplay");

  if (!couponCode) {
    discountMsg.textContent = "Please enter a coupon code.";
    discountMsg.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/validate-coupon`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ coupon: couponCode })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      discountMsg.textContent = data.message || "Invalid coupon code.";
      discountMsg.style.color = "red";

      // Reset everything if coupon is invalid
      localStorage.removeItem("finalAmount");
      localStorage.removeItem("appliedCoupon");
      couponAppliedThisSession = false;
      priceDisplay.textContent = "₹199";
      return;
    }

    const originalPrice = 199;
    let finalPrice = originalPrice;

    if (data.discountedPrice) {
      finalPrice = data.discountedPrice;
    } else if (data.discountPercent) {
      finalPrice = Math.round(originalPrice * (1 - data.discountPercent / 100));
    }

    // ✅ Save discount and mark that coupon was applied this session
    localStorage.setItem("finalAmount",   finalPrice);
    localStorage.setItem("appliedCoupon", couponCode);
    couponAppliedThisSession = true;  // ← this is the key flag

    priceDisplay.textContent = `₹${finalPrice} ✅`;
    discountMsg.textContent  = `Coupon applied! You save ₹${originalPrice - finalPrice}`;
    discountMsg.style.color  = "green";

  } catch (err) {
    console.error("Coupon error:", err);
    discountMsg.textContent = "Error applying coupon. Try again.";
    discountMsg.style.color = "red";
  }
}