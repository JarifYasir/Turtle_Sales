import React, { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const SearchAndFilter = ({
  onSearch,
  onFilter,
  placeholder = "Search...",
  filters = [],
  showAdvanced = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value,
    };
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
    onFilter({});
    onSearch("");
  };

  const hasActiveFilters = Object.keys(activeFilters).some(
    (key) => activeFilters[key]
  );

  return (
    <motion.div
      className="search-filter-container"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="search-bar-wrapper">
        <div className="search-input-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        {showAdvanced && (
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`filter-toggle-btn ${isAdvancedOpen ? "active" : ""}`}
            aria-label="Toggle filters"
          >
            <FiFilter />
            {hasActiveFilters && <span className="filter-indicator" />}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdvancedOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="advanced-filters"
          >
            <div className="filters-grid">
              {filters.map((filter) => (
                <div key={filter.key} className="filter-group">
                  <label htmlFor={filter.key} className="filter-label">
                    {filter.label}
                  </label>
                  {filter.type === "select" ? (
                    <select
                      id={filter.key}
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      className="filter-select"
                    >
                      <option value="">All {filter.label}</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : filter.type === "date" ? (
                    <input
                      id={filter.key}
                      type="date"
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      className="filter-input"
                    />
                  ) : (
                    <input
                      id={filter.key}
                      type={filter.type || "text"}
                      placeholder={filter.placeholder}
                      value={activeFilters[filter.key] || ""}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.value)
                      }
                      className="filter-input"
                    />
                  )}
                </div>
              ))}
            </div>

            {hasActiveFilters && (
              <div className="filter-actions">
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear All Filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchAndFilter;
