import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Welcome.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";

const WelcomePage = () => {
  const { user, token, setUser, setToken } = useContext(UserContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access dashboard");
    }
  }, [token, navigate]);
  const handleButtonClick = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"));

      await axios.put(
        "http://localhost:3000/api/v1/first-login",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("completed first login");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      console.log("Could not update first login status");
    }
  };

  return (
    <div>
      <div className="welcome-container">
        <motion.div
          className="welcome-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            {!mode && (
              <motion.div
                key="buttons"
                initial={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="welcome-content"
              >
                <h2 className="welcome-title">Welcome! 🎉</h2>
                <p className="welcome-subtitle">
                  Let’s get you started by creating a new organization or
                  joining an existing one.
                </p>
                <div className="button-group">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="welcome-btn create-btn"
                    onClick={() => setMode("create")}
                  >
                    Create Organization
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="welcome-btn join-btn"
                    onClick={() => setMode("join")}
                  >
                    Join Organization
                  </motion.button>
                </div>
              </motion.div>
            )}

            {mode === "create" && (
              <motion.form
                key="create-form"
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="welcome-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleButtonClick(); // immediately run first login + dashboard redirect
                }}
              >
                <h2>Create Organization</h2>
                <input
                  type="text"
                  placeholder="Organization Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="back-btn"
                  >
                    Back
                  </button>
                  <button type="submit" className="submit-btn">
                    Create
                  </button>
                </div>
              </motion.form>
            )}

            {mode === "join" && (
              <motion.form
                key="join-form"
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="welcome-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleButtonClick(); // immediately run first login + dashboard redirect
                }}
              >
                <h2>Join Organization</h2>
                <input
                  type="text"
                  placeholder="Organization Code"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                />
                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="back-btn"
                  >
                    Back
                  </button>
                  <button type="submit" className="submit-btn">
                    Join
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
