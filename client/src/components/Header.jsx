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
    <div style={{ paddingBottom: "70px" }}>
      <Navbar
        expand="lg"
        className="bg-body-tertiary"
        fixed="top"
        style={{ zIndex: 1050 }}
      >
        <Container fluid className="px-3">
          <Navbar.Brand
            href="/"
            style={{ fontSize: "1.5rem", fontWeight: "bold" }}
          >
            Turtle Sales
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="/" style={{ padding: "0.5rem 1rem" }}>
                Home
              </Nav.Link>

              {token ? (
                <>
                  <Nav.Link
                    href="/dashboard"
                    style={{ padding: "0.5rem 1rem" }}
                  >
                    Profile
                  </Nav.Link>
                  <Nav.Link
                    href="/turtle-portal"
                    style={{ padding: "0.5rem 1rem" }}
                  >
                    Turtle Portal
                  </Nav.Link>
                </>
              ) : (
                <Nav.Link href="/register" style={{ padding: "0.5rem 1rem" }}>
                  Register/Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}
