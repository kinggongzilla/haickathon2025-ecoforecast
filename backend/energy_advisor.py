import os
from mistralai import Mistral
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()
# Generic fallback tips in case API fails
FALLBACK_TIPS = [
    "Upgrade to energy-efficient LED lighting to reduce electricity consumption by up to 75%",
    "Install a programmable thermostat to optimize heating and cooling schedules",
    "Improve insulation and seal air leaks to reduce heating and cooling costs by up to 20%"
]
def generate_energy_advice(building_params, prediction_summary=None):
    """
    Generate personalized energy-saving advice using Mistral API.
    Args:
        building_params (dict): Building characteristics including:
            - in.state: State abbreviation
            - in.sqft..ft2: Square footage
            - in.vintage: Construction year
            - in.geometry_building_type_recs: Building type
            - in.heating_fuel: Heating fuel type
            - in.windows: Window type
            - in.insulation_wall: Wall insulation type
            - in.bedrooms: Number of bedrooms
        prediction_summary (dict, optional): Summary of predictions including:
            - avg_kwh: Average predicted consumption
            - seasonal_pattern: Description of seasonal usage
    Returns:
        list: List of 3 personalized energy-saving tips
    """
    try:
        # Get API key from environment
        api_key = os.getenv('MISTRAL_API_KEY')
        if not api_key:
            print("WARNING: MISTRAL_API_KEY not found in environment, using fallback tips")
            print(f"DEBUG: Current working directory: {os.getcwd()}")
            print(f"DEBUG: .env file exists: {os.path.exists('.env')}")
            return FALLBACK_TIPS
        print(f"DEBUG: Found API key (first 10 chars): {api_key[:10]}...")
        # Initialize Mistral client
        client = Mistral(api_key=api_key)
        # Build context from building parameters - only include what user provided
        state = building_params.get('in.state')
        sqft = building_params.get('in.sqft..ft2')
        vintage = building_params.get('in.vintage')
        building_type = building_params.get('in.geometry_building_type_recs')
        heating_fuel = building_params.get('in.heating_fuel')
        windows = building_params.get('in.windows')
        insulation = building_params.get('in.insulation_wall')
        bedrooms = building_params.get('in.bedrooms')
        # Build characteristics list with only provided values
        characteristics = []
        characteristics.append(f"- Location: {state}")
        characteristics.append(f"- Square footage: {sqft} ft²")
        if vintage:
            characteristics.append(f"- Construction year: {vintage}")
        if building_type:
            characteristics.append(f"- Building type: {building_type}")
        if heating_fuel:
            characteristics.append(f"- Current heating fuel: {heating_fuel}")
        if windows:
            characteristics.append(f"- Current windows: {windows}")
        if insulation:
            characteristics.append(f"- Current wall insulation: {insulation}")
        if bedrooms:
            characteristics.append(f"- Bedrooms: {bedrooms}")
        characteristics_text = '\n'.join(characteristics)
        # Build examples based on what was actually provided
        examples = []
        if windows:
            examples.append(f'- For a building with "{windows}": "Single-pane windows in {state} are responsible for 25-30% heat loss; upgrading to double-pane low-E windows would reduce heating costs by approximately 15-20%"')
        if heating_fuel:
            examples.append(f'- For a building using "{heating_fuel}": "Switching from {heating_fuel} to a high-efficiency heat pump would improve energy efficiency by 40-50% in {state}\'s climate"')
        if insulation:
            examples.append(f'- For a building with "{insulation}": "Adding insulation to walls can reduce heat loss by up to 20%"')
        if bedrooms:
            examples.append(f'- For a building with {bedrooms} bedrooms: "Properly insulating and sealing these bedrooms can reduce heating costs by up to 10%"')
        examples_text = '\n'.join(examples) if examples else "- Focus on the most impactful improvements for buildings in {state} with {sqft} ft²"
        # Build prompt for Mistral with specific analysis instructions
        prompt = f"""You are an energy efficiency expert analyzing a specific residential building. Generate 3 highly personalized energy-saving recommendations based ONLY on the following characteristics:
BUILDING CHARACTERISTICS:
{characteristics_text}
CRITICAL REQUIREMENTS:
1. ONLY make recommendations based on the characteristics listed above - DO NOT assume or suggest improvements for features not mentioned
2. Each recommendation MUST directly reference the building's SPECIFIC characteristics that were provided
3. Compare current systems to better alternatives with exact efficiency percentages
4. Use passive voice format
5. Prioritize the TOP 3 most impactful upgrades based on the information provided
6. If limited information is provided, focus on general improvements for buildings in {state} with {sqft} ft²
7. DO NOT infer or assume any additional characteristics beyond what is listed above
EXAMPLES OF SPECIFIC RECOMMENDATIONS:
{examples_text}
OUTPUT FORMAT:
- Return EXACTLY 3 recommendations, one per line
- NO numbering, NO bullet points, NO preamble, NO conclusion
- Each recommendation must be 1-2 sentences maximum
- Each must include specific percentages and reference THIS building's current state
- DO NOT infer or assume any additional characteristics beyond what is listed above
- If a characteristic is not listed, do not make recommendations related to it"""
        # Call Mistral API
        print(f"Calling Mistral API for building in {state} with {sqft} sqft...")
        response = client.chat.complete(
            model="mistral-small-2506",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        # Extract the generated advice
        advice_text = response.choices[0].message.content
        # Split into individual tips and clean up
        tips = [tip.strip() for tip in advice_text.strip().split('\n') if tip.strip()]
        # Ensure we have exactly 3 tips
        if len(tips) < 3:
            print(f"WARNING: Only got {len(tips)} tips from Mistral, padding with fallback tips")
            tips.extend(FALLBACK_TIPS[len(tips):3])
        elif len(tips) > 3:
            tips = tips[:3]
        print(f"✓ Successfully generated {len(tips)} personalized energy-saving tips")
        return tips
    except Exception as e:
        print(f"ERROR: Failed to generate advice with Mistral API: {e}")
        print("Using fallback tips instead")
        return FALLBACK_TIPS
if __name__ == "__main__":
    # Test the function
    test_params = {
        'in.state': 'IL',
        'in.sqft..ft2': 2000,
        'in.vintage': 1990,
        'in.geometry_building_type_recs': 'Single-Family Detached',
        'in.heating_fuel': 'Wood',
        'in.windows': 'Single, Clear, Metal',
        'in.insulation_wall': 'Wood Stud, Uninsulated',
        'in.bedrooms': 3
    }
    advice = generate_energy_advice(test_params)
    print("\nGenerated Energy-Saving Advice:")
    for i, tip in enumerate(advice, 1):
        print(f"{i}. {tip}")
