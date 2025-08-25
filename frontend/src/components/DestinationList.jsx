import React from 'react';

const DestinationList = ({ destinations, onSelectDestination, selectedDestination, onEditDestination, onDeleteDestination }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="destination-list">
      <div className="destination-list-header">
        <h2 className="destination-list-title">My Destinations</h2>
      </div>
      
      {destinations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✈️</div>
          <h3 className="empty-state-title">No destinations yet</h3>
          <p className="empty-state-text">Add your first destination to start planning your trip!</p>
        </div>
      ) : (
        <div className="destination-grid">
          {destinations.map((destination) => (
            <div 
              key={destination._id} 
              className={`destination-card ${selectedDestination?._id === destination._id ? 'selected' : ''}`}
              onClick={() => onSelectDestination(destination)}
            >
              <div className="destination-card-header">
                <div className="destination-info">
                  <h3 className="destination-name">{destination.name}</h3>
                  <p className="destination-country">{destination.country}</p>
                </div>
                <div className="destination-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDestination(destination);
                    }}
                    title="Edit destination"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDestination(destination._id);
                    }}
                    title="Delete destination"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="destination-details">
                <div className="date-range">
                  <span className="date-label">From:</span>
                  <span className="date-value">{formatDate(destination.startDate)}</span>
                </div>
                <div className="date-range">
                  <span className="date-label">To:</span>
                  <span className="date-value">{formatDate(destination.endDate)}</span>
                </div>
                <div className="trip-duration">
                  <span className="duration-value">
                    {calculateDays(destination.startDate, destination.endDate)} days
                  </span>
                </div>
              </div>
              
              <div className="destination-footer">
                <div className="packing-status">
                  <span className="status-text">
                    {destination.packedItems || 0} / {destination.totalItems || 0} items packed
                  </span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${destination.totalItems ? 
                          (destination.packedItems / destination.totalItems) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationList;
