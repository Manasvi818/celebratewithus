const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: String,
  discount: Number,
  used: Boolean,
  email: String
});

module.exports = mongoose.model("Coupon", couponSchema);