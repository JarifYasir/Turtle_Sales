import React from "react";
import { motion } from "framer-motion";

const LoadingSpinner = ({
  size = "medium",
  text = "Loading...",
  fullScreen = false,
}) => {
  const sizes = {
    small: { spinner: "24px", text: "0.875rem" },
    medium: { spinner: "40px", text: "1rem" },
    large: { spinner: "60px", text: "1.125rem" },
  };

  const currentSize = sizes[size];

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    ...(fullScreen && {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(4px)",
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
          border: "3px solid #e9ecef",
          borderTop: "3px solid #007bff",
          borderRadius: "50%",
        }}
      />

      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            margin: 0,
            fontSize: currentSize.text,
            color: "#6c757d",
            fontWeight: "500",
          }}
        >
          {text}
        </motion.p>
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

export { LoadingSpinner, SkeletonLoader, CardSkeleton };
export default LoadingSpinner;
