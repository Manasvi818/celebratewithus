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

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🧾 DESIGN
    doc.fontSize(20).text("Invoice Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Amount: ₹${amount}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);

    doc.moveDown();
    doc.text("Thank you for your purchase ", { align: "center" });

    doc.end();

    console.log("✅ PDF Invoice created:", filePath);

    return `/invoices/${fileName}`;

  } catch (err) {
    console.error("❌ PDF error:", err);
    return null;
  }
}

module.exports = { generateInvoice };