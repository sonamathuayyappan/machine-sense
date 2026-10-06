from typing import Dict, Any, Tuple, List, Optional
from schemas import (
    PredictRequest, 
    EngineeredFeatures, 
    FailureModeInfo, 
    DriverExplanation, 
    ExplanationObject
)

# ==============================================================================
# Named constants for rule-based explainability thresholds (easy to tune)
# ==============================================================================
TEMP_DIFF_HIGH_THRESHOLD = 12.0          # K - High heat accumulation
TEMP_DIFF_MEDIUM_THRESHOLD = 8.0         # K
HDF_TEMP_DIFF_THRESHOLD = 8.6            # K - Narrow thermal stagnation boundary
HDF_SPEED_THRESHOLD = 1380               # RPM - Low convective airflow boundary

TOOL_TORQUE_OVERSTRAIN_LIMITS = {
    "L": 11000.0,
    "M": 12000.0,
    "H": 13000.0
}

POWER_HIGH_OVERLOAD = 9000.0             # W
POWER_LOW_STALL = 3500.0                 # W
POWER_NOMINAL_MIN = 4000.0               # W
POWER_NOMINAL_MAX = 8000.0               # W

TOOL_WEAR_HIGH_THRESHOLD = 200           # min - Severe blade degradation
TOOL_WEAR_MEDIUM_THRESHOLD = 150         # min

TORQUE_HIGH_THRESHOLD = 60.0             # Nm
TORQUE_MEDIUM_THRESHOLD = 48.0           # Nm

SPEED_HIGH_THRESHOLD = 2600              # RPM
SPEED_LOW_THRESHOLD = 1350               # RPM

PROCESS_TEMP_HIGH_THRESHOLD = 312.0      # K
PROCESS_TEMP_MEDIUM_THRESHOLD = 310.5    # K

AIR_TEMP_HIGH_THRESHOLD = 303.0          # K
AIR_TEMP_MEDIUM_THRESHOLD = 301.5        # K

def compute_engineered_features(request: PredictRequest) -> EngineeredFeatures:
    """
    Computes server-side engineered features required by the AI4I 2020 ML model:
    - Power = Rotational speed [rpm] * Torque [Nm]
    - Temp_diff = Process temperature [K] - Air temperature [K]
    - Tool_torque_product = Tool wear [min] * Torque [Nm]
    """
    power = float(request.rotational_speed * request.torque)
    temp_diff = float(request.process_temperature - request.air_temperature)
    tool_torque_product = float(request.tool_wear * request.torque)
    
    return EngineeredFeatures(
        power=round(power, 2),
        temp_diff=round(temp_diff, 2),
        tool_torque_product=round(tool_torque_product, 2)
    )

