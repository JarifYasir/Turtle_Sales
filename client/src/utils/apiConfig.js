/**
 * Dynamic API Configuration Utility
 * Automatically detects the best API endpoint based on network environment
 */

class ApiConfig {
  constructor() {
    this.baseURL = null;
    this.isInitialized = false;
    this.networkConfig = null;
  }

  /**
   * Initialize the API configuration
   */
  async initialize() {
    if (this.isInitialized) {
      return this.baseURL;
    }

    try {
      // First, try to detect if we can reach the server via localhost
      const localhostURL = 'http://localhost:3000/api/v1';
      
      if (await this.testConnection(`${localhostURL}/network/health`)) {
        // We can reach localhost, get the network config
        const config = await this.fetchNetworkConfig(localhostURL);
        
        if (config) {
          this.networkConfig = config;
          
          // Check if we're accessing from a different device
          if (await this.isExternalDevice()) {
            // Use network IP if available
            if (config.network) {
              this.baseURL = config.network;
              console.log('🌐 Using network API:', this.baseURL);
            } else {
              throw new Error('Network IP not available');
            }
          } else {
            // Use localhost for same-device access
            this.baseURL = config.localhost;
            console.log('🏠 Using localhost API:', this.baseURL);
          }
        } else {
          throw new Error('Failed to get network config');
        }
      } else {
        // Can't reach localhost, try to auto-detect network IP
        const networkURL = await this.autoDetectNetworkAPI();
        if (networkURL) {
          this.baseURL = networkURL;
          console.log('🔍 Auto-detected network API:', this.baseURL);
        } else {
          throw new Error('Cannot detect API endpoint');
        }
      }

      this.isInitialized = true;
      return this.baseURL;
    } catch (error) {
      console.error('Failed to initialize API config:', error);
      // Fallback to environment variable or default
      this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      this.isInitialized = true;
      console.warn('⚠️ Using fallback API URL:', this.baseURL);
      return this.baseURL;
    }
  }

  /**
   * Test if we can connect to a given URL
   */
  async testConnection(url, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch network configuration from server
   */
  async fetchNetworkConfig(baseURL) {
    try {
      const response = await fetch(`${baseURL}/network/config`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.success ? data.config : null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching network config:', error);
      return null;
    }
  }

  /**
   * Check if we're accessing from an external device
   */
  async isExternalDevice() {
    try {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check if hostname is not localhost/127.0.0.1
      const isNotLocalhost = !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
      
      // If we're on mobile or not on localhost, we're likely external
      return isMobile || isNotLocalhost;
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-detect network API by trying common network ranges
   */
  async autoDetectNetworkAPI() {
    const currentIP = await this.getCurrentNetworkIP();
    if (!currentIP) return null;

    // Extract network prefix (e.g., 192.168.1 from 192.168.1.100)
    const parts = currentIP.split('.');
    if (parts.length !== 4) return null;

    const networkPrefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
    
    // Try common server IPs in the same network
    const possibleIPs = [
      `${networkPrefix}.1`,   // Router/gateway
      `${networkPrefix}.100`, // Common static IP
      `${networkPrefix}.101`,
      `${networkPrefix}.102`,
      `${networkPrefix}.104`, // Based on your current IP
    ];

    for (const ip of possibleIPs) {
      const testURL = `http://${ip}:3000/api/v1`;
      if (await this.testConnection(`${testURL}/network/health`)) {
        return testURL;
      }
    }

    return null;
  }

  /**
   * Get current device's network IP (approximation)
   */
  async getCurrentNetworkIP() {
    try {
      // This is a best-effort attempt to get the network IP
      // In a real browser environment, this is limited for security reasons
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      // We can't directly get the IP, but we can make educated guesses
      // based on the current page URL if it's already on a network IP
      if (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return window.location.hostname;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the current API base URL
   */
  getBaseURL() {
    if (!this.isInitialized) {
      console.warn('API config not initialized. Call initialize() first.');
      return import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    }
    return this.baseURL;
  }

  /**
   * Get network configuration info
   */
  getNetworkConfig() {
    return this.networkConfig;
  }

  /**
   * Reset configuration (useful for testing)
   */
  reset() {
    this.baseURL = null;
    this.isInitialized = false;
    this.networkConfig = null;
  }
}

// Create singleton instance
const apiConfig = new ApiConfig();

export default apiConfig;
