const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");

dotenv.config();

// Stripe environment variables validation
console.log(
  "STRIPE_SECRET_KEY exists:",
  !!process.env.STRIPE_SECRET_KEY
);

console.log(
  "STRIPE_SECRET_KEY length:",
  process.env.STRIPE_SECRET_KEY?.length
);

console.log(
  "STRIPE_WEBHOOK_SECRET exists:",
  !!process.env.STRIPE_WEBHOOK_SECRET
);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is missing");
}

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const pool = require("./config/db");

require("./passport");
const { createUsersTable } = require("./models/User");
const { createCoursesTable } = require("./models/Course");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Stripe webhook
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.userId;
      const customerEmail = session.customer_details?.email;

      try {
        if (userId) {
          await pool.query(
            "UPDATE users SET is_pro = $1, has_purchased = $2 WHERE id = $3",
            [true, true, userId]
          );
        } else if (customerEmail) {
          await pool.query(
            "UPDATE users SET is_pro = $1, has_purchased = $2 WHERE email = $3",
            [true, true, customerEmail]
          );
        }
      } catch (dbErr) {
        console.error("Database Update Error:", dbErr);
      }
    }

    res.json({ received: true });
  }
);

app.use(express.json());

app.use(
  cors({
    origin: [
      "https://frontend-ygau.vercel.app",
      "http://localhost:5173",
      /.vercel.app$/,
    ],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/payment", paymentRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/services", require("./routes/servicesRoutes"));
app.use("/api/projects", require("./routes/projectsRoutes"));

const { getDashboardStats } = require("./controllers/userController");
const { protect } = require("./middleware/authMiddleware");

app.use("/api/contact", require("./routes/contactRoutes"));

app.get("/api/dashboard/stats", protect, getDashboardStats);

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

const PORT = process.env.PORT || 5000;

createUsersTable()
  .then(() => createCoursesTable())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Server startup error:", err);
    process.exit(1);
  });
