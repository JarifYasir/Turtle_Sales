import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";

// Memoized components for better performance
export const MemoizedMotionDiv = memo(motion.div);
export const MemoizedMotionButton = memo(motion.button);

// Performance optimized card component
export const OptimizedCard = memo(
  ({
    title,
    children,
    className = "",
    onClick,
    disabled = false,
    loading = false,
  }) => {
    const cardVariants = useMemo(
      () => ({
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }),
      []
    );

    const cardClassName = useMemo(
      () =>
        `optimized-card ${className} ${disabled ? "disabled" : ""} ${
          loading ? "loading" : ""
        }`,
      [className, disabled, loading]
    );

    return (
      <MemoizedMotionDiv
        className={cardClassName}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        onClick={disabled || loading ? undefined : onClick}
        whileHover={disabled || loading ? {} : { scale: 1.02, y: -2 }}
        whileTap={disabled || loading ? {} : { scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {loading && <div className="card-loading-overlay" />}
        {title && <h3 className="card-title">{title}</h3>}
        <div className="card-content">{children}</div>
      </MemoizedMotionDiv>
    );
  }
);

// Performance optimized list component with virtualization support
export const OptimizedList = memo(
  ({
    items,
    renderItem,
    keyExtractor,
    className = "",
    emptyMessage = "No items found",
    loading = false,
  }) => {
    const listItems = useMemo(() => {
      if (loading) {
        return Array.from({ length: 3 }, (_, index) => (
          <div key={`skeleton-${index}`} className="list-item-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ));
      }

      if (!items.length) {
        return (
          <div className="empty-list-message">
            <p>{emptyMessage}</p>
          </div>
        );
      }

      return items.map((item, index) => (
        <motion.div
          key={keyExtractor ? keyExtractor(item) : index}
          className="list-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {renderItem(item, index)}
        </motion.div>
      ));
    }, [items, renderItem, keyExtractor, emptyMessage, loading]);

    return <div className={`optimized-list ${className}`}>{listItems}</div>;
  }
);

// Performance optimized form field component
export const OptimizedFormField = memo(
  ({ label, error, children, required = false, className = "" }) => {
    const fieldClassName = useMemo(
      () => `form-field ${className} ${error ? "has-error" : ""}`,
      [className, error]
    );

    return (
      <div className={fieldClassName}>
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="required-indicator">*</span>}
          </label>
        )}
        {children}
        {error && (
          <motion.div
            className="form-error-message"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </div>
    );
  }
);

// Performance hook for debounced search
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Performance hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const elementRef = React.useRef(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [options, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
};

OptimizedCard.displayName = "OptimizedCard";
OptimizedList.displayName = "OptimizedList";
OptimizedFormField.displayName = "OptimizedFormField";
