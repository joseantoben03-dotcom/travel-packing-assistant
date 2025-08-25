import axios from "axios";

let API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
if (!API_BASE_URL.endsWith("/api")) API_BASE_URL += "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  console.log(`📡 ${config.method?.toUpperCase()} → ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const handleError = (error, msg) => {
  console.error(msg, error.response?.data || error.message);
  throw error;
};

export const apiService = {
  // Destinations
  getDestinations: async () => {
    try {
      const res = await api.get("/destinations");
      return res.data;
    } catch (e) {
      handleError(e, "Fetch destinations failed");
    }
  },

  createDestination: async (data) => {
    try {
      const res = await api.post("/destinations", data);
      return res.data;
    } catch (e) {
      handleError(e, "Create destination failed");
    }
  },

  updateDestination: async (id, updates) => {
    try {
      const res = await api.put(`/destinations/${id}`, updates);
      return res.data;
    } catch (e) {
      handleError(e, "Update destination failed");
    }
  },

  deleteDestination: async (id) => {
    try {
      const res = await api.delete(`/destinations/${id}`);
      return res.data;
    } catch (e) {
      handleError(e, "Delete destination failed");
    }
  },

  // Items
  getItems: async (destinationId) => {
    try {
      const res = await api.get(`/items/${destinationId}`);
      return res.data;
    } catch (e) {
      handleError(e, "Fetch items failed");
    }
  },

  addItem: async (itemData) => {
    try {
      const res = await api.post("/items", itemData);
      return res.data;
    } catch (e) {
      handleError(e, "Add item failed");
    }
  },

  editItem: async (itemId, updates) => {
    try {
      const res = await api.put(`/items/${itemId}`, updates);
      return res.data;
    } catch (e) {
      handleError(e, "Edit item failed");
    }
  },

  toggleItemPacked: async (itemId) => {
    try {
      const res = await api.patch(`/items/${itemId}/toggle`);
      return res.data;
    } catch (e) {
      handleError(e, "Toggle packed status failed");
    }
  },

  deleteItem: async (itemId) => {
    try {
      const res = await api.delete(`/items/${itemId}`);
      return res.data;
    } catch (e) {
      handleError(e, "Delete item failed");
    }
  },

  getSuggestedItems: async (destinationName) => {
    try {
      const res = await api.get(`/items/suggestions/${destinationName}`);
      return res.data;
    } catch (e) {
      handleError(e, "Fetch suggested items failed");
    }
  },
};

export default apiService;
