from fastapi import APIRouter, HTTPException, Query
from schemas import PredictRequest, PredictResponse
from model_service import model_manager
from database import log_prediction
import random

router = APIRouter(tags=["Predict"])

@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Evaluates sensor telemetry, computes server-side engineered features,
    applies the Gradient Boosting model (or calibrated mock predictor),
    logs the event to SQLite, and returns failure probability, risk tier,
    recommendations, and feature attribution.
    """
    try:
        result = model_manager.predict(request)
        
        # Log to SQLite
        active_modes_str = ", ".join(result["active_mode_codes"])
        expl = result["explanation"]
        db_id, timestamp = log_prediction(
            type=request.type,
            air_temp=request.air_temperature,
            process_temp=request.process_temperature,
            rot_speed=request.rotational_speed,
            torque=request.torque,
            tool_wear=request.tool_wear,
            power=result["engineered_features"].power,
            temp_diff=result["engineered_features"].temp_diff,
            tool_torque_product=result["engineered_features"].tool_torque_product,
            failure_probability=result["failure_probability"],
            risk_level=result["risk_level"],
            predicted_failure=result["predicted_failure"],
            recommendation=result["recommendation"],
            model_source=result["model_source"],
            active_failure_modes=active_modes_str,
            summary_sentence=expl.summary_sentence,
            recommended_actions=expl.recommended_actions,
            explanation_dict=expl.model_dump()
        )
        
        return PredictResponse(
            failure_probability=result["failure_probability"],
            risk_level=result["risk_level"],
            predicted_failure=result["predicted_failure"],
            top_contributing_features=result["top_contributing_features"],
            recommendation=result["recommendation"],
            failure_modes=result["failure_modes"],
            engineered_features=result["engineered_features"],
            model_source=result["model_source"],
            prediction_id=db_id,
            timestamp=timestamp,
            explanation=expl
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/predict/simulate-reading", response_model=PredictRequest)
def simulate_reading(
    scenario: str = Query("random", description="Scenario: 'random', 'healthy', 'overstrain', 'heat_dissipation', 'tool_wear'")
):
    """
    Generates a realistic simulated telemetry tick from industrial machinery sensors.
    """
    machine_type = random.choice(["L", "L", "L", "M", "M", "H"])
    
    if scenario == "healthy":
        air_temp = round(random.uniform(297.0, 301.0), 2)
        process_temp = round(air_temp + random.uniform(9.8, 11.5), 2)
        rot_speed = random.randint(1450, 1650)
        torque = round(random.uniform(35.0, 45.0), 2)
        tool_wear = random.randint(10, 120)
    elif scenario == "overstrain":
        air_temp = round(random.uniform(298.0, 302.0), 2)
        process_temp = round(air_temp + random.uniform(9.5, 11.0), 2)
        rot_speed = random.randint(1200, 1400)
        torque = round(random.uniform(62.0, 76.0), 2)
        tool_wear = random.randint(190, 240)
    elif scenario == "heat_dissipation":
        air_temp = round(random.uniform(302.0, 305.0), 2)
        # Narrow temp diff < 8.6
        process_temp = round(air_temp + random.uniform(6.5, 8.4), 2)
        rot_speed = random.randint(1180, 1350)
        torque = round(random.uniform(40.0, 55.0), 2)
        tool_wear = random.randint(40, 140)
    elif scenario == "tool_wear":
        air_temp = round(random.uniform(298.0, 301.0), 2)
        process_temp = round(air_temp + random.uniform(9.0, 10.5), 2)
        rot_speed = random.randint(1400, 1600)
        torque = round(random.uniform(38.0, 48.0), 2)
        tool_wear = random.randint(215, 252)
    else: # random, weighted toward nominal operations (96.6% safe)
        roll = random.random()
        if roll < 0.88:
            air_temp = round(random.uniform(296.0, 303.0), 2)
            process_temp = round(air_temp + random.uniform(9.2, 11.8), 2)
            rot_speed = random.randint(1350, 1850)
            torque = round(random.uniform(28.0, 52.0), 2)
            tool_wear = random.randint(0, 175)
        elif roll < 0.94: # slight warning
            air_temp = round(random.uniform(298.0, 304.0), 2)
            process_temp = round(air_temp + random.uniform(8.7, 10.0), 2)
            rot_speed = random.randint(1300, 1700)
            torque = round(random.uniform(48.0, 58.0), 2)
            tool_wear = random.randint(165, 205)
        else: # failure condition
            air_temp = round(random.uniform(299.0, 304.0), 2)
            process_temp = round(air_temp + random.uniform(7.8, 10.2), 2)
            rot_speed = random.randint(1200, 1400)
            torque = round(random.uniform(58.0, 74.0), 2)
            tool_wear = random.randint(195, 248)

    return PredictRequest(
        type=machine_type,
        air_temperature=air_temp,
        process_temperature=process_temp,
        rotational_speed=rot_speed,
        torque=torque,
        tool_wear=tool_wear
    )
