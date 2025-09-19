'use server';

/**
 * @fileOverview A weather summarization AI agent.
 *
 * - summarizeWeather - A function that handles the weather summarization process.
 * - SummarizeWeatherInput - The input type for the summarizeWeather function.
 * - SummarizeWeatherOutput - The return type for the summarizeWeather function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWeatherInputSchema = z.object({
  location: z.string().describe('The location for which to summarize the weather.'),
  currentTemperature: z.number().describe('The current temperature in Celsius.'),
  hourlyForecast: z.array(z.object({
    time: z.string(),
    temperature: z.number(),
    precipitation: z.number(),
    windSpeed: z.number(),
  })).describe('The hourly forecast data.'),
  dailyForecast: z.array(z.object({
    time: z.string(),
    temperatureHigh: z.number(),
    temperatureLow: z.number(),
    description: z.string(),
  })).describe('The daily forecast data.'),
});
export type SummarizeWeatherInput = z.infer<typeof SummarizeWeatherInputSchema>;

const SummarizeWeatherOutputSchema = z.object({
  summary: z.string().describe('A short summary of the weather conditions.'),
});
export type SummarizeWeatherOutput = z.infer<typeof SummarizeWeatherOutputSchema>;

export async function summarizeWeather(input: SummarizeWeatherInput): Promise<SummarizeWeatherOutput> {
  return summarizeWeatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWeatherPrompt',
  input: {schema: SummarizeWeatherInputSchema},
  output: {schema: SummarizeWeatherOutputSchema},
  prompt: `You are a weather reporter.  Your job is to summarize the weather for a location, given current conditions and forecast data.

Location: {{{location}}}
Current Temperature: {{{currentTemperature}}}°C

Hourly Forecast:
{{#each hourlyForecast}}
  - {{{time}}}: {{{temperature}}}°C, {{{precipitation}}}mm precipitation, {{{windSpeed}}} km/h wind
{{/each}}

Daily Forecast:
{{#each dailyForecast}}
  - {{{time}}}: High {{{temperatureHigh}}}°C, Low {{{temperatureLow}}}°C, {{{description}}}
{{/each}}

Write a concise summary of the weather.  Reason about whether to describe current temperatures or future events like storms, if any exist.`,
});

const summarizeWeatherFlow = ai.defineFlow(
  {
    name: 'summarizeWeatherFlow',
    inputSchema: SummarizeWeatherInputSchema,
    outputSchema: SummarizeWeatherOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
