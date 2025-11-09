from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from chronos import Chronos2Pipeline
from inference import make_prediction

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model once when the server starts
print("Loading Chronos2 model...")
pipeline = Chronos2Pipeline.from_pretrained("amazon/chronos-2", device_map="cuda")
print("Model loaded successfully!")


@app.route('/building-data', methods=['POST'])
def building_data():
    """
    Endpoint to receive building/housing parameters and return electricity predictions
    Required: state, sqft
    Optional: all other parameters
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Extract required parameters
        state = data.get('in.state')
        sqft = data.get('in.sqft..ft2')
        
        # Validate required parameters
        if state is None or sqft is None:
            missing = []
            if state is None:
                missing.append('in.state')
            if sqft is None:
                missing.append('in.sqft..ft2')
            
            return jsonify({
                'error': 'Missing required parameters',
                'missing': missing
            }), 400
        
        # Extract optional parameters
        county_name = data.get('in.county_name')
        bedrooms = data.get('in.bedrooms')
        vintage = data.get('in.vintage')
        geometry_building_type_recs = data.get('in.geometry_building_type_recs')
        heating_fuel = data.get('in.heating_fuel')
        cooling_setpoint = data.get('in.cooling_setpoint')
        windows = data.get('in.windows')
        insulation_wall = data.get('in.insulation_wall')
        refrigerator = data.get('in.refrigerator')
        clothes_washer = data.get('in.clothes_washer')
        
        # Call the prediction function
        pred_df = make_prediction(
            pipeline=pipeline,
            state=state,
            sqft=sqft,
            county_name=county_name,
            bedrooms=bedrooms,
            vintage=vintage,
            geometry_building_type_recs=geometry_building_type_recs,
            heating_fuel=heating_fuel,
            cooling_setpoint=cooling_setpoint,
            windows=windows,
            insulation_wall=insulation_wall,
            refrigerator=refrigerator,
            clothes_washer=clothes_washer
        )
        
        # Convert predictions to JSON-serializable format
        result = {
            'status': 'success',
            'input_parameters': {
                'state': state,
                'sqft': sqft,
                'county_name': county_name,
                'bedrooms': bedrooms,
                'vintage': vintage,
                'geometry_building_type_recs': geometry_building_type_recs,
                'heating_fuel': heating_fuel,
                'cooling_setpoint': cooling_setpoint,
                'windows': windows,
                'insulation_wall': insulation_wall,
                'refrigerator': refrigerator,
                'clothes_washer': clothes_washer
            },
            'predictions': pred_df.to_dict(orient='records')
        }
        
        return jsonify(result), 200
        
    except ValueError as ve:
        # Handle specific errors from make_prediction (e.g., no similar buildings found)
        return jsonify({
            'error': 'Data processing error',
            'message': str(ve)
        }), 404

    except Exception as e:
        # Handle unexpected errors
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)