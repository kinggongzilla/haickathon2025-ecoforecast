import pandas as pd
from rapidfuzz import process, fuzz
import numpy as np

# Define the specific columns you want the fuzzy search to use
SEARCHABLE_COLUMNS = {
    'in.state', 'in.bedrooms', 'in.vintage', 'in.geometry_building_type_recs',
    'in.heating_fuel', 'in.windows', 'in.insulation_wall', 'in.sqft..ft2'
}

def smart_fuzzy_search(df, query_row, threshold=70, limit=10, numeric_weight=0.7, string_weight=0.3, verbose=False):
    """
    Performs a multi-pass intelligent search, prioritizing numeric matches and falling back to fuzzy text.
    Returns the full matching rows.
    """
    if isinstance(query_row, dict):
        query_row = pd.Series(query_row)

    def _search_with_mode(mode):
        if verbose:
            print(f"--- Trying search strategy: {mode.upper()} ---")

        numeric_mask = pd.Series(True, index=df.index)
        numeric_cols_in_query = [col for col in SEARCHABLE_COLUMNS if col in query_row.index and pd.api.types.is_numeric_dtype(df[col])]

        for col in numeric_cols_in_query:
            q_val = query_row[col]
            if pd.isna(q_val): continue

            if mode == 'strict':
                if pd.api.types.is_integer_dtype(df[col]):
                    mask = (df[col] >= q_val - 1) & (df[col] <= q_val + 1)
                else:
                    mask = (df[col] >= q_val * 0.9) & (df[col] <= q_val * 1.1)
            elif mode == 'relaxed':
                if pd.api.types.is_integer_dtype(df[col]):
                    mask = (df[col] >= q_val - 2) & (df[col] <= q_val + 2)
                else:
                    mask = (df[col] >= q_val * 0.75) & (df[col] <= q_val * 1.25)
            else:
                mask = pd.Series(True, index=df.index)
            
            numeric_mask &= mask

        filtered_df = df[numeric_mask]
        if verbose:
            print(f"Numeric filter found {len(filtered_df)} potential matches.")

        if filtered_df.empty:
            if verbose: print("No results found with this numeric filter.\n")
            return None

        text_cols_in_query = [col for col in SEARCHABLE_COLUMNS if col in query_row.index and not pd.api.types.is_numeric_dtype(df[col])]
        
        results = []
        for idx, row in filtered_df.iterrows():
            text_similarities = []
            for col in text_cols_in_query:
                if pd.notna(row[col]) and pd.notna(query_row[col]):
                    similarity = process.extractOne(str(query_row[col]), [str(row[col])], scorer=fuzz.WRatio)[1]
                    text_similarities.append(similarity)
            
            if not text_similarities:
                continue

            text_score = np.mean(text_similarities)
            numeric_score = 0
            if mode != 'none' and numeric_cols_in_query:
                numeric_similarities = []
                for col in numeric_cols_in_query:
                    q_val = query_row[col]
                    col_min, col_max = df[col].min(), df[col].max()
                    if col_max > col_min:
                        normalized_row = (row[col] - col_min) / (col_max - col_min)
                        normalized_query = (q_val - col_min) / (col_max - col_min)
                        similarity = 100 * (1 - abs(normalized_row - normalized_query))
                        numeric_similarities.append(similarity)
                numeric_score = np.mean(numeric_similarities) if numeric_similarities else 0

            overall_score = (numeric_weight * numeric_score) + (string_weight * text_score)
            if overall_score >= threshold:
                results.append((idx, overall_score))

        if not results:
            if verbose: print("No results met the final similarity threshold.\n")
            return None
            
        results.sort(key=lambda x: x[1], reverse=True)
        final_results = results[:limit]
        
        similar_indices = [idx for idx, score in final_results]
        # THIS LINE GETS THE FULL ROW
        result_df = df.loc[similar_indices].copy() 
        similarity_scores = [score for idx, score in final_results]
        result_df['similarity_score'] = similarity_scores
        
        if verbose:
            print(f"Found {len(result_df)} final matches with this strategy.\n")
        
        return result_df.sort_values('similarity_score', ascending=False)

    # Main Execution: Run the multi-pass strategy
    for mode in ['strict', 'relaxed', 'none']:
        result = _search_with_mode(mode)
        if result is not None:
            return result

    print("No matches found after all search strategies.")
    return pd.DataFrame()


