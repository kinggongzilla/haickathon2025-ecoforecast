import pandas as pd  # requires: pip install 'pandas[pyarrow]'
from chronos import Chronos2Pipeline

def make_prediction(state, sqft, county_name=None, bedrooms=None, vintage=None,
                       geometry_building_type_recs=None, heating_fuel=None,
                       cooling_setpoint=None, windows=None, insulation_wall=None,
                       refrigerator=None, clothes_washer=None):
    """
    Predict electricity consumption using Chronos2 model
    
    Required parameters:
    - state: State abbreviation
    - sqft: Square footage
    
    Optional parameters:
    - All other building characteristics
    
    Returns:
    - DataFrame with predictions
    """
    
    # Load historical target values and past values of covariates
    context_df = pd.read_parquet("https://autogluon.s3.amazonaws.com/datasets/timeseries/electricity_price/train.parquet")
    
    # (Optional) Load future values of covariates
    test_df = pd.read_parquet("https://autogluon.s3.amazonaws.com/datasets/timeseries/electricity_price/test.parquet")
    
    # Generate predictions with covariates
    pred_df = pipeline.predict_df(
        context_df,
        prediction_length=24,  # Number of steps to forecast
        quantile_levels=[0.1, 0.5, 0.9],  # Quantiles for probabilistic forecast
        id_column="id",  # Column identifying different time series
        timestamp_column="timestamp",  # Column with datetime information
        target="target",  # Column(s) with time series values to predict
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