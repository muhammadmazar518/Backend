const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { protect: authenticateToken } = require("../middleware/authMiddleware");

// Get all
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM services WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create
router.post("/", authenticateToken, async (req, res) => {
  const { title, description, price, icon } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO services (user_id, title, description, price, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, title, description, price, icon]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update ✅
router.put("/:id", authenticateToken, async (req, res) => {
  const { title, description, price, icon } = req.body;
  try {
    const result = await pool.query(
      "UPDATE services SET title=$1, description=$2, price=$3, icon=$4 WHERE id=$5 AND user_id=$6 RETURNING *",
      [title, description, price, icon, req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM services WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;