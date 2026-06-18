const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../config/db");

const createCheckout = async (req, res) => {
  const { plan } = req.body;

  const prices = {
    monthly: { amount: 1900, name: "Professional Monthly" },
    yearly: { amount: 9900, name: "Professional Yearly" },
  };

  const selected = prices[plan] || prices.monthly;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: selected.name },
          unit_amount: selected.amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      metadata: {
        userId: req.user.id.toString(),
        plan,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Payment error" });
  }
};


const verifyPayment = async (req, res) => {
  const { session_id } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const userId = session.metadata.userId;


      await pool.query(
        "UPDATE users SET is_pro = true, has_purchased = true WHERE id = $1",
        [userId]
      );

      res.json({ success: true, plan: "pro" });
    } else {
      res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Verification error" });
  }
};

module.exports = { createCheckout, verifyPayment };
