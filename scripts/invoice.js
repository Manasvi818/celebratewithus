const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

function generateInvoice(name, email, amount) {
  try {
    const invoicesDir = path.join(process.cwd(), "invoices");

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const fileName = `invoice_${Date.now()}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

// 🧁 LOGO (centered)
try {
  const logoPath = path.join(process.cwd(), "styles/images/logo.png");

  doc.image(
    logoPath,
    doc.page.width / 2 - 35,
    30,
    { width: 70 }
  );
} catch (err) {
  console.log("Logo not found, skipping...");
}

// spacing after logo
doc.moveDown(0.5);

doc.fillColor("#000"); // reset color

// 🎨 HEADER
doc
  .fontSize(22)
  .fillColor("#4F46E5")
  .text("CelebrateWithUs", { align: "center" });

// divider line
doc.moveDown(0.5);
doc
  .strokeColor("#ddd")
  .lineWidth(1)
  .moveTo(50, doc.y)
  .lineTo(550, doc.y)
  .stroke();

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Professional Celebration Templates", { align: "center" });

    doc.moveDown(2);

    // 📄 INVOICE TITLE
    doc.moveDown(1.5); // 👈 ADD THIS

// 📄 INVOICE TITLE
doc
  .fontSize(18)
  .fillColor("black")
  .text("INVOICE RECEIPT", { align: "center" });

    doc.moveDown();

    // 🧾 DETAILS
    const invoiceId = "INV-" + Date.now();

    doc.fontSize(12);
    doc.text(`Invoice ID: ${invoiceId}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.text(`Customer Name: ${name}`);
    doc.text(`Customer Email: ${email}`);
    doc.moveDown();

    // 📦 TABLE HEADER
    doc.moveDown();
    doc.fontSize(13).text("Order Details", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text("Product: Celebration Template");
    doc.text("Price: ₹149");
    doc.text("Quantity: 1");
    doc.text(`Total Paid: ₹${amount}`);

    doc.moveDown(2);

    // ❤️ FOOTER
    doc
      .fontSize(12)
      .fillColor("green")
      .text("Payment Successful ✔", { align: "center" });

    doc.moveDown();

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Thank you for your purchase ", { align: "center" });

    doc.end();

    console.log("✅ Professional PDF Invoice created:", filePath);

    return `/invoices/${fileName}`;

  } catch (err) {
    console.error("❌ Invoice error:", err);
    return null;
  }
}

module.exports = { generateInvoice };