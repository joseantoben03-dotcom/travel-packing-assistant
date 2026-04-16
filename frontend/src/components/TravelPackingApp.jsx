import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Trash2, Edit3 } from 'lucide-react';
import WeatherCard from './WeatherCard';
import apiService from '../services/apiService';

const TravelPackingApp = () => {
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [packingList, setPackingList] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [showAddDestination, setShowAddDestination] = useState(false);
  const [newDestination, setNewDestination] = useState({
    name: '',
    country: '',
    startDate: '',
    endDate: '',
    weather: '',
  });
  const [editTripId, setEditTripId] = useState(null);
  const [error, setError] = useState('');

  // Fetch trips
  const fetchTrips = async () => {
    try {
      const data = await apiService.getDestinations();
      setTrips(data);
      if (data.length > 0 && !currentTrip) {
        setCurrentTrip(data[0]);
        fetchPackingList(data[0]._id);
        fetchSuggestedItems(data[0]);
      }
    } catch {
      setError('Failed to fetch trips');
    }
  };

  // Fetch packing items
  const fetchPackingList = async (tripId) => {
    try {
      const data = await apiService.getItems(tripId);
      setPackingList(data);
    } catch {
      setError('Failed to fetch packing list');
    }
  };

  // Add or update destination
  const saveDestination = async () => {
    const { name, country, startDate, endDate, weather } = newDestination;
    if (!name || !country || !startDate || !endDate) {
      setError('Please fill all destination details');
      return;
    }

    try {
      if (editTripId) {
        await apiService.updateDestination(editTripId, newDestination);
        setEditTripId(null);
      } else {
        await apiService.createDestination(newDestination);
      }
      setNewDestination({ name: '', country: '', startDate: '', endDate: '', weather: '' });
      setShowAddDestination(false);
      fetchTrips();
    } catch {
      setError(editTripId ? 'Failed to update destination' : 'Failed to add destination');
    }
  };

  // Edit destination
  const editDestination = (trip) => {
    setEditTripId(trip._id);
    setNewDestination({
      name: trip.name,
      country: trip.country,
      startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
      endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
      weather: trip.weather || '',
    });
    setShowAddDestination(true);
  };

  // Delete destination
  const deleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await apiService.deleteDestination(tripId);
      if (currentTrip?._id === tripId) {
        setCurrentTrip(null);
        setPackingList([]);
      }
      fetchTrips();
    } catch {
      setError('Failed to delete trip');
    }
  };

  // Add packing item
  const addPackingItem = async () => {
    if (!newItemName.trim() || !currentTrip) return;
    try {
      await apiService.addItem({ name: newItemName, destinationId: currentTrip._id });
      setNewItemName('');
      fetchPackingList(currentTrip._id);
    } catch {
      setError('Failed to add item');
    }
  };

  // Toggle packed status
  const toggleItemPacked = async (itemId) => {
    try {
      const updatedItem = await apiService.toggleItemPacked(itemId);
      setPackingList(prev => prev.map(i => i._id === itemId ? updatedItem : i));
    } catch {
      setError('Failed to update item');
    }
  };

  // Remove item
  const removePackingItem = async (itemId) => {
    try {
      await apiService.deleteItem(itemId);
      setPackingList(prev => prev.filter(i => i._id !== itemId));
    } catch {
      setError('Failed to remove item');
    }
  };

  // Suggested items from API based on destination weather
  const [suggestedItemsList, setSuggestedItemsList] = useState([]);

  const fetchSuggestedItems = async (destination) => {
    try {
      const data = await apiService.getSuggestedItems(destination.name);
      setSuggestedItemsList(data || []);
    } catch {
      setSuggestedItemsList([]);
    }
  };

  const addSuggestedItem = async (item) => {
    if (!currentTrip) return;
    try {
      await apiService.addItem({
        name: item.name,
        category: item.category || 'General',
        priority: item.priority || 'medium',
        destinationId: currentTrip._id,
      });
      fetchPackingList(currentTrip._id);
    } catch {
      setError('Failed to add suggested item');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => { fetchTrips(); }, []);

  const packedCount = packingList.filter(i => i.packed).length;
  const progressPercent = packingList.length ? (packedCount / packingList.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">🧳 Smart Travel Packing Assistant</h1>
        {error && <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Destinations */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">My Destinations</h2>
              <button onClick={() => setShowAddDestination(!showAddDestination)} className="bg-blue-500 text-white p-2 rounded-full">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {showAddDestination && (
              <div className="mb-3 p-3 border border-gray-200 rounded bg-gray-50">
                <input type="text" placeholder="City" value={newDestination.name} onChange={e => setNewDestination({...newDestination, name: e.target.value})} className="w-full p-2 border rounded mb-2" />
                <input type="text" placeholder="Country" value={newDestination.country} onChange={e => setNewDestination({...newDestination, country: e.target.value})} className="w-full p-2 border rounded mb-2" />
                <input type="date" value={newDestination.startDate} onChange={e => setNewDestination({...newDestination, startDate: e.target.value})} className="w-full p-2 border rounded mb-2" />
                <input type="date" value={newDestination.endDate} onChange={e => setNewDestination({...newDestination, endDate: e.target.value})} className="w-full p-2 border rounded mb-2" />
                <input type="text" placeholder="Weather (cold/hot/rain)" value={newDestination.weather} onChange={e => setNewDestination({...newDestination, weather: e.target.value})} className="w-full p-2 border rounded mb-2" />
                <div className="flex gap-2">
                  <button onClick={saveDestination} className="bg-green-500 text-white px-4 py-2 rounded">{editTripId ? 'Update' : 'Add'}</button>
                  <button onClick={() => { setShowAddDestination(false); setEditTripId(null); }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {trips.map(trip => (
                <div key={trip._id} onClick={() => { setCurrentTrip(trip); fetchPackingList(trip._id); fetchSuggestedItems(trip); }} className={`p-3 border rounded cursor-pointer ${currentTrip?._id === trip._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2"/> {trip.name}, {trip.country}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); editDestination(trip); }} className="text-yellow-500 hover:text-yellow-700">
                        <Edit3 className="w-4 h-4"/>
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteTrip(trip._id); }} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-6">
            {currentTrip && (
              <>
                <WeatherCard destination={currentTrip} addSuggestedItem={addSuggestedItem} />

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Packing List</h2>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Add new item..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyPress={e => e.key === 'Enter' && addPackingItem()} className="px-3 py-1 border rounded"/>
                      <button onClick={addPackingItem} className="bg-green-500 text-white px-4 py-1 rounded flex items-center">
                        <Plus className="w-4 h-4 mr-1"/> Add Item
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full h-4 bg-gray-200 rounded">
                      <div className="h-4 bg-green-500 rounded" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <p className="text-sm mt-1">{packedCount} / {packingList.length} items packed</p>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {packingList.map(item => (
                      <div key={item._id} className={`flex justify-between items-center p-2 border rounded ${item.packed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center">
                          <input type="checkbox" checked={item.packed} onChange={() => toggleItemPacked(item._id)} className="mr-2"/>
                          <span className={item.packed ? 'line-through text-gray-500' : ''}>{item.name}</span>
                        </div>
                        <button onClick={() => removePackingItem(item._id)} className="text-red-500 hover:text-red-700">🗑️</button>
                      </div>
                    ))}
                  </div>

                  {/* Suggested Items */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Suggested Items</h3>
                    <div className="flex gap-2 flex-wrap">
                      {suggestedItemsList.map((item, idx) => (
                        <button key={idx} onClick={() => addSuggestedItem(item)} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">+ {item.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelPackingApp;
