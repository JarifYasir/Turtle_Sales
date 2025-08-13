import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Header from "./components/Header";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css"; // Add this import for global styles
import {
  Dashboard,
  HomeLayout,
  Landing,
  Login,
  Logout,
  Register,
} from "./pages";
import TurtlePortal from "./pages/TurtlePortal";
import { UserProvider } from "./usercontext/UserContext";
import WelcomePage from "./pages/WelcomePage";
import ManageOrg from "./pages/ManageOrg";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "welcome",
        element: <WelcomePage />,
      },
      {
        path: "manage-org",
        element: <ManageOrg />,
      },
      {
        path: "turtle-portal",
        element: <TurtlePortal />,
      }
    ],
  },
]);

function App() {
  return (
    <UserProvider>
      <Header />
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </UserProvider>
  );
}

export default App;
