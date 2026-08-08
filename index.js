const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");

dotenv.config();

const requiredEnv = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SESSION_SECRET",
  "DATABASE_URL",
];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(`${envName} is missing`);
  }
}

const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY
);

const pool = require("./config/db");

require("./passport");

const { createUsersTable } = require("./models/User");
const { createCoursesTable } = require("./models/Course");
const { createServicesTable } = require("./models/Service");
const { createProjectsTable } = require("./models/Project");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  "https://frontend-ml44.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.post(
  "/api/payment/webhook",
  express.raw({
    type: "application/json",
  }),
  async (req, res) => {
    const signature =
      req.headers["stripe-signature"];

    if (!signature) {
      return res
        .status(400)
        .send("Stripe signature missing");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res
        .status(400)
        .send(`Webhook Error: ${err.message}`);
    }

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const checkoutSession =
        event.data.object;

      const userId =
        checkoutSession.metadata?.userId;

      const customerEmail =
        checkoutSession.customer_details?.email;

      try {
        let result;

        if (userId) {
          result = await pool.query(
            `
            UPDATE users
            SET
              is_pro = $1,
              has_purchased = $2
            WHERE id = $3
            `,
            [true, true, userId]
          );
        } else if (customerEmail) {
          result = await pool.query(
            `
            UPDATE users
            SET
              is_pro = $1,
              has_purchased = $2
            WHERE email = $3
            `,
            [true, true, customerEmail]
          );
        } else {
          return res.status(400).json({
            error: "User information missing",
          });
        }

        if (result.rowCount === 0) {
          return res.status(404).json({
            error: "User not found",
          });
        }
      } catch (dbErr) {
        return res.status(500).json({
          error: "Database update failed",
        });
      }
    }

    return res.json({
      received: true,
    });
  }
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",

      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  "/api/payment",
  paymentRoutes
);

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/user",
  require("./routes/userRoutes")
);

app.use(
  "/api/courses",
  require("./routes/courseRoutes")
);

app.use(
  "/api/services",
  require("./routes/servicesRoutes")
);

app.use(
  "/api/projects",
  require("./routes/projectsRoutes")
);

app.use(
  "/api/contact",
  require("./routes/contactRoutes")
);

const {
  getDashboardStats,
} = require("./controllers/userController");

const {
  protect,
} = require("./middleware/authMiddleware");

app.get(
  "/api/dashboard/stats",
  protect,
  getDashboardStats
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS error",
    });
  }

  return res.status(500).json({
    error: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await createUsersTable();
    await createCoursesTable();
    await createServicesTable();
    await createProjectsTable();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(
      "Server startup failed:",
      err
    );

    process.exit(1);
  }
}

startServer();

