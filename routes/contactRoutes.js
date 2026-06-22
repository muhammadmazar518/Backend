const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email and message required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", 
      port: 587,           
      secure: false,       
      family: 4,               
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: subject || `New Contact from ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject || "N/A"}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    res.json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;