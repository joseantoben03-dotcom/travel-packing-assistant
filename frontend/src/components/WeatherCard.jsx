import React, { useState, useEffect } from 'react';

const WeatherCard = ({ destination }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock weather data for demonstration
  const getMockWeatherData = (cityName) => {
    const weatherConditions = [
      { condition: 'sunny', temp: 25, humidity: 45, wind: 15, icon: '☀️' },
      { condition: 'cloudy', temp: 20, humidity: 60, wind: 10, icon: '☁️' },
      { condition: 'rainy', temp: 18, humidity: 80, wind: 20, icon: '🌧️' },
      { condition: 'partly cloudy', temp: 22, humidity: 55, wind: 12, icon: '⛅' }
    ];
    
    // Simple hash function to consistently get weather for same city
    const hash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const weatherIndex = hash % weatherConditions.length;
    const baseWeather = weatherConditions[weatherIndex];
    
    return {
      ...baseWeather,
      city: cityName,
      country: destination.country,
      temp: baseWeather.temp + Math.floor(Math.random() * 10) - 5, // Add some variation
      description: `${baseWeather.condition} skies`,
      feelsLike: baseWeather.temp + Math.floor(Math.random() * 6) - 3,
      forecast: Array.from({ length: 5 }, (_, i) => ({
        day: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        icon: weatherConditions[Math.floor(Math.random() * weatherConditions.length)].icon,
        high: baseWeather.temp + Math.floor(Math.random() * 8) - 2,
        low: baseWeather.temp - Math.floor(Math.random() * 8) - 2,
      }))
    };
  };

  useEffect(() => {
    if (!destination) return;

    setLoading(true);
    setError(null);

    // Simulate API call delay
    const timer = setTimeout(() => {
      try {
        const weatherData = getMockWeatherData(destination.name);
        setWeather(weatherData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load weather data');
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [destination]);

  const getPackingSuggestions = (weather) => {
    if (!weather) return [];

    const suggestions = [];
    
    if (weather.temp > 25) {
      suggestions.push('🩳 Pack light, breathable clothing');
      suggestions.push('🧴 Don\'t forget sunscreen');
      suggestions.push('🕶️ Bring sunglasses');
    } else if (weather.temp < 10) {
      suggestions.push('🧥 Pack warm layers');
      suggestions.push('🧤 Bring gloves and hat');
      suggestions.push('👢 Pack warm boots');
    } else {
      suggestions.push('👕 Pack layered clothing');
      suggestions.push('🧥 Bring a light jacket');
    }

    if (weather.condition.includes('rain') || weather.humidity > 70) {
      suggestions.push('☂️ Pack an umbrella');
      suggestions.push('🧥 Bring a waterproof jacket');
    }

    if (weather.wind > 15) {
      suggestions.push('🧢 Pack a hat or cap');
      suggestions.push('🧥 Bring windproof clothing');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  if (!destination) return null;

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h3 className="weather-title">Weather Forecast</h3>
        <span className="weather-location">
          {destination.name}, {destination.country}
        </span>
      </div>

      {loading && (
        <div className="weather-loading">
          <div className="loading-spinner"></div>
          <span>Loading weather...</span>
        </div>
      )}

      {error && (
        <div className="weather-error">
          <span className="error-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {weather && !loading && (
        <>
          <div className="current-weather">
            <div className="weather-main">
              <div className="weather-icon">{weather.icon}</div>
              <div className="weather-temp">{weather.temp}°C</div>
            </div>
            <div className="weather-details">
              <div className="weather-description">{weather.description}</div>
              <div className="weather-feels-like">Feels like {weather.feelsLike}°C</div>
            </div>
          </div>

          <div className="weather-stats">
            <div className="stat-item">
              <span className="stat-icon">💧</span>
              <div className="stat-content">
                <span className="stat-label">Humidity</span>
                <span className="stat-value">{weather.humidity}%</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💨</span>
              <div className="stat-content">
                <span className="stat-label">Wind</span>
                <span className="stat-value">{weather.wind} km/h</span>
              </div>
            </div>
          </div>

          <div className="weather-forecast">
            <h4 className="forecast-title">5-Day Forecast</h4>
            <div className="forecast-list">
              {weather.forecast.map((day, index) => (
                <div key={index} className="forecast-item">
                  <span className="forecast-day">{day.day}</span>
                  <span className="forecast-icon">{day.icon}</span>
                  <span className="forecast-temps">
                    <span className="high">{day.high}°</span>
                    <span className="low">{day.low}°</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="packing-suggestions">
            <h4 className="suggestions-title">Packing Suggestions</h4>
            <div className="suggestions-list">
              {getPackingSuggestions(weather).map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherCard;