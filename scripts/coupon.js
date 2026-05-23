const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number },
  used: { type: Boolean, default: false },
  email: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });  // ✅ strict: false allows extra fields

module.exports = mongoose.model("Coupon", couponSchema);