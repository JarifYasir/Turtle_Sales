const os = require("os");

/**
 * Get the network IP address of the current machine
 * @returns {string|null} Network IP address or null if not found
 */
const getNetworkIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        return interface.address;
      }
    }
  }
  return null;
};

/**
 * Get dynamically configured CORS origins
 * @returns {string[]} Array of allowed origins
 */
const getCorsOrigins = () => {
  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    process.env.CLIENT_URL,
  ];

  // Add network-specific URLs if available
  const networkIP = process.env.NETWORK_HOST || getNetworkIP();
  if (networkIP) {
    defaultOrigins.push(
      `http://${networkIP}:5173`,
      `http://${networkIP}:5174`,
      `http://${networkIP}:3000`
    );
  }

  // Add additional origins from environment variable
  if (process.env.ADDITIONAL_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_ORIGINS.split(",").map(
      (origin) => origin.trim()
    );
    defaultOrigins.push(...additionalOrigins);
  }

  return defaultOrigins.filter(Boolean);
};

/**
 * Check if an IP is a local/private IP
 * @param {string} ip - IP address to check
 * @returns {boolean} True if the IP is local/private
 */
const isLocalIP = (ip) => {
  if (!ip) return false;

  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.includes("192.168.") ||
    ip.includes("10.") ||
    ip.includes("172.") ||
    ip === "::ffff:127.0.0.1"
  );
};

module.exports = {
  getNetworkIP,
  getCorsOrigins,
  isLocalIP,
};
