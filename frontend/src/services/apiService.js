import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const WEATHER_KEY  = import.meta.env.VITE_OPENWEATHER_KEY || "5f9ac878a5315be37d031e0798dcd4c5";

const api = axios.create({ baseURL: API_BASE_URL, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) { localStorage.clear(); window.location.href = "/login"; }
    return Promise.reject(err);
  }
);

const handle = (err, msg) => { console.error(msg, err.response?.data || err.message); throw err; };

// ── Weather ──────────────────────────────────────────────────────────────────
export const getCurrentWeather = async (city) => {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric`
  );
  return res.data;
};

export const getForecast = async (city) => {
  const res = await axios.get(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${WEATHER_KEY}&units=metric&cnt=40`
  );
  return res.data;
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  register: async (data) => {
    try { const r = await api.post("/auth/register", data); return r.data; }
    catch (e) { handle(e, "Register failed"); }
  },
  login: async (data) => {
    try { const r = await api.post("/auth/login", data); return r.data; }
    catch (e) { handle(e, "Login failed"); }
  },
};

// ── Destinations ──────────────────────────────────────────────────────────────
export const apiService = {
  getDestinations:    async ()       => { try { const r = await api.get("/destinations");        return r.data; } catch(e){ handle(e,"fetch destinations"); } },
  createDestination:  async (data)   => { try { const r = await api.post("/destinations",data); return r.data; } catch(e){ handle(e,"create destination"); } },
  updateDestination:  async (id,data)=> { try { const r = await api.put(`/destinations/${id}`,data); return r.data; } catch(e){ handle(e,"update destination"); } },
  deleteDestination:  async (id)     => { try { const r = await api.delete(`/destinations/${id}`); return r.data; } catch(e){ handle(e,"delete destination"); } },
  getItems:           async (destId) => { try { const r = await api.get(`/items/${destId}`);    return r.data; } catch(e){ handle(e,"fetch items"); } },
  addItem:            async (data)   => { try { const r = await api.post("/items",data);         return r.data; } catch(e){ handle(e,"add item"); } },
  toggleItemPacked:   async (id)     => { try { const r = await api.patch(`/items/${id}/toggle`); return r.data; } catch(e){ handle(e,"toggle item"); } },
  deleteItem:         async (id)     => { try { const r = await api.delete(`/items/${id}`);     return r.data; } catch(e){ handle(e,"delete item"); } },
};

export default apiService;
