const BASE_URL = "https://celebratewithus-1-qwb2.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const template = params.get("template");

  console.log("TEMPLATE:", template);

  const btn = document.getElementById("rzpButton");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      if (!template) {
        alert("No template selected");
        return;
      }

      console.log("CALLING:", `${BASE_URL}/create-order`);

      // 🔥 CREATE ORDER — replace the existing fetch body with this:
const finalAmount = parseInt(localStorage.getItem("finalAmount")) || 199;
const appliedCoupon = localStorage.getItem("appliedCoupon") || "";

const res = await fetch(`${BASE_URL}/create-order`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amountINR: finalAmount,   // ✅ uses discounted price
    template,
    coupon: appliedCoupon     // ✅ optional: send coupon to server too
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
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_order_id: response.razorpay_order_id,
  razorpay_signature: response.razorpay_signature,
  template
})
            });

            const result = await verifyRes.json();

            if (!result.success) {
              alert("Payment verification failed");
              return;
            }

            localStorage.setItem("projectId", result.projectId);
            localStorage.setItem("invoicePath", result.invoice);

            // ✅ SUCCESS FLOW
            alert("Payment successful!");

            window.location.href = `/editor/${template}/${result.projectId}`;

          } catch (err) {
            console.error("VERIFY ERROR:", err);
            alert("Verification error");
          }
        },

        modal: {
          ondismiss: function () {
            alert("Payment cancelled");
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
        btn.innerText = "Pay Now";
        btn.disabled = false;
      });

    } catch (err) {
      console.error("ERROR:", err);
      alert("Something went wrong: " + err.message);
    }
  });
});

async function applyCoupon() {
  const couponCode = document.getElementById("coupon").value.trim();
  const discountMsg = document.getElementById("discountMsg");
  const priceDisplay = document.getElementById("priceDisplay");

  if (!couponCode) {
    discountMsg.textContent = "Please enter a coupon code.";
    discountMsg.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/validate-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupon: couponCode })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      discountMsg.textContent = data.message || "Invalid coupon code.";
      discountMsg.style.color = "red";
      localStorage.removeItem("finalAmount");
      localStorage.removeItem("appliedCoupon");
      priceDisplay.textContent = "₹199";
      return;
    }

    // data should return: { success: true, discountPercent: 20 } or { discountedPrice: 159 }
    const originalPrice = 199;
    let finalPrice = originalPrice;

    if (data.discountedPrice) {
      finalPrice = data.discountedPrice;
    } else if (data.discountPercent) {
      finalPrice = Math.round(originalPrice * (1 - data.discountPercent / 100));
    }

    localStorage.setItem("finalAmount", finalPrice);
    localStorage.setItem("appliedCoupon", couponCode);

    priceDisplay.textContent = `₹${finalPrice} ✅`;
    discountMsg.textContent = `Coupon applied! You save ₹${originalPrice - finalPrice}`;
    discountMsg.style.color = "green";

  } catch (err) {
    console.error("Coupon error:", err);
    discountMsg.textContent = "Error applying coupon. Try again.";
    discountMsg.style.color = "red";
  }
}

app.post("/validate-coupon", async (req, res) => {
  const { coupon } = req.body;
  try {
    const couponDoc = await Coupon.findOne({ 
      code: coupon.toUpperCase(), 
      active: true 
    });

    if (!couponDoc) {
      return res.status(400).json({ success: false, message: "Invalid or expired coupon." });
    }

    if (couponDoc.expiresAt && new Date() > couponDoc.expiresAt) {
      return res.status(400).json({ success: false, message: "Coupon has expired." });
    }

    return res.json({ success: true, discountPercent: couponDoc.discountPercent });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// models/Coupon.js
const mongoose = require("mongoose");
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercent: { type: Number, required: true },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date }
});
module.exports = mongoose.model("Coupon", couponSchema);