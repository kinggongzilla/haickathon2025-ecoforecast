'use client';

import { useState } from 'react';

interface BuildingFormData {
  'in.state': string;
  'in.sqft..ft2': number;
  'in.bedrooms'?: number;
  'in.vintage'?: string;
  'in.geometry_building_type_recs'?: string;
  'in.heating_fuel'?: string;
  'in.windows'?: string;
  'in.insulation_wall'?: string;
}

interface BuildingFormProps {
  onSubmit: (data: BuildingFormData) => void;
  isLoading: boolean;
}

const STATES = [
  "AL", "FL", "TX", "TN", "AR", "MT", "ID", "PA", "IL", "CA", "OH", "NE", "UT", "OK",
  "NY", "MA", "MD", "VA", "NC", "MN", "WI", "GA", "MS", "NJ", "KS", "OR", "DC", "DE",
  "NM", "RI", "WY", "VT", "LA", "CO", "IA", "NV", "MO", "SC", "AZ", "ND", "CT", "IN",
  "AK", "MI", "WA", "KY", "NH", "HI", "ME", "WV", "SD"
];

const BEDROOMS = [1, 2, 3, 4, 5];

const VINTAGES = [
  "<1940", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s"
];

const BUILDING_TYPES = [
  "Single-Family Detached",
  "Single-Family Attached",
  "Multi-Family with 2 - 4 Units",
  "Multi-Family with 5+ Units",
  "Mobile Home"
];

const HEATING_FUELS = [
  "Natural Gas", "Electricity", "Fuel Oil", "Propane", "Wood", "Other Fuel"
];

const WINDOWS = [
  "Single, Clear, Metal",
  "Single, Clear, Non-metal",
  "Single, Clear, Metal, Exterior Clear Storm",
  "Single, Clear, Non-metal, Exterior Clear Storm",
  "Double, Clear, Metal, Air",
  "Double, Clear, Non-metal, Air",
  "Double, Clear, Metal, Air, Exterior Clear Storm",
  "Double, Clear, Non-metal, Air, Exterior Clear Storm",
  "Double, Low-E, Non-metal, Air, M-Gain",
  "Triple, Low-E, Non-metal, Air, L-Gain"
];

const INSULATION_WALL = [
  "Wood Stud, Uninsulated",
  "Wood Stud, R-7",
  "Wood Stud, R-11",
  "Wood Stud, R-15",
  "Wood Stud, R-19",
  "Brick, 12-in, 3-wythe, Uninsulated",
  "Brick, 12-in, 3-wythe, R-7",
  "Brick, 12-in, 3-wythe, R-11",
  "Brick, 12-in, 3-wythe, R-15",
  "Brick, 12-in, 3-wythe, R-19",
  "CMU, 6-in Hollow, Uninsulated",
  "CMU, 6-in Hollow, R-7",
  "CMU, 6-in Hollow, R-11",
  "CMU, 6-in Hollow, R-19"
];

export default function BuildingForm({ onSubmit, isLoading }: BuildingFormProps) {
  const [formData, setFormData] = useState<BuildingFormData>({
    'in.state': '',
    'in.sqft..ft2': 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof BuildingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Building Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Fields */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            State <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData['in.state']}
            onChange={(e) => handleInputChange('in.state', e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select a state</option>
            {STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Square Footage (ft²) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            value={formData['in.sqft..ft2'] || ''}
            onChange={(e) => handleInputChange('in.sqft..ft2', parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
            placeholder="e.g., 2000"
          />
        </div>

        {/* Optional Fields */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Bedrooms
          </label>
          <select
            value={formData['in.bedrooms'] || ''}
            onChange={(e) => handleInputChange('in.bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select bedrooms</option>
            {BEDROOMS.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Vintage
          </label>
          <select
            value={formData['in.vintage'] || ''}
            onChange={(e) => handleInputChange('in.vintage', e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select vintage</option>
            {VINTAGES.map(vintage => (
              <option key={vintage} value={vintage}>{vintage}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Building Type
          </label>
          <select
            value={formData['in.geometry_building_type_recs'] || ''}
            onChange={(e) => handleInputChange('in.geometry_building_type_recs', e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select building type</option>
            {BUILDING_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Heating Fuel
          </label>
          <select
            value={formData['in.heating_fuel'] || ''}
            onChange={(e) => handleInputChange('in.heating_fuel', e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select heating fuel</option>
            {HEATING_FUELS.map(fuel => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Windows
          </label>
          <select
            value={formData['in.windows'] || ''}
            onChange={(e) => handleInputChange('in.windows', e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select window type</option>
            {WINDOWS.map(window => (
              <option key={window} value={window}>{window}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Wall Insulation
          </label>
          <select
            value={formData['in.insulation_wall'] || ''}
            onChange={(e) => handleInputChange('in.insulation_wall', e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select wall insulation</option>
            {INSULATION_WALL.map(insulation => (
              <option key={insulation} value={insulation}>{insulation}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
      >
        {isLoading ? 'Generating Forecast...' : 'Generate 12-Month Forecast'}
      </button>
    </form>
  );
}
