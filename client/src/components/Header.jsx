import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

export default function Header() {
  const [token, setToken] = useState(
    JSON.parse(localStorage.getItem("auth")) || ""
  );

  const updateToken = () => {
    setToken(JSON.parse(localStorage.getItem("auth")) || "");
  };

  useEffect(() => {
    window.addEventListener("storage", updateToken);
    return () => {
      window.removeEventListener("storage", updateToken);
    };
  }, []);

  return (
    <div style={{ paddingBottom: "30px" }}>
      <Navbar expand="lg" className="bg-body-tertiary" fixed="top">
        <Container>
          <Navbar.Brand href="/">Turtle Sales</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/">Home</Nav.Link>

              {token ? (
                <Nav.Link href="/dashboard">Profile</Nav.Link>
              ) : (
                <Nav.Link href="/register">Register/Login</Nav.Link>
              )}
              <Nav.Link href="/turtle-portal">Turtle Portal</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}
