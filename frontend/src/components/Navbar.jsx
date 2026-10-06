import React from 'react';
import { 
  Activity, 
  History, 
  Layers, 
  Cpu, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Eye
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  healthData,
  isLiveSimulating,
  viewMode = 'simple',
  setViewMode
}) {
  const isHealthy = healthData && healthData.status === 'healthy';
  const isRealModel = healthData && healthData.model_loaded;
  const isSimple = viewMode === 'simple';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--primary-glow)',
            color: '#fff'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Machine<span style={{ color: 'var(--primary)' }}>Sense</span>
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                fontWeight: 700,
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                v1.0 • AD5305
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Industrial Predictive Maintenance & Telemetry Monitoring
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'dashboard' ? 'var(--text-main)' : 'var(--text-muted)',
              background: activeTab === 'dashboard' ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeTab === 'dashboard' ? 'var(--shadow-card)' : 'none',
              border: activeTab === 'dashboard' ? '1px solid var(--border-subtle)' : '1px solid transparent'
            }}
          >
            <Activity size={16} color={activeTab === 'dashboard' ? 'var(--primary)' : 'currentColor'} />
            Dashboard
            {isLiveSimulating && (
              <span className="live-pulse" title="Live simulation stream active" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'history' ? 'var(--text-main)' : 'var(--text-muted)',
              background: activeTab === 'history' ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeTab === 'history' ? 'var(--shadow-card)' : 'none',
              border: activeTab === 'history' ? '1px solid var(--border-subtle)' : '1px solid transparent'
            }}
          >
            <History size={16} color={activeTab === 'history' ? 'var(--primary)' : 'currentColor'} />
            History Log
          </button>

          <button
            onClick={() => setActiveTab('model-info')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'model-info' ? 'var(--text-main)' : 'var(--text-muted)',
              background: activeTab === 'model-info' ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeTab === 'model-info' ? 'var(--shadow-card)' : 'none',
              border: activeTab === 'model-info' ? '1px solid var(--border-subtle)' : '1px solid transparent'
            }}
          >
            {isSimple ? (
              <>
                <HelpCircle size={16} color={activeTab === 'model-info' ? 'var(--primary)' : 'currentColor'} />
                How accurate is this?
              </>
            ) : (
              <>
                <Cpu size={16} color={activeTab === 'model-info' ? 'var(--primary)' : 'currentColor'} />
                Model Card
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'architecture' ? 'var(--text-main)' : 'var(--text-muted)',
              background: activeTab === 'architecture' ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeTab === 'architecture' ? 'var(--shadow-card)' : 'none',
              border: activeTab === 'architecture' ? '1px solid var(--border-subtle)' : '1px solid transparent'
            }}
          >
            <Layers size={16} color={activeTab === 'architecture' ? 'var(--primary)' : 'currentColor'} />
            Architecture
          </button>
        </nav>

        {/* Right Status, View Mode Toggle & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* VIEW-MODE TOGGLE (Global XAI explanation depth) */}
          <div 
            title="XAI Mode (Barredo Arrieta et al., 2020): Adapts explanation depth for shop-floor operators vs. ML engineers without altering predictions."
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              onClick={() => setViewMode('simple')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '7px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isSimple ? 'var(--text-main)' : 'var(--text-muted)',
                background: isSimple ? 'var(--bg-card)' : 'transparent',
                boxShadow: isSimple ? 'var(--shadow-card)' : 'none',
                border: isSimple ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <Eye size={13} color={isSimple ? 'var(--primary)' : 'currentColor'} />
              Simple View
            </button>

            <button
              onClick={() => setViewMode('expert')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '7px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: !isSimple ? 'var(--text-main)' : 'var(--text-muted)',
                background: !isSimple ? 'var(--bg-card)' : 'transparent',
                boxShadow: !isSimple ? 'var(--shadow-card)' : 'none',
                border: !isSimple ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={13} color={!isSimple ? 'var(--primary)' : 'currentColor'} />
              Expert View
            </button>
          </div>

          {/* Health & Engine status pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '10px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem'
          }}>
            {isHealthy ? (
              <>
                <span className="live-pulse" style={{ width: '7px', height: '7px' }} />
                {isSimple ? (
                  <span style={{ fontWeight: 600, color: 'var(--color-safe)' }}>
                    System Active
                  </span>
                ) : (
                  <>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {isRealModel ? 'GradientBoosting' : 'Mock Fallback'}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isRealModel ? 'var(--color-safe-bg)' : 'var(--primary-subtle)',
                      color: isRealModel ? 'var(--color-safe)' : 'var(--primary)',
                      fontWeight: 600
                    }}>
                      {isRealModel ? 'model.pkl' : 'calibrated'}
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <AlertCircle size={14} color="var(--color-warn)" />
                <span style={{ color: 'var(--color-warn)' }}>Connecting...</span>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
