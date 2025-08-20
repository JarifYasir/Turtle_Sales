import React from 'react';
import { useApiConfig } from '../hooks/useApiConfig';

const NetworkStatus = ({ isVisible = false }) => {
  const { isInitialized, isLoading, error, apiUrl, networkConfig, reinitialize } = useApiConfig();

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
        🌐 Network Status
      </div>
      
      <div>
        <strong>Status:</strong> {
          isLoading ? '🔄 Loading...' :
          error ? '❌ Error' :
          isInitialized ? '✅ Ready' : '⏳ Pending'
        }
      </div>
      
      {error && (
        <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {apiUrl && (
        <div style={{ marginTop: '5px' }}>
          <strong>API URL:</strong> {apiUrl}
        </div>
      )}
      
      {networkConfig && (
        <div style={{ marginTop: '5px' }}>
          <strong>Network IP:</strong> {networkConfig.networkIP || 'N/A'}
        </div>
      )}
      
      <button
        onClick={reinitialize}
        style={{
          marginTop: '5px',
          padding: '2px 5px',
          fontSize: '10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        🔄 Reinitialize
      </button>
    </div>
  );
};

export default NetworkStatus;
