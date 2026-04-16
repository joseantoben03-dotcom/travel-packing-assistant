const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "Other" },
  destinationId: { type: mongoose.Schema.Types.ObjectId, ref: "Destination", required: true },
  packed: { type: Boolean, default: false },
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
});

module.exports = mongoose.models.Item || mongoose.model("Item", ItemSchema);

