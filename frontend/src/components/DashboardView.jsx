import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Zap, 
  Thermometer, 
  Gauge as GaugeIcon, 
  Clock, 
  Cpu, 
  Radio, 
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertOctagon,
  CheckSquare,
  Square,
  HelpCircle,
  BarChart2,
  ListChecks
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import Gauge from './Gauge';
import { api } from '../api';

const PRESET_DEFINITIONS = [
  {
    expertName: 'Normal Operations',
    simpleName: 'Example: Normal Operation',
    tag: 'Safe',
    color: 'var(--color-safe)',
    data: {
      type: 'L',
      air_temperature: 298.2,
      process_temperature: 308.7,
      rotational_speed: 1503,
      torque: 40.1,
      tool_wear: 20
    }
  },
  {
    expertName: 'Tool Wear Failure (TWF)',
    simpleName: 'Example: Worn-Out Tool',
    tag: 'TWF Alert',
    color: 'var(--color-danger)',
    data: {
      type: 'L',
      air_temperature: 298.8,
      process_temperature: 308.9,
      rotational_speed: 1455,
      torque: 41.3,
      tool_wear: 208
    }
  },
  {
    expertName: 'Heat Dissipation (HDF)',
    simpleName: 'Example: Overheating',
    tag: 'HDF Alert',
    color: 'var(--color-danger)',
    data: {
      type: 'L',
      air_temperature: 302.3,
      process_temperature: 310.8,
      rotational_speed: 1377,
      torque: 47.3,
      tool_wear: 166
    }
  },
  {
    expertName: 'Power Failure (PWF)',
    simpleName: 'Example: Power Surge',
    tag: 'PWF Alert',
    color: 'var(--color-danger)',
    data: {
      type: 'L',
      air_temperature: 298.9,
      process_temperature: 309.1,
      rotational_speed: 2861,
      torque: 4.6,
      tool_wear: 143
    }
  },
  {
    expertName: 'Overstrain Failure (OSF)',
    simpleName: 'Example: Mechanical Overload',
    tag: 'OSF Alert',
    color: 'var(--color-danger)',
    data: {
      type: 'L',
      air_temperature: 298.4,
      process_temperature: 308.2,
      rotational_speed: 1282,
      torque: 60.7,
      tool_wear: 216
    }
  }
];

