const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./config/db");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        let user;

        if (result.rows.length === 0) {

          const insertResult = await pool.query(
            "INSERT INTO users (name, email, password, is_pro, has_purchased, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [name, email, "google_oauth", false, false, profile.photos[0]?.value || null]
          );


          user = insertResult.rows[0];
        } else {
          user = result.rows[0];
        }

        const userId = user.id || user.user_id;

        if (!userId) {
          throw new Error("User ID not found in database rows");
        }

        const token = jwt.sign(
          {
            id: userId,
            email: user.email,
            is_pro: user.is_pro,
            has_purchased: user.has_purchased,
            avatar: profile.photos[0]?.value || null, // ✅ Google photo add karo
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        return done(null, { user, token });
      } catch (err) {
        console.error("Passport Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

module.exports = passport;