import sqlite3
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from pathlib import Path
from config import settings

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                type TEXT NOT NULL,
                air_temperature REAL NOT NULL,
                process_temperature REAL NOT NULL,
                rotational_speed INTEGER NOT NULL,
                torque REAL NOT NULL,
                tool_wear INTEGER NOT NULL,
                power REAL NOT NULL,
                temp_diff REAL NOT NULL,
                tool_torque_product REAL NOT NULL,
                failure_probability REAL NOT NULL,
                risk_level TEXT NOT NULL,
                predicted_failure INTEGER NOT NULL,
                recommendation TEXT NOT NULL,
                model_source TEXT NOT NULL,
                active_failure_modes TEXT,
                summary_sentence TEXT,
                recommended_actions TEXT,
                explanation_json TEXT
            )
        """)
        # Safe migration if columns were missing in earlier db versions
        cursor.execute("PRAGMA table_info(predictions)")
        existing_cols = {row["name"] for row in cursor.fetchall()}
        if "summary_sentence" not in existing_cols:
            cursor.execute("ALTER TABLE predictions ADD COLUMN summary_sentence TEXT")
        if "recommended_actions" not in existing_cols:
            cursor.execute("ALTER TABLE predictions ADD COLUMN recommended_actions TEXT")
        if "explanation_json" not in existing_cols:
            cursor.execute("ALTER TABLE predictions ADD COLUMN explanation_json TEXT")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pred_timestamp ON predictions (timestamp DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_pred_risk ON predictions (risk_level)")
        conn.commit()

def log_prediction(
    type: str,
    air_temp: float,
    process_temp: float,
    rot_speed: int,
    torque: float,
    tool_wear: int,
    power: float,
    temp_diff: float,
    tool_torque_product: float,
    failure_probability: float,
    risk_level: str,
    predicted_failure: int,
    recommendation: str,
    model_source: str,
    active_failure_modes: str = "",
    summary_sentence: str = "",
    recommended_actions: Optional[List[str]] = None,
    explanation_dict: Optional[Dict[str, Any]] = None
) -> Tuple[int, str]:
    iso_timestamp = datetime.now(timezone.utc).isoformat()
    actions_json = json.dumps(recommended_actions or [])
    expl_json = json.dumps(explanation_dict or {})
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions (
                timestamp, type, air_temperature, process_temperature,
                rotational_speed, torque, tool_wear, power, temp_diff,
                tool_torque_product, failure_probability, risk_level,
                predicted_failure, recommendation, model_source, active_failure_modes,
                summary_sentence, recommended_actions, explanation_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            iso_timestamp, type, air_temp, process_temp,
            rot_speed, torque, tool_wear, power, temp_diff,
            tool_torque_product, failure_probability, risk_level,
            predicted_failure, recommendation, model_source, active_failure_modes,
            summary_sentence, actions_json, expl_json
        ))
        conn.commit()
        return cursor.lastrowid, iso_timestamp

def get_history(
    limit: int = 50,
    offset: int = 0,
    risk_level: Optional[str] = None,
    machine_type: Optional[str] = None
) -> Tuple[List[Dict[str, Any]], int]:
    with get_connection() as conn:
        cursor = conn.cursor()
        
        where_clauses = []
        params = []
        
        if risk_level and risk_level.lower() != "all":
            where_clauses.append("risk_level = ?")
            params.append(risk_level.lower())
            
        if machine_type and machine_type.upper() != "ALL":
            where_clauses.append("type = ?")
            params.append(machine_type.upper())
            
        where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        
        # Count total matching
        count_query = f"SELECT COUNT(*) FROM predictions {where_str}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Fetch rows
        query = f"""
            SELECT * FROM predictions
            {where_str}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query, params + [limit, offset])
        rows = []
        for r in cursor.fetchall():
            row_dict = dict(r)
            # Parse recommended actions
            try:
                if row_dict.get("recommended_actions"):
                    row_dict["recommended_actions"] = json.loads(row_dict["recommended_actions"])
                else:
                    row_dict["recommended_actions"] = []
            except Exception:
                row_dict["recommended_actions"] = []
                
            # Parse explanation object if available
            try:
                if row_dict.get("explanation_json"):
                    row_dict["explanation"] = json.loads(row_dict["explanation_json"])
                else:
                    row_dict["explanation"] = None
            except Exception:
                row_dict["explanation"] = None
                
            rows.append(row_dict)
            
        return rows, total

def get_summary_stats() -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low_count,
                SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as med_count,
                SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_count,
                SUM(CASE WHEN predicted_failure = 1 THEN 1 ELSE 0 END) as failures_detected,
                AVG(failure_probability) as avg_prob
            FROM predictions
        """)
        row = cursor.fetchone()
        return {
            "total_predictions": row["total"] or 0,
            "low_risk_count": row["low_count"] or 0,
            "medium_risk_count": row["med_count"] or 0,
            "high_risk_count": row["high_count"] or 0,
            "failures_detected": row["failures_detected"] or 0,
            "average_failure_probability": round(row["avg_prob"] or 0.0, 4)
        }

def clear_all_history() -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions")
        affected = cursor.rowcount
        conn.commit()
        return affected
