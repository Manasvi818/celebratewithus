
console.log("🚀 SERVER FILE RUNNING");

// ✅ FIX dotenv path
require("dotenv").config({ path: __dirname + "/.env" });

// ✅ ADD DEBUG HERE
console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
console.log("KEY SECRET:", process.env.RAZORPAY_KEY_SECRET);

const express = require("express");
const session = require("express-session");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const app = express();  
app.use(session({
  secret: "my-secret-key",   // change later
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false   // change to true after deployment (HTTPS)
  }
}));
app.use(cors({
  origin: "*",
}));

app.options("*", cors()); 
console.log("CORS ENABLED ✅");
const path = require("path");
const archiver = require("archiver");
const bodyParser = require("body-parser");

const multer = require("multer");                 // for image upload
const cloudinary = require("cloudinary").v2;      // cloudinary SDK


// ------------------------------------------------------
// CORS
// ------------------------------------------------------


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🔐 allow assets ONLY after payment (you will connect session later)
function isPaid(req, res, next) {
  if (req.session.isPaid) {
    return next();
  }
  return res.status(403).send("Access denied - please pay");
}

// ✅ PUBLIC (needed for website to load)
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/scripts", express.static(path.join(__dirname, "../scripts")));

app.use(express.static(path.join(__dirname, "..")));

// 🔐 PROTECTED (optional)
app.use("/assets", isPaid, express.static(path.join(__dirname, "../assets")));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

app.use("/invoices", express.static("invoices"));
// ------------------------------------------------------
// CLOUDINARY CONFIG
// ------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   // your cloud name
  api_key: process.env.CLOUDINARY_API_KEY,         // your API key
  api_secret: process.env.CLOUDINARY_API_SECRET    // your API secret
});


// Multer - we store files in memory then upload buffer → Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ----------------------------------------------------
// CLOUDINARY UPLOAD ENDPOINT
// ------------------------------------------------------
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    const fileData =
      "data:image/jpeg;base64," + req.file.buffer.toString("base64");

    const result = await cloudinary.uploader.upload(fileData, {
      folder: "celebratewithus",
      resource_type: "image",
    });

    res.json({
      success: true,
      url: result.secure_url
    });

  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).json({ success: false, error: "Cloudinary upload failed" });
  }
});


// ------------------------------------------------------
// RAZORPAY CONFIG
// ------------------------------------------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ------------------------------------------------------
// HEALTH CHECK
// ------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/payment", (req, res) => {
  res.sendFile(path.join(__dirname, "../payment.html"));
});

// ------------------------------------------------------
// CREATE ORDER
// ------------------------------------------------------
app.post("/create-order", async (req, res) => {
  try {
    const { amountINR = 99, currency = "INR", receipt, notes = {} } = req.body;

    const amountPaise = Math.round(Number(amountINR) * 100);

    const options = {
      amount: amountPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const { createCoupon, markUsed } = require("./coupon");
const { generateInvoice } = require("./invoice");

// ------------------------------------------------------
// VERIFY PAYMENT
// ------------------------------------------------------
app.post("/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      metadata
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required params"
      });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isValid = generated_signature === razorpay_signature;

    if (isValid) {

  req.session.isPaid = true;

  // ✅ GET DATA FROM FRONTEND
  const { name, email, amount, couponCode } = req.body;

  // ✅ MARK COUPON USED
  if (couponCode) {
    markUsed(couponCode);
  }

  // ✅ GENERATE INVOICE
  const invoicePath = generateInvoice(name, email, amount);

  // ✅ CREATE NEW COUPON
  const newCoupon = createCoupon(email);

  return res.json({
    success: true,
    message: "Payment verified successfully",

    // ✅ SEND THESE TO FRONTEND
    invoice: invoicePath,
    coupon: newCoupon.code
  });

} else {

      return res.status(400).json({
        success: false,
        error: "Invalid signature - verification failed",
      });

    }

  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ------------------------------------------------------
// OPTIONAL WEBHOOK
// ------------------------------------------------------
app.post("/webhook", (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const receivedSignature = req.headers["x-razorpay-signature"];

  const body = JSON.stringify(req.body || {});

  if (!webhookSecret) {
    console.warn("Webhook secret not configured");
    return res.status(200).send("ok");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (expectedSignature === receivedSignature) {
    console.log("Verified webhook event:", req.body.event);
    res.status(200).json({ ok: true });
  } else {
    res.status(400).json({ ok: false, message: "signature mismatch" });
  }
});

// ------------------------------------------------------
// DOWNLOAD TEMPLATE (ZIP)
// ------------------------------------------------------
// ✅ DOWNLOAD ROUTE FIRST
app.get("/download", isPaid, (req, res) => {
  try {
    const fs = require("fs");
    const templateId = req.query.template || "template";

    console.log("🔥 Downloading template:", templateId);

    const templatePath = path.join(process.cwd(), "templates", templateId);

    console.log("Template Path:", templatePath);

    // ✅ SAFE CHECK (no crash)
    if (!fs.existsSync(templatePath)) {
      console.log("❌ Template not found");
      return res.status(404).json({ error: "Template not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename=${templateId}.zip`);
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).send("ZIP creation failed");
    });

    archive.pipe(res);

    // ✅ ADD FILES
    archive.file(path.join(templatePath, "viewer.html"), { name: "viewer.html" });
    archive.file(path.join(templatePath, "editor.html"), { name: "editor.html" });

    

    archive.finalize();

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Something went wrong");
  }
});

// 🔒 PROTECTED PAGES
app.get("/editor", isPaid, (req, res) => {
  res.sendFile(path.join(__dirname, "templates/simple-delight/editor.html"));
});

app.get("/viewer", isPaid, (req, res) => {
  res.sendFile(path.join(__dirname, "templates/simple-delight/viewer.html"));
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

