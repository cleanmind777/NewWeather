
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Wind, Thermometer, CalendarIcon, Globe } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import Image from 'next/image';

import type { WeatherData, TemperatureUnit, WindSpeedUnit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { summarizeWeather } from '@/ai/flows/summarize-weather';
import { getWeatherInfo } from '@/components/weather-icons';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


import { CurrentWeather } from '@/components/current-weather';
import { HourlyForecast } from '@/components/hourly-forecast';
import { DailyForecast } from '@/components/daily-forecast';
import { WeatherSkeleton } from '@/components/weather-skeleton';
import { HistoricalWeather } from '@/components/historical-weather';

const formSchema = z.object({
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tempUnit: z.enum(['celsius', 'fahrenheit']),
  windUnit: z.enum(['kmh', 'mph']),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function WeatherPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
      tempUnit: 'celsius',
      windUnit: 'kmh',
    },
  });

  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    const longitude = (x / width) * 360 - 180;
    const latitude = 90 - (y / height) * 180;

    form.setValue('latitude', latitude);
    form.setValue('longitude', longitude);
    
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1`);
      const geoData = await geoRes.json();
      if (geoData.results?.[0]) {
        const result = geoData.results[0];
        const locationParts = [result.name, result.admin1, result.country].filter(Boolean);
        const locationName = locationParts.join(', ');
        form.setValue('location', locationName);
        toast({
          title: "Location Selected",
          description: `Showing weather for ${locationName}`,
        });
      } else {
        const locationName = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
        form.setValue('location', locationName);
        toast({
            title: "Location Selected",
            description: `Showing weather for ${locationName}`,
        });
      }
    } catch (error) {
      const locationName = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
      form.setValue('location', locationName);
      toast({
        title: "Location Selected",
        description: `Showing weather for ${locationName}`,
    });
    }

    // Automatically submit form on map click
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setWeatherData(null);
    try {
      let latitude: number | undefined = values.latitude;
      let longitude: number | undefined = values.longitude;
      let name: string = values.location || 'Selected Location';

      if (!latitude || !longitude) {
        if (!values.location) {
          throw new Error('Please enter a location or select a point on the map.');
        }
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${values.location}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results?.[0]) {
          throw new Error('Location not found. Please try another.');
        }
        const result = geoData.results[0];
        latitude = result.latitude;
        longitude = result.longitude;
        const locationParts = [result.name, result.admin1, result.country].filter(Boolean);
        name = locationParts.join(', ');
        form.setValue('location', name);
      }

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

      if (date?.from && date?.to) {
        weatherParams.append('start_date', format(date.from, 'yyyy-MM-dd'));
        weatherParams.append('end_date', format(date.to, 'yyyy-MM-dd'));
      }

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`);
      const rawWeatherData = await weatherRes.json();
      
      if (rawWeatherData.error) {
        throw new Error(rawWeatherData.reason || 'Failed to fetch weather data.');
      }

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
              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="search"><MapPin className="mr-2 h-4 w-4" />Search by Name</TabsTrigger>
                  <TabsTrigger value="map"><Globe className="mr-2 h-4 w-4" />Select on Map</TabsTrigger>
                </TabsList>
                <TabsContent value="search" className="pt-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                           <FormControl>
                            <Input placeholder="e.g., New York, 90210, or coordinates" {...field} className="text-lg" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="map" className="pt-4">
                   <div 
                      className="relative w-full aspect-[2/1] bg-muted rounded-lg overflow-hidden cursor-pointer group"
                      onClick={handleMapClick}
                    >
                    <Image 
                      src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=2070&auto=format&fit=crop"
                      alt="World Map"
                      fill
                      className="object-cover group-hover:opacity-80 transition-opacity"
                      data-ai-hint="world map"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-semibold">Click to select a location</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField
                  control={form.control}
                  name="tempUnit"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2"><Thermometer className="h-4 w-4"/> Temperature</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="celsius" id="celsius" /></FormControl>
                            <FormLabel htmlFor="celsius" className="font-normal">Celsius (°C)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="fahrenheit" id="fahrenheit" /></FormControl>
                            <FormLabel htmlFor="fahrenheit" className="font-normal">Fahrenheit (°F)</FormLabel>
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
                      <FormLabel className="flex items-center gap-2"><Wind className="h-4 w-4"/> Wind Speed</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="kmh" id="kmh" /></FormControl>
                            <FormLabel htmlFor="kmh" className="font-normal">km/h</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl><RadioGroupItem value="mph" id="mph" /></FormControl>
                            <FormLabel htmlFor="mph" className="font-normal">mph</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                       <FormLabel className="mb-2.5">Historical Data (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal",
                                !date?.from && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date?.from ? (
                                date.to ? (
                                  <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(date.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={date?.from}
                              selected={date}
                              onSelect={setDate}
                              numberOfMonths={2}
                              disabled={(day) => day > subDays(new Date(), 1) || day < new Date("1940-01-01")}
                            />
                          </PopoverContent>
                        </Popover>
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
          {date?.from && date?.to ? (
            <HistoricalWeather data={weatherData} />
          ) : (
            <>
              <CurrentWeather data={weatherData} />
              <HourlyForecast data={weatherData} />
              <DailyForecast data={weatherData} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
