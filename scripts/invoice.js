const PDFDocument = require("pdfkit");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

function generateInvoice(name, email, amount) {
  const id = uuidv4();
  const path = `invoices/${id}.pdf`;

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(path));

  doc.fontSize(20).text("Invoice Receipt", { align: "center" });

  doc.moveDown();
  doc.text(`Invoice ID: ${id}`);
  doc.text(`Name: ${name}`);
  doc.text(`Email: ${email}`);
  doc.text(`Amount Paid: ₹${amount}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);

  doc.end();

  return path;
}

module.exports = { generateInvoice };