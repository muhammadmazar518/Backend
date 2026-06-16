const pool = require("../config/db");
const transporter = require("../config/nodemailer");

const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  const errors = [];
  if (!name || !name.trim()) errors.push("Name is required");
  if (!email || !email.trim()) errors.push("Email is required");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("Invalid email format");
  if (!message || !message.trim()) errors.push("Message is required");
  if (errors.length > 0)
    return res.status(400).json({ error: errors.join("; ") });

  try {
    await pool.query(
      "INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)",
      [name.trim(), email.trim(), subject?.trim() || "", message.trim()]
    );
    console.log("Contact message saved to DB");

    try {
      await transporter.sendMail({
        from: `"${name}" <${process.env.EMAIL_USER}>`,
        replyTo: email,
        to: process.env.ADMIN_EMAIL,
        subject: subject ? `[Contact] ${subject}` : "[Contact] New Message",
        html: `
          <h2>New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || "(no subject)"}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
      console.log("Contact email sent to", process.env.ADMIN_EMAIL);
    } catch (emailErr) {
      console.error("Nodemailer send failed:", emailErr.message);
    }

    res.json({ success: true, message: "Message sent! We'll reply within 24 hours." });
  } catch (dbErr) {
    console.error("DB save error:", dbErr.message);
    res.status(500).json({ error: "Failed to save message. Please try again." });
  }
};

module.exports = { sendContactMessage };