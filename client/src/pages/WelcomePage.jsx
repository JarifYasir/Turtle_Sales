import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Welcome.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";

const WelcomePage = () => {
  const { user, token, setUser, setToken } = useContext(UserContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access dashboard");
    }
  }, [token, navigate]);

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
        "http://localhost:3000/api/v1/organization/create",
        {
          name: orgName,
          description: orgDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Organization created successfully!");
        
        // Complete first login
        await axios.put(
          "http://localhost:3000/api/v1/first-login",
          {},
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        // Navigate to manage org page
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

    setLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.post(
        "http://localhost:3000/api/v1/organization/join",
        {
          code: orgCode,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Successfully joined organization!");
        
        // Complete first login
        await axios.put(
          "http://localhost:3000/api/v1/first-login",
          {},
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        // Navigate to dashboard
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

  return (
    <div className="welcome-container">
      <motion.div
        className="welcome-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Welcome to Our Platform!</h1>
        <p>Let's get you started by creating a new organization or joining an existing one.</p>

        <AnimatePresence mode="wait">
          {!mode && (
            <motion.div
              className="mode-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                className="mode-btn create-btn"
                onClick={() => setMode("create")}
                disabled={loading}
              >
                Create Organization
              </button>
              <button
                className="mode-btn join-btn"
                onClick={() => setMode("join")}
                disabled={loading}
              >
                Join Organization
              </button>
              <button
                className="skip-btn"
                onClick={handleSkipForNow}
                disabled={loading}
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.form
              className="org-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCreateOrganization}
            >
              <h3>Create New Organization</h3>
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Enter organization description"
                  rows="3"
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setMode(null)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Organization"}
                </button>
              </div>
            </motion.form>
          )}

          {mode === "join" && (
            <motion.form
              className="org-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleJoinOrganization}
            >
              <h3>Join Organization</h3>
              <div className="form-group">
                <label>Organization Code *</label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength="6"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setMode(null)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Joining..." : "Join Organization"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
