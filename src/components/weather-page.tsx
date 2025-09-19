'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Wind, Thermometer } from 'lucide-react';

import type { WeatherData, TemperatureUnit, WindSpeedUnit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { summarizeWeather } from '@/ai/flows/summarize-weather';
import { getWeatherInfo } from '@/components/weather-icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CurrentWeather } from '@/components/current-weather';
import { HourlyForecast } from '@/components/hourly-forecast';
import { DailyForecast } from '@/components/daily-forecast';
import { WeatherSkeleton } from '@/components/weather-skeleton';

const formSchema = z.object({
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
  tempUnit: z.enum(['celsius', 'fahrenheit']),
  windUnit: z.enum(['kmh', 'mph']),
});

type FormValues = z.infer<typeof formSchema>;

export function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
      tempUnit: 'celsius',
      windUnit: 'kmh',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setWeatherData(null);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${values.location}&count=1`);
      const geoData = await geoRes.json();
      if (!geoData.results?.[0]) {
        throw new Error('Location not found. Please try another.');
      }
      const { latitude, longitude, name } = geoData.results[0];

      const weatherParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: 'temperature_2m,weather_code,wind_speed_10m',
        hourly: 'temperature_2m,precipitation_probability,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        temperature_unit: values.tempUnit,
        wind_speed_unit: values.windUnit,
      });

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`);
      const rawWeatherData = await weatherRes.json();
      
      if (rawWeatherData.error) {
        throw new Error(rawWeatherData.reason || 'Failed to fetch weather data.');
      }

      // Prepare data for AI summary
      const hourlyForecastForAI = rawWeatherData.hourly.time.slice(0, 24).map((time: string, index: number) => ({
        time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temperature: Math.round(rawWeatherData.hourly.temperature_2m[index]),
        precipitation: rawWeatherData.hourly.precipitation_probability[index],
        windSpeed: Math.round(rawWeatherData.hourly.wind_speed_10m[index]),
      }));
      
      const dailyForecastForAI = rawWeatherData.daily.time.map((time: string, index: number) => ({
        time: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
        temperatureHigh: Math.round(rawWeatherData.daily.temperature_2m_max[index]),
        temperatureLow: Math.round(rawWeatherData.daily.temperature_2m_min[index]),
        description: getWeatherInfo(rawWeatherData.daily.weather_code[index]).description,
      }));

      const summaryResult = await summarizeWeather({
        location: name,
        currentTemperature: Math.round(rawWeatherData.current.temperature_2m),
        hourlyForecast: hourlyForecastForAI,
        dailyForecast: dailyForecastForAI,
      });
      
      setWeatherData({ ...rawWeatherData, summary: summaryResult.summary, locationName: name });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="e.g., New York, 90210, or coordinates" {...field} className="pl-10 text-lg" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-8">
                <FormField
                  control={form.control}
                  name="tempUnit"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <Label className="flex items-center gap-2"><Thermometer className="h-4 w-4"/> Temperature</Label>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="celsius" id="celsius" /></FormControl>
                            <Label htmlFor="celsius">Celsius (°C)</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="fahrenheit" id="fahrenheit" /></FormControl>
                            <Label htmlFor="fahrenheit">Fahrenheit (°F)</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="windUnit"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <Label className="flex items-center gap-2"><Wind className="h-4 w-4"/> Wind Speed</Label>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="kmh" id="kmh" /></FormControl>
                            <Label htmlFor="kmh">km/h</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="mph" id="mph" /></FormControl>
                            <Label htmlFor="mph">mph</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Fetching Forecast...' : 'Get Weather'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {loading && <WeatherSkeleton />}
      
      {weatherData && (
        <div className="animate-in fade-in-50 duration-500 space-y-8">
          <CurrentWeather data={weatherData} />
          <HourlyForecast data={weatherData} />
          <DailyForecast data={weatherData} />
        </div>
      )}
    </div>
  );
}
