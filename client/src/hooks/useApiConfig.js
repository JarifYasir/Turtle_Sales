import { useState, useEffect } from 'react';
import apiConfig from '../utils/apiConfig';

/**
 * Hook for managing dynamic API configuration
 */
export const useApiConfig = () => {
  const [isInitialized, setIsInitialized] = useState(true); // Always initialized now
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiUrl, setApiUrl] = useState(() => {
    // Use the same logic as in api.js
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    const hostname = window.location.hostname;
    const port = '3000';
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/api/v1`;
    } else {
      return `http://${hostname}:${port}/api/v1`;
    }
  });
  const [networkConfig, setNetworkConfig] = useState(null);

  useEffect(() => {
    // Set network config from apiConfig if available
    try {
      const config = apiConfig.getNetworkConfig();
      setNetworkConfig(config);
    } catch (err) {
      // apiConfig might not be initialized, that's okay
      console.log('Network config not available:', err.message);
    }
  }, []);

  const reinitialize = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Reset apiConfig if available
      try {
        apiConfig.reset();
      } catch (err) {
        console.log('apiConfig reset not available:', err.message);
      }
      
      // Recalculate API URL
      let newApiUrl;
      if (import.meta.env.VITE_API_URL) {
        newApiUrl = import.meta.env.VITE_API_URL;
      } else {
        const hostname = window.location.hostname;
        const port = '3000';
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          newApiUrl = `http://localhost:${port}/api/v1`;
        } else {
          newApiUrl = `http://${hostname}:${port}/api/v1`;
        }
      }
      
      setApiUrl(newApiUrl);
      
      // Get network config if available
      try {
        const config = apiConfig.getNetworkConfig();
        setNetworkConfig(config);
      } catch (err) {
        console.log('Network config not available:', err.message);
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to reinitialize API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    apiUrl,
    networkConfig,
    reinitialize
  };
};
