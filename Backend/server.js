import app from "./app.js"
import http from "http"
import { Server } from "socket.io"

const PORT = process.env.PORT || 3000

const server = http.createServer(app)

const allowedOrigins = process.env.ALLOW_URL
  ? process.env.ALLOW_URL.split(",").map(origin => origin.trim())
  : []

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.set("io", io)

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id)

  socket.on("joinCoupon", (code) => {
    socket.join(code);
    console.log(`Socket ${socket.id} joined coupon room ${code}`);
  });

  socket.on("leaveCoupon", (code) => {
    socket.leave(code);
    console.log(`Socket ${socket.id} left coupon room ${code}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Server running`)
})
