const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./config/mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const evaluationUpdateRoutes = require("./routes/evaluationUpdateRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const studentRoutes = require("./routes/studentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL1,
  process.env.FRONTEND_URL2,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/evaluationUpdate", evaluationUpdateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/files", uploadRoutes);
app.use("/api/quiz", quizRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
