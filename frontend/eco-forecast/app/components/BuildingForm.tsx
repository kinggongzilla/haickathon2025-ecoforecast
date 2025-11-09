'use client';

import { useState } from 'react';

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

interface BuildingFormProps {
  onSubmit: (data: BuildingFormData) => void;
  isLoading: boolean;
}

// State mapping: code -> full name
const STATE_LABELS: { [key: string]: string } = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
  "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
  "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
  "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
  "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
  "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
  "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon",
  "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
  "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia",
  "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
};

const STATES = [
  "AL", "FL", "TX", "TN", "AR", "MT", "ID", "PA", "IL", "CA", "OH", "NE", "UT", "OK",
  "NY", "MA", "MD", "VA", "NC", "MN", "WI", "GA", "MS", "NJ", "KS", "OR", "DC", "DE",
  "NM", "RI", "WY", "VT", "LA", "CO", "IA", "NV", "MO", "SC", "AZ", "ND", "CT", "IN",
  "AK", "MI", "WA", "KY", "NH", "HI", "ME", "WV", "SD"
];

const BEDROOMS = [1, 2, 3, 4, 5];

const VINTAGES = [
  1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010
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

// Window options with user-friendly labels
const WINDOWS: { [key: string]: string } = {
  "Single, Clear, Metal": "Single-Pane, Metal Frame",
  "Single, Clear, Non-metal": "Single-Pane, Wood/Vinyl Frame",
  "Single, Clear, Metal, Exterior Clear Storm": "Single-Pane, Metal Frame with Storm Window",
  "Single, Clear, Non-metal, Exterior Clear Storm": "Single-Pane, Wood/Vinyl Frame with Storm Window",
  "Double, Clear, Metal, Air": "Double-Pane, Metal Frame",
  "Double, Clear, Non-metal, Air": "Double-Pane, Wood/Vinyl Frame",
  "Double, Clear, Metal, Air, Exterior Clear Storm": "Double-Pane, Metal Frame with Storm Window",
  "Double, Clear, Non-metal, Air, Exterior Clear Storm": "Double-Pane, Wood/Vinyl Frame with Storm Window",
  "Double, Low-E, Non-metal, Air, M-Gain": "Double-Pane, Low-E Coating (Medium-Gain)",
  "Triple, Low-E, Non-metal, Air, L-Gain": "Triple-Pane, Low-E Coating (Low-Gain)"
};

// Wall insulation options with user-friendly labels
const INSULATION_WALL: { [key: string]: string } = {
  "Wood Stud, Uninsulated": "Wood Frame - No Insulation",
  "Wood Stud, R-7": "Wood Frame - R-7 Insulation (Minimal)",
  "Wood Stud, R-11": "Wood Frame - R-11 Insulation (Basic)",
  "Wood Stud, R-15": "Wood Frame - R-15 Insulation (Good)",
  "Wood Stud, R-19": "Wood Frame - R-19 Insulation (Better)",
  "Brick, 12-in, 3-wythe, Uninsulated": "Brick Wall - No Insulation",
  "Brick, 12-in, 3-wythe, R-7": "Brick Wall - R-7 Insulation (Minimal)",
  "Brick, 12-in, 3-wythe, R-11": "Brick Wall - R-11 Insulation (Basic)",
  "Brick, 12-in, 3-wythe, R-15": "Brick Wall - R-15 Insulation (Good)",
  "Brick, 12-in, 3-wythe, R-19": "Brick Wall - R-19 Insulation (Better)",
  "CMU, 6-in Hollow, Uninsulated": "Concrete Block - No Insulation",
  "CMU, 6-in Hollow, R-7": "Concrete Block - R-7 Insulation (Minimal)",
  "CMU, 6-in Hollow, R-11": "Concrete Block - R-11 Insulation (Basic)",
  "CMU, 6-in Hollow, R-19": "Concrete Block - R-19 Insulation (Good)"
};

export default function BuildingForm({ onSubmit, isLoading }: BuildingFormProps) {
  const [formData, setFormData] = useState<BuildingFormData>({
    'in.state': '',
    'in.sqft..ft2': 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof BuildingFormData, value: string | number | undefined) => {
    if (value === undefined) {
      const { [field]: _, ...rest } = formData;
      setFormData(rest as BuildingFormData);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
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
              <option key={state} value={state}>{STATE_LABELS[state]}</option>
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
            Construction Year
          </label>
          <input
            type="number"
            value={formData['in.vintage'] || ''}
            onChange={(e) => handleInputChange('in.vintage', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
            placeholder="e.g., 1990"
            min="1900"
            max="2024"
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Building Type
          </label>
          <select
            value={formData['in.geometry_building_type_recs'] || ''}
            onChange={(e) => handleInputChange('in.geometry_building_type_recs', e.target.value || undefined)}
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
            onChange={(e) => handleInputChange('in.heating_fuel', e.target.value || undefined)}
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
            onChange={(e) => handleInputChange('in.windows', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select window type</option>
            {Object.entries(WINDOWS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Wall Insulation
          </label>
          <select
            value={formData['in.insulation_wall'] || ''}
            onChange={(e) => handleInputChange('in.insulation_wall', e.target.value || undefined)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Select wall insulation</option>
            {Object.entries(INSULATION_WALL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
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
