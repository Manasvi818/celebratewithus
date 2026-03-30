const res = await fetch("/create-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amountINR: 99
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

    fetch("/verify-payment", {
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