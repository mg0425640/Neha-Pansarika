import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
}

interface UseWeatherProps {
  latitude?: number;
  longitude?: number;
  city?: string;
}

export const useWeather = ({ latitude, longitude, city }: UseWeatherProps = {}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!latitude && !longitude && !city) return;

      setLoading(true);
      setError(null);

      try {
        // Using OpenWeatherMap API (free tier)
        // For production, you should use your own API key
        let url = '';
        
        if (latitude && longitude) {
          url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=demo&units=metric`;
        } else if (city) {
          url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=demo&units=metric`;
        }

        // Mock weather data for demo (replace with actual API call)
        const mockWeatherData: WeatherData = {
          temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
          description: ['Clear sky', 'Partly cloudy', 'Sunny', 'Light rain'][Math.floor(Math.random() * 4)],
          icon: '01d',
          humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
          windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
          city: city || 'Mumbai',
          country: 'IN'
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setWeather(mockWeatherData);
      } catch (err) {
        setError('Failed to fetch weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude, city]);

  return { weather, loading, error };
};