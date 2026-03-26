
console.log("🚀 SERVER FILE RUNNING");

// ✅ FIX dotenv path
require("dotenv").config({ path: __dirname + "/.env" });

// ✅ ADD DEBUG HERE
console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
console.log("KEY SECRET:", process.env.RAZORPAY_KEY_SECRET);

const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const app = express();  
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

// ------------------------------------------------------
// EXPRESS STATIC (so /templates, /assets load correctly)
// ------------------------------------------------------
app.use(express.static(__dirname));

const PORT = process.env.PORT || 4000;


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
  res.send("Razorpay + Cloudinary server running ✔");
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
      return res
        .status(400)
        .json({ success: false, error: "Missing required params" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isValid = generated_signature === razorpay_signature;

    if (isValid) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          razorpay_order_id,
          razorpay_payment_id,
          metadata: metadata || null,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid signature - verification failed",
      });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({ success: false, error: err.message });
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
app.get("/download", (req, res) => {
  const templateId = req.query.template || "template";

  console.log("🔥 Downloading template:", templateId);
console.log("Preview exists:", require("fs").existsSync(path.join(__dirname, "../preview.html")));
console.log("Template exists:", require("fs").existsSync(path.join(__dirname, "../template.html")));
console.log("Styles exists:", require("fs").existsSync(path.join(__dirname, "../styles")));
console.log("Scripts exists:", require("fs").existsSync(path.join(__dirname, "../scripts")));
console.log("Assets exists:", require("fs").existsSync(path.join(__dirname, "../assets")));
  res.setHeader("Content-Disposition", `attachment; filename=${templateId}.zip`);
  res.setHeader("Content-Type", "application/zip");

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(res);

// 🔽 REPLACE EVERYTHING BELOW THIS

const fs = require("fs");

const templatePath = path.join(process.cwd(), "templates", templateId);

console.log("Template ID:", templateId);
console.log("Path:", templatePath);
console.log("Exists:", fs.existsSync(templatePath));

if (!fs.existsSync(templatePath)) {
  return res.status(404).send("Template not found ❌");
}

archive.file(path.join(templatePath, "viewer.html"), { name: "viewer.html" });
archive.file(path.join(templatePath, "editor.html"), { name: "editor.html" });

archive.directory(path.join(process.cwd(), "assets"), "assets");
archive.directory(path.join(process.cwd(), "styles"), "styles");
archive.directory(path.join(process.cwd(), "scripts"), "scripts");

// 🔼 END REPLACE

archive.finalize();
});
