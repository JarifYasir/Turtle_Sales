import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewSales.css";

const ViewSales = () => {
  const navigate = useNavigate();

  return (
    <div className="view-sales-container">
      <div className="sales-header">
        <h1>View Sales</h1>
        <p>Sales data and analytics will be displayed here</p>
      </div>

      <div className="sales-content">
        <div className="temp-message">
          <h3>🚧 Under Construction</h3>
          <p>
            This page is currently being developed. Sales functionality will be
            added soon!
          </p>
        </div>

        <button className="back-btn" onClick={() => navigate("/turtle-portal")}>
          ← Back to Portal
        </button>
      </div>
    </div>
  );
};

export default ViewSales;
