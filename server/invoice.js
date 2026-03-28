const fs = require("fs");
const path = require("path");

function generateInvoice(name, email, amount) {
  try {
    // ✅ Absolute safe path
    const invoicesDir = path.join(process.cwd(), "invoices");

    // ✅ Ensure folder exists
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
      console.log("📁 invoices folder created");
    }

    const fileName = `invoice_${Date.now()}.txt`;
    const filePath = path.join(invoicesDir, fileName);

    const content = `
Invoice Receipt
-------------------------
Name: ${name}
Email: ${email}
Amount: ₹${amount}
Date: ${new Date().toLocaleString()}
`;

    fs.writeFileSync(filePath, content);

    console.log("✅ Invoice created:", filePath);

    return `/invoices/${fileName}`;

  } catch (err) {
    console.error("❌ Invoice error:", err);
    return null;
  }
}

module.exports = { generateInvoice };