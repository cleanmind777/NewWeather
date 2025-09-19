'use client';

import type { WeatherData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { format } from 'date-fns';

interface HistoricalWeatherProps {
  data: WeatherData;
}

export function HistoricalWeather({ data }: HistoricalWeatherProps) {
  const historicalData = data.daily.time.map((time, index) => ({
    time: format(new Date(time), 'MMM d'),
    'High': data.daily.temperature_2m_max[index],
    'Low': data.daily.temperature_2m_min[index],
  }));

  const chartConfig = {
    'High': {
      label: `High Temp (${data.daily_units.temperature_2m_max})`,
      color: "hsl(var(--chart-2))",
    },
    'Low': {
      label: `Low Temp (${data.daily_units.temperature_2m_min})`,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Historical Weather for {data.locationName}</CardTitle>
        <CardDescription>
          Showing data from {format(new Date(data.daily.time[0]), 'PPP')} to {format(new Date(data.daily.time[data.daily.time.length - 1]), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[400px]">
          <ResponsiveContainer>
            <LineChart data={historicalData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}°`}
              />
              <ChartTooltip
                cursor={true}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line dataKey="High" type="monotone" stroke="var(--color-High)" strokeWidth={2} dot={false} />
              <Line dataKey="Low" type="monotone" stroke="var(--color-Low)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
