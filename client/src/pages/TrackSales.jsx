import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/TrackSales.css";
import { motion, AnimatePresence } from "framer-motion";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import { useWorkdays, useCreateSale } from "../hooks/useApi";
import { useSaleForm } from "../hooks/useForm";
import {
  FormField,
  Input,
  TextArea,
  Button,
} from "../components/FormComponents";
import LoadingSpinner, { CardSkeleton } from "../components/LoadingComponents";
import ErrorBoundary from "../components/ErrorBoundary";
import AddressAutocomplete from "../components/AddressAutocomplete";

// Phone number formatting utility
const formatPhoneNumber = (value) => {
  if (!value) return value;

  // Remove all non-digits
  const phoneNumber = value.replace(/[^\d]/g, "");

  // Format based on length
  if (phoneNumber.length < 4) {
    return phoneNumber;
  } else if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length < 11) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6)}`;
  } else {
    return `+${phoneNumber.slice(0, 1)} (${phoneNumber.slice(
      1,
      4
    )}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 11)}`;
  }
};

const TrackSales = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [selectedWorkday, setSelectedWorkday] = useState(null);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Calculate week parameters
  const weekParams = useMemo(() => {
    const startDate = new Date(selectedWeekStart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [selectedWeekStart]);

  // Fetch workdays with React Query
  const {
    data: workdaysData,
    isLoading,
    error,
    refetch,
  } = useWorkdays(weekParams);

  const workdays = workdaysData?.workdays || [];
  const isOwner = workdaysData?.isOwner || false;

  // Sale creation mutation
  const createSaleMutation = useCreateSale();

  // Form handling
  const saleForm = useSaleForm(
    {},
    useCallback(
      async (data) => {
        if (!selectedTimeslot || !selectedWorkday) return;

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

  // Handle error state
  useEffect(() => {
    if (error?.response?.status === 404) {
      toast.error("Please join an organization first");
      navigate("/welcome");
    }
  }, [error, navigate]);

  // Optimized helper functions
  const formatDate = useCallback((date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const getWorkdayByDate = useCallback(
    (date) => {
      const dateKey = date.toDateString();
      return workdays.find(
        (workday) => new Date(workday.date).toDateString() === dateKey
      );
    },
    [workdays]
  );

  // Memoized computed values
  const groupedWorkdays = useMemo(() => {
    const grouped = {};
    workdays.forEach((workday) => {
      const dateKey = new Date(workday.date).toDateString();
      grouped[dateKey] = workday;
    });
    return grouped;
  }, [workdays]);

  const myTimeslots = useMemo(() => {
    const slots = [];
    workdays.forEach((workday) => {
      if (workday.timeslots) {
        workday.timeslots.forEach((timeslot) => {
          if (
            timeslot.assignedUsers &&
            timeslot.assignedUsers.some(
              (assignment) => assignment.user._id === user.id
            )
          ) {
            slots.push({
              ...timeslot,
              date: workday.date,
              workdayId: workday._id,
            });
          }
        });
      }
    });
    return slots;
  }, [workdays, user.id]);

  const getMyAssignmentInSlot = useCallback(
    (timeslot) => {
      if (!timeslot.assignedUsers) return null;
      return timeslot.assignedUsers.find(
        (assignment) => assignment.user._id === user.id
      );
    },
    [user.id]
  );

  const getSlotStatus = useCallback(
    (slot) => {
      if (!slot.assignedUsers || slot.assignedUsers.length === 0) {
        return "unassigned";
      }
      const isMySlot = slot.assignedUsers.some(
        (assignment) => assignment.user._id === user.id
      );
      if (isMySlot) {
        return "my-assignment";
      }
      return "other-assignment";
    },
    [user.id]
  );

  const handleTimeslotClick = useCallback((timeslot, workday) => {
    // Get number of assigned cleaners and current sales
    const assignedCleanersCount = timeslot.assignedUsers?.length || 0;
    const currentSalesCount = timeslot.sales?.length || 0;

    // Validation checks
    if (assignedCleanersCount === 0) {
      toast.info(
        "No cleaners assigned to this timeslot. Sales cannot be recorded."
      );
      return;
    }

    if (currentSalesCount >= assignedCleanersCount) {
      toast.info(
        `This timeslot already has the maximum of ${assignedCleanersCount} sale${
          assignedCleanersCount !== 1 ? "s" : ""
        } (${assignedCleanersCount} cleaner${
          assignedCleanersCount !== 1 ? "s" : ""
        } assigned)`
      );
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
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    setSelectedWeekStart(startOfWeek);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="timeslots-container">
        <LoadingSpinner
          size="large"
          text="Loading workdays..."
          fullScreen={false}
        />
        <div
          className="skeleton-grid"
          style={{
            marginTop: "2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            padding: "0 2rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <ErrorBoundary>
      <div className="timeslots-container">
        <motion.div
          className="timeslots-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Sales Dashboard</h1>
          <p className="header-subtitle">Click timeslots to record sales</p>

          <div className="week-navigation">
            <button onClick={goToPreviousWeek} className="nav-btn">
              ← Previous Week
            </button>
            <button onClick={goToCurrentWeek} className="current-week-btn">
              Current Week
            </button>
            <button onClick={goToNextWeek} className="nav-btn">
              Next Week →
            </button>
          </div>

          <div className="week-display">
            <h3>
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </h3>
          </div>
        </motion.div>

        <motion.div
          className="my-assignments-summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Sales Dashboard</h3>
          <p>
            <strong>{workdays.length}</strong> workdays available for sales
          </p>
          <p>Tap to log sale</p>
        </motion.div>

        <motion.div
          className="calendar-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {weekDates.map((date) => (
            <div key={date.toDateString()} className="day-column">
              <div className="day-header">
                <h3>{formatDate(date)}</h3>
              </div>
              <div className="day-timeslots">
                {groupedWorkdays[date.toDateString()] ? (
                  groupedWorkdays[date.toDateString()].timeslots
                    .filter((timeslot) => {
                      // Only show timeslots that are not full
                      const salesCount = timeslot.sales
                        ? timeslot.sales.length
                        : 0;
                      const assignedWorkersCount = timeslot.assignedUsers
                        ? timeslot.assignedUsers.length
                        : 0;

                      // Hide if: no workers assigned OR all workers have sales (x = y)
                      return (
                        assignedWorkersCount > 0 &&
                        salesCount < assignedWorkersCount
                      );
                    })
                    .map((timeslot) => {
                      const workdayId =
                        groupedWorkdays[date.toDateString()]._id;
                      const timeslotWithWorkday = { ...timeslot, workdayId };
                      const status = getSlotStatus(timeslot);
                      const salesCount = timeslot.sales
                        ? timeslot.sales.length
                        : 0;
                      const assignedCleanersCount = timeslot.assignedUsers
                        ? timeslot.assignedUsers.length
                        : 0;
                      const canClick =
                        salesCount < assignedCleanersCount &&
                        assignedCleanersCount > 0;

                      return (
                        <motion.div
                          key={timeslot._id}
                          className={`timeslot-card ${status} ${
                            canClick ? "clickable" : ""
                          }`}
                          whileHover={canClick ? { scale: 1.02 } : {}}
                          whileTap={canClick ? { scale: 0.98 } : {}}
                          onClick={() =>
                            canClick &&
                            handleTimeslotClick(
                              timeslot,
                              groupedWorkdays[date.toDateString()]
                            )
                          }
                        >
                          <div className="timeslot-time">
                            {formatTime(timeslot.startTime)} -{" "}
                            {formatTime(timeslot.endTime)}
                          </div>

                          <div className="timeslot-assignments">
                            <div
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              Assigned Workers:
                            </div>
                            {timeslot.assignedUsers?.length > 0 ? (
                              timeslot.assignedUsers.map((assignment, idx) => (
                                <div
                                  key={idx}
                                  className={`assignment ${
                                    assignment.user._id === user.id
                                      ? "my-assignment-user"
                                      : "other-assignment-user"
                                  }`}
                                >
                                  <span className="user-name">
                                    {assignment.user.name}
                                    {assignment.user._id === user.id &&
                                      " (You)"}
                                  </span>
                                  {assignment.notes && (
                                    <span className="assignment-notes">
                                      {assignment.notes}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="no-assignment">
                                No workers assigned
                              </div>
                            )}
                          </div>

                          {timeslot.sales && timeslot.sales.length > 0 && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "6px",
                                backgroundColor:
                                  timeslot.sales.length >= assignedCleanersCount
                                    ? "#fff3cd"
                                    : "#e8f5e8",
                                borderRadius: "4px",
                                border:
                                  timeslot.sales.length >= assignedCleanersCount
                                    ? "1px solid #ffeaa7"
                                    : "1px solid #c3e6cb",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: "bold",
                                  color:
                                    timeslot.sales.length >=
                                    assignedCleanersCount
                                      ? "#856404"
                                      : "#155724",
                                }}
                              >
                                💰 {timeslot.sales.length}/
                                {assignedCleanersCount} Sale
                                {timeslot.sales.length !== 1 ? "s" : ""}
                                {timeslot.sales.length >=
                                  assignedCleanersCount && " (FULL)"}
                                :
                              </div>
                              {timeslot.sales.map((sale, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    fontSize: "0.7rem",
                                    color:
                                      timeslot.sales.length >=
                                      assignedCleanersCount
                                        ? "#856404"
                                        : "#155724",
                                  }}
                                >
                                  ${sale.price} - {sale.name} by{" "}
                                  {sale.salesRepName}
                                </div>
                              ))}
                            </div>
                          )}

                          {(!timeslot.sales || timeslot.sales.length === 0) &&
                            !isOwner &&
                            assignedCleanersCount > 0 && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "6px",
                                  backgroundColor: "#d1ecf1",
                                  borderRadius: "4px",
                                  border: "1px solid #bee5eb",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    color: "#0c5460",
                                  }}
                                >
                                  💰 0/{assignedCleanersCount} Sales - Available
                                  for recording
                                </div>
                              </div>
                            )}

                          {canClick && salesCount < assignedCleanersCount && (
                            <div
                              style={{
                                marginTop: "8px",
                                textAlign: "center",
                                color: "#007bff",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                              }}
                            >
                              ➕ Click to record sale (
                              {assignedCleanersCount - salesCount} spot
                              {assignedCleanersCount - salesCount !== 1
                                ? "s"
                                : ""}{" "}
                              left)
                            </div>
                          )}

                          {!isOwner &&
                            salesCount >= assignedCleanersCount &&
                            assignedCleanersCount > 0 && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  textAlign: "center",
                                  color: "#dc3545",
                                  fontSize: "0.8rem",
                                  fontWeight: "500",
                                  backgroundColor: "#f8d7da",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  border: "1px solid #f5c6cb",
                                }}
                              >
                                🚫 Sales full ({assignedCleanersCount}/
                                {assignedCleanersCount})
                              </div>
                            )}
                        </motion.div>
                      );
                    })
                ) : (
                  <div className="no-timeslots">No workday scheduled</div>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-color my-assignment"></div>
            <span>You are assigned as cleaner</span>
          </div>
          <div className="legend-item">
            <div className="legend-color other-assignment"></div>
            <span>Others assigned as cleaners</span>
          </div>
          <div className="legend-item">
            <div className="legend-color unassigned"></div>
            <span>No cleaners assigned</span>
          </div>
        </div>

        {/* MODERN SALE FORM MODAL */}
        <AnimatePresence>
          {showSaleForm && selectedTimeslot && (
            <motion.div
              className="sale-form-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowSaleForm(false);
                  setSelectedTimeslot(null);
                  setSelectedWorkday(null);
                }
              }}
            >
              <motion.div
                className="sale-form-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 500 }}
              >
                <div className="sale-form-header">
                  <h3>💼 Record Sale</h3>
                  <p className="sale-form-date">
                    📅 {formatDate(selectedWorkday?.date)} • ⏰{" "}
                    {formatTime(selectedTimeslot.startTime)} -{" "}
                    {formatTime(selectedTimeslot.endTime)}
                  </p>
                  <p className="sale-form-rep">
                    👤 Sales Rep: <strong>{user.name}</strong>
                  </p>
                </div>

                <form className="sale-form" onSubmit={saleForm.handleSubmit}>
                  <div className="form-row">
                    <FormField
                      label="Customer Name"
                      error={saleForm.formState.errors.name?.message}
                      required
                    >
                      <Input
                        {...saleForm.register("name")}
                        placeholder="Enter customer's full name"
                        error={saleForm.formState.errors.name}
                      />
                    </FormField>

                    <FormField
                      label="Phone Number"
                      error={saleForm.formState.errors.number?.message}
                      required
                    >
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

                  <FormField
                    label="Sale Price"
                    error={saleForm.formState.errors.price?.message}
                    required
                  >
                    <Input
                      {...saleForm.register("price")}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      error={saleForm.formState.errors.price}
                    />
                  </FormField>

                  <FormField
                    label="Customer Address"
                    error={saleForm.formState.errors.address?.message}
                    required
                  >
                    <AddressAutocomplete
                      {...saleForm.register("address")}
                      placeholder="Start typing address for suggestions..."
                      error={saleForm.formState.errors.address}
                      value={saleForm.watch("address")}
                      onChange={(e) => {
                        saleForm.setValue("address", e.target.value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Sale Details"
                    error={saleForm.formState.errors.details?.message}
                    required
                  >
                    <TextArea
                      {...saleForm.register("details")}
                      placeholder="Describe the products/services sold"
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
                      {createSaleMutation.isPending
                        ? "Recording..."
                        : "Record Sale"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};

export default TrackSales;
