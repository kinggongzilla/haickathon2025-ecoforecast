import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
from chronos import Chronos2Pipeline

# Load data
context_df = pd.read_parquet("https://autogluon.s3.amazonaws.com/datasets/timeseries/electricity_price/train.parquet")
test_df = pd.read_parquet("https://autogluon.s3.amazonaws.com/datasets/timeseries/electricity_price/test.parquet")

# Initialize pipeline
pipeline = Chronos2Pipeline.from_pretrained("amazon/chronos-2", device_map="cuda")

def evaluate_model(context_df, test_df, n_splits=5, prediction_length=24):
    tscv = TimeSeriesSplit(n_splits=n_splits)  # n_splits must be an integer
    maes = []
    rmses = []

    for train_index, val_index in tscv.split(context_df):
        train_df = context_df.iloc[train_index]
        val_df = context_df.iloc[val_index]

        pred_df = pipeline.predict_df(
            train_df,
            prediction_length=prediction_length,
            quantile_levels=[0.1, 0.5, 0.9],
            id_column="id",
            timestamp_column="timestamp",
            target="target",
        )

        mae = mean_absolute_error(val_df["target"].head(prediction_length), pred_df["0.5"])
        rmse = np.sqrt(mean_squared_error(val_df["target"].head(prediction_length), pred_df["0.5"]))

        maes.append(mae)
        rmses.append(rmse)

    return {"MAE": np.mean(maes), "RMSE": np.mean(rmses)}

# Run evaluation
results = evaluate_model(context_df, test_df, n_splits=5)
print("Evaluation Results:", results)
