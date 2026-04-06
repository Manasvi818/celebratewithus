
const { createCoupon, applyCoupon, markUsed } = require("./coupon");const Project = require("./models/Project");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.log("MongoDB Error ❌", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();

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
  secure: true,       // REQUIRED on Render (HTTPS)
  sameSite: "none"    // REQUIRED for cross-site
}
}));
app.use(cors({
  origin: [
    "https://www.celebratewithus.co.in",
    "https://celebratewithus.co.in"
  ],
  credentials: true
}));

app.options("*", cors({
  origin: [
    "https://www.celebratewithus.co.in",
    "https://celebratewithus.co.in"
  ],
  credentials: true
})); 
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

    const result = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: "celebratewithus",
      resource_type: "image"
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }
  );

  stream.end(req.file.buffer);
});

    res.json({
      success: true,
      url: result.secure_url
    });

  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return res.status(500).json({ success: false, error: "Cloudinary upload failed" });
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
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------
// VERIFY PAYMENT
// ------------------------------------------------------
app.post("/verify-payment", async (req, res) => {
  try {
    let {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  name,
  email,
  template
} = req.body;
console.log("FULL BODY:", req.body);
console.log("🔥 TEMPLATE RECEIVED:", template);


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

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid signature"
      });
    }

    console.log("✅ PAYMENT VERIFIED");

    const templateName = (template || "default").toLowerCase().trim();

// simple unique suffix
const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
const projectId = `${templateName}-${uniqueId}`;

const emailUser = email || "guest@email.com";

const coupon = await createCoupon(emailUser);   // 🔥 ADD THIS

    await Project.create({
      projectId,
      data: [],
      messages: "",
      music: "",
      password: req.body.password || "1234"
    });

    req.session.isPaid = true;

   const invoicePath = await generateInvoice({
  payment_id: razorpay_payment_id,
  name,
  email,
  projectId,
  template,
  viewerLink: `https://celebratewithus.co.in/viewer/${templateName}/${projectId}`,
editorLink: `https://celebratewithus.co.in/editor/${templateName}/${projectId}`,
  coupon: req.body?.coupon || "N/A",
  nextCoupon: coupon.code,
discount: req.body?.discount || 0,
  date: new Date().toLocaleDateString("en-IN"),
  time: new Date().toLocaleTimeString("en-IN")
});

return req.session.save(() => {
  res.json({
  success: true,
  projectId,
  editLink: `/editor/${templateName}/${projectId}`,
  viewerLink: `/viewer/${templateName}/${projectId}`, // optional but useful
  invoice: invoicePath,
  nextCoupon: coupon.code   // 🔥 ADD THIS
});
});

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ------------------------------------------------------
// SAVE PROJECT DATA
// ------------------------------------------------------
app.post("/save-project", async (req, res) => {
  try {
    const { projectId, data, messages, music, password } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, error: "Missing projectId" });
    }

   await Project.findOneAndUpdate(
  { projectId },
  {
    data: data || [],
    messages: messages || "",
    music: music || "",
    password: password || ""
  },
  { new: true }
);

    return res.json({ success: true });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------
// LOAD PROJECT DATA
// ------------------------------------------------------
app.get("/get-project/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ projectId: req.params.id });

    if (!project) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      data: project.data || [],
      messages: project.messages || "",
      music: project.music || "",
      password: project.password || ""
    });

  } catch (err) {
    res.status(500).json({ success: false });
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
    return res.status(200).json({ ok: true });
  } else {
    return res.status(400).json({ ok: false, message: "signature mismatch" });
  }
});

// ------------------------------------------------------
// DOWNLOAD TEMPLATE (ZIP)
// ------------------------------------------------------
// ✅ DOWNLOAD ROUTE FIRST
app.get("/download", async (req, res) => {
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
      return res.status(500).send("ZIP creation failed");
    });


    archive.pipe(res);

    const projectId = req.query.projectId;

const project = await Project.findOne({ projectId });

const password = project?.password || "sweet";

let viewerHtml = fs.readFileSync(viewerPath, "utf-8");

// inject password
viewerHtml = viewerHtml.replace(
  'let PASS = "";',
  `let PASS = "${project.password || ""}";`
);

// inject media
viewerHtml = viewerHtml.replace(
  'let data = [];',
  `let data = ${JSON.stringify(project.data || [])};`
);

// inject messages
viewerHtml = viewerHtml.replace(
  'let messages = "";',
  `let messages = ${JSON.stringify(project.messages || "")};`
);

// inject music
viewerHtml = viewerHtml.replace(
  'let song = "";',
  `let song = "${project.music || ""}";`
);

// add modified viewer
archive.append(viewerHtml, { name: "viewer.html" });



    archive.finalize();

  } catch (err) {
    console.error("🔥 CRASH in /download:", err);
    return res.status(500).send("Server crash");
  }
});


// ✅ VALID TEMPLATE LIST
const validTemplates = [
  "easy-breezy",
  "everyday-joy",
  "simple-delight",
  "soft-vibes",
  "sunny-smiles",
  "home-happiness",
  "always-together",
  "warm-bonds",
  "cherished-times",
  "joyful-family",
  "color-carnival",
  "crazy-confetti",
  "electric-energy",
  "laugh-riot",
  "party-pop",
  "blush-love",
  "candlelight-moments",
  "forever-yours",
  "golden-love",
  "sweet-affection",
  "cultural-festive",
  "golden-mandala",
  "royal-aura",
  "sacred-simplicity",
  "vintage-glory"
];

