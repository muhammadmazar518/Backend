const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

const isLocalHost = /localhost|127\.0\.0\.1|::1/.test(
  new URL(databaseUrl).hostname
);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalHost
    ? false
    : { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
});

// Prevent crashes when an idle client is killed by the host/proxy.
pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client:", err.message);
});

pool.connect((err) => {
  if (err) {
    console.error("PostgreSQL connection error:", err.message);
  } else {
    console.log("PostgreSQL Connected");
  }
});

// Transient connection failures (ECONNRESET / proxy closing idle sockets)
// get one retry with a fresh pooled client before surfacing the error.
const isConnectionError = (err) => {
  const msg = (err && err.message) || "";
  return (
    err?.code === "ECONNRESET" ||
    msg.includes("ECONNRESET") ||
    msg.includes("Connection terminated") ||
    msg.includes("connection terminated") ||
    err?.code === "57P01" || // terminating connection (admin shutdown)
    err?.code === "57P02" || // terminating connection (crash)
    err?.code === "57P03"    // cannot connect now
  );
};

const originalQuery = pool.query.bind(pool);

pool.query = async (text, params) => {
  try {
    return await originalQuery(text, params);
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn("[db] Connection reset — retrying query once:", String(text).slice(0, 80));
      await new Promise((resolve) => setTimeout(resolve, 250));
      return await originalQuery(text, params);
    }
    throw err;
  }
};

module.exports = pool;
