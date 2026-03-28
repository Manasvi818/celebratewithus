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
    discount: 20,
    email
  });

  return coupon;
}

async function applyCoupon(code) {
  const coupon = await Coupon.findOne({ code });

  if (!coupon || coupon.used) {
    return { valid: false };
  }

  return { valid: true, discount: coupon.discount };
}

async function markUsed(code) {
  await Coupon.updateOne({ code }, { used: true });
}

module.exports = {
  createCoupon,
  applyCoupon,
  markUsed
};