import React, { useState, useEffect } from 'react';
import { 
  History, 
  Filter, 
  Trash2, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowUpDown,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { api } from '../api';

export default function HistoryView({ onSelectForInspection, viewMode = 'simple' }) {
  const [historyData, setHistoryData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Filters
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [limit, setLimit] = useState(50);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getHistory({
        limit,
        risk_level: riskFilter !== 'all' ? riskFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      });
      setHistoryData(resp.items || []);
      setSummary(resp.summary);
      setTotal(resp.total);
    } catch (err) {
      setError(err.message || 'Failed to load prediction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter, typeFilter, limit]);

  const handleClearHistory = async () => {
    try {
      await api.clearHistory();
      setShowClearConfirm(false);
      fetchHistory();
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (historyData.length === 0) return;
    const headers = [
      'ID', 'Timestamp', 'Type', 'Air_Temp_K', 'Process_Temp_K', 
      'Rotational_Speed_RPM', 'Torque_Nm', 'Tool_Wear_Min', 'Power_W', 
      'Temp_Diff_K', 'Tool_Torque_Product', 'Failure_Probability', 
      'Risk_Level', 'Predicted_Failure', 'Failure_Modes', 'Model_Source', 'Recommendation'
    ];
    
    const rows = historyData.map(item => [
      item.id,
      `"${item.timestamp}"`,
      item.type,
      item.air_temperature,
      item.process_temperature,
      item.rotational_speed,
      item.torque,
      item.tool_wear,
      item.power,
      item.temp_diff,
      item.tool_torque_product,
      item.failure_probability,
      item.risk_level,
      item.predicted_failure,
      `"${item.active_failure_modes || ''}"`,
      `"${item.model_source}"`,
      `"${item.recommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `machine_sense_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data (reverse so oldest is left, newest right)
  const chartData = [...historyData].reverse().map((item, idx) => ({
    time: item.timestamp ? item.timestamp.split('T')[1]?.slice(0, 8) || `#${idx + 1}` : `#${idx + 1}`,
    probability: Math.round(item.failure_probability * 1000) / 10,
    risk: item.risk_level,
    type: item.type,
    power: Math.round(item.power)
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Controls */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Prediction Audit History</h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Logged telemetry evaluations stored in persistent SQLite repository
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Risk filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="all">{viewMode === 'simple' ? 'All Machine Statuses' : 'All Risk Levels'}</option>
              <option value="low">{viewMode === 'simple' ? 'Safe to Operate' : 'Low Risk (< 30%)'}</option>
              <option value="medium">{viewMode === 'simple' ? 'Monitor Closely' : 'Medium Risk (30-70%)'}</option>
              <option value="high">{viewMode === 'simple' ? 'Action Needed Soon' : 'High Risk (> 70%)'}</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="all">{viewMode === 'simple' ? 'All Machine Types (L, M, H)' : 'All Variants (L, M, H)'}</option>
              <option value="L">Type L (Light-duty)</option>
              <option value="M">Type M (Medium-duty)</option>
              <option value="H">Type H (Heavy-duty)</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="btn-secondary"
              title="Refresh database records"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              Refresh
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={historyData.length === 0}
              className="btn-secondary"
              title="Export all visible records to CSV"
            >
              <Download size={15} />
              Export CSV
            </button>

            {/* Clear History */}
            {showClearConfirm ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleClearHistory}
                  className="preset-btn"
                  style={{ background: 'var(--color-danger)', color: '#fff', borderColor: 'var(--color-danger)' }}
                >
                  <Check size={14} /> Confirm Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="preset-btn"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn-secondary"
                style={{ color: 'var(--color-danger)' }}
                title="Wipe database history"
              >
                <Trash2 size={15} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {viewMode === 'simple' ? 'Total Evaluations' : 'Total Logged'}
            </span>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
              {summary.total_predictions.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {viewMode === 'simple' ? 'Logged cycles' : 'Evaluation events'}
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-safe)', textTransform: 'uppercase' }}>
              {viewMode === 'simple' ? 'Safe to Operate' : 'Low Risk (Safe)'}
            </span>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-safe)', marginTop: '4px' }}>
              {summary.low_risk_count.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {summary.total_predictions > 0 ? ((summary.low_risk_count / summary.total_predictions) * 100).toFixed(1) : 0}% of fleet
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-warn)', textTransform: 'uppercase' }}>
              {viewMode === 'simple' ? 'Monitor Closely' : 'Medium Risk (Warn)'}
            </span>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warn)', marginTop: '4px' }}>
              {summary.medium_risk_count.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {viewMode === 'simple' ? 'Watchlist items' : 'Watchlist status'}
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-danger)', textTransform: 'uppercase' }}>
              {viewMode === 'simple' ? 'Action Needed Soon' : 'High Risk (Critical)'}
            </span>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '4px' }}>
              {summary.high_risk_count.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {viewMode === 'simple' ? 'Maintenance needed' : 'Immediate intervention'}
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
              {viewMode === 'simple' ? 'Average Fleet Risk' : 'Average Fleet Risk'}
            </span>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
              {(summary.average_failure_probability * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {viewMode === 'simple' ? 'Fleet-wide failure rate' : 'Mean failure probability'}
            </span>
          </div>
        </div>
      )}

      {/* Probability Over Time Trend Chart */}
      {chartData.length > 1 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Telemetry Failure Risk Trend Over Time</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Chronological probability progression with amber (30%) and red (70%) safety thresholds
              </p>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#06b6d4' }} />
                Failure Risk %
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warn)' }}>
                -- Warning (30%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)' }}>
                -- Critical (70%)
              </span>
            </div>
          </div>

          <div style={{ height: '230px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: 'var(--text-dim)', fontSize: 11 }} 
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: 'var(--text-dim)', fontSize: 11 }} 
                  axisLine={{ stroke: 'var(--border-subtle)' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
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
                          boxShadow: 'var(--shadow-elevated)',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ color: 'var(--text-muted)' }}>{d.time} • Type {d.type}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                            {d.probability}% Risk
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Power: {d.power.toLocaleString()} W
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={30} stroke="var(--color-warn)" strokeDasharray="3 3" />
                <ReferenceLine y={70} stroke="var(--color-danger)" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="probability" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#riskGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Prediction History Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {viewMode === 'simple' ? 'Operational History Log' : 'Audit Trail'} ({historyData.length} records shown)
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {viewMode === 'simple' 
                ? 'Simplified operational record showing machine status, diagnosis reason, and key action' 
                : 'Detailed telemetry logs with full feature vectors and expandable XAI prediction explanations'}
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Order: Newest First
          </span>
        </div>

        {historyData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            <History size={36} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
            <p>No historical predictions match the selected filters.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Run predictions in the Dashboard or enable Live Simulation to populate the log.
            </p>
          </div>
        ) : viewMode === 'simple' ? (
          /* =========================================================
             SIMPLE VIEW: Exactly 4 columns
             1. Time
             2. Status (traffic-light badge)
             3. Reason (summary_sentence, truncated)
             4. Recommended action (first item only)
             ========================================================= */
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.86rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '12px 14px', width: '180px' }}>Time</th>
                  <th style={{ padding: '12px 14px', width: '180px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Reason</th>
                  <th style={{ padding: '12px 14px' }}>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => {
                  const dateStr = item.timestamp 
                    ? new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) 
                    : `#${item.id}`;

                  // Traffic light status mapping
                  const statusConfig = item.risk_level === 'high' 
                    ? { label: 'Action needed soon', badgeClass: 'badge-danger', dotColor: '#ef4444' }
                    : item.risk_level === 'medium'
                    ? { label: 'Monitor closely', badgeClass: 'badge-warn', dotColor: '#f59e0b' }
                    : { label: 'Safe to operate', badgeClass: 'badge-safe', dotColor: '#10b981' };

                  // Reason fallback
                  const reasonText = item.summary_sentence || (
                    item.risk_level === 'high'
                      ? 'Risk is elevated based on excessive operational telemetry readings.'
                      : item.risk_level === 'medium'
                      ? 'Machine telemetry indicates elevated strain or temperature buildup.'
                      : 'All operational parameters within safe, nominal operating bounds.'
                  );

                  // Recommended action (first item only)
                  const firstAction = (item.recommended_actions && item.recommended_actions.length > 0)
                    ? item.recommended_actions[0]
                    : (item.recommendation || 'No action needed — continue standard monitoring');

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* 1. Time */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                        <div>{dateStr}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Machine Type {item.type}
                        </div>
                      </td>

                      {/* 2. Status (traffic-light badge) */}
                      <td style={{ padding: '12px 14px' }}>
                        <span 
                          className={`badge ${statusConfig.badgeClass}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                        >
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: statusConfig.dotColor
                          }} />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* 3. Reason (summary_sentence, truncated) */}
                      <td 
                        style={{
                          padding: '12px 14px',
                          maxWidth: '360px',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          lineHeight: '1.4'
                        }}
                        title={reasonText}
                      >
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {reasonText}
                        </div>
                      </td>

                      {/* 4. Recommended Action (first item only) */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {firstAction}
                          </span>
                          {onSelectForInspection && (
                            <button
                              onClick={() => onSelectForInspection({
                                type: item.type,
                                air_temperature: item.air_temperature,
                                process_temperature: item.process_temperature,
                                rotational_speed: item.rotational_speed,
                                torque: item.torque,
                                tool_wear: item.tool_wear
                              })}
                              className="preset-btn"
                              style={{ fontSize: '0.72rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                              title="Test these inputs in Dashboard"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* =========================================================
             EXPERT VIEW: Full technical table + expandable row detail
             ========================================================= */
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
                  <th style={{ padding: '10px 8px', width: '30px' }}></th>
                  <th style={{ padding: '10px 10px' }}>ID / Timestamp</th>
                  <th style={{ padding: '10px 10px' }}>Machine</th>
                  <th style={{ padding: '10px 10px' }}>Air / Proc Temp</th>
                  <th style={{ padding: '10px 10px' }}>RPM</th>
                  <th style={{ padding: '10px 10px' }}>Torque</th>
                  <th style={{ padding: '10px 10px' }}>Tool Wear</th>
                  <th style={{ padding: '10px 10px' }}>Power</th>
                  <th style={{ padding: '10px 10px' }}>Tool×Torque</th>
                  <th style={{ padding: '10px 10px' }}>Risk Prob</th>
                  <th style={{ padding: '10px 10px' }}>Status</th>
                  <th style={{ padding: '10px 10px' }}>Recommendation</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item) => {
                  const isExpanded = expandedRows.has(item.id);
                  const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : `#${item.id}`;
                  
                  // Extract explanation drivers and actions
                  const drivers = item.explanation?.primary_drivers || [];
                  const actions = (item.recommended_actions && item.recommended_actions.length > 0)
                    ? item.recommended_actions
                    : (item.explanation?.recommended_actions || [item.recommendation]);
                  const summarySentence = item.summary_sentence || item.explanation?.summary_sentence || item.recommendation;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)',
                          backgroundColor: isExpanded ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {/* Expand / Collapse toggle */}
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleRowExpansion(item.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isExpanded ? 'var(--primary)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px'
                            }}
                            title={isExpanded ? 'Collapse explanation details' : 'Expand explanation details'}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          #{item.id}
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {dateStr}
                          </div>
                        </td>

                        <td style={{ padding: '10px 10px', fontWeight: 700 }}>
                          Type {item.type}
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px' }}>
                          {item.air_temperature.toFixed(1)} / {item.process_temperature.toFixed(1)} K
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                            Δ {item.temp_diff.toFixed(1)} K
                          </div>
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px' }}>
                          {item.rotational_speed}
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px' }}>
                          {item.torque.toFixed(1)} Nm
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px' }}>
                          {item.tool_wear} min
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px' }}>
                          {Math.round(item.power).toLocaleString()} W
                        </td>

                        <td className="font-mono" style={{ padding: '10px 10px' }}>
                          {Math.round(item.tool_torque_product).toLocaleString()}
                        </td>

                        <td className="font-mono" style={{
                          padding: '10px 10px',
                          fontWeight: 700,
                          color: item.risk_level === 'high' ? 'var(--color-danger)' :
                                 item.risk_level === 'medium' ? 'var(--color-warn)' : 'var(--color-safe)'
                        }}>
                          {(item.failure_probability * 100).toFixed(1)}%
                        </td>

                        <td style={{ padding: '10px 10px' }}>
                          <span className={`badge ${
                            item.risk_level === 'high' ? 'badge-danger' :
                            item.risk_level === 'medium' ? 'badge-warn' : 'badge-safe'
                          }`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            {item.risk_level.toUpperCase()}
                          </span>
                          {item.active_failure_modes && (
                            <div style={{
                              fontSize: '0.68rem',
                              color: 'var(--color-danger)',
                              fontWeight: 700,
                              marginTop: '2px'
                            }}>
                              {item.active_failure_modes}
                            </div>
                          )}
                        </td>

                        <td style={{
                          padding: '10px 10px',
                          maxWidth: '240px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.76rem',
                          color: 'var(--text-muted)'
                        }} title={item.recommendation}>
                          {item.recommendation}
                        </td>

                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                          {onSelectForInspection && (
                            <button
                              onClick={() => onSelectForInspection({
                                type: item.type,
                                air_temperature: item.air_temperature,
                                process_temperature: item.process_temperature,
                                rotational_speed: item.rotational_speed,
                                torque: item.torque,
                                tool_wear: item.tool_wear
                              })}
                              className="preset-btn"
                              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                              title="Load into dashboard predictor"
                            >
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Explanation Row */}
                      {isExpanded && (
                        <tr style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: 'rgba(6, 182, 212, 0.04)'
                        }}>
                          <td colSpan={13} style={{ padding: '16px 20px 20px 38px' }}>
                            <div style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '16px 20px'
                            }}>
                              {/* Header & Summary */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      color: 'var(--primary)'
                                    }}>
                                      XAI Explanation Layer
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                      (Rule-based feature contribution approximation)
                                    </span>
                                  </div>
                                  <p style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                    marginTop: '4px',
                                    lineHeight: '1.4'
                                  }}>
                                    "{summarySentence}"
                                  </p>
                                </div>

                                <span className={`badge ${
                                  item.risk_level === 'high' ? 'badge-danger' :
                                  item.risk_level === 'medium' ? 'badge-warn' : 'badge-safe'
                                }`} style={{ fontSize: '0.75rem', padding: '4px 10px', textTransform: 'uppercase' }}>
                                  Risk: {item.risk_level} ({(item.failure_probability * 100).toFixed(1)}%)
                                </span>
                              </div>

                              {/* Primary Feature Drivers */}
                              <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                  Primary Feature Contributors & Drivers:
                                </div>
                                {drivers.length > 0 ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                                    {drivers.map((drv, dIdx) => (
                                      <div
                                        key={dIdx}
                                        style={{
                                          background: 'var(--bg-canvas)',
                                          border: `1px solid ${
                                            drv.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' :
                                            drv.severity === 'medium' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)'
                                          }`,
                                          borderRadius: '6px',
                                          padding: '10px 12px'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                            {drv.plain_label} <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>({drv.feature})</span>
                                          </span>
                                          <span className={`badge ${
                                            drv.severity === 'high' ? 'badge-danger' :
                                            drv.severity === 'medium' ? 'badge-warn' : 'badge-safe'
                                          }`} style={{ fontSize: '0.66rem', padding: '1px 6px', textTransform: 'uppercase' }}>
                                            {drv.severity}
                                          </span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.35' }}>
                                          {drv.detail}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                    Operating in nominal baseline state — all individual feature risk drivers are Low.
                                  </p>
                                )}
                              </div>

                              {/* Recommended Technical Actions */}
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                  Recommended Maintenance Interventions:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {actions.map((act, aIdx) => (
                                    <div
                                      key={aIdx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'var(--bg-canvas)',
                                        border: '1px solid var(--border-subtle)',
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        fontSize: '0.76rem',
                                        color: 'var(--text-main)'
                                      }}
                                    >
                                      <CheckCircle size={12} color="var(--primary)" />
                                      <span>{act}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