import pandas as pd

def create_average_consumption_profile(similar_buildings_df: pd.DataFrame, time_series_csv_path: str) -> pd.DataFrame:
    """
    Filters a time series CSV for specific buildings and calculates their average consumption profile.

    Args:
        similar_buildings_df (pd.DataFrame): DataFrame containing the search results, including a 'bldg_id' column.
        time_series_csv_path (str): The file path to the time_series.csv file.

    Returns:
        pd.DataFrame: A DataFrame with two columns: 'timestamp' and 'average_electricity_consumption..kwh',
                      representing the average consumption across all selected buildings.
                      Returns an empty DataFrame if no matching data is found.
    """
    # 1. Get the list of building IDs and convert to integers
    building_ids_str = similar_buildings_df["bldg_id"].astype(str).tolist()
    building_ids_int = [int(id) for id in building_ids_str]

    # 2. Load the time series data
    try:
        time_series = pd.read_csv(time_series_csv_path, sep=",")
    except FileNotFoundError:
        print(f"Error: The file '{time_series_csv_path}' was not found.")
        return pd.DataFrame()

    # 3. Filter the time series data for the selected buildings
    filtered_time_series = time_series[time_series['bldg_id'].isin(building_ids_int)]

    if filtered_time_series.empty:
        print("No time series data found for the selected building IDs.")
        return pd.DataFrame()

    # 4. Create a copy to avoid the SettingWithCopyWarning
    filtered_time_series_copy = filtered_time_series.copy()

    # 5. Prepare data for aggregation
    filtered_time_series_copy['timestamp'] = pd.to_datetime(filtered_time_series_copy['timestamp'])
    time_series_indexed = filtered_time_series_copy.set_index('timestamp')

    # 6. Group by timestamp and calculate the average consumption
    average_consumption_series = time_series_indexed.groupby('timestamp')['out.electricity.total.energy_consumption..kwh'].mean()

    # 7. Format the final DataFrame
    average_consumption_df = average_consumption_series.reset_index()
    average_consumption_df = average_consumption_df.rename(
        columns={'out.electricity.total.energy_consumption..kwh': 'average_electricity_consumption..kwh'}
    )

    return average_consumption_df


import pandas as pd

def create_continuous_profile(final_df: pd.DataFrame, end_date_str: str) -> pd.DataFrame:
    """
    Creates a continuous DataFrame by prepending a 12-month looping history to the original data.

    Args:
        final_df (pd.DataFrame): DataFrame with 'ID', 'timestamp', and 'target' columns.
        end_date_str (str): The desired end date for the historical profile (e.g., '2019-01-01').
                           This should correspond to the last timestamp in the original data.

    Returns:
        pd.DataFrame: A single, continuous DataFrame with 'ID', 'timestamp', and 'target' columns,
                      representing a full year of synthetic history followed by the original data.
    """
    # --- 1. Input Validation and Preparation ---
    if final_df.empty:
        print("Input DataFrame is empty. Returning an empty DataFrame.")
        return pd.DataFrame()

    # Create a working copy of the original data
    df_work = final_df.copy()
    
    # Ensure timestamp is in datetime format and set as index
    df_work['timestamp'] = pd.to_datetime(df_work['timestamp'])
    df_work.set_index('timestamp', inplace=True)
    
    # --- 2. Validate the end_date ---
    try:
        end_date = pd.to_datetime(end_date_str)
        if end_date != df_work.index[-1]:
            print(f"Warning: The provided end_date '{end_date_str}' does not match the last date in the data ('{df_work.index[-1]}').")
            print("The function will proceed using the provided end_date.")
    except Exception as e:
        print(f"Error with end_date_str: {e}")
        return pd.DataFrame()

    # --- 3. Determine Data Frequency ---
    freq = pd.infer_freq(df_work.index)
    if not freq:
        print("Could not infer frequency. Defaulting to '6h'.")
        freq = '6h'

    # --- 4. Generate New Timestamps for the Historical Period ---
    start_date = end_date - pd.DateOffset(years=1)
    new_timestamps = pd.date_range(start=start_date, end=end_date, freq=freq)

    # --- 5. Create the Looping (Cyclical) Target Data ---
    original_targets = df_work['target'].values
    num_original_points = len(original_targets)
    new_targets = [original_targets[i % num_original_points] for i in range(len(new_timestamps))]

    # --- 6. Assemble the Historical DataFrame ---
    historical_df = pd.DataFrame({
        'timestamp': new_timestamps,
        'target': new_targets
    })

    # --- 7. Combine Historical and Original DataFrames ---
    # Concatenate the historical data before the original data
    # ignore_index=True is crucial to create a new, continuous index
    continuous_df = pd.concat([historical_df, final_df], ignore_index=True)
    
    # --- 8. Final Cleanup ---
    # Reset the index to turn it into a continuous 'ID' column
    continuous_df = continuous_df.reset_index().rename(columns={'index': 'ID'})
    
    # Ensure columns are in the desired order
    continuous_df = continuous_df[['ID', 'timestamp', 'target']]
    
    return continuous_df


