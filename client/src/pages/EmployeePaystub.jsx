import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EmployeePaystub.css";

const EmployeePaystub = () => {
  const navigate = useNavigate();

  return (
    <div className="employee-paystub-container">
      <div className="paystub-header">
        <h1>Employee Paystub</h1>
        <p>Manage and view employee payroll information</p>
      </div>

      <div className="paystub-content">
        <div className="temp-message">
          <h3>🚧 Under Construction</h3>
          <p>
            This page is currently being developed. Employee paystub
            functionality will be added soon!
          </p>
        </div>

        <button className="back-btn" onClick={() => navigate("/turtle-portal")}>
          ← Back to Portal
        </button>
      </div>
    </div>
  );
};

export default EmployeePaystub;
