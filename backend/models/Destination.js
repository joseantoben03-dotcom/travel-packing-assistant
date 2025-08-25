const mongoose = require("mongoose");

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  weather: { type: String, default: "" }, 
});

module.exports = mongoose.models.Destination || mongoose.model("Destination", DestinationSchema);
