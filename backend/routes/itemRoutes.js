const express = require("express");
const mongoose = require("mongoose");
const Item = require("../models/Item");
const Destination = require("../models/Destination");

const router = express.Router();

// -----------------------------
// CREATE ITEM
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { name, category, priority, destinationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ error: "Invalid destination ID" });
    }

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }

    const item = await Item.create({
      name,
      category: category || "General",
      priority: priority || "medium",
      destinationId,
      packed: false,
    });

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// SUGGESTED ITEMS BASED ON DESTINATION WEATHER
// (MUST be before /:destinationId to avoid route collision)
// -----------------------------
const suggestedItemsByWeather = {
  sunny: [
    { name: "Sunglasses", category: "Accessories", priority: "medium" },
    { name: "Sunscreen", category: "Toiletries", priority: "high" },
    { name: "Hat/Cap", category: "Clothes", priority: "low" },
  ],
  rainy: [
    { name: "Umbrella", category: "Accessories", priority: "medium" },
    { name: "Raincoat", category: "Clothes", priority: "high" },
  ],
  cold: [
    { name: "Jacket", category: "Clothes", priority: "high" },
    { name: "Gloves", category: "Clothes", priority: "medium" },
    { name: "Thermal Wear", category: "Clothes", priority: "high" },
  ],
  default: [
    { name: "Passport", category: "Documents", priority: "high" },
    { name: "Phone Charger", category: "Electronics", priority: "high" },
    { name: "Toothbrush", category: "Toiletries", priority: "medium" },
  ],
};

router.get("/suggestions/:destinationName", async (req, res) => {
  try {
    const { destinationName } = req.params;
    const destination = await Destination.findOne({ name: destinationName });
    let weatherKey = "default";

    if (destination?.weather) {
      const w = destination.weather.toLowerCase();
      if (w.includes("cold")) weatherKey = "cold";
      else if (w.includes("hot") || w.includes("sunny")) weatherKey = "sunny";
      else if (w.includes("rain")) weatherKey = "rainy";
    }

    res.json(suggestedItemsByWeather[weatherKey]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suggested items" });
  }
});

// -----------------------------
// READ ITEMS FOR DESTINATION
// -----------------------------
router.get("/:destinationId", async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ error: "Invalid destination ID" });
    }

    const items = await Item.find({ destinationId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// UPDATE ITEM
// -----------------------------
router.put("/:id", async (req, res) => {
  try {
    const { name, category, priority } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { name, category, priority },
      { new: true }
    );

    if (!item) return res.status(404).json({ error: "Item not found" });

    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------
// TOGGLE PACKED STATUS
// -----------------------------
router.patch("/:id/toggle", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.packed = !item.packed;
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// DELETE ITEM
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }

    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
