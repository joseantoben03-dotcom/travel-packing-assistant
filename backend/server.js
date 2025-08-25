const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travelPacking", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error(err));

// Modelsz
const Destination = require("./models/Destination");
const Item = require("./models/Item");

// Routes
app.use("/api/destinations", require("./routes/destinationRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
