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

      // 🔥 CREATE ORDER
      const res = await fetch(`${BASE_URL}/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amountINR: 199,
          template
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
        description: "Template Purchase ₹199",

        handler: async function (response) {
          try {
            console.log("Payment Success:", response);

            const verifyRes = await fetch(`${BASE_URL}/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                ...response,
                template
              })
            });

            const result = await verifyRes.json();

            if (!result.success) {
              alert("Payment verification failed");
              return;
            }

            // ✅ SUCCESS FLOW
            alert("Payment successful!");

            window.location.href = `templates/${template}/editor.html`;

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

      rzp.on("payment.failed", function () {
        alert("Payment failed. Try again.");
        btn.innerText = "Pay Now";
        btn.disabled = false;
      });

    } catch (err) {
      console.error("ERROR:", err);
      alert("Something went wrong: " + err.message);
    }
  });
});