export default function DashboardView({ 
  onPredictionComplete,
  isLiveSimulating,
  setIsLiveSimulating,
  recentStream,
  setRecentStream,
  initialValues,
  viewMode = 'simple'
}) {
  const isSimple = viewMode === 'simple';

  // Input form state
  const [formData, setFormData] = useState({
    type: 'L',
    air_temperature: 298.2,
    process_temperature: 308.7,
    rotational_speed: 1503,
    torque: 40.1,
    tool_wear: 20
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [simIntervalMs, setSimIntervalMs] = useState(3000);
  const [simScenario, setSimScenario] = useState('random');

  // Interactive check states for recommended actions checklist
  const [checkedActions, setCheckedActions] = useState({});

  // Compute engineered features live in the UI for instant preview
  const livePower = Math.round(formData.rotational_speed * formData.torque);
  const liveTempDiff = Math.round((formData.process_temperature - formData.air_temperature) * 10) / 10;
  const liveToolTorque = Math.round(formData.tool_wear * formData.torque);

  // If inspection data passed in, load it
  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
      handlePredict(initialValues);
    }
  }, [initialValues]);

  // Initial prediction on load if result is null
  useEffect(() => {
    handlePredict(formData);
  }, []);

  // Live simulation tick timer
  useEffect(() => {
    let timer = null;
    if (isLiveSimulating) {
      timer = setInterval(async () => {
        try {
          const simulatedReq = await api.simulateReading(simScenario);
          const pred = await api.predict(simulatedReq);
          
          setRecentStream(prev => [
            {
              id: pred.prediction_id || Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              type: simulatedReq.type,
              sensors: simulatedReq,
              engineered: pred.engineered_features,
              probability: pred.failure_probability,
              riskLevel: pred.risk_level,
              failureModes: pred.failure_modes.filter(m => m.triggered).map(m => m.code),
              recommendation: pred.recommendation,
              explanation: pred.explanation
            },
            ...prev.slice(0, 19) // keep last 20
          ]);

          if (onPredictionComplete) {
            onPredictionComplete();
          }
        } catch (err) {
          console.error('Simulation tick failed:', err);
        }
      }, simIntervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLiveSimulating, simIntervalMs, simScenario]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'type' ? value : parseFloat(value) || 0
    }));
  };

  const handlePredict = async (dataToPredict = formData) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.predict(dataToPredict);
      setResult(resp);
      setCheckedActions({});
      if (onPredictionComplete) {
        onPredictionComplete();
      }
    } catch (err) {
      setError(err.message || 'Failed to execute prediction.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset) => {
    setFormData(preset.data);
    handlePredict(preset.data);
  };

  const inspectStreamRow = (row) => {
    setFormData(row.sensors);
    handlePredict(row.sensors);
  };

  const toggleActionCheck = (actionIdx) => {
    setCheckedActions(prev => ({
      ...prev,
      [actionIdx]: !prev[actionIdx]
    }));
  };

  // Determine traffic-light status for Simple View
  const getTrafficLightInfo = (riskLevel) => {
    if (riskLevel === 'high') {
      return {
        label: 'Action needed soon',
        color: 'var(--color-danger)',
        bgColor: 'var(--color-danger-bg)',
        borderColor: 'var(--color-danger-border)',
        icon: <AlertOctagon size={36} color="var(--color-danger)" />,
        badgeText: 'CRITICAL ALERT'
      };
    } else if (riskLevel === 'medium') {
      return {
        label: 'Monitor closely',
        color: 'var(--color-warn)',
        bgColor: 'var(--color-warn-bg)',
        borderColor: 'var(--color-warn-border)',
        icon: <AlertTriangle size={36} color="var(--color-warn)" />,
        badgeText: 'WARNING'
      };
    } else {
      return {
        label: 'Safe to operate',
        color: 'var(--color-safe)',
        bgColor: 'var(--color-safe-bg)',
        borderColor: 'var(--color-safe-border)',
        icon: <ShieldCheck size={36} color="var(--color-safe)" />,
        badgeText: 'NORMAL'
      };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner / Presets */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Quick Presets:</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isSimple 
                ? 'Test sample operational conditions with one click' 
                : 'Load calibrated sensor states from the AI4I 2020 dataset'}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PRESET_DEFINITIONS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(p)}
                className="preset-btn"
                title={`Load ${isSimple ? p.simpleName : p.expertName}`}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: p.color
                }} />
                {isSimple ? p.simpleName : p.expertName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Risk Diagnostic Panel (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: Sensor Input */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sliders size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Telemetry Input</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isSimple ? 'Set sensor readings to check machine health' : 'Enter raw sensor readings or adjust sliders'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePredict(formData)}
              disabled={loading}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play size={15} />
                  {isSimple ? 'Check Machine' : 'Predict Risk'}
                </>
              )}
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handlePredict(formData); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Machine Type */}
              <div>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}>
                  <span>Machine Type</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {isSimple ? 'Quality grade' : 'Type: L (Low 50%), M (Med 30%), H (High 20%)'}
                  </span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['L', 'M', 'H'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleInputChange('type', t)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        border: formData.type === t ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                        background: formData.type === t ? 'var(--primary-subtle)' : 'var(--bg-input)',
                        color: formData.type === t ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Type {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Air Temperature */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={15} color="var(--primary)" />
                    Air Temperature [K]
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formData.air_temperature.toFixed(1)} K
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="285.0"
                    max="315.0"
                    step="0.1"
                    value={formData.air_temperature}
                    onChange={(e) => handleInputChange('air_temperature', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="280.0"
                    max="320.0"
                    step="0.1"
                    value={formData.air_temperature}
                    onChange={(e) => handleInputChange('air_temperature', e.target.value)}
                    style={{ width: '80px', textAlign: 'right' }}
                    className="font-mono"
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Typical ambient: 295.0 – 305.0 K
                </span>
              </div>

              {/* Process Temperature */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={15} color="#38bdf8" />
                    Process Temperature [K]
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formData.process_temperature.toFixed(1)} K
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="295.0"
                    max="325.0"
                    step="0.1"
                    value={formData.process_temperature}
                    onChange={(e) => handleInputChange('process_temperature', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="290.0"
                    max="330.0"
                    step="0.1"
                    value={formData.process_temperature}
                    onChange={(e) => handleInputChange('process_temperature', e.target.value)}
                    style={{ width: '80px', textAlign: 'right' }}
                    className="font-mono"
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Typical contact zone: 305.0 – 314.0 K
                </span>
              </div>

              {/* Rotational Speed */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GaugeIcon size={15} color="#818cf8" />
                    Rotational Speed [rpm]
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formData.rotational_speed} RPM
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="1000"
                    max="3000"
                    step="5"
                    value={formData.rotational_speed}
                    onChange={(e) => handleInputChange('rotational_speed', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="500"
                    max="4000"
                    step="1"
                    value={formData.rotational_speed}
                    onChange={(e) => handleInputChange('rotational_speed', e.target.value)}
                    style={{ width: '80px', textAlign: 'right' }}
                    className="font-mono"
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Typical spindle speed: 1150 – 2900 RPM
                </span>
              </div>

              {/* Torque */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={15} color="#f59e0b" />
                    Torque [Nm]
                  </span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formData.torque.toFixed(1)} Nm
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="3.0"
                    max="80.0"
                    step="0.5"
                    value={formData.torque}
                    onChange={(e) => handleInputChange('torque', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0.0"
                    max="120.0"
                    step="0.1"
                    value={formData.torque}
                    onChange={(e) => handleInputChange('torque', e.target.value)}
                    style={{ width: '80px', textAlign: 'right' }}
                    className="font-mono"
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Typical motor resistance: 3.0 – 77.0 Nm
                </span>
              </div>

              {/* Tool Wear */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="#ec4899" />
                    Tool Wear [min]
                  </span>
                  <span className="font-mono" style={{
                    fontWeight: 700,
                    color: formData.tool_wear >= 200 ? 'var(--color-danger)' : 'var(--text-main)'
                  }}>
                    {formData.tool_wear} min {formData.tool_wear >= 200 ? '⚠️' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="260"
                    step="1"
                    value={formData.tool_wear}
                    onChange={(e) => handleInputChange('tool_wear', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="350"
                    step="1"
                    value={formData.tool_wear}
                    onChange={(e) => handleInputChange('tool_wear', e.target.value)}
                    style={{ width: '80px', textAlign: 'right' }}
                    className="font-mono"
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Failure threshold: 200 – 240 min
                </span>
              </div>

            </div>
          </form>

          {/* Expert View ONLY: Real-time Server-side Engineered Features */}
          {!isSimple && (
            <div style={{
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Cpu size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Server-Engineered Feature Synthesizer
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                    Power (RPM × Torque)
                  </span>
                  <span className="font-mono" style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: (livePower < 3500 || livePower > 9000) ? 'var(--color-danger)' : 'var(--text-main)'
                  }}>
                    {livePower.toLocaleString()} W
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                    Temp Diff (Proc - Air)
                  </span>
                  <span className="font-mono" style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: (liveTempDiff < 8.6) ? 'var(--color-danger)' : 'var(--text-main)'
                  }}>
                    {liveTempDiff} K
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                    Tool × Torque Load
                  </span>
                  <span className="font-mono" style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: (liveToolTorque > 11000) ? 'var(--color-danger)' : 'var(--text-main)'
                  }}>
                    {liveToolTorque.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Diagnostic Result Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SIMPLE VIEW PRESENTATION                                                  */}
          {/* ========================================================================= */}
          {isSimple && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Large Traffic-Light Status Card */}
              {(() => {
                const tl = getTrafficLightInfo(result.risk_level);
                return (
                  <div style={{
                    background: tl.bgColor,
                    border: `2px solid ${tl.borderColor}`,
                    borderRadius: '16px',
                    padding: '24px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-card)',
                      flexShrink: 0
                    }}>
                      {tl.icon}
                    </div>

                    <div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: tl.color,
                        textTransform: 'uppercase',
                        display: 'block'
                      }}>
                        {tl.badgeText}
                      </span>
                      <h2 style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: tl.color,
                        lineHeight: 1.2,
                        marginTop: '2px'
                      }}>
                        {tl.label}
                      </h2>
                      <span style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        display: 'block'
                      }}>
                        Operational risk status derived from real-time telemetry
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Plain-English Explanation Summary */}
              {result.explanation && (
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Why is this happening?
                  </span>
                  <p style={{
                    fontSize: '1.08rem',
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: 'var(--text-main)'
                  }}>
                    "{result.explanation.summary_sentence}"
                  </p>
                </div>
              )}

              {/* Recommended Actions Checklist */}
              {result.explanation && result.explanation.recommended_actions && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <ListChecks size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Recommended Preventive Actions</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.explanation.recommended_actions.map((act, idx) => {
                      const isChecked = !!checkedActions[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleActionCheck(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: isChecked ? 'var(--bg-subtle)' : 'var(--bg-card)',
                            border: `1px solid ${isChecked ? 'var(--color-safe-border)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ color: isChecked ? 'var(--color-safe)' : 'var(--text-dim)', flexShrink: 0 }}>
                            {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                          <span style={{
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            color: isChecked ? 'var(--text-muted)' : 'var(--text-main)',
                            textDecoration: isChecked ? 'line-through' : 'none'
                          }}>
                            {act}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '8px' }}>
                    Click items to check off actions during inspection
                  </span>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* EXPERT VIEW PRESENTATION                                                  */}
          {/* ========================================================================= */}
          {!isSimple && result && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '14px'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Risk Evaluation</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Gradient Boosting inference and failure mode assessment
                  </p>
                </div>

                <span className={`badge ${
                  result.risk_level === 'high' ? 'badge-danger' :
                  result.risk_level === 'medium' ? 'badge-warn' : 'badge-safe'
                }`}>
                  {result.risk_level === 'high' && <XCircle size={14} />}
                  {result.risk_level === 'medium' && <AlertTriangle size={14} />}
                  {result.risk_level === 'low' && <CheckCircle size={14} />}
                  {result.risk_level.toUpperCase()} RISK
                </span>
              </div>

              {/* Gauge and Probability Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                gap: '20px',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)'
              }}>
                <Gauge 
                  probability={result.failure_probability} 
                  riskLevel={result.risk_level}
                  size={170}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Diagnostic Verdict
                    </span>
                    <h3 style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: result.risk_level === 'high' ? 'var(--color-danger)' :
                             result.risk_level === 'medium' ? 'var(--color-warn)' : 'var(--color-safe)'
                    }}>
                      {result.predicted_failure === 1 ? 'Failure Imminent' : 'Nominal Operation'}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.86rem', lineHeight: 1.45, color: 'var(--text-main)' }}>
                    {result.recommendation}
                  </p>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                    Inference engine: <strong style={{ color: 'var(--text-main)' }}>{result.model_source}</strong>
                  </div>
                </div>
              </div>

              {/* Failure Modes Matrix (TWF, HDF, PWF, OSF, RNF) */}
              <div>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '10px',
                  letterSpacing: '0.04em'
                }}>
                  Domain Failure Sub-Mode Status
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {result.failure_modes.map((mode) => (
                    <div
                      key={mode.code}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: mode.triggered ? 'var(--color-danger-bg)' : 'var(--bg-subtle)',
                        border: `1px solid ${mode.triggered ? 'var(--color-danger-border)' : 'var(--border-subtle)'}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: mode.triggered ? 'var(--color-danger)' : 'var(--text-main)'
                        }}>
                          {mode.code}
                        </span>
                        {mode.triggered ? (
                          <XCircle size={14} color="var(--color-danger)" />
                        ) : (
                          <CheckCircle size={14} color="var(--color-safe)" />
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: mode.triggered ? 'var(--color-danger)' : 'var(--text-muted)'
                      }}>
                        {mode.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NEW SECTION: Prediction Explanation (XAI Layer) */}
              {result.explanation && (
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BarChart2 size={16} color="var(--primary)" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Prediction Explanation (Rule-Based Driver Attribution)
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Stand-in for SHAP
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>
                    "{result.explanation.summary_sentence}"
                  </p>

                  {/* Horizontal Bar Chart of Primary Drivers */}
                  <div style={{ height: '160px', width: '100%', marginBottom: '12px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={result.explanation.primary_drivers.slice(0, 4).map(d => ({
                          name: d.plain_label,
                          severityWeight: d.severity === 'high' ? 90 : d.severity === 'medium' ? 50 : 20,
                          severity: d.severity,
                          detail: d.detail,
                          thresholdInfo: d.threshold_info
                        }))}
                        margin={{ top: 0, right: 20, left: 130, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--text-main)', fontSize: 11, fontWeight: 500 }}
                          width={125}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div style={{
                                  background: 'var(--bg-card)',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-hover)',
                                  fontSize: '0.78rem',
                                  maxWidth: '280px'
                                }}>
                                  <strong style={{ color: 'var(--text-main)' }}>{d.name}</strong>
                                  <div style={{
                                    color: d.severity === 'high' ? 'var(--color-danger)' : d.severity === 'medium' ? 'var(--color-warn)' : 'var(--color-safe)',
                                    fontWeight: 700,
                                    margin: '2px 0'
                                  }}>
                                    Severity: {d.severity.toUpperCase()}
                                  </div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                                    {d.detail}
                                  </div>
                                  {d.thresholdInfo && (
                                    <div className="font-mono" style={{ color: 'var(--primary)', fontSize: '0.7rem', marginTop: '4px' }}>
                                      {d.thresholdInfo}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="severityWeight" radius={[0, 4, 4, 0]}>
                          {result.explanation.primary_drivers.slice(0, 4).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.severity === 'high' ? 'var(--color-danger)' : entry.severity === 'medium' ? 'var(--color-warn)' : 'var(--color-safe)'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Technical Recommended Actions with Thresholds */}
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                      Diagnostic Trigger Checklist:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {result.explanation.recommended_actions.map((act, idx) => {
                        // Find matching driver if any for threshold context
                        const matchingDriver = result.explanation.primary_drivers.find(d => d.severity === 'high' || d.severity === 'medium');
                        return (
                          <div 
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              • {act}
                            </div>
                            {matchingDriver && matchingDriver.threshold_info && (
                              <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Trigger context: {matchingDriver.threshold_info}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Top Contributing Features Bar Chart */}
              <div>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginBottom: '8px',
                  letterSpacing: '0.04em'
                }}>
                  Top Contributing Model Features
                </span>

                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '14px 12px 6px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  height: '190px'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={result.top_contributing_features.slice(0, 5)}
                      margin={{ top: 0, right: 20, left: 100, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        width={95}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                background: 'var(--bg-card)',
                                padding: '8px 12px',
                                border: '1px solid var(--border-hover)',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                boxShadow: 'var(--shadow-card)'
                              }}>
                                <strong style={{ color: 'var(--text-main)' }}>{data.feature}</strong>
                                <div style={{ color: 'var(--primary)' }}>
                                  Relative Weight: {(data.importance * 100).toFixed(1)}%
                                </div>
                                <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '2px' }}>
                                  Value: {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                        {result.top_contributing_features.slice(0, 5).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? 'var(--primary)' : index === 1 ? '#38bdf8' : '#64748b'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* BOTTOM SECTION: Live-Feed Simulation Module */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isLiveSimulating ? 'var(--color-safe-bg)' : 'var(--bg-subtle)',
                color: isLiveSimulating ? 'var(--color-safe)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Radio size={18} className={isLiveSimulating ? 'spin-slow' : ''} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Simulated Sensor Stream (IoT Simulation Mode)
                  </h2>
                  <span className={`badge ${isLiveSimulating ? 'badge-safe' : 'badge-primary'}`}>
                    {isLiveSimulating ? (
                      <>
                        <span className="live-pulse" />
                        STREAMING ACTIVE
                      </>
                    ) : 'PAUSED'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Continuous background telemetry generation simulating high-throughput industrial machine monitoring
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Scenario Selector */}
            <select
              value={simScenario}
              onChange={(e) => setSimScenario(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.84rem' }}
            >
              <option value="random">Dynamic Operating Distribution</option>
              <option value="healthy">Healthy Nominal Baseline</option>
              <option value="overstrain">Induce Torque Overstrain</option>
              <option value="heat_dissipation">Induce Heat Dissipation Flaw</option>
              <option value="tool_wear">Accelerate Tool Wear Drift</option>
            </select>

            {/* Toggle Button */}
            <button
              onClick={() => setIsLiveSimulating(!isLiveSimulating)}
              className={isLiveSimulating ? 'btn-secondary' : 'btn-primary'}
              style={{
                borderColor: isLiveSimulating ? 'var(--color-warn)' : undefined,
                color: isLiveSimulating ? 'var(--color-warn)' : undefined
              }}
            >
              {isLiveSimulating ? (
                <>
                  <Pause size={16} />
                  Pause Stream
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start Live Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Stream Table */}
        {recentStream.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            background: 'var(--bg-subtle)',
            borderRadius: '12px'
          }}>
            <Radio size={28} color="var(--primary)" style={{ marginBottom: '8px' }} />
            <p>No simulated telemetry ticks received yet.</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Click <strong>"Start Live Simulation"</strong> above to begin continuous real-time IoT fault-detection stream.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>Machine</th>
                  {isSimple ? (
                    <>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Reason / Explanation</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '10px 12px' }}>Air / Proc Temp</th>
                      <th style={{ padding: '10px 12px' }}>Speed [RPM]</th>
                      <th style={{ padding: '10px 12px' }}>Torque [Nm]</th>
                      <th style={{ padding: '10px 12px' }}>Tool Wear</th>
                      <th style={{ padding: '10px 12px' }}>Power</th>
                      <th style={{ padding: '10px 12px' }}>Failure Risk</th>
                      <th style={{ padding: '10px 12px' }}>Alert Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {recentStream.map((row) => {
                  const tl = getTrafficLightInfo(row.riskLevel);
                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="font-mono" style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>
                        {row.timestamp}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                        Type {row.type}
                      </td>

                      {/* Simple View Rows */}
                      {isSimple ? (
                        <>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge ${
                              row.riskLevel === 'high' ? 'badge-danger' :
                              row.riskLevel === 'medium' ? 'badge-warn' : 'badge-safe'
                            }`} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                              {tl.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                            {row.explanation?.summary_sentence || row.recommendation}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => inspectStreamRow(row)}
                              className="preset-btn"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              title="Inspect this reading"
                            >
                              Inspect <ArrowRight size={12} />
                            </button>
                          </td>
                        </>
                      ) : (
                        /* Expert View Rows */
                        <>
                          <td className="font-mono" style={{ padding: '10px 12px' }}>
                            {row.sensors.air_temperature.toFixed(1)} / {row.sensors.process_temperature.toFixed(1)} K
                          </td>
                          <td className="font-mono" style={{ padding: '10px 12px' }}>
                            {row.sensors.rotational_speed}
                          </td>
                          <td className="font-mono" style={{ padding: '10px 12px' }}>
                            {row.sensors.torque.toFixed(1)}
                          </td>
                          <td className="font-mono" style={{ padding: '10px 12px' }}>
                            {row.sensors.tool_wear} min
                          </td>
                          <td className="font-mono" style={{ padding: '10px 12px' }}>
                            {Math.round(row.engineered.power).toLocaleString()} W
                          </td>
                          <td className="font-mono" style={{
                            padding: '10px 12px',
                            fontWeight: 700,
                            color: row.riskLevel === 'high' ? 'var(--color-danger)' :
                                   row.riskLevel === 'medium' ? 'var(--color-warn)' : 'var(--color-safe)'
                          }}>
                            {(row.probability * 100).toFixed(1)}%
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge ${
                              row.riskLevel === 'high' ? 'badge-danger' :
                              row.riskLevel === 'medium' ? 'badge-warn' : 'badge-safe'
                            }`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                              {row.riskLevel.toUpperCase()}
                            </span>
                            {row.failureModes.length > 0 && (
                              <span style={{
                                fontSize: '0.68rem',
                                color: 'var(--color-danger)',
                                fontWeight: 700,
                                marginLeft: '6px'
                              }}>
                                [{row.failureModes.join(',')}]
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <button
                              onClick={() => inspectStreamRow(row)}
                              className="preset-btn"
                              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                              title="Load this telemetry reading into manual predictor"
                            >
                              Inspect <ArrowRight size={12} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
