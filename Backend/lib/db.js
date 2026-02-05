import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

// Test connection
pool
  .getConnection()
  .then((connection) => {
    console.log("MySQL database connected successfully")
    connection.release()
  })
  .catch((err) => {
    console.error("MySQL connection failed:", err.message)
    process.exit(1)
  })

pool.on("error", (err) => {
  console.error("Unexpected MySQL error:", err)
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("MySQL connection was lost.")
  }
  if (err.code === "ETIMEDOUT") {
    console.error("MySQL connection timed out.")
  }
})

export const executeQuery = async (query, params = []) => {
  const [rows] = await pool.execute(query, params)
  return rows
}

export default pool
