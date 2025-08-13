import React, { useEffect, useState } from "react";
import Logo from "../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import "../styles/Register.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState(
    JSON.parse(localStorage.getItem("auth")) || ""
  );

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    let name = e.target.name.value;
    let email = e.target.email.value;
    let password = e.target.password.value;
    let confirmPassword = e.target.confirmPassword.value;

    if (
      name.length > 0 &&
      email.length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0
    ) {
      if (password === confirmPassword) {
        const formData = {
          name: name,
          email,
          password,
        };
        try {
          const response = await axios.post(
            "http://localhost:3000/api/v1/register",
            formData
          );
          toast.success("Registration successful");
          navigate("/login");
        } catch (err) {
          if (err.response && err.response.data) {
            const errorMessage = err.response.data.msg;
            if (errorMessage === "Email already in use") {
              toast.error("Email already in use");
            } else {
              toast.error(errorMessage);
            }
          } else {
            toast.error("An error occurred. Please try again.");
          }
        }
      } else {
        toast.error("Passwords don't match");
      }
    } else {
      toast.error("Please fill all inputs");
    }
  };

  useEffect(() => {
    if (token !== "") {
      toast.success("You are already logged in");
      navigate("/dashboard");
    }
  }, [token]);

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="purple-gradient"></div>
      </div>

      <motion.div
        className="register-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="logo-section"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img src={Logo} alt="Logo" className="logo" />
          <h1 className="brand-title">Create Account</h1>
          <p className="brand-subtitle">Please enter your details</p>
        </motion.div>

        <motion.form
          onSubmit={handleRegisterSubmit}
          className="register-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="name-row">
            <div className="input-group half-width">
              <input
                type="text"
                name="name"
                placeholder="Username"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="form-input"
              required
            />
          </div>

          <div className="input-group">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="form-input"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="form-input"
              required
            />
          </div>

          <motion.button
            type="submit"
            className="submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account
          </motion.button>
        </motion.form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
