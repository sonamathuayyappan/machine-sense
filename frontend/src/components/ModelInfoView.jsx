import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  BarChart3, 
  Award, 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Database,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Legend 
} from 'recharts';
import { api } from '../api';

export default function ModelInfoView({ viewMode = 'simple' }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInfo() {
      try {
        const data = await api.getModelInfo();
        setModelInfo(data);
      } catch (err) {
        setError(err.message || 'Failed to load model card metadata.');
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Loading accuracy & model metadata...
      </div>
    );
  }

  if (error || !modelInfo) {
    return (
      <div className="glass-panel" style={{ padding: '24px', color: 'var(--color-danger)' }}>
        Failed to fetch model card: {error}
      </div>
    );
  }

  const { 
    dataset, 
    metrics_comparison, 
    confusion_matrix, 
    feature_importance, 
    class_imbalance_analysis, 
    failure_modes_definition,
    why_this_matters 
  } = modelInfo;

  // Comparison metrics bar chart data
  const comparisonChartData = metrics_comparison.map(m => ({
    name: m.model_name.replace(' Classifier', '').replace(' (Baseline)', ''),
    Accuracy: m.accuracy,
    Precision: m.precision,
    Recall: m.recall,
    F1: m.f1_score,
    'ROC-AUC': m.roc_auc,
    isBest: m.is_best
  }));

  // Reusable Why This Matters Note
  const renderWhyThisMatters = () => (
    <div style={{
      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <HelpCircle size={18} color="var(--primary)" />
        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
          Why This Matters: Beyond Raw Accuracy in Rare-Event Detection
        </h3>
      </div>
      <p style={{
        fontSize: '0.86rem',
        color: 'var(--text-main)',
        lineHeight: 1.6,
        margin: 0
      }}>
        {why_this_matters || (
          "Because only 3.39% of the dataset represents real machine failures, a model that always guesses 'no failure' would already achieve over 96% accuracy while being completely useless — so precision (ensuring a flagged failure is real to avoid costly false alarms) and recall (catching as many real failures as possible before catastrophic breakdown) matter far more than raw accuracy alone."
        )}
      </p>
    </div>
  );

  // If Simple View is active, render a plain-language summary instead of the raw technical table
  if (viewMode === 'simple') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Banner: Plain Language Accuracy */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>How Accurate Is This AI System?</h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  A plain-language summary of machine diagnostic reliability, validation benchmarks, and safety guarantees
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-safe" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <CheckCircle2 size={14} /> 99.2% Overall Reliability
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                <Award size={14} /> 96.4% Alert Trustworthiness
              </span>
            </div>
          </div>
        </div>

        {/* Why This Matters Note */}
        {renderWhyThisMatters()}

        {/* Plain Language One-Paragraph Summary Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>
            Operational Reliability & Performance Summary
          </h2>
          <p style={{
            fontSize: '0.94rem',
            color: 'var(--text-main)',
            lineHeight: 1.7,
            margin: 0
          }}>
            The Machine Sense predictive maintenance system was trained on 10,000 real-world industrial machine cycles and validated across 2,000 unseen test cycles. It achieves <strong>99.2% overall diagnostic reliability</strong> and successfully catches <strong>4 out of every 5 impending machine breakdowns</strong> (79.4% recall) before catastrophic stops occur. Most importantly, when a failure warning is issued, <strong>96.4% of alerts correspond to a genuine physical defect</strong> — meaning your maintenance crew spends their time fixing real issues rather than chasing false alarms.
          </p>
        </div>

        {/* 3 Key Operational Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-safe)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Overall Accuracy
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-safe)' }}>
              99.2%
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
              Out of every 100 machine cycles evaluated, more than 99 are diagnosed accurately without errors.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Alert Trustworthiness (Precision)
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              96.4%
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
              When the system alerts you, 96.4% of warnings are real mechanical issues, protecting technicians from false alarm fatigue.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Breakdown Prevention (Recall)
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>
              79.4%
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
              Catches the vast majority of impending mechanical breakdowns in advance before catastrophic factory halts.
            </p>
          </div>
        </div>

        {/* 5 Common Machine Faults Caught in Real Time */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
            Common Machine Faults Caught in Real Time
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            The AI continuously monitors operating conditions to preempt five major categories of machine damage:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                1. Worn-Out Tool
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Alerts when cutting edge cumulative contact time reaches dulling or micro-chipping limits.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                2. Heat Buildup
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Detects insufficient convective cooling when temperature difference and fan speed drop too low.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                3. Power & Motor Irregularities
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Catches motor stalling from inadequate power delivery or sudden electrical overload surges.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                4. Mechanical Overload
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Flags when cutting forces and wear exceed the physical structural strength of the machine.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                5. Random Faults
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Monitors background anomalies that occur independently of continuous sensor trends.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EXPERT VIEW: Full technical card with all benchmark tables, formulas, confusion matrix
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner: Algorithm & Dataset Overview */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Model Card & Architecture Benchmark</h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Selected Model: <strong>Gradient Boosting Classifier</strong> (AD5305 Machine Learning Project)
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="badge badge-primary">
              <Database size={13} /> UCI AI4I 2020
            </span>
            <span className="badge badge-safe">
              <Award size={13} /> 99.2% Test Accuracy
            </span>
            <span className="badge badge-safe">
              <Award size={13} /> 97.2% ROC-AUC
            </span>
          </div>
        </div>

        {/* Dataset Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dataset Name</span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>{dataset.name}</div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sample Size</span>
            <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>
              {dataset.total_records.toLocaleString()} rows × {dataset.total_columns} cols
            </div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', textTransform: 'uppercase' }}>Class Imbalance</span>
            <div className="font-mono" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-danger)', marginTop: '2px' }}>
              {dataset.failure_rate_pct}% Failure Rate ({dataset.failed_records} fail / {dataset.healthy_records} safe)
            </div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evaluation Partition</span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>{dataset.split_ratio}</div>
          </div>
        </div>
      </div>

      {/* Why This Matters Note (in Expert View too) */}
      {renderWhyThisMatters()}

      {/* Model Benchmark Comparison Table & Grouped Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Model Benchmark Comparison</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Empirical evaluation across all 3 trained candidates on the 2,000-sample test partition
          </p>
        </div>

        {/* Comparison Table */}
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '12px' }}>Model Architecture</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Accuracy</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Precision</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Recall</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>F1-Score</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>ROC-AUC</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {metrics_comparison.map((m) => (
                <tr
                  key={m.model_name}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: m.is_best ? 'var(--primary-subtle)' : 'transparent',
                    fontWeight: m.is_best ? 600 : 400
                  }}
                >
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.is_best && <Award size={16} color="var(--primary)" />}
                    {m.model_name}
                  </td>
                  <td className="font-mono" style={{ padding: '12px', textAlign: 'right' }}>{m.accuracy}%</td>
                  <td className="font-mono" style={{ padding: '12px', textAlign: 'right', color: m.is_best ? 'var(--color-safe)' : 'inherit' }}>
                    {m.precision}%
                  </td>
                  <td className="font-mono" style={{ padding: '12px', textAlign: 'right', color: m.is_best ? 'var(--color-safe)' : 'inherit' }}>
                    {m.recall}%
                  </td>
                  <td className="font-mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: m.is_best ? 'var(--primary)' : 'inherit' }}>
                    {m.f1_score}%
                  </td>
                  <td className="font-mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>
                    {m.roc_auc}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {m.is_best ? (
                      <span className="badge badge-safe" style={{ fontSize: '0.7rem' }}>
                        Selected Best
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Baseline
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grouped Bar Chart */}
        <div style={{ height: '240px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{
                        background: 'var(--bg-card)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-hover)',
                        fontSize: '0.78rem'
                      }}>
                        <strong style={{ color: 'var(--text-main)' }}>{label}</strong>
                        {payload.map((p) => (
                          <div key={p.name} style={{ color: p.color, marginTop: '2px' }}>
                            {p.name}: {p.value}%
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
              <Bar dataKey="Precision" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ROC-AUC" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix and Class Imbalance Insight Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Confusion Matrix Interactive Heatmap */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Gradient Boosting Confusion Matrix</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Evaluation on 2,000 test partition samples (68 actual failures, 1,932 actual non-failures)
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 1fr',
            gap: '8px',
            textAlign: 'center',
            fontSize: '0.84rem'
          }}>
            {/* Header row */}
            <div />
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', padding: '6px' }}>
              Pred: No Failure
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', padding: '6px' }}>
              Pred: Failure
            </div>

            {/* Actual Negative Row */}
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
              Actual Safe
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid var(--color-safe)',
              borderRadius: '10px',
              padding: '16px 10px'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-safe)', display: 'block', fontWeight: 700 }}>
                TRUE NEGATIVE (TN)
              </span>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-safe)' }}>
                {confusion_matrix.true_negative}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Safe correctly passed
              </span>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '16px 10px'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-warn)', display: 'block', fontWeight: 700 }}>
                FALSE POSITIVE (FP)
              </span>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warn)' }}>
                {confusion_matrix.false_positive}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                False alarms (only 0.1%!)
              </span>
            </div>

            {/* Actual Positive Row */}
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
              Actual Fail
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '16px 10px'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', display: 'block', fontWeight: 700 }}>
                FALSE NEGATIVE (FN)
              </span>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                {confusion_matrix.false_negative}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Missed breakdowns
              </span>
            </div>

            <div style={{
              background: 'rgba(6, 182, 212, 0.18)',
              border: '2px solid var(--primary)',
              borderRadius: '10px',
              padding: '16px 10px'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'block', fontWeight: 700 }}>
                TRUE POSITIVE (TP)
              </span>
              <div className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                {confusion_matrix.true_positive}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Breakdowns intercepted
              </span>
            </div>
          </div>

          <div style={{
            marginTop: '18px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45
          }}>
            <strong>Matrix Precision Calculation:</strong> TP / (TP + FP) = 54 / (54 + 2) = <strong style={{ color: 'var(--color-safe)' }}>96.4% Precision</strong>.<br />
            <strong>Matrix Recall Calculation:</strong> TP / (TP + FN) = 54 / (54 + 14) = <strong style={{ color: 'var(--primary)' }}>79.4% Recall</strong>.
          </div>
        </div>

        {/* Why Precision/Recall Matter in Severe Imbalance */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--color-warn)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>The 3.39% Class Imbalance Problem</h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Why Accuracy is deceptive in industrial predictive maintenance
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', lineHeight: 1.55 }}>
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '12px 14px',
              borderRadius: '10px',
              borderLeft: '4px solid var(--color-warn)'
            }}>
              <strong style={{ color: 'var(--text-main)' }}>The Accuracy Paradox:</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.82rem' }}>
                {class_imbalance_analysis.accuracy_paradox}
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--color-safe)' }}>Why 96.4% Precision Matters:</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                {class_imbalance_analysis.precision_importance}
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--primary)' }}>Why 79.4% Recall Matters:</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                {class_imbalance_analysis.recall_importance}
              </p>
            </div>

            <div>
              <strong style={{ color: '#a855f7' }}>The F1-Score (87.1%):</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                {class_imbalance_analysis.f1_score}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Feature Importance Ranking Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Feature Importance Ranking (Highest to Lowest)</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Empirical feature weight hierarchy derived from the Gradient Boosting ensemble
          </p>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={feature_importance}
              margin={{ top: 0, right: 30, left: 140, bottom: 0 }}
            >
              <XAxis 
                type="number" 
                tick={{ fill: 'var(--text-dim)', fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} 
              />
              <YAxis
                type="category"
                dataKey="display_name"
                tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={135}
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
                        fontSize: '0.8rem',
                        boxShadow: 'var(--shadow-card)'
                      }}>
                        <strong style={{ color: 'var(--text-main)' }}>Rank #{d.ranking}: {d.display_name}</strong>
                        <div style={{ color: 'var(--primary)', fontWeight: 700, margin: '2px 0' }}>
                          Importance: {(d.importance_weight * 100).toFixed(1)}% ({d.category})
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', maxWidth: '280px' }}>
                          {d.description}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="importance_weight" radius={[0, 6, 6, 0]}>
                {feature_importance.map((entry, index) => (
                  <Cell
                    key={`feat-${index}`}
                    fill={
                      index === 0 ? '#06b6d4' :
                      index === 1 ? '#0ea5e9' :
                      index === 2 ? '#3b82f6' :
                      index === 3 ? '#6366f1' :
                      index === 4 ? '#8b5cf6' :
                      '#64748b'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Domain Failure Modes Specification Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Physical Failure Modes Specification</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Ground truth physical failure modes defined in the UCI AI4I 2020 dataset
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {failure_modes_definition.map((f) => (
            <div
              key={f.code}
              style={{
                background: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{f.code}</span>
                <strong style={{ fontSize: '0.92rem' }}>{f.name}</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {f.physical_condition}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
