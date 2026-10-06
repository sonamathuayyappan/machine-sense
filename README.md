# Machine Sense — Industrial Predictive Maintenance System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?style=flat-square&logo=scikitlearn)](https://scikit-learn.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org)

**Machine Sense** is a full-stack, real-time industrial predictive maintenance web application built for the **AD5305 Machine Learning** course project. It operationalizes a validated **Gradient Boosting Classifier** trained on the **UCI AI4I 2020 Predictive Maintenance Dataset** (10,000 records, 3.39% severe class imbalance) to predict equipment failure risk and dispatch actionable preventive maintenance scheduling recommendations.

---

## ⚡ Quick Start (Run Locally)

The application runs locally with two commands (one for the backend API, one for the React frontend):

### 1. Start the Backend API (FastAPI)
```bash
# Navigate to the backend directory
cd backend

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Start FastAPI with Uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*The API is now running at `http://127.0.0.1:8000` (Interactive Swagger Docs at `http://127.0.0.1:8000/docs`).*

### 2. Start the Frontend Dashboard (React + Vite)
```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Start Vite dev server
npm.cmd run dev
```
*The dashboard is now live at `http://127.0.0.1:5173/`.*

---

## 📊 Dataset & Model Specification

### Ground Truth Dataset: UCI AI4I 2020
- **Size:** 10,000 synthetic rows reflecting real milling machine operations.
- **Class Imbalance:** 339 failures (3.39%) vs. 9,661 normal operating runs (96.61%).
- **Target:** Binary machine failure (`0` or `1`) plus 5 physical failure sub-modes:
  - **TWF (Tool Wear Failure):** Tool contact time reaches 200–240+ minutes.
  - **HDF (Heat Dissipation Failure):** $\Delta T < 8.6\text{ K}$ and Rotational Speed $< 1,380\text{ RPM}$.
  - **PWF (Power Failure):** Mechanical power $< 3,500\text{ W}$ or $> 9,000\text{ W}$.
  - **OSF (Overstrain Failure):** Tool wear $\times$ Torque exceeds machine variant load capacity (11k for L, 12k for M, 13k for H).
  - **RNF (Random Failure):** 0.1% background stochastic defect rate.

### Model Benchmark Comparison (2,000 Test Samples)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosting Classifier** | **99.2%** | **96.4%** | **79.4%** | **87.1%** | **97.2%** | **Selected Best** |
| Random Forest Classifier | 99.05% | 92.98% | 77.94% | 84.80% | 98.21% | Candidate |
| Logistic Regression (Baseline) | 85.95% | 17.82% | 86.76% | 29.57% | 93.74% | Baseline |

### Confusion Matrix (Gradient Boosting on 2,000 Test Samples)
$$\begin{pmatrix} \text{TN} = 1930 & \text{FP} = 2 \\ \text{FN} = 14 & \text{TP} = 54 \end{pmatrix}$$
- **False Positive Rate:** Only 2 false alarms out of 1,932 safe machines (0.1%), preventing costly unneeded factory shutdowns.
- **True Positives:** 54 impending breakdowns caught before catastrophic equipment failure.

---

## ⚙️ Server-Side Feature Engineering

Before calling the model, the backend automatically derives 3 physical domain features from the 6 raw sensor inputs:

1. **Power (Mechanical Proxy) [W]:**
   $$\text{Power} = \text{Rotational Speed [rpm]} \times \text{Torque [Nm]}$$
2. **Temperature Differential ($\Delta T$) [K]:**
   $$\text{Temp\_diff} = \text{Process Temperature [K]} - \text{Air Temperature [K]}$$
3. **Tool-Torque Product [min $\cdot$ Nm]:**
   $$\text{Tool\_torque\_product} = \text{Tool Wear [min]} \times \text{Torque [Nm]}$$

### Feature Importance Hierarchy (Highest to Lowest)
1. `Tool_torque_product` (0.342) — Overstrain failure indicator
2. `Power` (0.238) — Drive motor conversion proxy
3. `Temp_diff` (0.165) — Thermal dissipation margin
4. `Rotational speed [rpm]` (0.098) — Convective cooling airflow
5. `Tool wear [min]` (0.071) — Tool cutting tip contact degradation
6. `Type` (0.038) — Machine quality grade (L / M / H)
7. `Process temperature [K]` (0.021) — Workpiece contact zone heat
8. `Air temperature [K]` (0.015) — Factory ambient intake heat
9. `Torque [Nm]` (0.012) — Spindle motor load resistance

---

## 🔌 Model Artifacts & Drop-In Upgrades

The application includes `model.pkl` and `preprocessor.pkl` trained and validated on the official UCI AI4I 2020 dataset.

### How to Drop in Custom Trained Artifacts:
To replace the artifacts with a model trained in Google Colab or Jupyter:
1. Export model and preprocessor using `joblib`:
   ```python
   import joblib
   joblib.dump(best_gradient_boosting_model, "model.pkl")
   joblib.dump(fitted_column_transformer, "preprocessor.pkl")
   ```
2. Place both files in the `backend/` folder:
   - `backend/model.pkl`
   - `backend/preprocessor.pkl`
3. Restart the backend server. The health check will verify `model_source: GradientBoosting (model.pkl)`.

