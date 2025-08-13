import React, { useEffect, useState } from "react";
import "../styles/Logout.css";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    localStorage.removeItem("auth");

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          navigate("/login");
          window.location.reload();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="logout-main">
      <h1>Logout Successful!</h1>
      <p>
        You will be redirected to the landing page in {timeLeft} second
        {timeLeft !== 1 ? "s" : ""}...
      </p>
    </div>
  );
};

export default Logout;
