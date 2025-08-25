import React from 'react';

const AddDestinationModal = ({ onClose, onAdd, newDestination, setNewDestination }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(e);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">Add New Destination</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              value={newDestination.name || ''}
              onChange={(e) => setNewDestination((prev) => ({ ...prev, name: e.target.value }))}
              className="form-input"
              placeholder="Enter city name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              value={newDestination.country || ''}
              onChange={(e) => setNewDestination((prev) => ({ ...prev, country: e.target.value }))}
              className="form-input"
              placeholder="Enter country name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={newDestination.startDate || ''}
              onChange={(e) => setNewDestination((prev) => ({ ...prev, startDate: e.target.value }))}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={newDestination.endDate || ''}
              onChange={(e) => setNewDestination((prev) => ({ ...prev, endDate: e.target.value }))}
              className="form-input"
              required
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Add Destination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDestinationModal;