require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { setIO } = require("./sockets/socket");
const connectDb = require("./config/db");

const app = express();

connectDb();

const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL;

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

setIO(io);

io.on("connection", (socket) => {
  console.log("Client Connected");

  socket.on("disconnect", () => {
    console.log("Client Disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("AeroSurvey Manager API Running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/drones", require("./routes/droneRoutes"));
app.use("/api/missions", require("./routes/missionRoutes"));
app.use( "/api/dashboard",require("./routes/dashboardRoutes"));

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});