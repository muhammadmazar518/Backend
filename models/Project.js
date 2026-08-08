const pool = require("../config/db");

const createProjectsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Planning',
      icon VARCHAR(20) DEFAULT '📁',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log("Projects table ready");
  } catch (err) {
    console.error("Error creating projects table:", err.message);
  }
};

module.exports = { createProjectsTable };
