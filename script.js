const params = new URLSearchParams(window.location.search);
const template = params.get("template");

console.log("TEMPLATE:", template);

const res = await fetch("https://celebratewithus-production.up.railway.app/create-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amountINR: 199,
    template // ✅ pass template
  })
});

const data = await res.json();

var options = {
  key: data.keyId,
  amount: data.amount,
  currency: data.currency,
  order_id: data.orderId,
  name: "CelebrateWithUs",

  handler: function (response) {
    console.log("Payment Success:", response);

   fetch("https://celebratewithus-production.up.railway.app/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(response)
    });
  }
};

var rzp = new Razorpay(options);
rzp.open();