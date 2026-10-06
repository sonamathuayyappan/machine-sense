import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import ModelInfoView from './components/ModelInfoView';
import ArchitectureView from './components/ArchitectureView';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('machine-sense-theme') || 'dark';
  });
  // Global View-Mode toggle ("simple" | "expert"), defaulting to "simple"
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('machine-sense-view-mode') || 'simple';
  });
  const [healthData, setHealthData] = useState(null);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);
  const [recentStream, setRecentStream] = useState([]);
  const [inspectionData, setInspectionData] = useState(null);

  // Sync theme changes with DOM and localStorage
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('machine-sense-theme', theme);
  }, [theme]);

  // Sync viewMode changes with localStorage
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('machine-sense-view-mode', mode);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Poll health on mount and periodically
  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealthData(data);
    } catch (err) {
      console.warn('Backend offline or health check failed:', err.message);
      setHealthData(null);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleInspectHistoricalItem = (sensorValues) => {
    setInspectionData(sensorValues);
    setActiveTab('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        healthData={healthData}
        isLiveSimulating={isLiveSimulating}
        viewMode={viewMode}
        setViewMode={handleSetViewMode}
      />

      <main style={{ flex: 1 }}>
        <div className="app-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              onPredictionComplete={checkHealth}
              isLiveSimulating={isLiveSimulating}
              setIsLiveSimulating={setIsLiveSimulating}
              recentStream={recentStream}
              setRecentStream={setRecentStream}
              initialValues={inspectionData}
              viewMode={viewMode}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              onSelectForInspection={handleInspectHistoricalItem}
              viewMode={viewMode}
            />
          )}

          {activeTab === 'model-info' && (
            <ModelInfoView 
              viewMode={viewMode}
            />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureView 
              viewMode={viewMode}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        padding: '20px 0',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <strong>Machine Sense</strong> — Industrial Predictive Maintenance System • AD5305 Machine Learning
          </div>
          <div>
            AI4I 2020 Predictive Maintenance Dataset • UCI Machine Learning Repository
          </div>
        </div>
      </footer>
    </div>
  );
}
