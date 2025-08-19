import React from "react";
import { useLocation, Link } from "react-router-dom";
import { FiHome, FiChevronRight } from "react-icons/fi";
import { motion } from "framer-motion";

const Breadcrumb = () => {
  const location = useLocation();

  // Define route hierarchy and names
  const routeConfig = {
    "/": { name: "Home", icon: FiHome },
    "/login": { name: "Login", parent: "/" },
    "/register": { name: "Register", parent: "/" },
    "/dashboard": { name: "Profile", parent: "/" },
    "/welcome": { name: "Welcome", parent: "/" },
    "/turtle-portal": { name: "Turtle Portal", parent: "/" },
    "/manage-org": { name: "Manage Organization", parent: "/turtle-portal" },
    "/manage-timeslots": { name: "Manage Timeslots", parent: "/turtle-portal" },
    "/track-sales": { name: "Track Sales", parent: "/turtle-portal" },
    "/view-sales": { name: "View Sales", parent: "/turtle-portal" },
    "/employee-paystub": { name: "Employee Paystub", parent: "/turtle-portal" },
    "/sales-leaderboard": {
      name: "Sales Leaderboard",
      parent: "/turtle-portal",
    },
  };

  // Build breadcrumb hierarchy
  const buildBreadcrumbs = (currentPath) => {
    const breadcrumbs = [];
    let path = currentPath;

    // Build the path from current to root
    while (path && routeConfig[path]) {
      breadcrumbs.unshift({
        path: path,
        name: routeConfig[path].name,
        icon: routeConfig[path].icon,
        current: path === currentPath,
      });
      path = routeConfig[path].parent;
    }

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs(location.pathname);

  // Don't show breadcrumb on home page or if no valid route found
  if (location.pathname === "/" || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <motion.nav
      className="breadcrumb-nav"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Breadcrumb"
    >
      <div className="breadcrumb-container">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <FiChevronRight
                className="breadcrumb-separator"
                aria-hidden="true"
              />
            )}
            {crumb.current ? (
              <span className="breadcrumb-item current" aria-current="page">
                {crumb.icon && <crumb.icon />}
                <span>{crumb.name}</span>
              </span>
            ) : (
              <Link
                to={crumb.path}
                className={`breadcrumb-item ${
                  crumb.path === "/" ? "home-link" : ""
                }`}
              >
                {crumb.icon && <crumb.icon />}
                <span>{crumb.name}</span>
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.nav>
  );
};

export default Breadcrumb;

// Quick Action Buttons Component for common tasks
export const QuickActions = ({ actions = [] }) => {
  if (!actions.length) return null;

  return (
    <motion.div
      className="quick-actions-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="quick-actions-grid">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            onClick={action.onClick}
            className={`quick-action-item ${action.variant || "primary"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            disabled={action.disabled}
            title={action.tooltip}
          >
            {action.icon && <action.icon className="quick-action-icon" />}
            <span className="quick-action-text">{action.label}</span>
            {action.badge && (
              <span className="quick-action-badge">{action.badge}</span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