app.get("/editor/:template/:id", (req, res) => {
  let { template } = req.params;

template = template?.toLowerCase().trim();

  console.log("🔥 EDITOR TEMPLATE:", template);

  // ✅ VALIDATION
  const cleanTemplate = template.toLowerCase().trim();

if (!validTemplates.includes(cleanTemplate)) {
  return res.status(400).send("Invalid template");
}

  const filePath = path.join(__dirname, `../templates/${template}/editor.html`);

  console.log("Opening template:", template);
  console.log("File path:", filePath);

  if (!fs.existsSync(filePath)) {
    console.log("❌ Template not found:", template);
    return res.status(404).send("Template not found");
  }

  res.sendFile(filePath);
});

// 🔒 PROTECTED VIEWER (ALL TEMPLATES)
app.get("/viewer/:template/:id", (req, res) => {
  let { template } = req.params;

  template = template?.toLowerCase().trim();

  if (!validTemplates.includes(template)) {
    return res.status(400).send("Invalid template");
  }

  const filePath = path.join(__dirname, `../templates/${template}/viewer.html`);

  if (!fs.existsSync(filePath)) {
    console.log("❌ Viewer template not found:", template);
    return res.status(404).send("Template not found");
  }

  res.sendFile(filePath);
});


app.post("/apply-coupon", async (req, res) => {
  const { code } = req.body;

  const result = await couponController.applyCoupon(code);
  res.json(result);

});

async function generateInvoice(data) {
  return new Promise((resolve, reject) => {

    const invoicesDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const fileName = `invoice_${data.projectId}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

console.log("📄 Saving invoice at:", filePath);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ✅ SAFE CALCULATION
    const baseAmount = 149;
    const discount = parseInt(data.discount || 0);
    const safeDiscount = isNaN(discount) ? 0 : discount;
    const finalAmount = Math.round(baseAmount - (baseAmount * safeDiscount / 100));

    // 🎨 BACKGROUND
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#E89AC6");
    
    doc.fillColor("#000000");   // 🔥 VERY IMPORTANT
    doc.moveDown(2);

    // 🧁 LOGO (top right)
try {
  const logoPath = path.join(process.cwd(), "styles/images/logo.png");

  if (fs.existsSync(logoPath)) {
  doc.image(logoPath, 400, 120, { width: 110 });
  } else {
    console.log("Logo file NOT found at:", logoPath);
  }

} catch (err) {
  console.log("Logo error:", err.message);
}

    // 🧾 TITLE
    doc.fontSize(20).fillColor("#333").text("INVOICE RECEIPT", { align: "center" });

    doc.moveDown(1);

let startY = 120;

    // 👤 CUSTOMER
    doc.fontSize(12).fillColor("#444")
      .text(`Name: ${data.name || "Guest"}`)
      .text(`Email: ${data.email || "guest@email.com"}`);

    doc.moveDown();

    // 💳 PAYMENT
    doc.text(`Payment ID: ${data.payment_id}`);
    doc.text(`Date: ${data.date}`);
    doc.text(`Time: ${data.time}`);

    doc.moveDown();

    doc.text(`Project ID: ${data.projectId}`);
    doc.text(`Template: ${data.template}`);
doc.text(`Next Coupon (for next purchase): ${data.nextCoupon || "N/A"}`);
    doc.moveDown();

doc.fillColor("#000"); // reset color

    doc.fillColor("#0000EE")
      .text(`Viewer Link: ${data.viewerLink}`, { link: data.viewerLink });

    doc.text(`Editor Link: ${data.editorLink}`, { link: data.editorLink });

    doc.moveDown();

    // 💰 PAYMENT DETAILS
    doc.fillColor("#000");
    doc.text(`Coupon Used: ${data.coupon || "N/A"}`);
    doc.text(`Discount: ₹${safeDiscount}`);
    doc.text(`Final Amount Paid: ₹${finalAmount}`);

 doc.moveDown(3);

// 💰 PINK BOX
const boxY = doc.y;

// 💰 PINK BOX
const boxX = 150;
const boxWidth = 300;

doc.roundedRect(boxX, boxY, boxWidth, 60, 12).fill("#F4C2C2");

// ✅ CENTER TEXT INSIDE BOX
doc.fillColor("#000")
  .fontSize(16)
  .text(`Total Paid: ₹${finalAmount}`, boxX, boxY + 20, {
    width: boxWidth,
    align: "center"
  });
    

doc.moveDown(2);

doc.fontSize(14)
  .fillColor("#555")
  .text("Thank you for celebrating with us 💛", { align: "left" });

    doc.moveDown(4);

if (!fs.existsSync(filePath)) {
  console.log("❌ FILE NOT FOUND BEFORE END:", filePath);
}

    doc.end();

    stream.on("finish", () => {
  console.log("✅ Invoice created:", filePath);
  resolve(`/invoices/${fileName}?t=${Date.now()}`);
});

    stream.on("error", (err) => {
      reject(err);
    });

    
  });
}