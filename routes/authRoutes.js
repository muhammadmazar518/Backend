const express = require("express");
const router = express.Router();
const passport = require("../passport");
const { signup, login, logout } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login?error=google_failed",
  }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  }
);

module.exports = router;