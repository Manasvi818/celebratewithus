const { createCoupon, applyCoupon, markUsed } = require("./coupon");
const Project = require("./models/Project");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const express = require("express");
const app = express();


const cors = require("cors");

const corsConfig = {
  origin: [
    "https://www.celebratewithus.co.in",
    "https://celebratewithus.co.in"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

app.use(express.json());

app.get("/cors-test", (req, res) => {
  res.json({ cors: "working", time: Date.now() });
});

// ✅ CORS - single clean middleware, no duplicates

const PORT = process.env.PORT || 10000;

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

console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);

const session = require("express-session");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const archiver = require("archiver");
const bodyParser = require("body-parser");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

app.use(express.static(__dirname + "/.."));

app.use(session({
  secret: "my-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "lax"
  }
}));

console.log("CORS ENABLED ✅");


app.use(bodyParser.urlencoded({ extended: true }));

// 🔐 Payment gate middleware
function isPaid(req, res, next) {
  if (req.session.isPaid) {
    return next();
  }
  return res.status(403).send("Access denied - please pay");
}

// ✅ PUBLIC routes
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/scripts", express.static(path.join(__dirname, "../scripts")));
app.use(express.static(path.join(__dirname, "..")));

// 🔐 PROTECTED
app.use("/assets", isPaid, express.static(path.join(__dirname, "../assets")));
app.use("/invoices", express.static(path.join(__dirname, "../invoices")));

// ------------------------------------------------------
// CLOUDINARY CONFIG
// ------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

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
  "joyful-times",
  "color-carnival",
  "crazy-confetti",
  "electric-energy",
  "laugh-riot",
  "party-pop",
  "party_pop",
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

// ------------------------------------------------------
// CLOUDINARY UPLOAD
// ------------------------------------------------------
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "celebratewithus", resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({ success: true, url: result.secure_url });

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

    const templateName = (req.body.template || "").toLowerCase().trim();

    if (!templateName) {
      return res.status(400).json({ success: false, error: "Template is required" });
    }

    if (!validTemplates.includes(templateName)) {
      return res.status(400).json({ success: false, error: "Invalid template" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing required params" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isValid = generated_signature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    console.log("✅ PAYMENT VERIFIED");

    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const projectId = `${templateName}-${uniqueId}`;

    const emailUser = email || "guest@email.com";
    const coupon = await createCoupon(emailUser);

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
        viewerLink: `/viewer/${templateName}/${projectId}`,
        invoice: invoicePath,
        nextCoupon: coupon.code
      });
    });

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    return res.status(500).json({ success: false, error: err.message });
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
// WEBHOOK
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
app.get("/download", async (req, res) => {
  try {
    const templateId = req.query.template || "simple-delight";
    console.log("🔥 Downloading template:", templateId);

    const templatePath = path.join(__dirname, "../templates", templateId);
    const viewerPath = path.join(templatePath, "viewer.html");
    const editorPath = path.join(templatePath, "editor.html");

    if (!fs.existsSync(templatePath)) {
      return res.status(404).send("Template folder not found");
    }

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

    let viewerHtml = fs.readFileSync(viewerPath, "utf-8");

    viewerHtml = viewerHtml.replace('let PASS = "";', `let PASS = "${project?.password || ""}";`);
    viewerHtml = viewerHtml.replace('let data = [];', `let data = ${JSON.stringify(project?.data || [])};`);
    viewerHtml = viewerHtml.replace('let messages = "";', `let messages = ${JSON.stringify(project?.messages || "")};`);
    viewerHtml = viewerHtml.replace('let song = "";', `let song = "${project?.music || ""}";`);

    archive.append(viewerHtml, { name: "viewer.html" });
    archive.finalize();

  } catch (err) {
    console.error("🔥 CRASH in /download:", err);
    return res.status(500).send("Server crash");
  }
});

// ------------------------------------------------------
// EDITOR ROUTE
// ------------------------------------------------------
app.get("/editor/:template/:id", (req, res) => {
  let { template } = req.params;
  template = template?.toLowerCase().trim();

  if (!validTemplates.includes(template)) {
    return res.status(400).send("Invalid template");
  }

  const filePath = path.join(__dirname, `../templates/${template}/editor.html`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Template not found");
  }

  res.sendFile(filePath);
});

// ------------------------------------------------------
// VIEWER ROUTE
// ------------------------------------------------------
app.get("/viewer/:template/:id", (req, res) => {
  let { template } = req.params;
  template = template?.toLowerCase().trim();

  if (!validTemplates.includes(template)) {
    return res.status(400).send("Invalid template");
  }

  const filePath = path.join(__dirname, `../templates/${template}/viewer.html`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Template not found");
  }

  res.sendFile(filePath);
});

// ------------------------------------------------------
// APPLY COUPON
// ------------------------------------------------------
app.post("/apply-coupon", async (req, res) => {
  const { code } = req.body;
  const result = await couponController.applyCoupon(code);
  res.json(result);
});

// ------------------------------------------------------
// GENERATE INVOICE
// ------------------------------------------------------
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

    const baseAmount = 199;
    const discount = parseInt(data.discount || 0);
    const safeDiscount = isNaN(discount) ? 0 : discount;
    const finalAmount = Math.round(baseAmount - (baseAmount * safeDiscount / 100));

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#E89AC6");
    doc.fillColor("#ffffff");
    doc.moveDown(2);

    // Logo
    try {
      const logoPath = path.join(process.cwd(), "styles/images/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 400, 120, { width: 110 });
      }
    } catch (err) {
      console.log("Logo error:", err.message);
    }

    doc.fontSize(20).fillColor("#ffffff").text("INVOICE RECEIPT", { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12).fillColor("#ffffff")
      .text(`Name: ${data.name || "Guest"}`)
      .text(`Email: ${data.email || "guest@email.com"}`);
    doc.moveDown();

    doc.text(`Payment ID: ${data.payment_id}`);
    doc.text(`Date: ${data.date}`);
    doc.text(`Time: ${data.time}`);
    doc.moveDown();

    doc.text(`Project ID: ${data.projectId}`);
    doc.text(`Template: ${data.template}`);
    doc.text(`Next Coupon (for next purchase): ${data.nextCoupon || "N/A"}`);
    doc.moveDown();

    doc.fillColor("#0000EE")
      .text(`Viewer Link: ${data.viewerLink}`, { link: data.viewerLink });
    doc.text(`Editor Link: ${data.editorLink}`, { link: data.editorLink });
    doc.moveDown();

    doc.fillColor("#ffffff");
    doc.text(`Coupon Used: ${data.coupon || "N/A"}`);
    doc.text(`Discount: ₹${safeDiscount}`);
    doc.text(`Final Amount Paid: ₹${finalAmount}`);
    doc.moveDown(3);

    const boxY = doc.y;
    const boxX = 150;
    const boxWidth = 300;

    doc.roundedRect(boxX, boxY, boxWidth, 60, 12).fill("#FF6EC7");
    doc.fillColor("#ffffff")
      .fontSize(16)
      .text(`Total Paid: ₹${finalAmount}`, boxX, boxY + 20, {
        width: boxWidth,
        align: "center"
      });

    doc.moveDown(2);
    doc.fontSize(14).fillColor("#ffffff")
      .text("Thank you for celebrating with us 💛", { align: "left" });

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
