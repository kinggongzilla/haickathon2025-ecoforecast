'use client';

import { useState } from 'react';
import BuildingForm from './components/BuildingForm';
import PredictionChart from './components/PredictionChart';

interface BuildingFormData {
  'in.state': string;
  'in.sqft..ft2': number;
  'in.bedrooms'?: number;
  'in.vintage'?: number;
  'in.geometry_building_type_recs'?: string;
  'in.heating_fuel'?: string;
  'in.windows'?: string;
  'in.insulation_wall'?: string;
}

export default function Home() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [energyAdvice, setEnergyAdvice] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleFormSubmit = async (formData: BuildingFormData) => {
    setIsLoading(true);
    setError(null);

    console.log('Submitting form data:', formData);
    console.log('JSON payload:', JSON.stringify(formData));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const endpoint = apiUrl ? `${apiUrl}/building-data` : '/api/building-data';

      console.log('API endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || response.statusText;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.status === 'success') {
        setPredictions(data.predictions);
        setEnergyAdvice(data.energy_advice || []);
        setShowResults(true);
      } else {
        throw new Error(data.message || 'Failed to generate predictions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setPredictions([]);
    setEnergyAdvice([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      <main className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            EcoForecast AI
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            12-Month Building Energy AI Forecast with Energy Reduction Recommendations
          </p>
        </div>

        {/* Show Form or Results */}
        {!showResults ? (
          <>
            {/* Form */}
            <BuildingForm onSubmit={handleFormSubmit} isLoading={isLoading} />

            {/* Error Message */}
            {error && (
              <div className="w-full max-w-2xl mt-8 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="mb-8 flex items-center gap-2 px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-md transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Form
            </button>

            {/* Predictions Chart */}
            {predictions.length > 0 && (
              <PredictionChart predictions={predictions} energyAdvice={energyAdvice} />
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-zinc-500 dark:text-zinc-600">
          <p>Powered by Chronos2 AI Model | NewGB, Linz</p>
        </footer>
      </main>
    </div>
  );
}
