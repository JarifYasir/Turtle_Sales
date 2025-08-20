import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "../styles/EmployeePaystub.css";
import LoadingSpinner from "../components/LoadingComponents";

const EmployeePaystub = () => {
  const navigate = useNavigate();
  const { token } = useContext(UserContext);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [generatingPDF, setGeneratingPDF] = useState(false);

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
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

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

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

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

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text
      const addText = (text, x, y, options = {}) => {
        pdf.setFont(options.font || "helvetica", options.style || "normal");
        pdf.setFontSize(options.size || 10);
        pdf.setTextColor(options.color || "#000000");
        if (options.align === "center") {
          pdf.text(text, x, y, { align: "center" });
        } else if (options.align === "right") {
          pdf.text(text, x, y, { align: "right" });
        } else {
          pdf.text(text, x, y);
        }
      };

      // Helper function to add line
      const addLine = (x1, y1, x2, y2) => {
        pdf.setDrawColor("#4a7c59");
        pdf.setLineWidth(0.5);
        pdf.line(x1, y1, x2, y2);
      };

      // Helper function to add rectangle
      const addRect = (x, y, width, height, fillColor = null) => {
        if (fillColor) {
          pdf.setFillColor(fillColor);
          pdf.rect(x, y, width, height, "F");
        } else {
          pdf.setDrawColor("#4a7c59");
          pdf.setLineWidth(0.5);
          pdf.rect(x, y, width, height);
        }
      };

      // Header with watermark
      pdf.setGState(new pdf.GState({ opacity: 0.1 }));
      addText("TURTLE SALES", pageWidth / 2 - 30, pageHeight / 2, {
        size: 60,
        style: "bold",
        color: "#4a7c59"
      });
      pdf.setGState(new pdf.GState({ opacity: 1 }));

      // Title Section
      addText("TURTLE SALES", pageWidth / 2, yPosition, { 
        size: 20, 
        style: "bold", 
        color: "#4a7c59",
        align: "center"
      });
      yPosition += 10;
      
      addText("Weekly Sales Report", pageWidth / 2, yPosition, { 
        size: 16, 
        style: "bold",
        align: "center"
      });
      yPosition += 8;
      
      addText(`${formatDate(selectedWeek.start)} - ${formatDate(selectedWeek.end)}`, 
        pageWidth / 2, yPosition, { 
        size: 12, 
        color: "#666666",
        align: "center"
      });
      yPosition += 15;

      // Line separator
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Employee Sales Sections
      salesData.salesReport.forEach((rep, repIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }

        // Employee Header
        addRect(margin, yPosition, pageWidth - 2 * margin, 12, "#f0f8f0");
        addText(`Employee: ${rep.salesRepName}`, margin + 5, yPosition + 8, {
          size: 14,
          style: "bold",
          color: "#4a7c59"
        });
        addText(`${rep.salesCount} Sales | ${formatCurrency(rep.totalAmount)}`, 
          pageWidth - margin - 5, yPosition + 8, {
          size: 12,
          style: "bold",
          color: "#4a7c59",
          align: "right"
        });
        yPosition += 15;

        // Sales Table Header
        addRect(margin, yPosition, pageWidth - 2 * margin, 8, "#e8f5e8");
        addText("Date", margin + 3, yPosition + 5, { size: 9, style: "bold" });
        addText("Amount", margin + 35, yPosition + 5, { size: 9, style: "bold" });
        addText("Client", margin + 55, yPosition + 5, { size: 9, style: "bold" });
        addText("Phone", margin + 85, yPosition + 5, { size: 9, style: "bold" });
        addText("Address", margin + 115, yPosition + 5, { size: 9, style: "bold" });
        yPosition += 8;

        // Sales Details
        rep.sales.forEach((sale, saleIndex) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          const rowHeight = 20;
          const isEvenRow = saleIndex % 2 === 0;
          
          // Alternate row background
          if (isEvenRow) {
            addRect(margin, yPosition, pageWidth - 2 * margin, rowHeight, "#fafafa");
          }

          // Sale basic info
          addText(new Date(sale.date).toLocaleDateString(), margin + 3, yPosition + 5, { size: 8 });
          addText(formatCurrency(sale.amount), margin + 35, yPosition + 5, { 
            size: 8, 
            style: "bold", 
            color: "#4a7c59" 
          });
          addText(sale.clientName || "N/A", margin + 55, yPosition + 5, { size: 8 });
          addText(sale.clientPhone || "N/A", margin + 85, yPosition + 5, { size: 8 });
          
          // Address (truncated if too long)
          let address = sale.clientAddress || "N/A";
          if (address.length > 25) {
            address = address.substring(0, 22) + "...";
          }
          addText(address, margin + 115, yPosition + 5, { size: 8 });

          // Timeslot info
          if (sale.timeslot) {
            const timeslotText = `${formatTimeslotRange(sale.timeslot)}`;
            addText(`Time: ${timeslotText}`, margin + 3, yPosition + 10, { 
              size: 7, 
              color: "#666666" 
            });
          }

          // Sale details
          if (sale.details) {
            let details = sale.details;
            if (details.length > 80) {
              details = details.substring(0, 77) + "...";
            }
            addText(`Details: ${details}`, margin + 3, yPosition + 15, { 
              size: 7, 
              color: "#333333",
              style: "italic"
            });
          }

          yPosition += rowHeight;
        });

        yPosition += 5; // Space between employees
      });

      // Summary Section
      yPosition += 10;
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Summary Header
      addLine(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      addText("WEEK SUMMARY", pageWidth / 2, yPosition, { 
        size: 16, 
        style: "bold", 
        color: "#4a7c59",
        align: "center"
      });
      yPosition += 15;

      // Summary Box
      addRect(margin, yPosition, pageWidth - 2 * margin, 25, "#f0f8f0");
      
      // Summary Content
      addText("Total Revenue:", margin + 10, yPosition + 8, { 
        size: 12, 
        style: "bold" 
      });
      addText(formatCurrency(salesData.summary.totalRevenue), margin + 60, yPosition + 8, { 
        size: 12, 
        style: "bold", 
        color: "#4a7c59" 
      });

      addText("Total Sales:", margin + 10, yPosition + 16, { 
        size: 12, 
        style: "bold" 
      });
      addText(salesData.summary.totalSales.toString(), margin + 60, yPosition + 16, { 
        size: 12, 
        style: "bold", 
        color: "#4a7c59" 
      });

      addText("Sales Representatives:", pageWidth - margin - 60, yPosition + 8, { 
        size: 12, 
        style: "bold" 
      });
      addText(salesData.summary.totalReps.toString(), pageWidth - margin - 10, yPosition + 8, { 
        size: 12, 
        style: "bold", 
        color: "#4a7c59",
        align: "right"
      });

      addText("Average per Rep:", pageWidth - margin - 60, yPosition + 16, { 
        size: 12, 
        style: "bold" 
      });
      addText(formatCurrency(salesData.summary.totalRevenue / salesData.summary.totalReps), 
        pageWidth - margin - 10, yPosition + 16, { 
        size: 12, 
        style: "bold", 
        color: "#4a7c59",
        align: "right"
      });

      // Footer
      yPosition = pageHeight - 20;
      addText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 
        pageWidth / 2, yPosition, { 
        size: 8, 
        color: "#666666",
        align: "center"
      });

      // Generate filename with date
      const filename = `Turtle-Sales-Report-${
        selectedWeek.start.toISOString().split("T")[0]
      }-to-${selectedWeek.end.toISOString().split("T")[0]}.pdf`;

      pdf.save(filename);
      toast.success("Professional PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
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
        <div className="pdf-content">
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
                              {sale.clientPhone && (
                                <div className="phone-info">
                                  <span className="phone-label">Phone:</span>
                                  <span className="client-phone">
                                    {sale.clientPhone}
                                  </span>
                                </div>
                              )}
                              {sale.details && (
                                <div className="details-info">
                                  <span className="details-label">Details:</span>
                                  <span className="sale-details-text">
                                    {sale.details}
                                  </span>
                                </div>
                              )}
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