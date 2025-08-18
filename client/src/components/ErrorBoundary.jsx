import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { motion } from "framer-motion";

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="error-boundary-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        borderRadius: "12px",
        margin: "2rem",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: "4rem",
          marginBottom: "1rem",
          color: "#dc3545",
        }}
      >
        🚨
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          color: "#343a40",
          marginBottom: "1rem",
          fontSize: "1.5rem",
        }}
      >
        Oops! Something went wrong
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          color: "#6c757d",
          marginBottom: "2rem",
          maxWidth: "500px",
          lineHeight: "1.6",
        }}
      >
        We're sorry for the inconvenience. The error has been logged and we'll
        look into it.
      </motion.p>

      {process.env.NODE_ENV === "development" && (
        <motion.details
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <summary
            style={{ cursor: "pointer", fontWeight: "bold", color: "#495057" }}
          >
            Error Details (Development)
          </summary>
          <pre
            style={{
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "#dc3545",
              textAlign: "left",
              overflow: "auto",
              maxHeight: "200px",
            }}
          >
            {error.message}
          </pre>
        </motion.details>
      )}

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetErrorBoundary}
        style={{
          padding: "12px 24px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "500",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
          transition: "all 0.2s ease",
        }}
      >
        Try Again
      </motion.button>
    </motion.div>
  );
};

const ErrorBoundary = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to monitoring service in production
        console.error("Error caught by boundary:", error);
        console.error("Error info:", errorInfo);

        // In production, you might want to send this to a logging service
        if (process.env.NODE_ENV === "production") {
          // Example: Sentry.captureException(error);
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
