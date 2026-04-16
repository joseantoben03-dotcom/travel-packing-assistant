const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/destinations", require("./routes/destinationRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
