import db from "../lib/db.js"

export const health = async (req, res) => {
 try {
    await db.query("SELECT 1")
    res.status(200).json({
      status: "healthy",
      database: "connected",
    })
  } catch (err) {
    console.error("Health check DB error:", err.message)
    res.status(503).json({
      status: "unhealthy",
    })
  }
}

 export const server = (req, res) => {
  res.json({
    message: "Restaurant API v1.0",
    status: "running",
    timestamp: new Date().toISOString(),
  })
}
