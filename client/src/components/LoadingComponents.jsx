import React from "react";
import { motion } from "framer-motion";
import "../styles/LoadingComponents.css";

// Turtle SVG Component for themed loading
const TurtleIcon = ({ size = 60, color = "#4CAF50" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Turtle Shell */}
    <ellipse cx="50" cy="45" rx="35" ry="25" fill={color} opacity="0.8" />
    <ellipse cx="50" cy="45" rx="30" ry="20" fill={color} />

    {/* Shell Pattern */}
    <circle cx="40" cy="35" r="4" fill="rgba(255,255,255,0.3)" />
    <circle cx="60" cy="35" r="4" fill="rgba(255,255,255,0.3)" />
    <circle cx="50" cy="45" r="4" fill="rgba(255,255,255,0.3)" />
    <circle cx="35" cy="50" r="3" fill="rgba(255,255,255,0.3)" />
    <circle cx="65" cy="50" r="3" fill="rgba(255,255,255,0.3)" />

    {/* Head */}
    <circle cx="50" cy="20" r="8" fill={color} />
    <circle cx="47" cy="18" r="1.5" fill="#333" />
    <circle cx="53" cy="18" r="1.5" fill="#333" />

    {/* Legs */}
    <ellipse cx="25" cy="55" rx="6" ry="8" fill={color} />
    <ellipse cx="75" cy="55" rx="6" ry="8" fill={color} />
    <ellipse cx="35" cy="65" rx="5" ry="6" fill={color} />
    <ellipse cx="65" cy="65" rx="5" ry="6" fill={color} />

    {/* Tail */}
    <circle cx="50" cy="75" r="4" fill={color} />
  </svg>
);

// Skeleton Loading Component for better UX
const SkeletonCard = () => (
  <motion.div
    className="skeleton-card"
    animate={{ opacity: [0.6, 1, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="skeleton-header"></div>
    <div className="skeleton-line"></div>
    <div className="skeleton-line short"></div>
    <div className="skeleton-line"></div>
  </motion.div>
);

const LoadingSpinner = ({
  size = "medium",
  text = "Loading...",
  fullScreen = false,
  variant = "turtle", // "turtle" or "spinner"
  showProgress = false,
  progress = 0,
}) => {
  const sizes = {
    small: { spinner: 30, text: "0.875rem" },
    medium: { spinner: 60, text: "1rem" },
    large: { spinner: 80, text: "1.125rem" },
  };

  const currentSize = sizes[size];

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5rem",
    minHeight: fullScreen ? "100vh" : "200px",
    width: "100%",
    padding: "2rem",
    ...(fullScreen && {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(8px)",
      zIndex: 9999,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={containerStyle}
    >
      {variant === "turtle" ? (
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <TurtleIcon size={currentSize.spinner} />
        </motion.div>
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: currentSize.spinner,
            height: currentSize.spinner,
            border: "4px solid #e9ecef",
            borderTop: "4px solid #4CAF50",
            borderRadius: "50%",
          }}
        />
      )}

      {text && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: currentSize.text,
              color: "#4CAF50",
              fontWeight: "600",
              marginBottom: "0.5rem",
            }}
          >
            {text}
          </p>
          {variant === "turtle" && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "#81C784",
                  fontStyle: "italic",
                }}
              >
                🐢 Taking it slow and steady...
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Skeleton loading component for better UX
const SkeletonLoader = ({
  width = "100%",
  height = "20px",
  count = 1,
  className = "",
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
          }}
          style={{
            width,
            height,
            backgroundColor: "#e9ecef",
            borderRadius: "4px",
            marginBottom: count > 1 ? "8px" : "0",
          }}
        />
      ))}
    </div>
  );
};

// Pulse loading for cards
const CardSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: "1.5rem",
        border: "1px solid #e9ecef",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <SkeletonLoader height="24px" width="60%" />
      <SkeletonLoader height="16px" width="80%" count={2} />
      <SkeletonLoader height="32px" width="120px" />
    </motion.div>
  );
};

// Small inline loading component for buttons
const InlineLoader = ({ size = "small", color = "#4CAF50" }) => {
  const loaderSize = size === "small" ? 16 : 20;

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        width: loaderSize,
        height: loaderSize,
        border: "2px solid transparent",
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        display: "inline-block",
        marginRight: "8px",
      }}
    />
  );
};

export { LoadingSpinner, SkeletonLoader, CardSkeleton, InlineLoader };
export default LoadingSpinner;
