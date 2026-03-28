const fs = require("fs");
const path = require("path");

function generateInvoice(name, email, amount) {
  const fileName = `invoice_${Date.now()}.txt`;
  const filePath = path.join(__dirname, "../invoices", fileName);

  const content = `
Invoice Receipt
-------------------------
Name: ${name}
Email: ${email}
Amount: ₹${amount}
Date: ${new Date().toLocaleString()}
`;

  // ensure folder exists
  if (!fs.existsSync(path.join(__dirname, "../invoices"))) {
    fs.mkdirSync(path.join(__dirname, "../invoices"));
  }

  fs.writeFileSync(filePath, content);

  return `/invoices/${fileName}`;
}

module.exports = { generateInvoice };