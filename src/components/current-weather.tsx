'use client';

import type { WeatherData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWeatherInfo } from './weather-icons';
import { Wind } from 'lucide-react';

interface CurrentWeatherProps {
  data: WeatherData;
}

export function CurrentWeather({ data }: CurrentWeatherProps) {
  const { icon: WeatherIcon, description } = getWeatherInfo(data.current.weather_code);

  return (
    <Card className="bg-gradient-to-br from-primary/20 to-background">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Location: {data.locationName}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex items-center gap-6">
          <WeatherIcon className="w-24 h-24 text-primary" strokeWidth={1.5}/>
          <div>
            <p className="text-7xl font-bold">
              {Math.round(data.current.temperature_2m)}
              <span className="text-3xl align-top">{data.current_units.temperature_2m}</span>
            </p>
            <p className="text-lg text-muted-foreground capitalize">{description}</p>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Wind className="w-5 h-5" />
              <span>{Math.round(data.current.wind_speed_10m)} {data.current_units.wind_speed_10m}</span>
            </div>
          </div>
        </div>
        <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
            <h3 className="font-semibold text-lg text-accent-foreground mb-2">AI Summary</h3>
            <p className="text-muted-foreground">{data.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
