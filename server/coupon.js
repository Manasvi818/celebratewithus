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
    discountPercent: 20,  // ✅ fixed: was "discount"
    active: true,
    email
  });

  return coupon;
}

async function applyCoupon(code) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });

  if (!coupon) {
    return { success: false, message: "Invalid or expired coupon." };  // ✅ fixed
  }

  return { success: true, discountPercent: coupon.discountPercent };   // ✅ fixed
}

async function markUsed(code) {
  await Coupon.updateOne({ code }, { active: false }); // ✅ deactivates after use
}

module.exports = {
  createCoupon,
  applyCoupon,
  markUsed
};