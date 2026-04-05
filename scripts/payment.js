
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
console.log("TEMPLATE:", localStorage.getItem("selectedTemplate"));

console.log("Razorpay loaded:", typeof Razorpay);

const payBtn = document.getElementById("rzpButton");
const BASE_URL = "https://celebratewithus.onrender.com";

let finalAmount = 14900; // ₹149 in paise
let usedCoupon = null;

if (payBtn) {
    payBtn.addEventListener("click", openCheckout);
}


async function openCheckout() {

  // ✅ VALIDATION HERE (CORRECT PLACE)
  const selectedTemplate = localStorage.getItem("selectedTemplate");

if (!selectedTemplate) {
  console.error("No template selected");
  return;
}

const template = localStorage.getItem("selectedTemplate")?.toLowerCase().trim();

console.log("TEMPLATE:", template);

  try {
    const res = await fetch(`${BASE_URL}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountINR: finalAmount / 100,
        notes: {
          templateId: selectedTemplate
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

        const res = await fetch(`${BASE_URL}/verify-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            ...response,
            template: selectedTemplate
          })
        });

        const result = await res.json();

        if (result.success && result.editLink) {

  // ✅ 1. Save coupon locally (for invoice)
  localStorage.setItem("usedCoupon", usedCoupon || "N/A");

  // ✅ 2. Generate invoice PDF
  generateInvoicePDF(response);

  // ✅ 3. Redirect after small delay
  setTimeout(() => {
    window.location.href = result.editLink;
  }, 2000);

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

    // ✅ THIS IS REQUIRED
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

function generateInvoicePDF(response){

  const projectId = "TEMP_" + Date.now(); // since project not created yet
  const template = localStorage.getItem("selectedTemplate") || "N/A";

  const coupon = localStorage.getItem("usedCoupon") || "N/A";
  const paymentId = response.razorpay_payment_id;

  const date = new Date().toLocaleString();

  const content = `
  <div style="font-family:Arial;padding:25px;">
    
    <h2 style="text-align:center;">CelebrateWithUs - Invoice</h2>
    <hr>

    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Payment ID:</strong> ${paymentId}</p>

    <hr>

    <p><strong>Template:</strong> ${template}</p>
    <p><strong>Amount Paid:</strong> ₹149</p>
    <p><strong>Coupon:</strong> ${coupon}</p>

    <hr>

    <p style="text-align:center;">
      Thank you for your purchase 💛
    </p>
  </div>
  `;

  const element = document.createElement("div");
  element.innerHTML = content;

  html2pdf().from(element).save(`invoice_${paymentId}.pdf`);
}
    