const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      is_pro: user.is_pro, 
      has_purchased: user.has_purchased 
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, is_pro, has_purchased",
      [name, email, hashed]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
  console.error("Signup Error:", err);

  res.status(500).json({
    message: err.message,
    stack: err.stack,
  });
}
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user);

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        is_pro: user.is_pro,
        has_purchased: user.has_purchased
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

const sendPurchaseEmail = async (req, res) => {
  const { email, courseTitle, name } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, 
      subject: `🎉 Course Unlocked Successfully: ${courseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0d0f14; color: #fff; border-radius: 10px; border: 1px solid #1e293b;">
          <h2 style="color: #6366f1;">Hello ${name}! 👋</h2>
          <p style="font-size: 15px; color: #cbd5e1;">Mubarak ho! Aapka premium course <strong style="color: #fff;">"${courseTitle}"</strong> kamyabi ke sath unlock ho chuka hai.</p>
          <p style="font-size: 15px; color: #cbd5e1;">Ab aap apne dashboard par ja kar exclusive pro features aur lessons ko access kar sakte hain.</p>
          <br />
          <hr style="border-color: #1e293b;" />
          <p style="color: #64748b; font-size: 12px; margin-top: 15px;">Best Regards,<br />Your Project Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Confirmation email sent!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
};

module.exports = { signup, login, logout, sendPurchaseEmail };