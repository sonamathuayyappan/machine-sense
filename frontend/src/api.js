/**
 * Machine Sense API Client
 * Connects frontend to FastAPI backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {
        // fallback to statusText
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Check health and model loading state
  getHealth: () => request('/health'),

  // Get complete static model card & metrics
  getModelInfo: () => request('/model-info'),

  // Run prediction on 6 raw sensor values
  predict: (sensorData) => request('/predict', {
    method: 'POST',
    body: JSON.stringify(sensorData)
  }),

  // Fetch prediction audit logs with filtering
  getHistory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    if (params.risk_level) query.append('risk_level', params.risk_level);
    if (params.type) query.append('type', params.type);
    const qs = query.toString();
    return request(`/history${qs ? `?${qs}` : ''}`);
  },

  // Clear audit history
  clearHistory: () => request('/history', { method: 'DELETE' }),

  // Generate a realistic simulated sensor reading
  simulateReading: (scenario = 'random') => request(`/predict/simulate-reading?scenario=${encodeURIComponent(scenario)}`)
};
