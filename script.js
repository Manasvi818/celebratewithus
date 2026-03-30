const res = await fetch("https://celebratewithus.onrender.com/create-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amountINR: 149
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

   fetch("https://celebratewithus.onrender.com/verify-payment", {
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