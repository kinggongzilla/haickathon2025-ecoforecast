'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PredictionData {
  timestamp: string;
  '0.25': number;
  '0.5': number;
  '0.75': number;
  [key: string]: any;
}

interface PredictionChartProps {
  predictions: PredictionData[];
  energyAdvice?: string[];
}

export default function PredictionChart({ predictions, energyAdvice }: PredictionChartProps) {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  // Transform the data for better display
  // Aggregate 6-hourly predictions (4 per day) into daily averages
  // Expected: 1,460 predictions (4 datapoints/day × 365 days)
  const aggregateToDailyAverages = (data: PredictionData[]) => {
    const dailyData = [];
    const pointsPerDay = 4; // 6-hour intervals = 4 datapoints per day

    for (let i = 0; i < data.length; i += pointsPerDay) {
      const dayPredictions = data.slice(i, i + pointsPerDay);

      if (dayPredictions.length === 0) break;

      // Calculate average for each quantile
      const avg25 = dayPredictions.reduce((sum, p) => sum + (p['0.25'] || 0), 0) / dayPredictions.length;
      const avg50 = dayPredictions.reduce((sum, p) => sum + (p['0.5'] || 0), 0) / dayPredictions.length;
      const avg75 = dayPredictions.reduce((sum, p) => sum + (p['0.75'] || 0), 0) / dayPredictions.length;

      // Generate date for this day (starting from tomorrow)
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + (i / pointsPerDay) + 1);

      // Format as "Month YY" (e.g., "Nov 25", "Dec 25", "Jan 26")
      const month = futureDate.toLocaleDateString('en-US', { month: 'short' });
      const year = futureDate.getFullYear().toString().slice(-2); // Last 2 digits of year
      const formattedDate = `${month} ${year}`;

      dailyData.push({
        name: formattedDate,
        date: futureDate,
        'Lower Bound (25%)': avg25,
        'Median (50%)': avg50,
        'Upper Bound (75%)': avg75,
      });
    }

    return dailyData;
  };

  const chartData = aggregateToDailyAverages(predictions);

  return (
    <div className="w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">12-Month Energy Forecast</h2>

      <div className="mb-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This chart shows the predicted daily energy consumption for the next 12 months (365 days).
          The median line represents the most likely consumption, while the upper and lower bounds
          show the 75th and 25th percentile predictions.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="name"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            interval={30}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            label={{ value: 'kWh / day', angle: -90, position: 'insideLeft' }}
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Lower Bound (25%)"
            stroke="#93c5fd"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="Median (50%)"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Upper Bound (75%)"
            stroke="#93c5fd"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Energy Saving Recommendations as Cards */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
          {energyAdvice && energyAdvice.length > 0 ? 'Personalized Energy Saving Recommendations' : 'Energy Saving Tips'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {energyAdvice && energyAdvice.length > 0 ? (
            energyAdvice.map((tip, index) => {
              // Choose icon based on card index
              const icons = [
                // Icon 1: Light bulb (energy/efficiency)
                <svg key="icon1" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>,
                // Icon 2: Fire (heating/temperature)
                <svg key="icon2" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>,
                // Icon 3: Home (building/structure)
                <svg key="icon3" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              ];

              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white">
                      {icons[index]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Fallback cards
            <>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      Upgrade to energy-efficient LED lighting to reduce electricity consumption by up to 75%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      Install a programmable thermostat to optimize heating and cooling schedules
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      Improve insulation and seal air leaks to reduce heating and cooling costs by up to 20%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
