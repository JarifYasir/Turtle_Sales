import React from "react";
import { Outlet } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import "../styles/Breadcrumb.css";

const HomeLayout = () => {
  return (
    <>
      <Breadcrumb />
      <Outlet />
    </>
  );
};

export default HomeLayout;
