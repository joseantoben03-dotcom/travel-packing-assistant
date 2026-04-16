import React, { useState, useEffect } from 'react';

const WeatherCard = ({ destination, addSuggestedItem }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate mock weather
  const getMockWeatherData = (city) => {
    const conditions = [
      { condition: 'sunny', temp: 25, humidity: 45, wind: 15, icon: '☀️' },
      { condition: 'cloudy', temp: 20, humidity: 60, wind: 10, icon: '☁️' },
      { condition: 'rainy', temp: 18, humidity: 80, wind: 20, icon: '🌧️' },
      { condition: 'partly cloudy', temp: 22, humidity: 55, wind: 12, icon: '⛅' }
    ];
    const hash = city.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const base = conditions[hash % conditions.length];
    return {
      ...base,
      city,
      country: destination.country,
      temp: base.temp + Math.floor(Math.random()*10-5),
      description: `${base.condition} skies`,
      feelsLike: base.temp + Math.floor(Math.random()*6-3),
      forecast: Array.from({length:5},(_,i)=>({
        day: new Date(Date.now()+(i+1)*86400000).toLocaleDateString('en-US',{weekday:'short'}),
        icon: conditions[Math.floor(Math.random()*conditions.length)].icon,
        high: base.temp + Math.floor(Math.random()*8-2),
        low: base.temp - Math.floor(Math.random()*8-2)
      }))
    };
  };

  useEffect(() => {
    if(!destination) return;
    setLoading(true);
    setError(null);
    const timer = setTimeout(()=>{
      try { setWeather(getMockWeatherData(destination.name)); }
      catch { setError('Failed to load weather'); }
      finally { setLoading(false); }
    }, 500);
    return ()=>clearTimeout(timer);
  }, [destination]);

  const packingSuggestions = (w) => {
    if(!w) return [];
    const s=[];
    if(w.temp>25){s.push('🩳 Light clothing','🧴 Sunscreen','🕶️ Sunglasses');}
    else if(w.temp<10){s.push('🧥 Warm layers','🧤 Gloves & hat','👢 Warm boots');}
    else s.push('👕 Layered clothing','🧥 Light jacket');
    if(w.condition.includes('rain')||w.humidity>70) s.push('☂️ Umbrella','🧥 Waterproof jacket');
    if(w.wind>15) s.push('🧢 Hat','🧥 Windproof clothes');
    return s.slice(0,3);
  };

  if(!destination) return null;

  return (
    <div className="weather-card bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-lg mb-2">Weather Forecast</h3>
      <span className="text-sm text-gray-500 mb-3 block">{destination.name}, {destination.country}</span>

      {loading && <div className="text-gray-500">Loading weather...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {weather && !loading && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{weather.icon}</div>
            <div>
              <div className="text-xl font-semibold">{weather.temp}°C</div>
              <div className="text-sm text-gray-600">{weather.description}</div>
              <div className="text-sm text-gray-500">Feels like {weather.feelsLike}°C</div>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div>💧 {weather.humidity}% Humidity</div>
            <div>💨 {weather.wind} km/h Wind</div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">5-Day Forecast</h4>
            <div className="flex gap-2 overflow-x-auto">
              {weather.forecast.map((d,i)=>(
                <div key={i} className="p-2 bg-gray-100 rounded text-center min-w-[60px]">
                  <div>{d.day}</div>
                  <div>{d.icon}</div>
                  <div><span className="font-semibold">{d.high}°</span>/<span>{d.low}°</span></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Packing Suggestions</h4>
            <div className="flex gap-2 flex-wrap">
              {packingSuggestions(weather).map((s,i)=>{
                const cleanName = s.replace(/^[\p{Emoji}\s]+/u, '').trim();
                return (
                  <button key={i} className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    onClick={()=>addSuggestedItem?.({name: cleanName, category: 'Accessories', packed: false})}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherCard;
