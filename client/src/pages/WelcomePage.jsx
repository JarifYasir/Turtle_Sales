import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Welcome.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingComponents";

const WelcomePage = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access this page");
      return;
    }

    // Check if user already belongs to an organization
    checkExistingOrganization();
  }, [token, navigate]);

  const checkExistingOrganization = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/organization`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        // User already has an organization
        if (response.data.isOwner) {
          navigate("/manage-org");
        } else {
          // Employees go to dashboard, but can still access manage-org to view
          navigate("/dashboard");
        }
      }
    } catch (err) {
      // User doesn't have an organization, which is expected for welcome page
      if (err.response && err.response.status === 404) {
        setCheckingOrg(false);
      } else {
        console.error("Error checking organization:", err);
        setCheckingOrg(false);
      }
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/organization/create`,
        {
          name: orgName.trim(),
          description: orgDescription.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Organization created successfully!");

        // Complete first login if it's the user's first time
        try {
          await axios.put(
            "http://localhost:3000/api/v1/first-login",
            {},
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
        } catch (firstLoginError) {
          console.log(
            "First login update not needed or failed:",
            firstLoginError
          );
        }

        // Navigate to manage org page (owner can manage)
        navigate("/manage-org");
      }
    } catch (err) {
      console.error("Create organization error:", err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          const errorMsg = err.response.data.errors[0].msg;
          toast.error(errorMsg);
        } else {
          toast.error(err.response.data.msg || "Failed to create organization");
        }
      } else {
        toast.error("Failed to create organization");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async (e) => {
    e.preventDefault();

    if (!orgCode.trim()) {
      toast.error("Organization code is required");
      return;
    }

    if (orgCode.length !== 6) {
      toast.error("Organization code must be exactly 6 characters");
      return;
    }

    setLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.post(
        "http://localhost:3000/api/v1/organization/join",
        { code: orgCode.trim().toUpperCase() },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Successfully joined organization!");

        // Complete first login if it's the user's first time
        try {
          await axios.put(
            "http://localhost:3000/api/v1/first-login",
            {},
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
        } catch (firstLoginError) {
          console.log(
            "First login update not needed or failed:",
            firstLoginError
          );
        }

        // Navigate to dashboard (employees go to dashboard, not manage-org)
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Join organization error:", err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          const errorMsg = err.response.data.errors[0].msg;
          toast.error(errorMsg);
        } else {
          toast.error(err.response.data.msg || "Failed to join organization");
        }
      } else {
        toast.error("Failed to join organization");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForNow = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      await axios.put(
        "http://localhost:3000/api/v1/first-login",
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      navigate("/dashboard");
    } catch (err) {
      console.error("Skip error:", err);
      navigate("/dashboard");
    }
  };

  const resetForm = () => {
    setMode(null);
    setOrgName("");
    setOrgDescription("");
    setOrgCode("");
  };

  if (checkingOrg) {
    return (
      <LoadingSpinner
        size="large"
        text="Checking organization status..."
        variant="turtle"
        fullScreen={false}
      />
    );
  }

  return (
    <div className="welcome-container">
      <motion.div
        className="welcome-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="welcome-header">
          <h1 className="welcome-title">Welcome, {user?.name || "User"}!</h1>
          <p className="welcome-subtitle">
            Let's get you started by creating a new organization or joining an
            existing one.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div
              key="options"
              className="welcome-options"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="option-card"
                whileHover={{
                  y: -5,
                  boxShadow: "0 8px 25px rgba(53, 120, 214, 0.15)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="option-icon create-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h3>Create Organization</h3>
                <p>
                  Start your own organization and invite team members to join
                </p>
                <button
                  className="option-btn create-btn"
                  onClick={() => setMode("create")}
                  disabled={loading}
                >
                  Create New Organization
                </button>
              </motion.div>

              <motion.div
                className="option-card"
                whileHover={{
                  y: -5,
                  boxShadow: "0 8px 25px rgba(53, 120, 214, 0.15)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="option-icon join-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l2.01 2.01c.47.62 1.21.99 2.01.99h2.54l-2.54 7.63V22z"
                      fill="currentColor"
                    />
                    <path
                      d="M12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm1.5 2h-3C2.46 8 1 9.46 1 11.5V16h8v-4.5C9 9.46 7.54 8 6 8z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h3>Join Organization</h3>
                <p>Enter an invitation code to join an existing organization</p>
                <button
                  className="option-btn join-btn"
                  onClick={() => setMode("join")}
                  disabled={loading}
                >
                  Join Organization
                </button>
              </motion.div>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div
              key="create-form"
              className="form-container"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <div className="form-header">
                <h2>Create Your Organization</h2>
                <p>Set up your organization details</p>
              </div>

              <form onSubmit={handleCreateOrganization} className="org-form">
                <div className="form-group">
                  <label htmlFor="orgName">Organization Name *</label>
                  <input
                    type="text"
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter organization name"
                    className="form-input"
                    maxLength={100}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="orgDescription">Description (Optional)</label>
                  <textarea
                    id="orgDescription"
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    placeholder="Describe your organization..."
                    className="form-textarea"
                    maxLength={500}
                    disabled={loading}
                    rows={4}
                  />
                </div>

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || !orgName.trim()}
                  >
                    {loading ? "Creating..." : "Create Organization"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div
              key="join-form"
              className="form-container"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <div className="form-header">
                <h2>Join Organization</h2>
                <p>Enter the organization code provided by your team leader</p>
              </div>

              <form onSubmit={handleJoinOrganization} className="org-form">
                <div className="form-group">
                  <label htmlFor="orgCode">Organization Code *</label>
                  <input
                    type="text"
                    id="orgCode"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    className="org-code-input"
                    disabled={loading}
                    required
                  />
                  <p className="form-help">
                    The organization code is a 6-character code provided by your
                    organization owner.
                  </p>
                </div>

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || orgCode.length !== 6}
                  >
                    {loading ? "Joining..." : "Join Organization"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {!mode && (
          <div className="skip-section">
            <button onClick={handleSkipForNow} className="skip-btn">
              Skip for now
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WelcomePage;
