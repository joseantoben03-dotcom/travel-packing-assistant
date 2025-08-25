import React, { useState } from "react";
import apiService from "../services/apiService";

const AddItemModal = ({ destination, onClose, onAdd }) => {
  const [itemName, setItemName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      await apiService.addItem({
        name: itemName,
        destinationId: destination._id, // ✅ link item to destination
      });
      onAdd();  // refresh list in parent
      onClose();
    } catch (err) {
      console.error("❌ Failed to add item:", err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">Add Item to {destination.name}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="form-input"
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-cancel">Cancel</button>
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