def evaluate_failure_modes(
    machine_type: str,
    air_temp: float,
    process_temp: float,
    rot_speed: int,
    torque: float,
    tool_wear: int,
    power: float,
    temp_diff: float,
    tool_torque_product: float
) -> List[FailureModeInfo]:
    """
    Evaluates known physical failure conditions from the AI4I 2020 dataset specification:
    1. TWF (Tool Wear Failure): Tool wear between 200 and 240 mins or beyond.
    2. HDF (Heat Dissipation Failure): Temp_diff < 8.6 K and Rotational speed < 1380 rpm.
    3. PWF (Power Failure): Mechanical Power < 3500 W or > 9000 W.
    4. OSF (Overstrain Failure): Tool_torque_product exceeds threshold based on machine type:
       - Type L: > 11,000 min*Nm
       - Type M: > 12,000 min*Nm
       - Type H: > 13,000 min*Nm
    5. RNF (Random Failure): Independent stochastic failure mode.
    """
    modes: List[FailureModeInfo] = []
    
    # 1. Tool Wear Failure
    twf_triggered = tool_wear >= TOOL_WEAR_HIGH_THRESHOLD
    modes.append(FailureModeInfo(
        code="TWF",
        name="Tool Wear Failure",
        triggered=twf_triggered,
        explanation=f"Tool wear at {tool_wear} min (critical threshold >= {TOOL_WEAR_HIGH_THRESHOLD} min)." if twf_triggered else f"Tool wear within safe threshold (< {TOOL_WEAR_HIGH_THRESHOLD} min)."
    ))
    
    # 2. Heat Dissipation Failure
    hdf_triggered = (temp_diff < HDF_TEMP_DIFF_THRESHOLD) and (rot_speed < HDF_SPEED_THRESHOLD)
    modes.append(FailureModeInfo(
        code="HDF",
        name="Heat Dissipation Failure",
        triggered=hdf_triggered,
        explanation=f"Insufficient heat dissipation: Temp diff ({temp_diff:.1f} K < {HDF_TEMP_DIFF_THRESHOLD} K) with low cooling airflow at {rot_speed} RPM." if hdf_triggered else "Heat dissipation and cooling airflow within nominal bounds."
    ))
    
    # 3. Power Failure
    pwf_triggered = (power < POWER_LOW_STALL) or (power > POWER_HIGH_OVERLOAD)
    modes.append(FailureModeInfo(
        code="PWF",
        name="Power Failure",
        triggered=pwf_triggered,
        explanation=f"Mechanical power delivery ({power:.0f} W) out of nominal bounds (safe range: {POWER_LOW_STALL:,.0f} - {POWER_HIGH_OVERLOAD:,.0f} W)." if pwf_triggered else "Power delivery within nominal operating limits."
    ))
    
    # 4. Overstrain Failure
    limit = TOOL_TORQUE_OVERSTRAIN_LIMITS.get(machine_type.upper(), 11000.0)
    osf_triggered = tool_torque_product > limit
    modes.append(FailureModeInfo(
        code="OSF",
        name="Overstrain Failure",
        triggered=osf_triggered,
        explanation=f"Mechanical overstrain: Tool-torque product ({tool_torque_product:.0f} min*Nm) exceeds {limit:.0f} limit for Type {machine_type}." if osf_triggered else f"Tool-torque strain product is within safe design tolerance for Type {machine_type}."
    ))
    
    # 5. Random Failure
    modes.append(FailureModeInfo(
        code="RNF",
        name="Random Failure",
        triggered=False,
        explanation="Stochastic micro-component defect (0.1% baseline background risk)."
    ))
    
    return modes

def generate_recommendation(
    risk_level: str,
    failure_probability: float,
    active_modes: List[str],
    tool_wear: int,
    power: float,
    temp_diff: float
) -> str:
    """Generates practical, human-readable preventive maintenance recommendations."""
    if risk_level == "high":
        mode_str = f" Root cause: {', '.join(active_modes)}." if active_modes else ""
        if "OSF" in active_modes or "TWF" in active_modes:
            return f"CRITICAL ALERT: Immediate shutdown recommended. Replace worn cutting tool (wear: {tool_wear} min) and inspect spindle bearings before restarting.{mode_str}"
        elif "HDF" in active_modes:
            return f"CRITICAL ALERT: Heat dissipation failure imminent. Check coolant flow and ventilation passages; process-to-air differential is dangerously low ({temp_diff:.1f} K).{mode_str}"
        elif "PWF" in active_modes:
            return f"CRITICAL ALERT: Motor power anomaly ({power:.0f} W). Verify electrical drive inverter, motor torque limits, and check for mechanical jams.{mode_str}"
        return f"CRITICAL ALERT ({failure_probability*100:.1f}% risk): Halt machine operation immediately and dispatch maintenance crew for comprehensive diagnostic inspection."
        
    elif risk_level == "medium":
        mode_str = f" Potential threat: {', '.join(active_modes)}." if active_modes else ""
        if tool_wear > 160:
            return f"WARNING: Tool wear reaching advanced degradation ({tool_wear} min). Stage replacement tool and schedule maintenance within next 24-48 operating hours.{mode_str}"
        elif temp_diff < 9.5:
            return f"WARNING: Thermal margin narrowing ({temp_diff:.1f} K). Inspect heat exchanger and air filters at the next scheduled shift change.{mode_str}"
        return f"WARNING ({failure_probability*100:.1f}% risk): Monitor machine telemetry closely. Schedule preventive inspection within 48 operating hours."
        
    else:
        return f"NORMAL: Machine operating within nominal parameters ({failure_probability*100:.1f}% risk). Continue standard preventive maintenance cycle."

