import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ViewTimeslots.css";
import { motion, AnimatePresence } from "framer-motion";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import { useWorkdays, useCreateSale } from "../hooks/useApi";
import { useSaleForm } from "../hooks/useForm";
import { FormField, Input, TextArea, Button } from "../components/FormComponents";
import LoadingSpinner from "../components/LoadingComponents";

// Phone number formatting utility
const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, "");
  if (phoneNumber.length < 4) return phoneNumber;
  if (phoneNumber.length < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  if (phoneNumber.length < 11) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  return `+${phoneNumber.slice(0, 1)} (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 11)}`;
};

const ViewTimeslots = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    return startOfWeek;
  });
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [selectedWorkday, setSelectedWorkday] = useState(null);

  // API hooks
  const { data: workdays = [], isLoading, error } = useWorkdays();
  const createSaleMutation = useCreateSale();

  // Form handling
  const saleForm = useSaleForm(
    useCallback(
      async (data) => {
        try {
          await createSaleMutation.mutateAsync({
            ...data,
            timeslotId: selectedTimeslot._id,
            workdayId: selectedWorkday._id,
            price: parseFloat(data.price),
          });
          setShowSaleForm(false);
          setSelectedTimeslot(null);
          setSelectedWorkday(null);
        } catch (error) {
          console.error("Sale creation error:", error);
        }
      },
      [selectedTimeslot, selectedWorkday, createSaleMutation]
    )
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token, navigate]);

  // Handle error state
  useEffect(() => {
    if (error?.response?.status === 404) {
      toast.error("Please join an organization first");
      navigate("/welcome");
    }
  }, [error, navigate]);

  // Helper functions
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatTime = useCallback((time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);

  const getWeekDates = useCallback(() => {
    const dates = [];
    const start = new Date(selectedWeekStart);
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedWeekStart]);

  // Group workdays by date
  const groupedWorkdays = useCallback(() => {
    const grouped = {};
    workdays.forEach((workday) => {
      const dateKey = new Date(workday.date).toDateString();
      grouped[dateKey] = workday;
    });
    return grouped;
  }, [workdays]);

  // Handle timeslot click for sale recording
  const handleTimeslotClick = useCallback((timeslot, workday) => {
    const salesCount = timeslot.sales?.length || 0;
    const assignedCount = timeslot.assignedUsers?.length || 0;
    
    if (salesCount >= assignedCount) {
      toast.error("This timeslot is full!");
      return;
    }
    
    setSelectedTimeslot(timeslot);
    setSelectedWorkday(workday);
    setShowSaleForm(true);
  }, []);

  // Navigation handlers
  const goToPreviousWeek = useCallback(() => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(selectedWeekStart.getDate() - 7);
    setSelectedWeekStart(newStart);
  }, [selectedWeekStart]);

  const goToNextWeek = useCallback(() => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(selectedWeekStart.getDate() + 7);
    setSelectedWeekStart(newStart);
  }, [selectedWeekStart]);

  const goToCurrentWeek = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    setSelectedWeekStart(startOfWeek);
  }, []);

  const weekDates = getWeekDates();
  const groupedData = groupedWorkdays();

  // Loading state
  if (isLoading) {
    return (
      <div className="timeslots-container">
        <LoadingSpinner size="large" text="Loading workdays..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="timeslots-container">
      {/* Header */}
      <motion.div
        className="timeslots-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>💰 Record Sales</h1>
        <p className="header-subtitle">Tap available timeslots to record sales</p>
        
        {/* Week Navigation */}
        <div className="week-navigation">
          <button className="nav-btn" onClick={goToPreviousWeek}>
            ← Previous
          </button>
          <button className="nav-btn current-week" onClick={goToCurrentWeek}>
            Current Week
          </button>
          <button className="nav-btn" onClick={goToNextWeek}>
            Next →
          </button>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="quick-stats"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="stat-card">
          <span className="stat-number">{workdays.length}</span>
          <span className="stat-label">Workdays</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {workdays.reduce((total, day) => 
              total + day.timeslots.filter(slot => 
                (slot.assignedUsers?.length || 0) > (slot.sales?.length || 0)
              ).length, 0
            )}
          </span>
          <span className="stat-label">Available Slots</span>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        className="calendar-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {weekDates.map((date) => {
          const workday = groupedData[date.toDateString()];
          const availableTimeslots = workday?.timeslots.filter(slot => {
            const salesCount = slot.sales?.length || 0;
            const assignedCount = slot.assignedUsers?.length || 0;
            return assignedCount > 0 && salesCount < assignedCount;
          }) || [];

          return (
            <div key={date.toDateString()} className="day-column">
              <div className="day-header">
                <h3>{formatDate(date)}</h3>
                {availableTimeslots.length > 0 && (
                  <span className="available-count">
                    {availableTimeslots.length} available
                  </span>
                )}
              </div>
              
              <div className="day-timeslots">
                {availableTimeslots.length > 0 ? (
                  availableTimeslots.map((timeslot) => {
                    const salesCount = timeslot.sales?.length || 0;
                    const assignedCount = timeslot.assignedUsers?.length || 0;
                    const slotsLeft = assignedCount - salesCount;

                    return (
                      <motion.div
                        key={timeslot._id}
                        className="timeslot-card available"
                        onClick={() => handleTimeslotClick(timeslot, workday)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <div className="timeslot-time">
                          {formatTime(timeslot.startTime)} - {formatTime(timeslot.endTime)}
                        </div>
                        
                        <div className="availability-info">
                          <span className="sales-count">
                            {salesCount}/{assignedCount}
                          </span>
                          <span className="slots-left">
                            {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
                          </span>
                        </div>
                        
                        <div className="tap-indicator">
                          Tap to record sale
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="no-timeslots">
                    {workday ? "No available slots" : "No workday scheduled"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Sale Form Modal */}
      <AnimatePresence>
        {showSaleForm && selectedTimeslot && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSaleForm(false);
              setSelectedTimeslot(null);
              setSelectedWorkday(null);
              saleForm.reset();
            }}
          >
            <motion.div
              className="sale-form-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Record Sale</h3>
                <p>
                  {formatTime(selectedTimeslot.startTime)} - {formatTime(selectedTimeslot.endTime)} •{" "}
                  {formatDate(new Date(selectedWorkday.date))}
                </p>
              </div>

              <form onSubmit={saleForm.handleSubmit} className="sale-form">
                <div className="form-row">
                  <FormField label="Customer Name" required>
                    <Input
                      {...saleForm.register("name")}
                      placeholder="Full name"
                      error={saleForm.formState.errors.name}
                    />
                  </FormField>

                  <FormField label="Phone" required>
                    <Input
                      {...saleForm.register("number")}
                      type="tel"
                      placeholder="(555) 123-4567"
                      error={saleForm.formState.errors.number}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        e.target.value = formatted;
                        saleForm.setValue("number", formatted);
                      }}
                    />
                  </FormField>
                </div>

                <div className="form-row">
                  <FormField label="Sale Price" required>
                    <Input
                      {...saleForm.register("price")}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      error={saleForm.formState.errors.price}
                    />
                  </FormField>

                  <FormField label="Address" required>
                    <Input
                      {...saleForm.register("address")}
                      placeholder="Customer address"
                      error={saleForm.formState.errors.address}
                    />
                  </FormField>
                </div>

                <FormField label="Sale Details" required>
                  <TextArea
                    {...saleForm.register("details")}
                    placeholder="Products/services sold"
                    rows={3}
                    error={saleForm.formState.errors.details}
                  />
                </FormField>

                <div className="form-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSaleForm(false);
                      setSelectedTimeslot(null);
                      setSelectedWorkday(null);
                      saleForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={createSaleMutation.isPending}
                    disabled={!saleForm.formState.isValid}
                  >
                    {createSaleMutation.isPending ? "Recording..." : "Record Sale"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewTimeslots;
