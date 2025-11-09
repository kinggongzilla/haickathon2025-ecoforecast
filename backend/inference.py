import pandas as pd  # requires: pip install 'pandas[pyarrow]'
from chronos import Chronos2Pipeline
from data_processing import run_full_analysis
import os

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHARACTERISTICS_CSV = os.path.join(SCRIPT_DIR, "transformed", "house_characteristics_clean.csv")
TIME_SERIES_CSV = os.path.join(SCRIPT_DIR, "transformed", "time_series.csv")

def make_prediction(pipeline, state, sqft, county_name=None, bedrooms=None, vintage=None,
                       geometry_building_type_recs=None, heating_fuel=None,
                       cooling_setpoint=None, windows=None, insulation_wall=None,
                       refrigerator=None, clothes_washer=None):
    """
    Predict electricity consumption using Chronos2 model based on real building data

    Required parameters:
    - state: State abbreviation
    - sqft: Square footage

    Optional parameters:
    - All other building characteristics

    Returns:
    - DataFrame with predictions
    """

    # Build query dictionary with correct CSV column names
    query = {
        'in.state': state,
        'in.sqft..ft2': sqft
    }

    # Add optional parameters if provided
    if county_name:
        query['in.county_name'] = county_name
    if bedrooms:
        query['in.bedrooms'] = bedrooms
    if vintage:
        query['in.vintage'] = vintage
    if geometry_building_type_recs:
        query['in.geometry_building_type_recs'] = geometry_building_type_recs
    if heating_fuel:
        query['in.heating_fuel'] = heating_fuel
    if cooling_setpoint:
        query['in.cooling_setpoint'] = cooling_setpoint
    if windows:
        query['in.windows'] = windows
    if insulation_wall:
        query['in.insulation_wall'] = insulation_wall
    if refrigerator:
        query['in.refrigerator'] = refrigerator
    if clothes_washer:
        query['in.clothes_washer'] = clothes_washer

    # Try to get historical data with all parameters
    context_df = run_full_analysis(
        query=query,
        characteristics_csv=CHARACTERISTICS_CSV,
        time_series_csv=TIME_SERIES_CSV
    )

    # If no results with all parameters, try progressive relaxation
    if context_df is None or context_df.empty:
        print(f"No buildings found with all parameters. Trying with only required parameters (state, sqft)...")

        # Retry with only required parameters
        relaxed_query = {
            'in.state': state,
            'in.sqft..ft2': sqft
        }

        context_df = run_full_analysis(
            query=relaxed_query,
            characteristics_csv=CHARACTERISTICS_CSV,
            time_series_csv=TIME_SERIES_CSV
        )

        if context_df is None or context_df.empty:
            raise ValueError(
                f"No similar buildings found in database for state={state}, sqft={sqft}. "
                "Please try different parameters."
            )

    print(f"Using historical data from similar buildings: {len(context_df)} data points")

    # Clean up the DataFrame - remove duplicate columns if they exist
    # The run_full_analysis function sometimes creates duplicate 'ID' columns
    if 'ID' in context_df.columns and context_df.columns.tolist().count('ID') > 1:
        # Keep only the first ID column and drop duplicates
        context_df = context_df.loc[:, ~context_df.columns.duplicated()]

    # Ensure we have the required columns
    required_columns = ['ID', 'timestamp', 'target']
    if not all(col in context_df.columns for col in required_columns):
        raise ValueError(f"Missing required columns. Found: {context_df.columns.tolist()}, Expected: {required_columns}")

    # Select only the columns we need
    context_df = context_df[required_columns].copy()

    # Fix: The ID column should be constant (all same value) for a single time series
    # Currently each row has a unique ID, which makes Chronos think there are 2922 series with 1 point each
    # We need 1 time series with 2922 points
    context_df['ID'] = 'building_0'  # Set all rows to the same ID (representing one building/time series)

    # Ensure timestamp is in datetime format and sorted
    context_df['timestamp'] = pd.to_datetime(context_df['timestamp'])
    context_df = context_df.sort_values('timestamp').reset_index(drop=True)

    # Handle duplicate timestamps by averaging the target values
    # This happens because create_continuous_profile concatenates historical and original data with overlap
    print(f"Before deduplication: {len(context_df)} rows")
    context_df = context_df.groupby(['ID', 'timestamp'], as_index=False)['target'].mean()
    print(f"After deduplication: {len(context_df)} rows")

    # Sort again after groupby
    context_df = context_df.sort_values('timestamp').reset_index(drop=True)

    # Verify we have enough data points
    print(f"Final context data shape: {context_df.shape}")
    print(f"Date range: {context_df['timestamp'].min()} to {context_df['timestamp'].max()}")

    # Check frequency
    time_diffs = context_df['timestamp'].diff().dropna()
    print(f"Unique time intervals: {time_diffs.unique()[:5]}")  # Show first 5 unique intervals

    # Generate predictions using real historical consumption data
    # Note: Data has 4 datapoints per day (6-hour intervals)
    # For 12 months: 4 datapoints/day × 365 days = 1,460 prediction points
    pred_df = pipeline.predict_df(
        context_df,
        prediction_length=1460,  # Forecast 12 months ahead (4 datapoints/day × 365 days)
        quantile_levels=[0.1, 0.5, 0.9],  # Quantiles for probabilistic forecast
        id_column="ID",  # Column identifying different time series
        timestamp_column="timestamp",  # Column with datetime information
        target="target",  # Column with electricity consumption values to predict
    )

    return pred_df

#if name main
if __name__ == "__main__":
    # Load the model
    print("Loading Chronos2 model...")
    pipeline = Chronos2Pipeline.from_pretrained("amazon/chronos-2", device_map="cuda")
    print("Model loaded successfully!")
    
    # Example usage
    predictions = make_prediction(state="CA", sqft=2000)
    print(predictions.head())