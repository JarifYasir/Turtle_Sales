import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../styles/EmployeePaystub.css";
import LoadingSpinner from "../components/LoadingComponents";

const EmployeePaystub = () => {
  const navigate = useNavigate();
  const { token } = useContext(UserContext);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const pdfContentRef = useRef();

  // Get current week's start and end dates
  function getCurrentWeek() {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day; // First day is the day of the month - the day of the week

    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      start: startOfWeek,
      end: endOfWeek,
    };
  }

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (time24) => {
    if (!time24 || typeof time24 !== "string") return "";

    try {
      const timeParts = time24.split(":");
      if (timeParts.length < 2) return time24; // Return original if not proper format

      const hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];

      if (isNaN(hours)) return time24; // Return original if hours not a number

      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;

      return `${hour12}:${minutes}${ampm}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return time24; // Return original time if formatting fails
    }
  };

  // Format timeslot range
  const formatTimeslotRange = (timeslot) => {
    if (!timeslot) {
      return "No timeslot assigned";
    }

    // Handle case where timeslot might be a string or have different structure
    if (typeof timeslot === "string") {
      return timeslot;
    }

    if (!timeslot.startTime || !timeslot.endTime) {
      console.log("Timeslot missing start/end time:", timeslot);
      return "Invalid timeslot";
    }

    const startTime = formatTime(timeslot.startTime);
    const endTime = formatTime(timeslot.endTime);

    if (!startTime || !endTime) {
      return `${timeslot.startTime || "??"} - ${timeslot.endTime || "??"}`;
    }

    return `${startTime} - ${endTime}`;
  };

  // Clean up orphaned sales before fetching data
  const cleanupOrphanedSales = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api/v1"; // Use relative URL as fallback

      const response = await fetch(`${apiUrl}/sales/cleanup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.deletedCount > 0) {
        console.log(
          `Cleanup completed: ${data.deletedCount} orphaned sales removed`
        );
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      // Don't show error to user for cleanup - it's a background operation
    }
  };

  // Fetch sales data for the selected week
  const fetchSalesData = async () => {
    try {
      setLoading(true);

      // First, run cleanup to ensure data integrity
      await cleanupOrphanedSales();

      const apiUrl = import.meta.env.VITE_API_URL || "/api/v1"; // Use relative URL as fallback

      const response = await fetch(
        `${apiUrl}/sales/weekly-report?startDate=${selectedWeek.start.toISOString()}&endDate=${selectedWeek.end.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Debug: Log a sample sale to see timeslot structure
        if (
          data.data.salesReport &&
          data.data.salesReport.length > 0 &&
          data.data.salesReport[0].sales &&
          data.data.salesReport[0].sales.length > 0
        ) {
          console.log("Sample sale data:", data.data.salesReport[0].sales[0]);
        }
        setSalesData(data.data);
      } else {
        toast.error(data.msg || "Failed to fetch sales data");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast.error("Failed to fetch sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [selectedWeek, token]);

  // Handle week change
  const handleWeekChange = (direction) => {
    const newStart = new Date(selectedWeek.start);
    const newEnd = new Date(selectedWeek.end);

    if (direction === "prev") {
      newStart.setDate(newStart.getDate() - 7);
      newEnd.setDate(newEnd.getDate() - 7);
    } else {
      newStart.setDate(newStart.getDate() + 7);
      newEnd.setDate(newEnd.getDate() + 7);
    }

    setSelectedWeek({ start: newStart, end: newEnd });
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!salesData || generatingPDF) return;

    try {
      setGeneratingPDF(true);
      const element = pdfContentRef.current;

      if (!element) {
        toast.error("PDF content not found");
        return;
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with date
      const filename = `Sales-Report-${
        selectedWeek.start.toISOString().split("T")[0]
      }-to-${selectedWeek.end.toISOString().split("T")[0]}.pdf`;

      pdf.save(filename);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="large"
        text="Loading sales data..."
        variant="turtle"
        fullScreen={false}
      />
    );
  }

  return (
    <div className="employee-paystub-container">
      <div className="paystub-header">
        <h1>Employee Sales Report</h1>
        <p className="paystub-subtitle">
          Weekly sales performance and revenue tracking
        </p>
      </div>

      <div className="paystub-content">
        {/* Period Selector */}
        <div className="period-selector">
          <div className="period-controls">
            <button
              className="period-btn prev-btn"
              onClick={() => handleWeekChange("prev")}
            >
              ← Previous Week
            </button>
            <div className="current-period">
              <span className="period-text">
                {formatDate(selectedWeek.start)} -{" "}
                {formatDate(selectedWeek.end)}
              </span>
            </div>
            <button
              className="period-btn next-btn"
              onClick={() => handleWeekChange("next")}
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div ref={pdfContentRef} className="pdf-content">
          {/* PDF Header with Watermark */}
          <div className="pdf-header">
            <div className="watermark">Turtle Sales</div>
            <div className="report-title">
              <h2>Weekly Sales Report</h2>
              <p>
                {formatDate(selectedWeek.start)} -{" "}
                {formatDate(selectedWeek.end)}
              </p>
            </div>
          </div>

          {/* Sales Data */}
          {salesData && salesData.salesReport.length > 0 ? (
            <>
              <div className="sales-grid">
                {salesData.salesReport.map((rep, index) => (
                  <div key={rep.salesRepName} className="sales-card">
                    <div className="sales-card-header">
                      <div className="rep-info">
                        <h3 className="rep-name">{rep.salesRepName}</h3>
                        <div className="rep-stats">
                          <span className="sales-count">
                            {rep.salesCount} sales
                          </span>
                          <span className="total-amount">
                            {formatCurrency(rep.totalAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="rep-rank">#{index + 1}</div>
                    </div>

                    <div className="sales-list">
                      {rep.sales.map((sale, saleIndex) => (
                        <div key={sale.saleId} className="sale-item">
                          <div className="sale-main-info">
                            <div className="sale-header">
                              <span className="sale-date">
                                {formatDate(sale.date)}
                              </span>
                              <span className="sale-amount">
                                {formatCurrency(sale.amount)}
                              </span>
                            </div>
                            <div className="sale-details">
                              <div className="client-info">
                                <span className="client-label">Client:</span>
                                <span className="client-name">
                                  {sale.clientName || "N/A"}
                                </span>
                              </div>
                              <div className="address-info">
                                <span className="address-label">Address:</span>
                                <span className="client-address">
                                  {sale.clientAddress || "N/A"}
                                </span>
                              </div>
                              <div className="timeslot-info">
                                <span className="timeslot-label">
                                  Timeslot:
                                </span>
                                <span className="timeslot-details">
                                  {sale.timeslot ? (
                                    <>
                                      {formatDate(sale.timeslot.date)} |{" "}
                                      {formatTimeslotRange(sale.timeslot)}
                                    </>
                                  ) : (
                                    "No timeslot assigned"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="summary-section">
                <h3>Week Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Revenue</span>
                    <span className="summary-value revenue">
                      {formatCurrency(salesData.summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Sales</span>
                    <span className="summary-value">
                      {salesData.summary.totalSales}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Active Sales Reps</span>
                    <span className="summary-value">
                      {salesData.summary.totalReps}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Average Sale Value</span>
                    <span className="summary-value">
                      {salesData.summary.totalSales > 0
                        ? formatCurrency(
                            salesData.summary.totalRevenue /
                              salesData.summary.totalSales
                          )
                        : "$0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-sales-message">
              <div className="no-sales-icon">📊</div>
              <h3>No Sales Found</h3>
              <p>No sales were recorded for the selected week period.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="download-pdf-btn"
            onClick={generatePDF}
            disabled={
              generatingPDF || !salesData || salesData.salesReport.length === 0
            }
          >
            {generatingPDF ? (
              <>
                <div className="btn-spinner"></div>
                Generating PDF...
              </>
            ) : (
              <>📄 Download PDF Report</>
            )}
          </button>

          <button
            className="cleanup-btn"
            onClick={async () => {
              await cleanupOrphanedSales();
              await fetchSalesData();
              toast.success("Data refreshed successfully");
            }}
            disabled={loading}
          >
            🔄 Refresh Data
          </button>

          <button
            className="back-btn"
            onClick={() => navigate("/turtle-portal")}
          >
            ← Back to Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePaystub;
