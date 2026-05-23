const Coupon = require("./models/Coupon");

function generateCoupon() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function createCoupon(email) {
  let code;
  let exists = true;

  while (exists) {
    code = generateCoupon();
    const existing = await Coupon.findOne({ code });
    if (!existing) exists = false;
  }

  const coupon = await Coupon.create({
    code,
    discount: 20,   // ✅ matches actual DB field
    used: false,    // ✅ matches actual DB field
    email
  });

  console.log("✅ Coupon created:", coupon.code); // add this to confirm it saves
  return coupon;
}

async function applyCoupon(code) {
  const coupon = await Coupon.findOne({ 
    code: code.toUpperCase().trim(), 
    used: false 
  });

  if (!coupon) {
    return { success: false, message: "Invalid or expired coupon." };
  }

  return { success: true, discountPercent: coupon.discount };
}

async function markUsed(code) {
  await Coupon.updateOne({ code }, { used: true });
}

module.exports = { createCoupon, applyCoupon, markUsed };

module.exports = {
  createCoupon,
  applyCoupon,
  markUsed
};