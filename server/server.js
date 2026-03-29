const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error ❌", err));

console.log("🚀 SERVER FILE RUNNING");

const couponController = require("./coupon");



// ✅ ADD DEBUG HERE
console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);

const express = require("express");
const session = require("express-session");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const app = express();  
app.use(express.static(__dirname + "/.."));
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


app.use("/invoices", express.static(path.join(__dirname, "../invoices")));
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


// ------------------------------------------------------
// VERIFY PAYMENT
// ------------------------------------------------------
app.post("/verify-payment", async (req, res) => {
  try {
    const {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  name,
  email,
  template
} = req.body;

// ✅ ADD THIS EXACTLY HERE
console.log("Received from frontend:", {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
});

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

// ✅ ADD THIS LINE (THIS IS WHAT YOU MISSED)
const isValid = generated_signature === razorpay_signature;

// ✅ DEBUG (VERY IMPORTANT)
console.log("Generated:", generated_signature);
console.log("Received:", razorpay_signature);

if (isValid) {
  console.log("✅ PAYMENT SIGNATURE VERIFIED");
console.log("BODY:", req.body);
console.log("Generating invoice...");
 if (isValid) {


  let invoicePath = null;

try {
  const now = new Date();

  invoicePath = await generateInvoice({
    payment_id: razorpay_payment_id,
    name,
    email,
    date: now.toLocaleDateString("en-IN"),
    time: now.toLocaleTimeString("en-IN")
  });

} catch (err) {
  console.error("INVOICE ERROR:", err);

}

  let newCoupon = { code: "WELCOME10" };

  if (email) {
    newCoupon = await createCoupon(email);
  }

  return res.json({
    success: true,
    message: "Payment verified successfully",
  invoiceUrl: invoicePath || null,
    coupon: newCoupon.code,
    download: `/download?template=${template || "simple-delight"}`
  });

} else {

  return res.status(400).json({
    success: false,
    error: "Invalid signature - verification failed",
  });

}

  } catch (err) {
  console.error("❌ FULL VERIFY ERROR:");
  console.error(err.stack);

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
app.get("/download", (req, res) => {
  try {
    const fs = require("fs");
    const templateId = req.query.template || "simple-delight";

    console.log("🔥 Downloading template:", templateId);

    const templatePath = path.join(__dirname, "../templates", templateId);
    const viewerPath = path.join(templatePath, "viewer.html");
    const editorPath = path.join(templatePath, "editor.html");

    console.log("Template Path:", templatePath);

    // ✅ CHECK FOLDER
    if (!fs.existsSync(templatePath)) {
      console.log("❌ Template folder missing");
      return res.status(404).send("Template folder not found");
    }

    // ✅ CHECK FILES (THIS WAS MISSING → CAUSED 502)
   if (!fs.existsSync(viewerPath) || !fs.existsSync(editorPath)) {
  return res.status(404).send("Template files missing");
}

    res.setHeader("Content-Disposition", `attachment; filename=${templateId}.zip`);
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      console.error("❌ Archive error:", err);
      res.status(500).send("ZIP creation failed");
    });

    archive.pipe(res);

    archive.directory(templatePath, false);

    archive.finalize();

  } catch (err) {
    console.error("🔥 CRASH in /download:", err);
    res.status(500).send("Server crash");
  }
});


// 🔒 PROTECTED PAGES
app.get("/editor", isPaid, (req, res) => {
  res.sendFile(path.join(__dirname, "../templates/simple-delight/editor.html"));
});

app.get("/viewer", isPaid, (req, res) => {
  res.sendFile(path.join(__dirname, "../templates/simple-delight/viewer.html"));
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

app.post("/apply-coupon", async (req, res) => {
  const { code } = req.body;

  const result = await couponController.applyCoupon(code);
  res.json(result);

});

async function generateInvoice(data) {
  return new Promise((resolve, reject) => {

    // ✅ ADD THIS BLOCK HERE
    const invoicesDir = path.join(__dirname, "../invoices");

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // ✅ THEN CONTINUE
    const fileName = `invoice_${Date.now()}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const doc = new PDFDocument({
      margin: 50
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🌸 BACKGROUND (baby pink)
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill("#ffe4ec");

    // 🧁 LOGO
    try {
      doc.image(path.join(__dirname, "../images/logo.png"), 50, 40, { width: 70 });
    } catch (err) {
      console.log("Logo not found, skipping...");
    }

    // 🧾 TITLE
    doc.fillColor("#333")
       .fontSize(22)
       .text("INVOICE", 400, 50);

    // 🧍 CUSTOMER INFO
    doc.moveDown(3);
    doc.fontSize(12)
       .fillColor("#444")
       .text(`Name: ${data.name || "Guest"}`)
       .text(`Email: ${data.email || "guest@email.com"}`)
       .moveDown();

    // 💳 PAYMENT INFO
    doc.text(`Payment ID: ${data.payment_id}`)
       .text(`Date: ${data.date}`)
       .text(`Time: ${data.time}`);

    // 💰 AMOUNT BOX
    doc.moveDown(2);
    doc.roundedRect(50, 250, 500, 80, 10)
       .fill("#ffc0cb");

    doc.fillColor("#000")
       .fontSize(18)
       .text("Total Paid: ₹599", 70, 280);

    // ✨ THANK YOU
    doc.moveDown(4);
    doc.fontSize(14)
       .fillColor("#555")
       .text("Thank you for celebrating with us 💖", {
         align: "center"
       });

    doc.end();

    stream.on("finish", () => {
      resolve(`/invoices/${fileName}`);
    });

    stream.on("error", (err) => {
      reject(err);
    });

  });
}