### Calibrated Mock Fallback:
If `model.pkl` or `preprocessor.pkl` are absent, the application automatically engages a **Calibrated Physics Mock Predictor**. This mock accurately models the 3.39% baseline prior and the physical failure envelopes (OSF, HDF, PWF, TWF) so the entire frontend, charts, and live simulation remain 100% demoable.

---

## 🖥️ Application Features & Views

### 1. Dashboard (Home)
- **Sensor Input Form:** 6 validated numeric controls (Type dropdown, Air Temp, Process Temp, RPM, Torque, Wear).
- **1-Click Failure Mode Presets:** Instant loading of benchmark operating points:
  - *Normal Operations (Safe)*
  - *Tool Wear Failure (TWF - UDI 78)*
  - *Heat Dissipation (HDF - UDI 3761)*
  - *Power Failure (PWF - UDI 51)*
  - *Overstrain Failure (OSF - UDI 161)*
- **Live Feature Synthesizer:** Real-time calculation of Power, Temp Diff, and Tool-Torque Product.
- **Diagnostic Risk Panel:**
  - Animated SVG circular failure probability gauge (0–100%).
  - Configurable risk tier badge (`Low < 30%`, `Medium 30–70%`, `High > 70%`).
  - Actionable human-readable maintenance recommendation.
  - Sub-mode breakdown grid (TWF, HDF, PWF, OSF, RNF).
  - Feature contribution horizontal bar chart.
- **Live-Feed Simulation Stream (IoT Simulation Mode):**
  - Toggle-driven autonomous telemetry generator streaming ticks every 3 seconds.
  - Scrolling recent readings table with color-coded risk and 1-click **Inspect** button to load any tick into the manual form.

### 2. History Log View
- Full audit log of all predictions logged to SQLite (`backend/machine_sense.db`).
- Interactive KPI cards: Total logged, Safe count, Warning count, Critical count, Average fleet risk.
- Chronological probability-over-time trend chart with 30% and 70% safety reference thresholds.
- Filtering by risk tier and machine variant.
- 1-click CSV export and database clear utilities.

### 3. Model Card & Evaluation View
- Complete model card specs, dataset partition breakdown, and 3-model benchmark table.
- Interactive 4-quadrant Confusion Matrix heatmap.
- Feature importance hierarchy bar chart.
- Educational plain-language explainer on the **3.39% class imbalance problem** and why precision/recall/F1 matter far more than raw accuracy in industrial manufacturing.

### 4. System Architecture View
- Visual 5-step pipeline diagram: *IoT Sensors $\to$ Feature Synthesizer $\to$ Gradient Boosting Engine $\to$ Fault Diagnosis & Alerts $\to$ Dispatcher & Audit DB*.
- Technical specifications and model drop-in instructions.

---

## 🛠️ API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/predict` | Evaluates sensor readings, returns probability, risk tier, recommendations, and feature contributions. Logs event to SQLite. |
| `GET` | `/history` | Returns paginated historical prediction logs with filtering by risk tier and machine variant. |
| `DELETE` | `/history` | Clears historical prediction audit logs from SQLite. |
| `GET` | `/health` | Liveness check returning model loaded status, model source, and project metadata. |
| `GET` | `/model-info` | Returns complete static model card metadata, comparison metrics, confusion matrix, and feature importances. |
| `GET` | `/predict/simulate-reading` | Generates a realistic simulated telemetry tick from industrial machinery sensors. |

---

## 📁 Repository Structure

```
ml/
├── backend/
│   ├── config.py                 # Application configuration & risk thresholds
│   ├── database.py               # SQLite logging & query helpers
│   ├── schemas.py                # Pydantic v2 data models & validation
│   ├── feature_engineering.py    # Power, Temp_diff, Tool_torque_product computation
│   ├── model_service.py          # Model loader, mock fallback & feature importance
│   ├── main.py                   # FastAPI app entrypoint with CORS & routes
│   ├── train_model.py            # UCI AI4I 2020 training & export pipeline
│   ├── model.pkl                 # Serialized GradientBoostingClassifier
│   ├── preprocessor.pkl          # Serialized OneHotEncoder / ColumnTransformer
│   ├── ai4i2020.csv              # Downloaded UCI AI4I 2020 dataset
│   ├── machine_sense.db          # SQLite prediction audit log database
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Header with navigation, health ping & theme toggle
│   │   │   ├── DashboardView.jsx # Form, presets, live simulation stream & results
│   │   │   ├── HistoryView.jsx   # Audit table, KPI cards & trend area chart
│   │   │   ├── ModelInfoView.jsx # Model card, metrics table & confusion matrix
│   │   │   ├── ArchitectureView.jsx # Visual pipeline diagram & tech specs
│   │   │   └── Gauge.jsx         # Circular animated SVG probability gauge
│   │   ├── api.js                # Frontend API client
│   │   ├── App.jsx               # Root application component
│   │   ├── index.css             # Modern industrial design system & theme tokens
│   │   └── main.jsx              # React DOM entrypoint
│   ├── index.html                # App HTML template with Inter/JetBrains Mono
│   ├── package.json              # Node dependencies (React 19, Recharts, Lucide)
│   └── vite.config.js            # Vite configuration & backend proxy
│
└── README.md                     # Complete project documentation
```
