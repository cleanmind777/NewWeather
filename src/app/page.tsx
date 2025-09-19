import { WeatherPage } from '@/components/weather-page';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold text-primary font-headline tracking-tight">
                NewWeather
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Your daily forecast with a touch of AI insight.
            </p>
        </header>
        
        <WeatherPage />
      </div>
    </main>
  );
}
