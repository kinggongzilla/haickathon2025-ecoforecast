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
}

export default function PredictionChart({ predictions }: PredictionChartProps) {
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

      dailyData.push({
        name: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
            label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
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

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Energy Saving Tips</h3>
        <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
          <li>Upgrade to energy-efficient LED lighting</li>
          <li>Install a programmable thermostat to optimize heating/cooling</li>
          <li>Improve insulation and seal air leaks</li>
          <li>Consider upgrading to ENERGY STAR certified appliances</li>
          <li>Use natural ventilation when possible to reduce AC usage</li>
        </ul>
      </div>
    </div>
  );
}
