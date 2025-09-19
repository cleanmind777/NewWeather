import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  type LucideProps,
} from 'lucide-react';
import type { ReactElement } from 'react';

type WeatherInfo = {
  icon: (props: LucideProps) => ReactElement;
  description: string;
};

const weatherCodeMap: Record<number, WeatherInfo> = {
  0: { icon: Sun, description: 'Clear sky' },
  1: { icon: CloudSun, description: 'Mainly clear' },
  2: { icon: Cloud, description: 'Partly cloudy' },
  3: { icon: Cloud, description: 'Overcast' },
  45: { icon: CloudFog, description: 'Fog' },
  48: { icon: CloudFog, description: 'Depositing rime fog' },
  51: { icon: CloudDrizzle, description: 'Light drizzle' },
  53: { icon: CloudDrizzle, description: 'Moderate drizzle' },
  55: { icon: CloudDrizzle, description: 'Dense drizzle' },
  56: { icon: CloudDrizzle, description: 'Light freezing drizzle' },
  57: { icon: CloudDrizzle, description: 'Dense freezing drizzle' },
  61: { icon: CloudRain, description: 'Slight rain' },
  63: { icon: CloudRain, description: 'Moderate rain' },
  65: { icon: CloudRain, description: 'Heavy rain' },
  66: { icon: CloudRain, description: 'Light freezing rain' },
  67: { icon: CloudRain, description: 'Heavy freezing rain' },
  71: { icon: CloudSnow, description: 'Slight snow fall' },
  73: { icon: CloudSnow, description: 'Moderate snow fall' },
  75: { icon: CloudSnow, description: 'Heavy snow fall' },
  77: { icon: CloudSnow, description: 'Snow grains' },
  80: { icon: CloudRain, description: 'Slight rain showers' },
  81: { icon: CloudRain, description: 'Moderate rain showers' },
  82: { icon: CloudRain, description: 'Violent rain showers' },
  85: { icon: CloudSnow, description: 'Slight snow showers' },
  86: { icon: CloudSnow, description: 'Heavy snow showers' },
  95: { icon: CloudLightning, description: 'Thunderstorm' },
  96: { icon: CloudLightning, description: 'Thunderstorm with slight hail' },
  99: { icon: CloudLightning, description: 'Thunderstorm with heavy hail' },
};

export function getWeatherInfo(code: number): WeatherInfo {
  return weatherCodeMap[code] || { icon: Cloud, description: 'Unknown' };
}
