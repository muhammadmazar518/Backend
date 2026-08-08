const pool = require("../config/db");

const createServicesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      price VARCHAR(100),
      icon VARCHAR(20) DEFAULT '🌐',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log("Services table ready");
  } catch (err) {
    console.error("Error creating services table:", err.message);
  }
};

module.exports = { createServicesTable };
