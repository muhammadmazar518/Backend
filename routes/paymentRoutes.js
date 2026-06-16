const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../config/db");
const { protect } = require("../middleware/authMiddleware");

router.post("/create-checkout-session", protect, async (req, res) => {
  try {
    const { planName, amount, billingPeriod } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
            },
            unit_amount: amount * 100,
            recurring: {
              interval: billingPeriod === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "http://localhost:5173/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/pricing?payment=cancel",
      metadata: {
        userId: req.user.id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify", async (req, res) => {
  const { session_id } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const userId = session.metadata?.userId;

      if (userId) {
        await pool.query(
          "UPDATE users SET is_pro = true, has_purchased = true WHERE id = $1",
          [userId]
        );
      }

      res.json({ success: true, plan: "pro" });
    } else {
      res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Verification error" });
  }
});

module.exports = router;

