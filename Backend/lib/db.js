import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

// ✅ Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ใช้ URL ที่ Render ให้
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL database connected successfully");
    client.release();
  } catch (err) {
    console.error("PostgreSQL connection failed:", err.message);
    process.exit(1);
  }
})();

// Error handling
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
  process.exit(1);
});

// Query helper (แทน pool.execute)
export const executeQuery = async (query, params = []) => {
  const { rows } = await pool.query(query, params);
  return rows;
};

// Enhanced query helper with transaction support
export const executeQueryWithTransaction = async (queries) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const { query, params } of queries) {
      const { rows } = await client.query(query, params);
      results.push(rows);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Single query helper (สำหรับการ query เดี่ยว)
export const executeSingleQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(query, params);
    return rows;
  } finally {
    client.release();
  }
};

export default pool;