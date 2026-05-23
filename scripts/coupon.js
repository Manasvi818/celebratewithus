const mongoose = require("mongoose");
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },   // ✅ match actual DB field
  used: { type: Boolean, default: false },       // ✅ match actual DB field
  email: { type: String },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Coupon", couponSchema);