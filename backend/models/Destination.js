const mongoose = require("mongoose");

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  startDate: { type: Date, required: false },
  endDate: { type: Date, required: false },
  weather: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
});

module.exports = mongoose.models.Destination || mongoose.model("Destination", DestinationSchema);
