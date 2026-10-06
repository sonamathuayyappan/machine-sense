import React from 'react';
import { 
  Layers, 
  Cpu, 
  Database, 
  Radio, 
  ArrowRight, 
  CheckCircle, 
  FileCode, 
  Terminal, 
  Server, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export default function ArchitectureView() {
  const pipelineSteps = [
    {
      step: '01',
      title: 'IoT Sensor Stream',
      icon: <Radio size={22} color="var(--primary)" />,
      badge: 'Edge Telemetry',
      desc: 'Raw machine sensors capture 6 operational channels: Product Type (L/M/H), Air Temp [K], Process Temp [K], Rotational Speed [rpm], Torque [Nm], and Tool Wear [min].'
    },
    {
      step: '02',
      title: 'Feature Synthesizer',
      icon: <Cpu size={22} color="#38bdf8" />,
      badge: 'Server-side ML',
      desc: 'Computes physical stress proxies: Power (Speed × Torque), Temp_diff (Process - Air), and Tool_torque_product (Wear × Torque) before model evaluation.'
    },
    {
      step: '03',
      title: 'Gradient Boosting Engine',
      icon: <Layers size={22} color="#818cf8" />,
      badge: 'scikit-learn',
      desc: 'An ensemble of sequentially trained decision trees executes sub-millisecond inference, producing calibrated failure probabilities and feature attributions.'
    },
    {
      step: '04',
      title: 'Fault Diagnosis & Alerts',
      icon: <ShieldCheck size={22} color="var(--color-safe)" />,
      badge: 'Domain Rules',
      desc: 'Dual-tier evaluation checks physical failure thresholds (TWF, HDF, PWF, OSF, RNF) and assigns configurable risk tiers: Low (<30%), Medium (30-70%), High (>70%).'
    },
    {
      step: '05',
      title: 'Dispatcher & Audit DB',
      icon: <Database size={22} color="#ec4899" />,
      badge: 'SQLite Storage',
      desc: 'Persists full telemetry snapshots to SQLite for historical audit trails, dispatching human-readable preventive maintenance recommendations to shop-floor technicians.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Overview Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          System Architecture & Pipeline Flow
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '850px' }}>
          Machine Sense is an end-to-end industrial predictive maintenance application built for course 
          <strong> AD5305 Machine Learning</strong>. It operationalizes a validated Gradient Boosting model trained on the 
          <strong> UCI AI4I 2020 Predictive Maintenance Dataset</strong>, providing real-time telemetry monitoring, automated feature engineering, 
          and preventive maintenance guidance.
        </p>
      </div>

      {/* Interactive Visual Pipeline Diagram */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px' }}>
          Real-Time Prediction Pipeline
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          position: 'relative'
        }}>
          {pipelineSteps.map((s, idx) => (
            <div
              key={s.step}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="font-mono" style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-subtle)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {s.step}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {s.badge}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700 }}>{s.title}</h3>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Breakdown Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Backend & ML Stack */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Server size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Backend & Serving Layer</h2>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>FastAPI & Uvicorn:</strong> Asynchronous REST API serving <code style={{ color: 'var(--primary)' }}>POST /predict</code>, <code style={{ color: 'var(--primary)' }}>GET /history</code>, <code style={{ color: 'var(--primary)' }}>GET /model-info</code>, and <code style={{ color: 'var(--primary)' }}>GET /health</code>.
            </li>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>scikit-learn & Joblib:</strong> GradientBoostingClassifier serialized via joblib with OneHotEncoder preprocessor and graceful fallback to calibrated physics-based predictor.
            </li>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>SQLite Storage:</strong> Indexed relational logging of all sensor telemetry inputs, probabilities, and maintenance recommendations.
            </li>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>Pydantic v2:</strong> Strict type validation and bounds verification for all incoming sensor telemetry.
            </li>
          </ul>
        </div>

        {/* Frontend Stack */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Frontend Presentation Layer</h2>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>React 19 & Vite:</strong> Ultra-fast component reactivity with modular architecture, client-side simulation tickers, and telemetry sliders.
            </li>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>Recharts & Custom SVG:</strong> Animated circular risk gauge, confusion matrix heatmap, probability-over-time trend lines, and feature importance rankings.
            </li>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>Lucide-React:</strong> High-precision industrial status, gauge, thermometer, and telemetry icons.
            </li>
            <li style={{ padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <strong>Vanilla Industrial CSS:</strong> Tokenized dark & light mode styling, glassmorphism card surfaces, and responsive layouts.
            </li>
          </ul>
        </div>

      </div>

      {/* How to Drop in Real Model Instructions */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <FileCode size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Model Artifacts & Drop-In Upgrades
          </h2>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
          The backend automatically discovers and loads serialized model artifacts from the <code style={{ color: 'var(--primary)' }}>backend/</code> directory.
          If custom serialized files are exported from Google Colab or Jupyter notebooks, simply drop them into the backend directory:
        </p>

        <div style={{
          background: 'var(--bg-subtle)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          lineHeight: 1.6,
          color: 'var(--text-main)'
        }}>
          <div># In Python / Google Colab:</div>
          <div style={{ color: 'var(--primary)' }}>import joblib</div>
          <div style={{ color: 'var(--primary)' }}>joblib.dump(best_gradient_boosting_model, "model.pkl")</div>
          <div style={{ color: 'var(--primary)' }}>joblib.dump(fitted_column_transformer, "preprocessor.pkl")</div>
          <br />
          <div># Copy to project root:</div>
          <div>backend/model.pkl</div>
          <div>backend/preprocessor.pkl</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.82rem', color: 'var(--color-safe)' }}>
          <CheckCircle size={16} />
          <span>
            If <code style={{ color: 'var(--text-main)' }}>model.pkl</code> is omitted or removed, the app immediately and automatically engages the 
            <strong> Calibrated Mock Fallback Predictor</strong> so all UI views, simulations, and charts remain 100% operational.
          </span>
        </div>
      </div>

    </div>
  );
}
