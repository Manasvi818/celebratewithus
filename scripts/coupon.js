const coupons = [];

function generateCoupon() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function createCoupon(email) {
  const code = generateCoupon();

  const coupon = {
    code,
    discount: 20,
    used: false,
    email
  };

  coupons.push(coupon);
  return coupon;
}

function applyCoupon(code) {
  const coupon = coupons.find(c => c.code === code);

  if (!coupon || coupon.used) {
    return { valid: false };
  }

  return { valid: true, discount: coupon.discount };
}

function markUsed(code) {
  const coupon = coupons.find(c => c.code === code);
  if (coupon) coupon.used = true;
}

module.exports = {
  createCoupon,
  applyCoupon,
  markUsed
};