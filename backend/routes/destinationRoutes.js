const express = require("express");
const mongoose = require("mongoose");
const Destination = require("../models/Destination");
const Item = require("../models/Item");

const router = express.Router();

// Function to generate suggested items
function getSuggestedItems(destination) {
  const items = [];

  // Basic essentials
  items.push({ name: "Passport/ID", category: "Documents" });
  items.push({ name: "Wallet & Money", category: "Essentials" });
  items.push({ name: "Phone & Charger", category: "Electronics" });

  // Weather-based suggestions
  if (destination.weather?.toLowerCase().includes("cold")) {
    items.push({ name: "Jacket", category: "Clothing" });
    items.push({ name: "Gloves", category: "Clothing" });
  } else if (destination.weather?.toLowerCase().includes("hot")) {
    items.push({ name: "Sunscreen", category: "Health" });
    items.push({ name: "Cap/Hat", category: "Clothing" });
    items.push({ name: "Sunglasses", category: "Accessories" });
  } else if (destination.weather?.toLowerCase().includes("rain")) {
    items.push({ name: "Umbrella", category: "Accessories" });
    items.push({ name: "Raincoat", category: "Clothing" });
  }

  // Duration-based (rough idea: >5 days = long trip)
  const start = destination.startDate ? new Date(destination.startDate) : null;
  const end = destination.endDate ? new Date(destination.endDate) : null;
  if (start && end) {
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > 5) {
      items.push({ name: "Extra Clothes", category: "Clothing" });
      items.push({ name: "Travel Laundry Kit", category: "Essentials" });
    }
  }

  return items;
}

// CREATE Destination + suggested items
router.post("/", async (req, res) => {
  try {
    const { name, country, startDate, endDate, weather } = req.body;

    const destination = await Destination.create({
      name,
      country, // ✅ required field added
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      weather,
    });

    // Generate suggested items
    const suggestedItems = getSuggestedItems(destination).map((item) => ({
      ...item,
      destinationId: destination._id,
    }));

    // Insert suggested items into DB
    if (suggestedItems.length > 0) {
      await Item.insertMany(suggestedItems);
    }

    res.json({
      destination,
      suggestedItems, // return them in response too
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all destinations
router.get("/", async (req, res) => {
  try {
    const destinations = await Destination.find();
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Destination (doesn’t auto-add new suggestions to avoid duplicates)
router.put("/:id", async (req, res) => {
  try {
    const { name, country, startDate, endDate, weather } = req.body;

    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      {
        name,
        country, 
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        weather,
      },
      { new: true }
    );

    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }

    res.json(destination);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE Destination + related items
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid destination ID format" });
    }

    const existingDestination = await Destination.findById(req.params.id);
    if (!existingDestination) {
      return res.status(404).json({ error: "Destination not found" });
    }

    await Item.deleteMany({ destinationId: req.params.id });
    await Destination.findByIdAndDelete(req.params.id);

    res.json({ message: "Destination and related items deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
