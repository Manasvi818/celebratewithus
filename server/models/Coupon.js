const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: String,
  discount: Number,
  email: String,
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Coupon", couponSchema);