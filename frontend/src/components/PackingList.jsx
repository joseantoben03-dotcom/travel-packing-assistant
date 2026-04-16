import React, { useState, useEffect } from "react";
import apiService from "../services/apiService";

const PackingList = ({ destination }) => {
  const [items, setItems] = useState([]);
  const [categories] = useState([
    "Clothes",
    "Toiletries",
    "Electronics",
    "Documents",
    "Other",
  ]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Suggested items based on weather
  const suggestedItems = () => {
    if (!destination) return [];

    if (destination.weather?.toLowerCase().includes("cold")) {
      return [
        { name: "Jacket", category: "Clothes", priority: "high" },
        { name: "Gloves", category: "Clothes", priority: "medium" },
        { name: "Thermal Wear", category: "Clothes", priority: "high" },
      ];
    }

    if (destination.weather?.toLowerCase().includes("hot")) {
      return [
        { name: "Sunglasses", category: "Accessories", priority: "medium" },
        { name: "Sunscreen", category: "Toiletries", priority: "high" },
        { name: "Cap", category: "Clothes", priority: "low" },
      ];
    }

    return [
      { name: "Passport", category: "Documents", priority: "high" },
      { name: "Phone Charger", category: "Electronics", priority: "high" },
      { name: "Toothbrush", category: "Toiletries", priority: "medium" },
    ];
  };

  // Filter out suggested items that already exist
  const filteredSuggestedItems = suggestedItems().filter(
    (sItem) => !items.some((i) => i.name === sItem.name)
  );

  // Fetch items when destination changes
  useEffect(() => {
    if (destination?._id) {
      fetchItems(destination._id);
    }
  }, [destination]);

  const fetchItems = async (destinationId) => {
    try {
      const data = await apiService.getItems(destinationId);
      setItems(data);
    } catch (err) {
      console.error("❌ Failed to fetch packing list:", err);
    }
  };

  const handleToggleItem = async (id) => {
    try {
      const updated = await apiService.toggleItemPacked(id);
      setItems((prev) =>
        prev.map((i) => (i._id === id ? updated : i))
      );
    } catch (err) {
      console.error("❌ Failed to toggle item:", err);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await apiService.deleteItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error("❌ Failed to delete item:", err);
    }
  };

  const handleAddSuggestedItem = async (item) => {
    try {
      const newItem = await apiService.addItem({
        name: item.name,
        category: item.category || "General",
        priority: item.priority || "medium",
        destinationId: destination._id,
      });
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error("❌ Failed to add suggested item:", err);
    }
  };

  // Filtering
  const filteredItems = items.filter((item) => {
    const statusMatch =
      filter === "all" ||
      (filter === "packed" && item.packed) ||
      (filter === "unpacked" && !item.packed);

    const categoryMatch =
      categoryFilter === "all" || item.category === categoryFilter;

    const priorityMatch =
      priorityFilter === "all" || item.priority === priorityFilter;

    return statusMatch && categoryMatch && priorityMatch;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const packedCount = items.filter((i) => i.packed).length;
  const totalCount = items.length;
  const progressPercentage =
    totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  if (!destination) {
    return (
      <div className="packing-list-empty">
        <h3>Select a destination to view your packing list</h3>
      </div>
    );
  }

  return (
    <div className="packing-list">
      {/* Header */}
      <div className="packing-list-header">
        <div className="destination-info">
          <h2>{destination.name}</h2>
          <p>Date: {destination.startDate || "Not set"} - {destination.endDate || "Not set"}</p>
          <p>Weather: {destination.weather || "Unknown"}</p>
        </div>
        <div className="packing-progress">
          <p>
            {packedCount} of {totalCount} items packed (
            {Math.round(progressPercentage)}%)
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Suggested Items */}
      {filteredSuggestedItems.length > 0 && (
        <div className="suggested-items">
          <h3>Suggested Items</h3>
          <div className="suggested-grid">
            {filteredSuggestedItems.map((item, idx) => (
              <button
                key={idx}
                className="suggested-btn"
                onClick={() => handleAddSuggestedItem(item)}
              >
                ➕ {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Items</option>
          <option value="unpacked">To Pack</option>
          <option value="packed">Packed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Items */}
      {Object.keys(groupedItems).length === 0 ? (
        <p>No items found. Add something!</p>
      ) : (
        Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="category-section">
            <h3>{category} ({categoryItems.length})</h3>
            <div className="items-grid">
              {categoryItems.map((item) => (
                <div
                  key={item._id}
                  className={`item-card ${item.packed ? "packed" : "unpacked"}`}
                >
                  <input
                    type="checkbox"
                    checked={item.packed}
                    onChange={() => handleToggleItem(item._id)}
                  />
                  <span>{item.name}</span>
                  <span>{getPriorityIcon(item.priority)}</span>
                  <button onClick={() => handleDeleteItem(item._id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PackingList;
