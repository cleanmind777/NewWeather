'use client';

import type { WeatherData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWeatherInfo } from './weather-icons';
import { format } from 'date-fns';

interface DailyForecastProps {
  data: WeatherData;
}

export function DailyForecast({ data }: DailyForecastProps) {
  const dailyData = data.daily.time.map((time, index) => {
    const { icon: WeatherIcon, description } = getWeatherInfo(data.daily.weather_code[index]);
    return {
      time,
      WeatherIcon,
      description,
      tempMax: data.daily.temperature_2m_max[index],
      tempMin: data.daily.temperature_2m_min[index],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">7-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {dailyData.map((day, index) => (
          <div key={day.time} className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
            <p className="font-semibold">{index === 0 ? 'Today' : format(new Date(day.time), 'eee')}</p>
            <day.WeatherIcon className="w-12 h-12 my-2 text-primary" strokeWidth={1.5} />
            <p className="text-sm capitalize text-center text-muted-foreground mb-2 h-10">{day.description}</p>
            <div className="flex gap-2 font-medium">
              <span className="text-accent-foreground">{Math.round(day.tempMax)}°</span>
              <span className="text-muted-foreground">{Math.round(day.tempMin)}°</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