# ==============================================================================
# RULE-BASED EXPLAINABILITY LAYER (APPROXIMATION OF FEATURE ATTRIBUTION)
# ==============================================================================
# NOTE: This is a rule-based approximation of feature contribution acting as a simplified
# stand-in for SHAP (SHapley Additive exPlanations), since no live SHAP explainability library
# is currently wired directly to the real-time inference loop. It models the local attribution
# and risk contribution of physical sensor features based on domain thresholds and empirical weights.
def build_rule_based_explanation(
    request: PredictRequest,
    eng_features: EngineeredFeatures,
    risk_level: str,
    failure_modes: List[FailureModeInfo]
) -> ExplanationObject:
    """
    Builds the rule-based explanation layer required for XAI:
    - primary_drivers: ordered list of contributing features with plain label, severity, and physical detail
    - summary_sentence: plain-English single sentence synthesizing the top 1-2 drivers
    - recommended_actions: 2-4 short imperative action strings mapped from implicated failure modes
    """
    limit = TOOL_TORQUE_OVERSTRAIN_LIMITS.get(request.type.upper(), 11000.0)
    drivers: List[DriverExplanation] = []

    # 1. Tool_torque_product -> Mechanical overstress on tool
    ttp = eng_features.tool_torque_product
    if ttp >= limit * 0.90:
        ttp_sev = "high"
        ttp_detail = f"Cumulative mechanical load ({ttp:,.0f} min·Nm) approaches or exceeds structural overstrain limits ({limit:,.0f} min·Nm) for Type {request.type}, linked to Overstrain Failure (OSF)."
    elif ttp >= limit * 0.72:
        ttp_sev = "medium"
        ttp_detail = f"Cumulative mechanical load ({ttp:,.0f} min·Nm) is elevated for Type {request.type}, accelerating cutting edge wear."
    else:
        ttp_sev = "low"
        ttp_detail = f"Cumulative mechanical load ({ttp:,.0f} min·Nm) is within standard structural tolerance ({limit:,.0f} min·Nm)."

    drivers.append(DriverExplanation(
        feature="Tool_torque_product",
        plain_label="Mechanical overstress on tool",
        severity=ttp_sev,
        detail=ttp_detail,
        value=round(ttp, 1),
        threshold_info=f"{ttp:,.0f} min·Nm (limit: {limit:,.0f} min·Nm)"
    ))

    # 2. Power -> Power draw irregularity
    pwr = eng_features.power
    if pwr < POWER_LOW_STALL or pwr > POWER_HIGH_OVERLOAD:
        pwr_sev = "high"
        pwr_detail = f"Mechanical power delivery ({pwr:,.0f} W) is abnormal ({'motor overload > 9,000 W' if pwr > POWER_HIGH_OVERLOAD else 'motor stall < 3,500 W'}), linked to Power Failure (PWF)."
    elif pwr < POWER_NOMINAL_MIN or pwr > POWER_NOMINAL_MAX:
        pwr_sev = "medium"
        pwr_detail = f"Mechanical power delivery ({pwr:,.0f} W) fluctuates outside nominal operating range (4,000–8,000 W)."
    else:
        pwr_sev = "low"
        pwr_detail = f"Mechanical power delivery ({pwr:,.0f} W) is stable and well within nominal limits (3,500–9,000 W)."

    drivers.append(DriverExplanation(
        feature="Power",
        plain_label="Power draw irregularity",
        severity=pwr_sev,
        detail=pwr_detail,
        value=round(pwr, 1),
        threshold_info=f"{pwr:,.0f} W (nominal: 3,500 – 9,000 W)"
    ))

    # 3. Temp_diff -> Heat buildup
    td = eng_features.temp_diff
    if (td < HDF_TEMP_DIFF_THRESHOLD and request.rotational_speed < HDF_SPEED_THRESHOLD) or td >= TEMP_DIFF_HIGH_THRESHOLD:
        td_sev = "high"
        if td < HDF_TEMP_DIFF_THRESHOLD and request.rotational_speed < HDF_SPEED_THRESHOLD:
            td_detail = f"Process temperature differential ({td:.1f} K < 8.6 K) is too narrow at low spindle speed ({request.rotational_speed} RPM), causing cooling failure, linked to Heat Dissipation Failure (HDF)."
        else:
            td_detail = f"Process temperature is running {td:.1f} K above ambient air temperature, indicating severe heat buildup in the machining zone."
    elif td < 9.2 or td >= 11.5:
        td_sev = "medium"
        td_detail = f"Process-to-ambient temperature differential ({td:.1f} K) is near boundary margins (nominal: 9.0–11.5 K)."
    else:
        td_sev = "low"
        td_detail = f"Temperature differential ({td:.1f} K) is within normal thermal dissipation equilibrium."

    drivers.append(DriverExplanation(
        feature="Temp_diff",
        plain_label="Heat buildup",
        severity=td_sev,
        detail=td_detail,
        value=round(td, 1),
        threshold_info=f"{td:.1f} K (safe differential: 8.6 – 12.0 K)"
    ))

    # 4. Tool wear -> Tool cutting edge wear
    tw = request.tool_wear
    if tw >= TOOL_WEAR_HIGH_THRESHOLD:
        tw_sev = "high"
        tw_detail = f"Tool contact time has reached {tw} minutes (critical wear threshold >= 200 min), indicating severe tip dulling and chipping, linked to Tool Wear Failure (TWF)."
    elif tw >= TOOL_WEAR_MEDIUM_THRESHOLD:
        tw_sev = "medium"
        tw_detail = f"Tool wear is elevated at {tw} minutes (approaching 200 min replacement threshold)."
    else:
        tw_sev = "low"
        tw_detail = f"Tool wear ({tw} min) is within standard usable blade life expectancy."

    drivers.append(DriverExplanation(
        feature="tool_wear",
        plain_label="Tool cutting edge wear",
        severity=tw_sev,
        detail=tw_detail,
        value=tw,
        threshold_info=f"{tw} min (threshold: >= 200 min = critical)"
    ))

    # 5. Rotational speed -> Spindle rotation speed
    rpm = request.rotational_speed
    if rpm < SPEED_LOW_THRESHOLD or rpm > SPEED_HIGH_THRESHOLD:
        rpm_sev = "high"
        rpm_detail = f"Spindle rotational speed ({rpm} RPM) is outside safe operational boundaries (nominal: 1,350–2,500 RPM)."
    elif rpm < 1420 or rpm > 2200:
        rpm_sev = "medium"
        rpm_detail = f"Spindle speed ({rpm} RPM) is drifting towards boundary limits."
    else:
        rpm_sev = "low"
        rpm_detail = f"Spindle speed ({rpm} RPM) provides optimal torque transmission and convective airflow."

    drivers.append(DriverExplanation(
        feature="rotational_speed",
        plain_label="Spindle rotation speed",
        severity=rpm_sev,
        detail=rpm_detail,
        value=rpm,
        threshold_info=f"{rpm} RPM (nominal: 1,350 – 2,500 RPM)"
    ))

    # 6. Torque -> Motor shaft torque resistance
    tq = request.torque
    if tq >= TORQUE_HIGH_THRESHOLD or tq <= 10.0:
        tq_sev = "high"
        tq_detail = f"Shaft torque resistance ({tq:.1f} Nm) is abnormally high, creating severe motor strain."
    elif tq >= TORQUE_MEDIUM_THRESHOLD or tq <= 20.0:
        tq_sev = "medium"
        tq_detail = f"Shaft torque ({tq:.1f} Nm) is elevated above average manufacturing baseline."
    else:
        tq_sev = "low"
        tq_detail = f"Shaft torque resistance ({tq:.1f} Nm) is within normal resistance envelope."

    drivers.append(DriverExplanation(
        feature="torque",
        plain_label="Motor shaft torque resistance",
        severity=tq_sev,
        detail=tq_detail,
        value=round(tq, 1),
        threshold_info=f"{tq:.1f} Nm (typical: 25.0 – 50.0 Nm)"
    ))

    # 7. Process Temperature -> Process zone temperature
    pt = request.process_temperature
    if pt >= PROCESS_TEMP_HIGH_THRESHOLD:
        pt_sev = "high"
        pt_detail = f"Workpiece contact zone temperature ({pt:.1f} K) is exceeding recommended limits."
    elif pt >= PROCESS_TEMP_MEDIUM_THRESHOLD:
        pt_sev = "medium"
        pt_detail = f"Workpiece contact zone temperature ({pt:.1f} K) is moderately elevated."
    else:
        pt_sev = "low"
        pt_detail = f"Process temperature ({pt:.1f} K) is within normal operational range."

    drivers.append(DriverExplanation(
        feature="process_temperature",
        plain_label="Process zone temperature",
        severity=pt_sev,
        detail=pt_detail,
        value=round(pt, 1),
        threshold_info=f"{pt:.1f} K (nominal: 305.0 – 311.0 K)"
    ))

    # 8. Air Temperature -> Ambient factory air temperature
    at = request.air_temperature
    if at >= AIR_TEMP_HIGH_THRESHOLD:
        at_sev = "high"
        at_detail = f"Factory intake ambient air temperature is elevated at {at:.1f} K."
    elif at >= AIR_TEMP_MEDIUM_THRESHOLD:
        at_sev = "medium"
        at_detail = f"Factory ambient temperature is {at:.1f} K."
    else:
        at_sev = "low"
        at_detail = f"Factory ambient temperature ({at:.1f} K) is nominal."

    drivers.append(DriverExplanation(
        feature="air_temperature",
        plain_label="Ambient factory air temperature",
        severity=at_sev,
        detail=at_detail,
        value=round(at, 1),
        threshold_info=f"{at:.1f} K (typical: 295.0 – 301.0 K)"
    ))

    # 9. Type -> Machine variant tolerance
    m_type = request.type
    if m_type == "L" and (tw >= 160 or tq >= 50.0):
        type_sev = "medium"
        type_detail = f"Type L (Low product variant) has lower load capacity ({limit:,.0f} min·Nm) than Type M or H."
    else:
        type_sev = "low"
        type_detail = f"Type {m_type} machine variant operating with standard {limit:,.0f} min·Nm strain envelope."

    drivers.append(DriverExplanation(
        feature="type",
        plain_label="Machine variant tolerance",
        severity=type_sev,
        detail=type_detail,
        value=m_type,
        threshold_info=f"Grade: Type {m_type}"
    ))

    # Sort drivers: high first, then medium, then low
    severity_order = {"high": 0, "medium": 1, "low": 2}
    drivers.sort(key=lambda d: severity_order[d.severity])

    # Build plain-English summary sentence combining top 1-2 drivers
    high_drivers = [d for d in drivers if d.severity == "high"]
    med_drivers = [d for d in drivers if d.severity == "medium"]

    if risk_level in ["high", "medium"]:
        notable = high_drivers if high_drivers else med_drivers
        if len(notable) >= 2:
            summary_sentence = f"Risk is elevated mainly because of {notable[0].plain_label.lower()} and {notable[1].plain_label.lower()}."
        elif len(notable) == 1:
            summary_sentence = f"Risk is elevated primarily due to {notable[0].plain_label.lower()}."
        else:
            summary_sentence = "Risk is slightly elevated due to combined sensor readings across thermal and mechanical operational channels."
    else:
        summary_sentence = "Machine is operating safely with all thermal, mechanical, and power sensor channels within nominal limits."

    # Build recommended actions based on implicated failure modes & top drivers
    active_mode_codes = [m.code for m in failure_modes if m.triggered]
    actions: List[str] = []

    if "HDF" in active_mode_codes or any(d.feature == "Temp_diff" and d.severity == "high" for d in drivers):
        actions.append("Check coolant flow and heat sink ventilation")
        actions.append("Reduce spindle speed temporarily")

    if "TWF" in active_mode_codes or any(d.feature == "tool_wear" and d.severity == "high" for d in drivers):
        actions.append("Inspect or replace the cutting tool")
        actions.append("Log current tool wear time against its rated lifespan")

    if "PWF" in active_mode_codes or any(d.feature == "Power" and d.severity == "high" for d in drivers):
        actions.append("Verify power supply stability")
        actions.append("Check for voltage drops under load")

    if "OSF" in active_mode_codes or any(d.feature == "Tool_torque_product" and d.severity == "high" for d in drivers):
        actions.append("Reduce feed rate / mechanical load")
        actions.append("Inspect for signs of material binding")

    if not actions:
        if risk_level == "medium":
            actions.append("Monitor machine telemetry closely during current shift")
            actions.append("Schedule preventive visual inspection within 48 operating hours")
        else:
            actions.append("No action needed — continue standard monitoring")
            actions.append("Perform routine lubrication at next planned shift change")

    # Deduplicate while preserving order, max 4 actions
    unique_actions = []
    for a in actions:
        if a not in unique_actions:
            unique_actions.append(a)
    unique_actions = unique_actions[:4]

    return ExplanationObject(
        primary_drivers=drivers,
        summary_sentence=summary_sentence,
        recommended_actions=unique_actions
    )