def print_dataframe(df, title="DataFrame", num_rows=5):
    """Prints a title and the first few rows of a DataFrame for clean output in a script."""
    print(f"\n--- {title} ---")
    print(df.head(num_rows))














def run_full_analysis(query: dict, 
                      characteristics_csv: str = "transformed/house_characteristics_clean.csv", 
                      time_series_csv: str = "transformed/time_series.csv", 
                      end_date: str = '2018-10-01 00:00:00') -> pd.DataFrame | None:
    """
    Executes the full analysis workflow: finds similar buildings, creates an average
    consumption profile, and generates a continuous historical profile.

    Args:
        query (dict): The building characteristics to search for.
        characteristics_csv (str): Path to the house characteristics CSV.
        time_series_csv (str): Path to the time series CSV.
        end_date (str): The end date for the historical profile.

    Returns:
        pd.DataFrame | None: The final continuous profile DataFrame, or None if an error occurs.
    """
    try:
        # --- Step 1: Load Data ---
        house_df = pd.read_csv(characteristics_csv, sep=";")
        time_series_df = pd.read_csv(time_series_csv, sep=",")
    except FileNotFoundError as e:
        print(f"Error: A required file was not found. Details: {e}")
        return None

    # --- Step 2: Find Similar Buildings ---
    similar_buildings = smart_fuzzy_search(house_df, query, threshold=60, limit=5)
    if similar_buildings.empty:
        print("No similar buildings found. Analysis aborted.")
        return None
    
    # --- Step 3: Create Average Consumption Profile ---
    average_profile_df = create_average_consumption_profile(similar_buildings, time_series_csv)
    if average_profile_df.empty:
        print("Could not create average consumption profile. Analysis aborted.")
        return None
        
    # --- Step 4: Create Final DataFrame with Renamed Columns ---
    final_df = average_profile_df.reset_index().rename(
        columns={'index': 'ID', 'average_electricity_consumption..kwh': 'target'}
    )

    # --- Step 5: Generate Continuous Historical Profile ---
    continuous_profile_df = create_continuous_profile(final_df, end_date)
    if continuous_profile_df.empty:
        print("Could not create continuous profile. Analysis aborted.")
        return None
        
    print("✅ Full analysis finished successfully!")
    return continuous_profile_df



#### How to use ####
# corrected_query = {
#     # Text-based criteria
#     'in.state': 'FL',
#     'in.geometry_building_type_recs': 'Single-Family Detached',
#     'in.heating_fuel': 'Electricity',
#     'in.windows': 'Low-E',
#     'in.insulation_wall': 'CMU, 6-in Hollow, R-19',

#     # Numeric-based criteria
#     'in.bedrooms': 3,
#     'in.vintage': 2000,
#     'in.sqft..ft2': 1800
# }

# final_continuous_df = run_full_analysis(query=corrected_query,
#                                         characteristics_csv="transformed/house_characteristics_clean.csv", 
#                                         time_series_csv= "transformed/time_series.csv", 
#                                         end_date= '2018-10-01 00:00:00')

# print(final_continuous_df)