const pool = require("../config/db");

const runMigration = async () => {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN DEFAULT false
    `);
    console.log("Migration done: is_pro and has_purchased columns added");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
};

module.exports = { runMigration };
