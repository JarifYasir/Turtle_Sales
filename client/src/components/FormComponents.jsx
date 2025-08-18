import React from "react";
import { motion } from "framer-motion";

const FormField = ({
  label,
  error,
  children,
  required = false,
  className = "",
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`form-field ${className}`}
      style={{
        marginBottom: "1.5rem",
        width: "100%",
      }}
    >
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "500",
            color: error ? "#dc3545" : "#495057",
            fontSize: "0.875rem",
          }}
        >
          {label}
          {required && (
            <span style={{ color: "#dc3545", marginLeft: "4px" }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: "relative" }}>{children}</div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            color: "#dc3545",
            fontSize: "0.75rem",
            marginTop: "0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span>⚠️</span>
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

const Input = React.forwardRef(
  ({ type = "text", error, className = "", ...props }, ref) => {
    const baseStyles = {
      width: "100%",
      padding: "12px 16px",
      border: `2px solid ${error ? "#dc3545" : "#e9ecef"}`,
      borderRadius: "8px",
      fontSize: "1rem",
      backgroundColor: "#fff",
      transition: "all 0.2s ease",
      outline: "none",
    };

    const focusStyles = {
      ":focus": {
        borderColor: error ? "#dc3545" : "#007bff",
        boxShadow: `0 0 0 3px ${
          error ? "rgba(220, 53, 69, 0.1)" : "rgba(0, 123, 255, 0.1)"
        }`,
      },
    };

    return (
      <input
        ref={ref}
        type={type}
        className={`form-input ${className}`}
        style={baseStyles}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#dc3545" : "#007bff";
          e.target.style.boxShadow = `0 0 0 3px ${
            error ? "rgba(220, 53, 69, 0.1)" : "rgba(0, 123, 255, 0.1)"
          }`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#dc3545" : "#e9ecef";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
    );
  }
);

const TextArea = React.forwardRef(
  ({ error, rows = 3, className = "", ...props }, ref) => {
    const baseStyles = {
      width: "100%",
      padding: "12px 16px",
      border: `2px solid ${error ? "#dc3545" : "#e9ecef"}`,
      borderRadius: "8px",
      fontSize: "1rem",
      backgroundColor: "#fff",
      transition: "all 0.2s ease",
      outline: "none",
      resize: "vertical",
      minHeight: "80px",
    };

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`form-textarea ${className}`}
        style={baseStyles}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#dc3545" : "#007bff";
          e.target.style.boxShadow = `0 0 0 3px ${
            error ? "rgba(220, 53, 69, 0.1)" : "rgba(0, 123, 255, 0.1)"
          }`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#dc3545" : "#e9ecef";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
    );
  }
);

const Select = React.forwardRef(
  (
    {
      options = [],
      error,
      placeholder = "Select an option...",
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles = {
      width: "100%",
      padding: "12px 16px",
      border: `2px solid ${error ? "#dc3545" : "#e9ecef"}`,
      borderRadius: "8px",
      fontSize: "1rem",
      backgroundColor: "#fff",
      transition: "all 0.2s ease",
      outline: "none",
      cursor: "pointer",
    };

    return (
      <select
        ref={ref}
        className={`form-select ${className}`}
        style={baseStyles}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#dc3545" : "#007bff";
          e.target.style.boxShadow = `0 0 0 3px ${
            error ? "rgba(220, 53, 69, 0.1)" : "rgba(0, 123, 255, 0.1)"
          }`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#dc3545" : "#e9ecef";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const variants = {
    primary: {
      backgroundColor: "#007bff",
      color: "#fff",
      border: "2px solid #007bff",
    },
    secondary: {
      backgroundColor: "#6c757d",
      color: "#fff",
      border: "2px solid #6c757d",
    },
    success: {
      backgroundColor: "#28a745",
      color: "#fff",
      border: "2px solid #28a745",
    },
    danger: {
      backgroundColor: "#dc3545",
      color: "#fff",
      border: "2px solid #dc3545",
    },
    outline: {
      backgroundColor: "transparent",
      color: "#007bff",
      border: "2px solid #007bff",
    },
  };

  const sizes = {
    small: { padding: "8px 16px", fontSize: "0.875rem" },
    medium: { padding: "12px 24px", fontSize: "1rem" },
    large: { padding: "16px 32px", fontSize: "1.125rem" },
  };

  const baseStyles = {
    ...variants[variant],
    ...sizes[size],
    borderRadius: "8px",
    fontWeight: "500",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    outline: "none",
    textDecoration: "none",
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`form-button ${className}`}
      style={baseStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid transparent",
            borderTop: "2px solid currentColor",
            borderRadius: "50%",
          }}
        />
      )}
      {children}
    </motion.button>
  );
};

const Checkbox = React.forwardRef(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div
        className={`checkbox-field ${className}`}
        style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
      >
        <input
          ref={ref}
          type="checkbox"
          style={{
            width: "18px",
            height: "18px",
            marginTop: "2px",
            accentColor: "#007bff",
          }}
          {...props}
        />
        {label && (
          <label
            style={{
              fontSize: "0.875rem",
              color: error ? "#dc3545" : "#495057",
              lineHeight: "1.4",
              cursor: "pointer",
            }}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
TextArea.displayName = "TextArea";
Select.displayName = "Select";
Checkbox.displayName = "Checkbox";

export { FormField, Input, TextArea, Select, Button, Checkbox };
